import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import fetch from "node-fetch";

// --------------------
// Environment
// --------------------
const SOURCE_REPOS = process.env.SOURCE_REPOS;
const RELEASE_TAG = process.env.RELEASE_TAG;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Target repo (where PRs are created)
const TARGET_REPO = process.env.TARGET_REPO || "shubham-namdeo/UDM-Assignment";
const [TARGET_OWNER, TARGET_REPO_NAME] = TARGET_REPO.split("/");

if (!SOURCE_REPOS || !GITHUB_TOKEN) {
  console.error("Missing SOURCE_REPOS or GITHUB_TOKEN");
  process.exit(1);
}

const repos = SOURCE_REPOS.split(",").map(r => r.trim());

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// --------------------
// Helpers
// --------------------
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

const interpretChanges = (raw) => {
  return raw
    .split("\n")
    .map(l => l.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .map(l => `- This change improves system behavior related to: ${l.toLowerCase()}.`)
    .join("\n");
};

const geminiRefine = async (text) => {
  if (!GEMINI_API_KEY) return null;

  const resp = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `
Refine these release notes for business and operations stakeholders.

${text}

Explain:
- User impact
- Operational impact
- Business impact

Do not invent features.
            `
          }]
        }]
      })
    }
  );

  const json = await resp.json();
  return json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};

// --------------------
// Main loop
// --------------------
for (const sourceRepo of repos) {
  const [owner, repo] = sourceRepo.split("/");
  const branch = `release-notes/${repo}`;

  console.log(`\nProcessing ${sourceRepo}`);

  // ---- Fetch release ----
  let release;
  if (RELEASE_TAG) {
    release = await octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag: RELEASE_TAG
    });
  } else {
    const releases = await octokit.repos.listReleases({ owner, repo });
    release = releases.data[0];
  }

  const tag = release.data.tag_name;
  const body = release.data.body || "";
  const releaseUrl = release.data.html_url;

  if (!body.trim()) {
    console.log(`Skipping ${sourceRepo}: empty release body`);
    continue;
  }

  // ---- Interpret ----
  const interpreted = interpretChanges(body);

  let markdown = `# ${sourceRepo} – Release ${tag}

## Change Summary
This release focuses on improving reliability and usability.

## Interpreted Changes
${interpreted}
`;

  // ---- Gemini ----
  const refined = await geminiRefine(interpreted);
  if (refined) {
    markdown += `

## Impact Analysis
${refined}
`;
  }

  // ---- Write file ----
  const dir = path.join("drafts", sourceRepo);
  fs.mkdirSync(dir, { recursive: true });

  const filePath = path.join(dir, `${tag}.md`);
  fs.writeFileSync(filePath, markdown);

  // ---- Git ops ----
  run("git fetch origin");

  try {
    run(`git checkout ${branch}`);
    run(`git pull origin ${branch}`);
  } catch {
    run(`git checkout -b ${branch}`);
  }

  run(`git add ${filePath}`);
  run(`git commit -m "Update release notes for ${sourceRepo} ${tag}"`);
  run(`git push origin ${branch}`);

  // ---- PR logic ----
  const prs = await octokit.pulls.list({
    owner: TARGET_OWNER,
    repo: TARGET_REPO_NAME,
    head: `${TARGET_OWNER}:${branch}`,
    state: "open"
  });

  if (prs.data.length > 0) {
    console.log(`PR already exists for ${sourceRepo}`);
    continue;
  }

  await octokit.pulls.create({
    owner: TARGET_OWNER,
    repo: TARGET_REPO_NAME,
    head: `${TARGET_OWNER}:${branch}`,
    base: "main",
    title: `Release notes updates for ${sourceRepo}`,
    body: `Automated release notes.\n\nSource release: ${releaseUrl}`
  });

  console.log(`PR created for ${sourceRepo}`);
}
