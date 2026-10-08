---
name: audio-and-video
description: |
  Make or edit audio and video with Glif, from a text brief or from a reference image, video or audio file. Use when: "make music", "add fitting music to my video", "jingle", "voiceover", "narrate this", "text to speech", "sound effect", "UI sounds", "ambient loop", "make a video", "video clip", "UGC video", "talking avatar", "lipsync", "dub this into Spanish", "GIF", "add captions", "trim or combine these clips", "split the vocals", "remove background noise", "animate this photo", "turn this product photo into a video ad", "make this photo dance", "bullet time", "one continuous shot around this", "make a music video for my song", "drive this character with my video", "show this room renovated", "use this video's structure for my product". NOT for: editing a still image (use edit-images), demo videos of an app (use app-demo-videos), new still images (use make-images).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Route audio and video work to Glif. Glif picks the models; you write a clear brief and handle the files. The user's explicit instructions come first, within host safety rules.

## 1. Write the brief

Describe the result, not the model. Include what matters:

- **Voice:** the exact script in quotes, language, voice (age, accent, energy), pace, and emotion cues like a whisper, a laugh or a sigh at the right words. Glif can play voice samples to pick from. Clone a voice only from a sample whose owner agreed.
- **Music:** mood, genre, tempo, length, and vocals with lyrics or instrumental. Say if it must loop or sit under a voice (Glif can duck it).
- **Sound effects and UI sounds:** what triggers each one, length (UI sounds under 1 second) and how subtle. Ask for a matched set when there are several. For a video, Glif can add foley synced to the action.
- **Ambience:** the place and a seamless loop length.
- **Video:** write it in shots. For each shot: camera and framing first, then the action with clear motion verbs, the light source and the look (film stock, style). Add length, aspect ratio (16:9, 9:16, 1:1 or 4:5) and whether it needs sound. For tight control, ask for stills first, then animate the approved ones.
- **People on screen:** UGC-style creators, talking avatars, lipsync and dubbing. Use real people's faces or voices only with their consent. No fake testimonials or invented claims, and label synthetic creators where the platform requires it.
- **Edits:** attach the source files and say exactly what changes and what stays: captions (word-highlight, animated, styled), punch zooms, background swap, trims and joins, stem separation, noise cleanup.

## 2. Starting from a reference

When the user supplies or picks a file to build on, say what the reference provides and what is new:

- **Image to video:** subject motion, camera move, length and framing. "One continuous shot, no cuts" helps for orbits and bullet time.
- **Product photo to ad:** keep the product identical; only the camera, light and setting move.
- **Song or voice to video:** which parts are sung or spoken, the look, and where lipsync is needed.
- **Driving video:** which character takes over the motion, and what stays from the original (camera, timing, sound).
- **Room photo:** the style to stage or renovate in, and whether to add a walkthrough video.
- **Reference video for structure:** copy its pacing, shot order and hook only. Never copy its people, footage, logos or brand.

Ask about missing creative choices only when they matter. Ask whose face to use; never pick one yourself.

Get the reference to Glif:

- Saved Glif media: find the project with `list_projects` if needed, then read it with `get_project`. Pass that `project_id` and name the item in the brief. Do not re-upload it.
- A public link: pass it to `upload_file` as `url`.
- A host-provided file object: pass it as `file`.
- A local file with shell access: call `upload_file` with only `filename` (plus `kind` if unclear), then run the returned `command` with the real path.
- A small local file (under 1 MiB) without shell access: pass `base64` and `filename`.

Upload a file only after the user agrees to send it to Glif. If you cannot reach the bytes, ask for a supported attachment. Pass the returned `fileUrl` in `attachments`. Never assume ownership from a URL, and never reveal whether another account's project exists.

## 3. Check cost, then run once

Generation spends the user's Glif credits; video costs the most. A direct request ("make a jingle", "animate this photo") is approval. If the media was your own idea, or the user only picked a file, describe the plan in a line and wait for a yes. Put related pieces, like a set of UI sounds or a series of shots, in one `compose_project` call.

Share the `projectUrl`. Follow the run with `get_job_status`, passing the `jobId` as `job_id`. Video can take minutes, so keep working meanwhile. A pending status or timeout is not a reason to start another run, and never retry a failure on your own. Glif creates new files; it never overwrites the source.

## 4. Bring files into the project

If you're working in a codebase, download each result. Never hotlink Glif URLs in shipped code.

```sh
curl -fsSL "<media url>" -o public/audio/click.mp3
```

- Pick the folder the project already uses, such as `public/audio/` or `public/videos/`. Name files by purpose: `notify-success.mp3`, `hero-loop.mp4`.
- Use the media's MIME type for the extension. Don't overwrite files; add `-v2`.
- Check with `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of csv=p=0 <file>`.
- If `ffmpeg` is installed, prepare files for the web: MP3 or AAC for audio, MP4 (H.264) for video, no audio track on muted background video, and loops cut cleanly.
- Keep web assets small: UI sounds a few KB, background video a few MB.

Wire them in: `<audio preload="none">` or the Web Audio API for UI sounds (respect the user's mute setting), and `<video autoplay muted loop playsinline poster="...">` for background video.

## 5. Report

Say what you made, where you saved it and the `projectUrl`. To build on it later, pass the same `project_id` to `compose_project`. A new variation needs its own explicit request.
