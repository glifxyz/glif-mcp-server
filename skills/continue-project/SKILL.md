---
name: continue-project
description: |
  Find the user's saved Glif project, show its media, and add new work to it without starting a separate project. Use when: "show my recent Glif projects", "open my last image", "keep going on that one", "make 5 variations to A/B test", "same but vertical", "make a version for TikTok", "resize it to every format", "same character in a new scene", "fix only the text", "fix scene 3", "next episode", "do another one like yesterday's".
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Use this when the user wants to revisit or build on saved Glif work. The user's explicit instructions come first, within host safety rules.

1. Find the project:
   - From a link or ID the user gives you.
   - Or with `list_projects`, paging with `cursor` only as far as needed.
   Read it with `get_project`. Set `include_messages` only when you need the history to understand the request. If several projects match, ask. If a project is missing or inaccessible, say so; do not guess other IDs or storage URLs.
2. For a browse-only request, show the media links from `get_project` and stop. If the host renders Glif's viewer, `view_media` with the `project_id` (and optional `asset_ids`) reopens it there. Browsing never starts generation.
3. If `get_project` shows an active job, the project is already working. Do not start another. Follow it with `get_job_status` only if this conversation started that job; otherwise share the project link.
4. Work out what stays the same and what changes. Name the chosen media in the brief and keep the project's `project_id`. Do not re-upload existing media just to copy it. Common follow-ups, each phrased as one clear change:
   - **Variations:** "Make 4 variations of image 2 that change only the background." Keep the count small unless the user asks for more.
   - **New format:** "Same video, recomposed for 9:16 without cropping the subject."
   - **Targeted fix:** "Fix only the headline text to read '...'. Keep everything else identical."
   - **Continuity:** "Same character and style, new scene: ..." or "Next episode, same format and voice."
5. If the user only asked to prepare a continuation, show the draft prompt and wait. Choosing media is not approval to spend.
6. For a clear request to generate, note that it uses the account's Glif credits. Call `compose_project` with the `project_id` and the brief. Keep related outputs in one call. Leave `intelligence` unset so the project keeps its tier, unless the user asks to change it.
7. Share the `projectUrl`. Call `get_job_status` with the `jobId` as `job_id` until the job finishes, and show new media as it arrives without repeats. Report the result or the failure. Never retry paid work on your own.

New work is added to the project. Originals stay untouched. Do not change account settings, buy credits or set up automatic generation while continuing a project.
