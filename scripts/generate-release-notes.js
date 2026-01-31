import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import fetch from "node-fetch";

// --------------------
// Environment
// --------------------
const SOURCE_REPOS = process.env.SOURCE_REPOS || "hotwax/fulfillment,hotwax/receiving,hotwax/inventory-count";
const RELEASE_TAG = process.env.RELEASE_TAG; // Optional, specific tag
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Target repo (where PRs are created)
const TARGET_REPO = process.env.TARGET_REPO || "shubham-namdeo/UDM-Assignment";
const [TARGET_OWNER, TARGET_REPO_NAME] = TARGET_REPO.split("/");

if (!GITHUB_TOKEN) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(1);
}

const repos = SOURCE_REPOS.split(",").map(r => r.trim());
const octokit = new Octokit({ auth: GITHUB_TOKEN });

// --------------------
// Helpers
// --------------------
const run = (cmd, ignoreError = false) => {
  try {
    return execSync(cmd, { stdio: "pipe", encoding: "utf-8" }).trim();
  } catch (e) {
    if (!ignoreError) {
      console.error(`Command failed: ${cmd}`);
      console.error(e.stderr || e.message);
      throw e;
    }
    return null;
  }
};

/**
 * Uses Gemini to BOTH interpret raw changes and analyze impact.
 * We do this in one go or two steps. Let's do a comprehensive prompt.
 */
const analyzeWithGemini = async (tag, rawChangelog) => {
  if (!GEMINI_API_KEY) return null;

  const prompt = `
You are a Release Intelligence Agent.
Release: ${tag}
Raw Changelog:
${rawChangelog}

Task 1: Interpret Changes
Convert the raw changelog into a clean, human-readable list of changes. 
- Remove technical jargon where possible.
- Focus on "what changed" for a user or admin.
- Ignore trivial dependency updates unless critical.

Task 2: Impact Analysis
Explain the impact of this release in three distinct sections:
- **User Impact**: what users feel.
- **Operational Impact**: what ops/admins need to know.
- **Business Impact**: value to the business (stability, speed, etc.).

Output Format (Markdown):
## Interpreted Changes
- [Change 1]
- [Change 2]

## Impact Analysis
### User Impact
[Text]

### Operational Impact
[Text]

### Business Impact
[Text]
  `;

  try {
    const resp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + GEMINI_API_KEY,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );
    const json = await resp.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error("Gemini API error:", e);
    return null;
  }
};

const ensureBranch = (branchName) => {
  // Check if branch exists remotely
  const remoteRef = run(`git ls-remote --heads origin ${branchName}`);

  if (remoteRef) {
    // Exists remotely, checkout and pull
    run(`git fetch origin ${branchName}:${branchName}`, true);
    run(`git checkout ${branchName}`);
  } else {
    // New branch
    run(`git checkout -b ${branchName}`);
  }
};

// --------------------
// Main loop
// --------------------
(async () => {
  for (const sourceRepo of repos) {
    const [owner, repo] = sourceRepo.split("/");
    const branchName = `release-notes/${repo}`; // One branch per app

    console.log(`\nProcessing ${sourceRepo}...`);

    try {
      // 1. Fetch Release
      let release;
      if (RELEASE_TAG) {
        const response = await octokit.repos.getReleaseByTag({ owner, repo, tag: RELEASE_TAG });
        release = response.data;
      } else {
        const response = await octokit.repos.listReleases({ owner, repo });
        release = response.data[0];
      }

      if (!release) {
        console.log(`No release found for ${sourceRepo}`);
        continue;
      }

      const tag = release.tag_name;
      const body = release.body || "No description provided.";
      const releaseUrl = release.html_url;

      console.log(`Found release ${tag}`);

      // 2. Generate Content
      let content = `# ${sourceRepo} – Release ${tag}\n\n`;
      content += `**Source**: [${tag}](${releaseUrl})\n\n`;

      const aiAnalysis = await analyzeWithGemini(tag, body);

      if (aiAnalysis) {
        content += aiAnalysis;
      } else {
        content += `## Raw Changes\n${body}\n\n> [!WARNING]\n> AI analysis failed or API key missing.`;
      }

      // 3. File Operations
      const dir = path.join("drafts", sourceRepo);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = path.join(dir, `${tag}.md`);
      fs.writeFileSync(filename, content);
      console.log(`Wrote ${filename}`);

      // 4. Git Operations
      run("git fetch origin"); // Sync remote state

      // Robust Branch Checkout
      const branchExistsLocally = run(`git rev-parse --verify ${branchName}`, true);

      if (branchExistsLocally) {
        run(`git checkout ${branchName}`);
      } else {
        // Try to checkout from remote (if exists)
        const remoteBranch = run(`git rev-parse --verify origin/${branchName}`, true);
        if (remoteBranch) {
          run(`git checkout -b ${branchName} origin/${branchName}`);
        } else {
          // Create fresh branch
          run(`git checkout -b ${branchName}`);
        }
      }

      // Always pull latest to avoid conflicts/non-fast-forward
      run(`git pull origin ${branchName} --rebase`, true);

      run(`git add ${filename}`);

      const status = run("git status --porcelain");
      if (status) {
        run(`git commit -m "chore: update release notes for ${sourceRepo} ${tag}"`);
        try {
          run(`git push origin ${branchName}`);
          console.log("Pushed changes.");
        } catch (e) {
          console.error("Push failed, retrying with pull --rebase...");
          run(`git pull origin ${branchName} --rebase`);
          run(`git push origin ${branchName}`);
        }
      } else {
        console.log("No changes to commit.");
      }

      // 5. Manage PR
      // Check if open PR exists for this branch
      const prs = await octokit.pulls.list({
        owner: TARGET_OWNER,
        repo: TARGET_REPO_NAME,
        head: `${TARGET_OWNER}:${branchName}`,
        state: "open"
      });

      if (prs.data.length === 0) {
        await octokit.pulls.create({
          owner: TARGET_OWNER,
          repo: TARGET_REPO_NAME,
          head: branchName,
          base: "main",
          title: `Release Notes: ${sourceRepo}`,
          body: `Automated release notes updates for **${sourceRepo}**.\n\nUpdated to include release: ${tag}`
        });
        console.log("Created PULL REQUEST.");
      } else {
        console.log("PR already open. Updated via push.");
      }

      // Switch back to main for next repo loop? Not strictly necessary if we checkout branches explicitly, 
      // but good hygiene to not start next branch from previous app branch.
      run("git checkout main", true);

    } catch (error) {
      console.error(`Error processing ${sourceRepo}:`, error);
    }
  }
})();
