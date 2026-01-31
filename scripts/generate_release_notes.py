import os
import requests
from pathlib import Path
import subprocess
import sys

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

def github_get(url):
    r = requests.get(url, headers=HEADERS)
    r.raise_for_status()
    return r.json()

def run(cmd):
    subprocess.check_call(cmd, shell=True)

def interpret_changes(raw_text):
    lines = [l.strip("- ").strip() for l in raw_text.splitlines() if l.strip()]
    return "\n".join(
        f"- This change improves system behavior related to: {line.lower()}."
        for line in lines
    )

# --------------------------------------------------
# Loop over repos
# --------------------------------------------------
for source_repo in REPOS:
    owner, repo = source_repo.split("/")

    # 1. Fetch release
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

    # 2. Interpret
    interpreted = interpret_changes(body)

    markdown = f"""# {source_repo} – Release {tag}

## Change Summary
This release focuses on improving reliability and usability.

## Interpreted Changes
{interpreted}
"""

    # 3. Gemini refinement (optional)
    if GEMINI_API_KEY:
        prompt = f"""
Refine these release notes for business and operations stakeholders:

{interpreted}

Explain user, operational, and business impact.
Do not invent features.
"""
        gemini_resp = requests.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            params={"key": GEMINI_API_KEY},
            json={"contents": [{"parts": [{"text": prompt}]}]},
        ).json()

        refined = gemini_resp["candidates"][0]["content"]["parts"][0]["text"]
        markdown += "\n## Impact Analysis\n" + refined + "\n"

    # 4. Write file
    output_dir = Path(f"drafts/{source_repo}")
    output_dir.mkdir(parents=True, exist_ok=True)
    file_path = output_dir / f"{tag}.md"
    file_path.write_text(markdown)

    # 5. Commit + PR
    branch = f"release-notes/{repo}/{tag}"

    run(f"git checkout -b {branch}")
    run(f"git add {file_path}")
    run(f'git commit -m "Release notes for {source_repo} {tag}"')
    run(f"git push origin {branch}")

    pr = requests.post(
        f"{GITHUB_API}/repos/{owner}/{repo}/pulls",
        headers=HEADERS,
        json={
            "title": f"Release notes for {source_repo} {tag}",
            "head": branch,
            "base": "main",
            "body": f"Auto-generated release notes.\n\nSource: {release_url}",
        },
    )

    if pr.status_code >= 300:
        print(f"Failed to create PR for {source_repo}: {pr.text}")
    else:
        print(f"PR created for {source_repo}")
