---
name: app-demo-videos
description: |
  Record a screencast of an app you are building and turn it into a polished demo, explainer or promo video with Glif, using video templates for device mockups, captions, voiceover and music. Use when: "make a demo video", "record a screencast", "I need a launch video for my startup", "hype trailer for my app", "product walkthrough", "feature tour", "explainer video", "turn my Loom into a polished demo", "show my app on a MacBook", "scroll through my dashboard and zoom in", "15-second TikTok ad for our best feature", "changelog video", "App Store preview video", "GIF for the README", "thumbnail for the launch video". NOT for: still graphics (use app-promo-materials), videos unrelated to the app (use audio-and-video), animating a single image (use image-video-audio).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp. Recording needs Node.js and Playwright.
---

Record the real app, then let Glif frame it in a video template. The user's explicit instructions come first, within host safety rules.

## 1. Plan the video

Agree on a short plan before recording:

- **Story:** 3 to 6 beats, one feature or action each. Open with the most useful moment; social cuts need a hook in the first 3 seconds.
- **Length:** 15 to 30 seconds for social and teasers, 30 to 90 for walkthroughs and explainers.
- **Template:** pick one, or describe your own.
  - *Browser tour:* the app in a clean browser window on a soft background, zooms on clicks, a caption per beat.
  - *Device composite:* the real recording placed on a laptop or phone screen in a generated lifestyle scene. Glif tracks the screen if the camera moves.
  - *Social ad demo:* vertical, 15 seconds, hook first, big captions, music.
  - *Narrated walkthrough:* voiceover and captions over the browser tour.
  - *Explainer:* animated slides in a chosen style, narrated, with short clips of the real app. Good for "how it works".
  - *Changelog video:* release notes or a changelog URL turned into a short narrated update.
  - *App Store preview:* real app footage only, 15 to 30 seconds, vertical. Check App Store Connect for current specs.
- **Outputs:** 16:9 master at 1920×1080, plus a 9:16 1080×1920 cut if wanted, a poster image, a 1280×720 YouTube thumbnail or a README GIF.
- **Sound:** voiceover script, voice (Glif can play samples to choose from, or clone a voice from a sample with the owner's consent), music mood (ducked under the voice), and optional click sounds synced to the cursor.
- **Captions:** word-by-word highlight, simple lower thirds, or motion-graphic overlays with numbers and charts. Ask Glif for a still frame with a few font options first if the look matters.

Show the plan and wait for a yes. Video is the most expensive thing Glif makes.

## 2. Record the app

Use the user's own recording or Loom export if they have one. Otherwise:

1. Start the app locally and seed it with demo data. Never record real customer data, emails, tokens or keys.
2. Copy [`scripts/record-demo.mjs`](scripts/record-demo.mjs) into the project's scratch space. Install Playwright if the project lacks it (`npm i -D playwright` and `npx playwright install chromium`), after checking with the user.
3. Replace the example beats with the planned steps. `glideClick` moves a visible cursor before clicking. `smoothScroll` scrolls gently. Leave about a second of stillness after each beat.
4. Run it with `DEMO_URL=<local url> node record-demo.mjs`. Add `DEMO_MOBILE=1` for a phone layout. It prints each beat's time; keep those for captions.
5. Check the result, or pull frames with `ffmpeg -ss <seconds> -i <file> -frames:v 1 frame.png`. Re-record if something glitched.
6. If `ffmpeg` is installed, convert to MP4: `ffmpeg -i in.webm -c:v libx264 -pix_fmt yuv420p -crf 18 demo-raw.mp4`.

Keep recordings out of git, such as in `recordings/` listed in `.gitignore`.

## 3. Send it to Glif

Upload each recording and the logo with `upload_file`: pass `filename` and `kind: "video"` (or `"image"`), then run the returned `command` with the real path. Attach the returned `fileUrl` values.

Call `compose_project` once with:

- the chosen template, length and every output size
- the beat list with timestamps and exact caption text, in quotes
- the voiceover script, voice choice and music mood
- brand colors (hex), logo and an intro or outro card (app name, one line, URL)
- this rule: "Keep the app footage real. Frame, crop, zoom, speed up and caption it, but never regenerate or restyle the interface. Use a programmatic video template, such as Remotion, so captions and timing are exact."

Share the `projectUrl`. Follow the run with `get_job_status`, passing the `jobId` as `job_id`. A video can take several minutes; keep working on other things meanwhile. A pending status or timeout is not a reason to start another run.

## 4. Check and save

Download with `curl -fsSL "<media url>" -o <path>` into `marketing/video/`, or `public/videos/` if the site embeds it. Check:

- size, length and codec: `ffprobe -v error -show_entries stream=codec_name,width,height:format=duration -of csv=p=0 <file>`
- caption spelling and timing against the beats
- the interface looks like the real app

Fix problems in the same project by passing its `project_id`. Don't start a fresh run for a small fix. Useful follow-ups there: a 9:16 cut, 3 alternative 3-second openings to test, or a thumbnail.

To embed on the site:

```html
<video src="/videos/demo.mp4" poster="/videos/demo-poster.jpg" autoplay muted loop playsinline width="1920" height="1080"></video>
```

For a README, a short MP4 works on GitHub. A GIF should stay under about 10 MB; ask Glif for one or make it locally with `ffmpeg`.

List the files you made. Posting or uploading to stores is the user's call.
