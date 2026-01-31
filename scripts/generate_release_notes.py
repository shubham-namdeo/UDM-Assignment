import os
import requests
from pathlib import Path
import subprocess
import sys

# --------------------------------------------------
# Environment variables
# --------------------------------------------------
SOURCE_REPOS = os.getenv("SOURCE_REPOS")  # comma-separated
RELEASE_TAG = os.getenv("RELEASE_TAG")
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN") or os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not SOURCE_REPOS or not GITHUB_TOKEN:
    print("Missing required environment variables")
    sys.exit(1)

REPOS = [r.strip() for r in SOURCE_REPOS.split(",") if r.strip()]

GITHUB_API = "https://api.github.com"
HEADERS = {
    "Authorization": f"token {GITHUB_TOKEN}",
    "Accept": "application/vnd.github+json",
}

# --------------------------------------------------
# Helpers
# --------------------------------------------------
def github_get(url):
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    return r.json()

def github_post(url, payload):
    r = requests.post(url, headers=HEADERS, json=payload)
    return r

def run(cmd):
    subprocess.check_call(cmd, shell=True)

def branch_exists(branch):
    return subprocess.run(
        f"git show-ref --verify --quiet refs/heads/{branch}",
        shell=True
    ).returncode == 0

def interpret_changes(raw_text):
    lines = [l.strip("- ").strip() for l in raw_text.splitlines() if l.strip()]
    return "\n".join(
        f"- This change improves system behavior related to: {line.lower()}."
        for line in lines
    )

# --------------------------------------------------
# Main loop
# --------------------------------------------------
for source_repo in REPOS:
    owner, repo = source_repo.split("/")
    branch = f"release-notes/{repo}"

    # -----------------------------
    # Fetch release
    # -----------------------------
    if RELEASE_TAG:
        release = github_get(
            f"{GITHUB_API}/repos/{owner}/{repo}/releases/tags/{RELEASE_TAG}"
        )
    else:
        releases = github_get(
            f"{GITHUB_API}/repos/{owner}/{repo}/releases"
        )
        release = releases[0]

    tag = release["tag_name"]
    body = release["body"] or ""
    release_url = release["html_url"]

    if not body.strip():
        print(f"Skipping {source_repo}: empty release body")
        continue

    # -----------------------------
    # Interpret
    # -----------------------------
    interpreted = interpret_changes(body)

    markdown = f"""# {source_repo} – Release {tag}

## Change Summary
This release focuses on improving reliability and usability.

## Interpreted Changes
{interpreted}
"""

    # -----------------------------
    # Gemini refinement (optional)
    # -----------------------------
    if GEMINI_API_KEY:
        prompt = f"""
Refine these release notes for business and operations stakeholders.

{interpreted}

Explain:
- User impact
- Operational impact
- Business impact

Do not invent features.
"""
        gemini_resp = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        ).json()

        refined = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
        markdown += "\n## Impact Analysis\n" + refined + "\n"

    # -----------------------------
    # Write file
    # -----------------------------
    output_dir = Path(f"drafts/{source_repo}")
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"{tag}.md"
    file_path.write_text(markdown)

    # -----------------------------
    # Git: checkout or create branch
    # -----------------------------
    run("git fetch origin")

    if branch_exists(branch):
        run(f"git checkout {branch}")
        run(f"git pull origin {branch}")
    else:
        run(f"git checkout -b {branch}")

    run(f"git add {file_path}")
    run(f'git commit -m "Update release notes for {source_repo} {tag}"')
    run(f"git push origin {branch}")

    # -----------------------------
    # PR: create only if not exists
    # -----------------------------
    prs = github_get(
        f"{GITHUB_API}/repos/{owner}/{repo}/pulls?head={owner}:{branch}&state=open"
    )

    if prs:
        print(f"PR already exists for {source_repo}")
        continue

    pr = github_post(
        f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
        {
            "title": f"Release notes updates for {source_repo}",
            "head": branch,
            "base": "main",
            "body": f"Automated release notes updates.\n\nSource release: {release_url}",
        },
    )

    if pr.status_code >= 300:
        print(f"Failed to create PR for {source_repo}: {pr.text}")
    else:
        print(f"PR created for {source_repo}")
