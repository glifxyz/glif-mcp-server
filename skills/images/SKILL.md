---
name: images
description: |
  Make or edit still images with Glif and save them where they belong: concept art, posters, variations, illustrations, website visuals (hero images, textures, OG images), logos and app icons with every export size, game art (character sheets, sprite sheets, seamless textures), and edits to an existing image (remove the background, erase, expand, upscale, restyle). Use when: "make an image of", "generate a picture", "make 10 variations", "poster for", "mockup of", "add a hero image", "this page needs visuals", "background texture", "OG image", "design a logo", "app icon", "favicon set", "character sheet", "sprite sheet", "seamless texture", "remove the background", "make this a transparent PNG", "expand this to 16:9", "upscale this", "restyle this as pixel art". NOT for: ads, product shots, thumbnails or store graphics (use ads-and-promo), or video and audio (use video-and-audio).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Make or change the images the user asked for and put them where they belong. Glif picks the models; you write a clear brief and handle the files. The user's explicit instructions come first, within host safety rules.

## 1. Write the brief

Say what each image shows, not which model to use. Include:

- **Subject and scene:** what is in the picture and what it is doing.
- **Style:** a named look (pixel art, watercolor, 1990s desktop screenshot), a palette, lighting and mood. Name a reference style, not a living artist. In a codebase, pull the palette (CSS variables or Tailwind theme) and put hex colors in the brief.
- **Size:** aspect ratio and exact pixel size, such as 16:9 at 1920×1080 or 1:1 at 1024×1024. Many image models only make certain sizes, so ask Glif to resize to the exact size and to report each file's measured size.
- **Count:** how many images, and what varies between them. Number a series and name each item, so Glif titles the outputs to match.
- **Text in the image:** the exact words in quotes, kept short. Say "no text" otherwise. On websites, real text stays in HTML.

Use real people's faces only with their consent. Don't make images that pass as real photos of real people or events.

### Bring references or the image to edit

Upload a file only after the user agrees to send it to Glif.

- A file on disk: call `upload_file` with only `filename` (plus `kind: "image"` if unclear), then run the returned `command` with the real path. Pass the returned `fileUrl` in `attachments`.
- A public link: pass it to `upload_file` as `url`. Pass the returned `assetId` in `asset_ids`.
- An image in a saved Glif project: pass that `project_id` and name the image in the brief. Don't re-upload it.

Say what to keep from a reference: "Use the attached mark exactly, don't redraw it."

### Edits

Name the edit, then say what must stay the same. "Keep everything else identical" works well.

| Edit               | Put in the brief                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Remove background  | "Transparent PNG, keep fine edges like hair." Say whether to crop to the subject or keep the canvas.       |
| Erase or replace   | What to remove, and what fills the gap.                                                                    |
| Expand (outpaint)  | The new aspect ratio or pixel size, which side to grow, and "keep the original pixels unchanged in place". |
| Restore or upscale | The target size. For old photos: fix scratches and fading, keep faces true.                                |
| Restyle            | The style, and what must stay, such as pose and layout.                                                    |
| Fix text           | The exact new text in quotes.                                                                              |

Edit photos of real people only with their permission. Don't change someone's identity, age or body in a misleading way.

## 2. Check cost, then run once

Generation spends the user's Glif credits. A direct request ("make an image of…", "remove the background") is approval. If the images were your own idea, list them in a line each and wait for a yes. When the look is still open, ask for 2 to 4 clearly different directions first, let the user pick, then make the rest in that style in the same project.

Call `compose_project` once with the whole brief. Share the `projectUrl`. Follow the run with `get_job_status`, passing the `jobId` as `job_id` and each returned `progressCursor` as `progress_cursor`. If the call comes back as a background task, skip `get_job_status`: keep working and the host delivers the result. A pending status or timeout is not a reason to start another run, and never retry a failure on your own.

## 3. Save and check

Download every result with `curl -fsSL "<media url>" -o <path>`. Never hotlink Glif URLs in shipped code, and never overwrite an existing file: add `-v2`, or a suffix that says what changed for edits (`-nobg`, `-wide`, `-2x`).

- **Drafts and series:** a folder the build doesn't ship, such as `drafts/posters/`, or the folder the user named.
- **Website visuals:** the static folder, such as `public/images/` or `static/`.
- **Game art:** the engine's folder, such as Unity `Assets/Art/` or Godot `res://assets/`.

Check every file:

- the real pixel size (`file`, `sips -g pixelWidth -g pixelHeight` or `magick identify`). Ask Glif to redo a wrong one in the same project; never upscale locally.
- any text, letter by letter.
- cutouts have an alpha channel; textures tiled 2×2 show no seams.
- for more than 6 images, build a contact sheet so the user can scan them in one look.

## 4. Common jobs

### Website visuals

Read the page and list each slot: hero (and where the headline sits), section backgrounds, seamless textures, illustrations, cutouts, OG image (1200×630 per major route). Send one call for the whole page, with each asset's filename, pixel size, placement and empty space for text. Ask for matched light and dark versions if the site has dark mode, and ask Glif to check each texture tiled 2×2 and fix seams before it reports back. Keep coding with placeholders while it runs.

Wire them in: set `width` and `height`, `fetchpriority="high"` on the hero and `loading="lazy"` elsewhere, `srcset` widths, real `alt` text (`alt=""` for decoration), and convert photos to WebP or AVIF when a tool is available. Simple shapes, gradients and standard UI icons are better as CSS, SVG or the project's icon library.

### Logos and app icons

Ask for 4 clearly different concepts: 1:1, at least 1024×1024, flat shapes that read at 32 px. Ask Glif to also return a strip of all 4 at 32 px. Show them and stop; the user picks. Then ask for the chosen one as SVG plus a 2048×2048 transparent PNG master, one-color versions and an opaque square on the brand color. If the user already has a logo, use it.

Export locally from the master with `sharp`, `magick` or `sips`:

| File                           | Size       | Notes                                                   |
| ------------------------------ | ---------- | ------------------------------------------------------- |
| `favicon.ico`                  | 16, 32, 48 | multi-size ICO                                          |
| `favicon.svg`                  | vector     | from the SVG master                                     |
| `apple-touch-icon.png`         | 180×180    | opaque, with padding                                    |
| `icon-192.png`, `icon-512.png` | 192, 512   | listed in `site.webmanifest`                            |
| iOS app icon                   | 1024×1024  | no transparency, square corners                         |
| Android adaptive icon          | 432×432    | foreground and background layers, mark in center 264 px |

Check wordmark spelling letter by letter, and look at the favicon at 16 px.

### Game art

Agree on the art style, palette and engine first. Make a character reference sheet (front, side, back, expressions) for each main character and get it approved; every later asset uses it. Then ask for engine-ready output: sprite sheets with frame size, count and layout on transparency; tilesets with matching edges; seamless power-of-two textures without baked lighting; PBR maps at the same size; 3D models in the engine's format, such as GLB. Keep using the same `project_id` so the style carries over. Import pixel art with nearest filtering.

## 5. Report

Say what you made, where the files are and the `projectUrl`. Point out the ones that missed the brief. To change one image or add to a series, continue the same project with its `project_id` and name the item.
