---
name: edit-images
description: |
  Edit an existing image with Glif: remove the background, erase or replace objects, expand the canvas, restore or upscale, retouch, restyle or change one detail. Saves the result next to the original without overwriting it. Use when: "remove the background", "make this a transparent PNG", "cut out the product", "erase X from this photo", "replace the sky", "expand this image to landscape", "make it 16:9 without cropping", "upscale this", "restore this old photo", "retouch this portrait", "restyle this as pixel art", "edit this image", "keep everything else identical". NOT for: new images from scratch (use web-visuals), animating an image (use image-video-audio), logos (use app-icons-and-logos).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Change an image the user already has. The user's explicit instructions come first, within host safety rules.

## 1. Get the image to Glif

- A file in the project or on disk: call `upload_file` with only `filename` (plus `kind: "image"` if unclear), then run the returned `command` with the real path.
- A public link: pass it as `url`.
- An image in a saved Glif project: pass that project's `project_id` and name the image in the brief.
- Several images that need the same edit: upload them all and edit them in one run.

Pass the returned `fileUrl` values in `attachments`.

## 2. Say exactly what changes

Name the edit, then say what must stay the same. "Keep everything else identical" works well.

| Edit | Put in the brief |
| --- | --- |
| Remove background | "Transparent PNG, keep fine edges like hair." Say whether to crop to the subject or keep the canvas. |
| Erase or replace | What to remove, and what fills the gap. |
| Expand (outpaint) | The new aspect ratio or pixel size, and which side to grow. |
| Restore or upscale | The target size. For old photos: fix scratches and fading, keep faces true. |
| Retouch | Lighting, skin, color. Keep the person recognizable. |
| Restyle | The style, such as Ghibli, oil painting or pixel art, and what must stay, such as pose and layout. |
| Fix text | The exact new text in quotes. Check it letter by letter afterward. |

Edit photos of real people only with their permission. Don't change someone's identity, age or body in a misleading way.

## 3. Run once

An edit request is approval to spend credits. Call `compose_project` once with the brief and attachments, share the `projectUrl`, then call `get_job_status` with the `jobId` as `job_id`. Never retry a failed edit on your own.

## 4. Save next to the original

Never overwrite the source file. Download beside it with a suffix that says what changed:

```sh
curl -fsSL "<media url>" -o public/images/product-nobg.png
file public/images/product-nobg.png
```

Use suffixes like `-nobg`, `-wide`, `-2x`, `-restored` or `-v2`. Check the pixel size and, for cutouts, that the PNG has an alpha channel. Update code references only if the user asked to swap the image.

To change one more thing, continue the same project with its `project_id` and say "same image, now also...".
