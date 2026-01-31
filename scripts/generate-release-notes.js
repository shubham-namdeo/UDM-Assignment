const { Octokit } = require("@octokit/rest");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

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

// ✅ ONLY use models that WORK (same as your working script)
const GEMINI_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-1.5-flash"
];

async function fetchRelease(owner, repo) {
  if (RELEASE_TAG) {
    const { data } = await octokit.repos.getReleaseByTag({ owner, repo, tag: RELEASE_TAG });
    return data;
  }
  const { data } = await octokit.repos.listReleases({ owner, repo });
  return data[0];
}

function extractPRRefs(text) {
  const regex = /#(\d+)/g;
  return [...new Set((text.match(regex) || []).map(m => `{${m}}`))];
}

async function analyzeWithGemini(prompt) {
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.warn(`${modelName} failed`);
    }
  }
  throw new Error("All Gemini models failed");
}

(async () => {
  for (const repoFull of repos) {
    const [owner, repo] = repoFull.split("/");
    console.log(`Processing ${repoFull}...`);

    const release = await fetchRelease(owner, repo);
    if (!release?.body) continue;

    const prRefs = extractPRRefs(release.body);
    const tag = release.tag_name;

    const prompt = `
You are a Product Manager writing customer-facing release notes.

Rewrite the release using ONLY this structure:

# ${repo.replace("-", " ")} – Release ${tag}

## What changed (in plain English)
- User-facing changes only
- Reference PRs inline like ${prRefs.join(", ")}

## User impact
## Operational impact
## Business impact

Rules:
- Do NOT include raw GitHub sections
- Do NOT list contributors
- Do NOT invent features
- Keep language confident and non-technical

Raw GitHub Release:
${release.body}
`;

    let content;
    try {
      content = await analyzeWithGemini(prompt);
    } catch {
      console.warn("Gemini failed — using fallback");
      content = release.body;
    }

    const outDir = path.join("drafts", repoFull);
    fs.mkdirSync(outDir, { recursive: true });

    const file = path.join(outDir, `${tag}.md`);
    fs.writeFileSync(file, content);

    console.log(`✓ Generated ${file}`);
  }
})();
