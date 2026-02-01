import { Octokit } from "@octokit/rest";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const SOURCE_REPOS = process.env.SOURCE_REPOS;
const MONTH = process.env.MONTH; // Format: YYYY-MM (e.g., 2026-01)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!SOURCE_REPOS || !GITHUB_TOKEN || !GEMINI_API_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const repos = SOURCE_REPOS.split(",").map(r => r.trim());

// ✅ ONLY use models that WORK
const GEMINI_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-1.5-flash"
];

// Get target month (defaults to previous month if not specified)
function getTargetMonth() {
  if (MONTH) return MONTH;

  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = prevMonth.getFullYear();
  const month = String(prevMonth.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Check if a release was published in the target month
function isInTargetMonth(publishedAt, targetMonth) {
  const releaseDate = new Date(publishedAt);
  const year = releaseDate.getFullYear();
  const month = String(releaseDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}` === targetMonth;
}

// Fetch all releases from a repository published in the target month
async function fetchMonthlyReleases(owner, repo, targetMonth) {
  const { data } = await octokit.repos.listReleases({ owner, repo, per_page: 100 });
  return data.filter(release => isInTargetMonth(release.published_at, targetMonth));
}

// Extract PR references and create interlinks
function extractPRRefsWithLinks(text, owner, repo) {
  const regex = /#(\d+)/g;
  const matches = text.matchAll(regex);
  const prRefs = [];

  for (const match of matches) {
    const prNumber = match[1];
    const prUrl = `https://github.com/${owner}/${repo}/pull/${prNumber}`;
    prRefs.push({ number: prNumber, url: prUrl, text: `#${prNumber}` });
  }

  return prRefs;
}

async function analyzeWithGemini(prompt) {
  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`Trying Gemini model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      console.warn(`${modelName} failed: ${e.message}`);
    }
  }
  throw new Error("All Gemini models failed");
}

(async () => {
  const targetMonth = getTargetMonth();
  console.log(`Generating release notes for ${targetMonth}...`);

  let styleGuide = "";
  try {
    styleGuide = fs.readFileSync("style guide.md", "utf8");
  } catch (e) {
    console.warn("style guide.md not found, using default.");
  }

  // Aggregate all releases from all repos for the target month
  const allReleases = [];

  for (const repoFull of repos) {
    const [owner, repo] = repoFull.split("/");
    console.log(`Fetching releases from ${repoFull}...`);

    try {
      const releases = await fetchMonthlyReleases(owner, repo, targetMonth);

      for (const release of releases) {
        const prRefs = extractPRRefsWithLinks(release.body, owner, repo);
        allReleases.push({
          repo: repoFull,
          repoName: repo,
          tag: release.tag_name,
          publishedAt: release.published_at,
          body: release.body,
          prRefs: prRefs
        });
      }

      console.log(`  Found ${releases.length} release(s)`);
    } catch (error) {
      console.error(`  Error fetching releases: ${error.message}`);
    }
  }

  if (allReleases.length === 0) {
    console.log(`No releases found for ${targetMonth}`);
    return;
  }

  console.log(`\nTotal releases found: ${allReleases.length}`);

  // Prepare consolidated data for Gemini
  const consolidatedData = allReleases.map(r => {
    const prLinks = r.prRefs.map(pr => `[${pr.text}](${pr.url})`).join(", ");
    return `
Repository: ${r.repo}
Version: ${r.tag}
Published: ${r.publishedAt}
PR References: ${prLinks || "None"}

Release Notes:
${r.body}

---
`;
  }).join("\n");

  const prompt = `
You are a Product Manager writing a consolidated monthly product update for HotWax Commerce.

${styleGuide ? `Please follow this Style Guide strictly:\n${styleGuide}\n` : ""}

Context:
Month: ${targetMonth}
Number of releases: ${allReleases.length}

All Release Data:
${consolidatedData}

Task:
Generate a consolidated monthly product update following this EXACT structure:

# HotWax Commerce Product Update

[Write a brief introductory paragraph about this month's focus areas, e.g., "This month, we've focused on expanding fulfillment options, enhancing inventory accuracy, and making the store associate experience more intuitive across our suite of apps."]

## 🚀 New Features

[For each NEW feature, use this format:]

### [Feature name]
[Brief description of the feature]

**User Benefit:** [Explain how this benefits the user in practical terms]

[Include PR reference like (#123) at the end of the description where applicable]

## ⚡ Improvements

[For each IMPROVEMENT/enhancement, use this format:]

### [Improvement name]
[Brief description of what was improved]

**User Benefit:** [Explain the practical benefit to users]

[Include PR reference like (#123) at the end of the description where applicable]

Rules:
- Be concise and customer-focused
- Use sentence-style capitalization (only capitalize first word and proper nouns)
- Avoid marketing fluff words like "seamlessly", "effortlessly", "cutting-edge"
- Focus on USER BENEFITS, not technical implementation
- Group similar changes together
- Include PR references in the format (#123) where the number links to the actual PR
- Do NOT list contributors
- Do NOT invent features not mentioned in the release data
- Categorize intelligently: new capabilities = New Features, enhancements to existing features = Improvements
- Each item should have a clear heading and User Benefit section
- Keep the tone warm, clear, and helpful (following HotWax voice principles)

IMPORTANT: Make sure PR references are formatted as (#123) and appear inline with the description, similar to the example format provided.
`;

  let content;
  try {
    content = await analyzeWithGemini(prompt);
  } catch (error) {
    console.warn("Gemini failed — using fallback");
    content = `# HotWax Commerce Product Update - ${targetMonth}\n\n${consolidatedData}`;
  }

  // Output to drafts/YYYY-MM.md
  const outFile = path.join("drafts", `${targetMonth}.md`);
  fs.mkdirSync("drafts", { recursive: true });
  fs.writeFileSync(outFile, content);

  console.log(`\n✓ Generated consolidated release notes: ${outFile}`);
})();
