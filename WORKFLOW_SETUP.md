# GitHub Action Workflow Setup Instructions

## Important Note

Due to GitHub App permission restrictions, the workflow file cannot be directly created in `.github/workflows/`. You'll need to manually move it after merging this PR.

## Setup Steps

1. After merging this PR, move the workflow file:
   ```bash
   mv docs-update-workflow.yml .github/workflows/auto-update-docs.yml
   ```

2. The workflow will then automatically:
   - Analyze all PRs for changes that require documentation updates
   - Create new PRs with documentation updates when needed
   - Update documentation directly on the main branch after merges

## How the Workflow Works

### Triggers
- **On Pull Requests**: Analyzes changes and creates a documentation update PR if needed
- **On Push to Main**: Updates documentation directly after merges

### What It Analyzes
- **Tool Changes** (`src/tools/`): Updates tool lists in README and website
- **API Changes** (`src/api`, `src/index.ts`): Updates both README and site
- **Config Changes** (`package.json`, `src/config.ts`): Updates README

### Automatic Updates
1. **README.md**: Tool definitions and descriptions
2. **docs/index.html**: GitHub Pages site tool listings
3. Creates PRs for review before merging documentation changes

## Self-Documenting Loop

This creates a self-referential documentation system where:
- Code changes trigger documentation analysis
- Documentation updates are proposed via PR
- The system keeps docs in sync with the actual implementation
- No manual documentation maintenance required

## Permissions Required

The workflow needs:
- `contents: write` - To commit documentation updates
- `pull-requests: write` - To create documentation PRs

These permissions are already configured in the workflow file.