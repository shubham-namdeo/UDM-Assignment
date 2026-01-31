import { Octokit } from "@octokit/rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const SOURCE_REPOS = process.env.SOURCE_REPOS;
const RELEASE_TAG = process.env.RELEASE_TAG;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SOURCE_REPOS || !GITHUB_TOKEN || !GEMINI_API_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const repos = SOURCE_REPOS.split(",").map(r => r.trim());

async function fetchRelease(owner, repo) {
  if (RELEASE_TAG) {
    const { data } = await octokit.repos.getReleaseByTag({
      owner, repo, tag: RELEASE_TAG
    });
    return data;
  }

  const { data } = await octokit.repos.listReleases({ owner, repo });
  return data[0];
}

function extractPRLinks(text) {
  const regex = /(https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+|#\d+)/g;
  return [...new Set(text.match(regex) || [])];
}

async function analyzeWithGemini(appName, tag, releaseBody, prRefs) {
  const prompt = `
You are a Product Manager writing customer-facing release notes.

App: ${appName}
Release: ${tag}

Raw GitHub Release Notes:
${releaseBody}

Referenced Pull Requests:
${prRefs.map(p => `- ${p}`).join("\n")}

Rewrite the release notes using this structure ONLY:

# ${appName} – Release ${tag}

## What changed (in plain English)
- Bullet points, user-facing
- Each bullet must describe behavior change
- Reference PRs inline like: {#123}

## User impact
- How this affects end users

## Operational impact
- What ops/support teams should know

## Business impact
- Stability, accuracy, speed, trust, cost

Rules:
- Do NOT include raw GitHub sections like "What's Changed"
- Do NOT list contributors
- Do NOT invent features
- Keep language non-technical and confident
`;

  // List of models to try in order of preference (Cheaper/Faster -> Legacy/Stable)
  const models = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"];

  for (const modelName of models) {
    console.log(`Attempting analysis with model: ${modelName}`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (e) {
      console.warn(`Model ${modelName} failed:`, e.message || e);
      // Continue to next model
    }
  }

  console.error("All Gemini models failed. Returning raw body as fallback.");
  return releaseBody; // Fallback to raw text if AI fails completely
}

(async () => {
  for (const repoFull of repos) {
    const [owner, repo] = repoFull.split("/");
    console.log(`Processing ${repoFull}...`);

    const release = await fetchRelease(owner, repo);
    if (!release?.body) {
      console.log(`Skipping ${repoFull} — empty release body`);
      continue;
    }

    const tag = release.tag_name;
    const prRefs = extractPRLinks(release.body);

    const content = await analyzeWithGemini(
      repo.replace("-", " "),
      tag,
      release.body,
      prRefs
    );

    const outDir = path.join("drafts", repoFull);
    fs.mkdirSync(outDir, { recursive: true });

    const file = path.join(outDir, `${tag}.md`);
    fs.writeFileSync(file, content);

    console.log(`✓ Generated ${file}`);
  }
})();
