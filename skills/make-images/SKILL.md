---
name: make-images
description: |
  Make new still images from a brief with Glif and save them to a folder: concept art, a series of variations, mockups, posters, illustrations, wallpapers, reference boards or any picture that isn't tied to a web page, app store or game engine. Use when: "make an image of", "generate a picture", "draw me", "I need some concept art", "make 10 variations", "one in each of these styles", "mockup of", "poster for", "wallpaper", "fake screenshot of", "what would X look like as Y", "mood board images", "images for my deck or doc". NOT for: editing an existing image (use edit-images), images that go into a site you're building (use web-visuals), logos or icons (use app-icons-and-logos), store or ad graphics (use app-promo-materials), game art (use game-assets), video or audio (use audio-and-video).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Make the images the user described and put them where they can find them. The user's explicit instructions come first, within host safety rules.

## 1. Write the brief

Say what each image shows, not which model to use. Include:

- **Subject and scene:** what is in the picture and what it is doing.
- **Style:** a named look (pixel art, watercolor, 1990s desktop screenshot), a palette, lighting and mood. Name a reference style, not a living artist.
- **Size:** aspect ratio and pixel size, such as 16:9 at 1920×1080 or 1:1 at 1024×1024.
- **Count:** how many images, and what varies between them.
- **Text in the image:** the exact words in quotes, kept short. Say "no text" otherwise.
- **References:** upload a logo, sketch or style sample with `upload_file`. With shell access, pass `filename` (and `kind` if unclear), then run the returned `command` with the real path. Pass the returned `fileUrl` in `attachments`. Say what to keep from it: "Use the attached mark exactly, don't redraw it."

A series goes in one brief. Number the items and give each a short name and what makes it different, so Glif can title the outputs to match.

Use real people's faces only with their consent. Don't make images that pass as real photos of real people or events.

## 2. Check cost, then run once

Generation spends the user's Glif credits. A direct request ("make an image of…") is approval. If the images were your own idea, list them in a line each and wait for a yes.

Call `compose_project` once with the whole brief. Share the `projectUrl`. Follow the run with `get_job_status`, passing the `jobId` as `job_id`. A series can take minutes, so keep working meanwhile. A pending status or timeout is not a reason to start another run, and never retry a failure on your own.

## 3. Save and check

Download every result. In a codebase, use a folder that isn't shipped, such as `assets/` or `images/`, with a subfolder per series. Elsewhere, use the folder the user named or the current directory.

```sh
curl -fsSL "<media url>" -o assets/posters/01-noir.png
file assets/posters/01-noir.png
```

- Name files after the series item: `01-noir.png`, `02-pastel.png`.
- Use the media's MIME type for the extension. Don't overwrite an existing file; add `-v2`.
- Check the pixel size. Ask Glif to redo a wrong one in the same project; never upscale locally.
- Check any text letter by letter.
- For more than 6 images, build a contact sheet so the user can scan them in one look.

## 4. Report

Say what you made, where the files are and the `projectUrl`. Point out the ones that missed the brief. To change one image or add to the series, continue the same project with its `project_id` and name the item.
