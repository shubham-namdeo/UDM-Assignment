# HotWax Commerce Release Notes Generator

Automated workflow to generate consolidated monthly product updates across all HotWax Commerce repositories.

## Overview

This script fetches all releases published in a specified month across multiple repositories and generates a single consolidated product update document in the HotWax Commerce style.

## Features

- **Monthly aggregation**: Fetches all releases from a specified month across all configured repositories
- **Consolidated output**: Single markdown file per month (`drafts/YYYY-MM.md`)
- **Categorized changes**: Automatically categorizes into "New Features" and "Improvements"
- **Interlinked PR references**: Includes clickable PR references in the format `(#123)`
- **Style guide compliance**: Follows HotWax Commerce style guide for tone, capitalization, and formatting
- **AI-powered**: Uses Google Gemini to transform raw release notes into customer-facing product updates

## Setup

### Prerequisites

- Node.js (v14 or higher)
- GitHub Personal Access Token
- Google Gemini API Key

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file or set the following environment variables:

```bash
# Required
SOURCE_REPOS="hotwax/fulfillment,hotwax/inventory-count,hotwax/bopis"
GITHUB_TOKEN="your_github_token"
GEMINI_API_KEY="your_gemini_api_key"

# Optional
MONTH="2026-01"  # Defaults to previous month if not specified
```

## Usage

### Generate release notes for a specific month

```bash
MONTH=2026-01 SOURCE_REPOS="hotwax/fulfillment,hotwax/inventory-count" GITHUB_TOKEN=<token> GEMINI_API_KEY=<key> node scripts/generate-release-notes.js
```

### Generate release notes for the previous month (default)

```bash
SOURCE_REPOS="hotwax/fulfillment,hotwax/inventory-count" GITHUB_TOKEN=<token> GEMINI_API_KEY=<key> node scripts/generate-release-notes.js
```

## Output Format

The script generates a consolidated markdown file at `drafts/YYYY-MM.md` with the following structure:

```markdown
# HotWax Commerce Product Update

[Introductory paragraph about the month's focus]

## 🚀 New Features

### Feature name
Description of the feature

**User Benefit:** Practical benefit explanation

## ⚡ Improvements

### Improvement name
Description of the improvement

**User Benefit:** Practical benefit explanation
```

## Configuration

### Adding Repositories

Add repositories to the `SOURCE_REPOS` environment variable as a comma-separated list:

```bash
SOURCE_REPOS="hotwax/repo1,hotwax/repo2,hotwax/repo3"
```

### Month Format

The `MONTH` parameter should be in `YYYY-MM` format:
- `2026-01` for January 2026
- `2025-12` for December 2025

If not specified, the script defaults to the previous month.

## Style Guide

The script follows the HotWax Commerce style guide (`style guide.md`) for:
- Sentence-style capitalization
- Warm, clear, and helpful tone
- Avoiding marketing fluff
- Focus on user benefits
- Concise, scannable content

## Troubleshooting

### No releases found
If the script reports "No releases found for YYYY-MM", verify:
- The month parameter is correct
- Releases were actually published in that month
- Your GitHub token has access to the repositories

### Gemini API errors
The script includes fallback logic across multiple Gemini models:
1. gemini-3-flash-preview
2. gemini-2.5-flash
3. gemini-1.5-flash

If all models fail, the script will output raw release data as a fallback.

## License

MIT
