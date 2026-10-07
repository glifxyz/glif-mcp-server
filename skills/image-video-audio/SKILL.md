---
name: image-video-audio
description: Turn a reference image, video or audio file into new media with Glif, such as animating an image, making a short video, or adding matching music or voice. Use when the user supplies or picks a file to build on. Generation needs an explicit request.
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Use this for reference-led media work. Skip it for conceptual questions or edits meant for another tool. The user's explicit instructions come first, within host safety rules.

1. Identify the reference and the output they want.
   - Saved Glif media: find the project with `list_projects` if needed, then read it with `get_project`. Ask which item to use when it is unclear.
   - A new file: see step 4.
   - Never assume ownership from a URL, and never reveal whether another account's project exists.
2. Draft a brief:
   - Image to video: subject motion, camera move, length and framing.
   - Matching audio: mood, timing, and whether it needs speech or music.
   - Audio or video reference: what should carry over into the new output.
   Ask about missing creative choices only when they matter.
3. Picking media prepares context. It does not approve spending. If the user has not asked to generate, show the draft and wait. Glif creates new files; it never overwrites the source.
4. Upload a new reference only after the user agrees to send it to Glif. Use `upload_file`:
   - A public `http(s)` link: pass it as `url`.
   - A host-provided file object: pass it as `file`.
   - A local file with shell access, such as in Claude Code: pass only `filename` (plus `kind` if the extension is unclear). Run the returned `command` with the real path in place of `<YOUR_FILE_PATH>`.
   - A small local file (under 1 MiB) without shell access: pass `base64` and `filename`.
   - If you cannot reach the bytes, ask for a supported attachment. Do not invent a download link.
   Pass the returned `fileUrl` in `compose_project`'s `attachments`. Do not re-upload media that is already in a Glif project.
5. For saved media, pass the project's `project_id` and name the chosen item in the brief.
6. Call `compose_project` once with the reviewed brief, attachments and `project_id`. Share the `projectUrl`. Call `get_job_status` with the `jobId` as `job_id` until the job finishes, and show new media as it arrives without repeats.
7. Report the result or the failure. Never start another run while one is working, and never retry automatically. A new variation needs its own explicit request.
