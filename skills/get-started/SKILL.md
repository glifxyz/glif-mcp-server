---
name: get-started
description: Help someone start with Glif. Explain how it connects, check the connection and credits for free, and suggest what to make first. Use when the user asks what Glif is, how to set it up, whether it's connected, which account is connected, how many credits they have, or what Glif can do. Never starts generation.
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Help the user get oriented. The user's explicit instructions come first, within host safety rules.

1. Check the connection. If Glif's tools are available, call `whoami`; it's free and proves the connection works. If they're missing, help the user connect:
   - Claude Code: `claude plugin marketplace add glifxyz/glif-mcp-server`, then `claude plugin install glif@glif`, then `/mcp` to sign in.
   - Any other client: add the remote MCP server `https://glif.app/api/mcp` and sign in when the browser opens. https://glif.app/mcp has steps for each client.
   Never ask for passwords, API keys or sign-in codes in chat. A free account can be created at https://glif.app.
2. Explain what costs credits. Only `compose_project` spends the account's Glif credits. Connecting, browsing, choosing a reference and checking status are free. Rough ranges from Glif's own templates: image edits 1–60 credits, logos and icons 1–50, thumbnails 15–80, short videos 40–400, a full music video 500 or more. Glif decides the real cost when it runs. Plans and credits are managed at https://glif.app/pricing; never buy or upgrade in chat.
3. If the user asks which account or how many credits, report only the `whoami` fields they asked about, such as username, available credits or recent spend.
4. To browse, call `list_projects`, then `get_project` for the one they pick. Show media links from the result. If the host renders Glif's viewer, `view_media` can reopen saved media in it.
5. Explain how continuity works:
   - A project keeps its messages and media. Passing its `project_id` to `compose_project` adds new work to the same project.
   - A new reference file goes through `upload_file`. Its returned `fileUrl` goes in `compose_project`'s `attachments`.
   - Project IDs, job IDs, asset IDs and media URLs are different values. Do not swap them.
6. End with a choice that fits what the user is doing. Examples:
   - In a codebase: "add a hero image and texture to this page", "make a logo and favicon set", "record a 30-second demo of this app", "make App Store screenshots", "add UI sounds".
   - Anywhere: "make a YouTube thumbnail", "remove the background from this image", "create a character sheet", "make an explainer video", "generate a voiceover", "plan an ad campaign", "show my recent projects".
   Or show a draft brief for review.

Onboarding never calls `compose_project`, uploads files, or changes settings. Browsing, picking a reference or accepting a suggestion is not a request to generate. Show draft prompts as text and wait for an explicit "go".
