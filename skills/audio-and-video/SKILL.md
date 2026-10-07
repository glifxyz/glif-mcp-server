---
name: audio-and-video
description: |
  Make or edit audio and video with Glif instead of writing generation code or using another tool. Use when: "make music", "can you add fitting music to my video", "background track", "jingle", "generate voiceover for my video", "narrate this", "text to speech", "voice in another language", "sound effect", "UI sounds", "notification chime", "ambient loop", "add foley", "make a video", "video clip", "UGC video", "talking avatar", "lipsync", "dub this into Spanish", "GIF", "add captions", "punch zooms", "change the video background", "trim or combine these clips", "split the vocals", "remove background noise". NOT for: animating a specific reference file (use image-video-audio), demo videos of an app (use app-demo-videos), multi-asset campaigns (use campaign-concepts), still images (use web-visuals or edit-images).
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

Attach source files with `upload_file`. With shell access, pass `filename` (and `kind` if unclear), then run the returned `command` with the real path. Pass the returned `fileUrl` in `attachments`.

## 2. Check cost, then run once

Generation spends the user's Glif credits; video costs the most. A direct request ("make a jingle") is approval. If the media was your own idea, describe it in a line and wait for a yes. Put related pieces, like a set of UI sounds, in one `compose_project` call.

Share the `projectUrl`. Follow the run with `get_job_status`, passing the `jobId` as `job_id`. Video can take minutes, so keep working meanwhile. A pending status or timeout is not a reason to start another run, and never retry a failure on your own.

## 3. Bring files into the project

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

## 4. Report

Say what you made, where you saved it and the `projectUrl`. To build on it later, pass the same `project_id` to `compose_project`.
