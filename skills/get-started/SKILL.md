---
name: get-started
description: Help someone start with Glif. Explain how it connects, check the connected account and credits on request, and show how to browse or continue saved projects. Use when the user asks what Glif is, how to set it up, which account is connected, or how many credits they have. Never starts generation.
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Help the user get oriented. The user's explicit instructions come first, within host safety rules.

1. Glif connects to the user's existing Glif account through the host's OAuth flow. If the connection is missing, point them to the host's sign-in or connector flow. Never ask for passwords, API keys or sign-in codes in chat. A free account can be created at https://glif.app.
2. Explain what costs credits. Only `compose_project` spends the account's Glif credits. Connecting, browsing, choosing a reference and checking status are free. Plans and credits are managed at https://glif.app/pricing, not in chat.
3. If the user asks which account or how many credits, call `whoami`. Report only the fields they asked about, such as username, available credits or recent spend.
4. To browse, call `list_projects`, then `get_project` for the one they pick. Show media links from the result. If the host renders Glif's viewer, `view_media` can reopen saved media in it.
5. Explain how continuity works:
   - A project keeps its messages and media. Passing its `project_id` to `compose_project` adds new work to the same project.
   - A new reference file goes through `upload_file`. Its returned `fileUrl` goes in `compose_project`'s `attachments`.
   - Project IDs, job IDs, asset IDs and media URLs are different values. Do not swap them.
6. End with a choice: plan a campaign, browse saved work, or draft a brief that turns an image into video or audio. Or show a draft brief for review.

Onboarding never calls `compose_project`, uploads files, or changes settings. Browsing, picking a reference or accepting a suggestion is not a request to generate. Show draft prompts as text and wait for an explicit "go".
