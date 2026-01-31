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
  let styleGuide = "";
  try {
    styleGuide = fs.readFileSync("style guide.md", "utf8");
  } catch (e) {
    console.warn("style guide.md not found, using default.");
  }

  for (const repoFull of repos) {
    const [owner, repo] = repoFull.split("/");
    console.log(`Processing ${repoFull}...`);

    const release = await fetchRelease(owner, repo);
    if (!release?.body) continue;

    const tag = release.tag_name;
    const outDir = path.join("drafts", repoFull);
    const file = path.join(outDir, `${tag}.md`);

    // Efficiency: Check if release note already exists
    if (fs.existsSync(file)) {
      console.log(`✓ Skipping ${file} (already exists)`);
      continue;
    }

    const prRefs = extractPRRefs(release.body);

    const prompt = `
You are a Product Manager writing customer-facing release notes.

${styleGuide ? `Please follow this Style Guide strictly:\n${styleGuide}\n` : ""}

Context:
Repo: ${repoFull}
Version: ${tag}
PR References: ${prRefs.join(", ")}

Raw Release Data:
${release.body}

Task:
Generate release notes following the structure below explicitly:

# ${repo.replace("-", " ")} – Release ${tag}

## Background
(Brief context on why this change was made)

## What changed
(Plain English explanation of specific user-facing changes. Reference PRs inline.)

## Impact
### User Impact
(How this affects the day-to-day workflow)

### Operational Impact
(Changes to configurations, workflows, or SOPs)

### Business Impact
(Value provided e.g., efficiency, compliance)

Rules:
- Be concise and to the point.
- Do NOT include raw GitHub sections.
- Do NOT list contributors.
- Do NOT invent features.
`;

    let content;
    try {
      content = await analyzeWithGemini(prompt);
    } catch {
      console.warn("Gemini failed — using fallback");
      content = release.body;
    }

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(file, content);

    console.log(`✓ Generated ${file}`);
  }
})();
