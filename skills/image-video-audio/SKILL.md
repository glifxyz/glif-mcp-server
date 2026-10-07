---
name: image-video-audio
description: |
  Turn a reference image, video or audio file into new media with Glif. Use when the user supplies or picks a file to build on: "animate this photo", "turn this product photo into a video ad", "make this photo dance", "bullet time", "one continuous shot around this", "lipsync my photo to this track", "make a music video for my song", "drive this character with my video", "swap me for this character", "stage this empty room", "show this room renovated", "use this video's structure for my product". Generation needs an explicit request. NOT for: editing the image itself (use edit-images), new audio or video without a reference (use audio-and-video), app screencasts (use app-demo-videos).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Use this for reference-led media work. Skip it for conceptual questions or edits meant for another tool. The user's explicit instructions come first, within host safety rules.

1. Identify the reference and the output they want.
   - Saved Glif media: find the project with `list_projects` if needed, then read it with `get_project`. Ask which item to use when it is unclear.
   - A new file: see step 4.
   - Never assume ownership from a URL, and never reveal whether another account's project exists.
2. Draft a brief:
   - Image to video: subject motion, camera move, length and framing. "One continuous shot, no cuts" helps for orbits and bullet time.
   - Product photo to ad: keep the product identical; only the camera, light and setting move.
   - Song or voice to video: which parts are sung or spoken, the look, and where lipsync is needed.
   - Driving video: which character takes over the motion, and what stays from the original (camera, timing, sound).
   - Room photo: the style to stage or renovate in, and whether to add a walkthrough video.
   - Reference video for structure: copy its pacing, shot order and hook only. Never copy its people, footage, logos or brand.
   - Matching audio: mood, timing, and whether it needs speech or music.
   Ask about missing creative choices only when they matter.
   Use a real person's face, body or voice only with their consent. Ask whose face to use; never pick one yourself.
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
