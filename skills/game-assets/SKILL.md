---
name: game-assets
description: |
  Make art and media for a game you are building with Glif: character reference sheets, consistent characters, pixel-art sprite sheets with animation cycles, seamless and PBR textures, 3D models, item and ability icons, and trailers. Saves files where the engine expects them. Use when: "character sheet", "let's create a character sheet", "same character in every scene", "sprite sheet", "run cycle", "pixel art character", "tileset", "seamless texture for my game", "PBR materials", "3D model for Unity/Godot/three.js", "ability icons", "game trailer", "I need a cool logo for my game". NOT for: the game's logo or app icon (use app-icons-and-logos), music and sound effects (use audio-and-video), store graphics (use app-promo-materials).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Make game art that fits the engine and stays consistent. The user's explicit instructions come first, within host safety rules.

## 1. Set the style once

Before making anything, agree on:

- art style: pixel art (and resolution, such as 32×32), hand-painted, cel-shaded, low-poly, PS1 retro, realistic...
- palette and mood, and any reference art (upload it with `upload_file`)
- the engine and folder layout: Unity `Assets/Art/`, Godot `res://assets/`, web games `public/assets/`

Start with a **character reference sheet** for each main character: front, side and back views, expressions, colors and key items. Every later asset uses it as a reference, so characters stay the same. Show it and let the user approve it first.

## 2. Ask for engine-ready output

| Asset | Put in the brief |
| --- | --- |
| Sprite sheet | Frame size, frame count and layout (for example an 8-frame run cycle, 64×64 per frame, one row), solid background removed to transparent, plus a preview GIF. |
| Tileset | Tile size, which tiles (ground, edges, corners) and that edges match. |
| Seamless texture | 1:1, power-of-two size (1024, 2048 or 4096), tileable on every edge, no baked lighting or shadows. |
| PBR material | The albedo plus normal, displacement and specular or roughness maps at the same size. |
| 3D model | What it is, rough poly budget, and the file format the engine wants, such as GLB. |
| Icons | One sheet in a shared style, then each icon cut out on transparency at the size the UI uses. |
| Trailer | Length, aspect ratio, key moments and music mood. It uses generated footage, so label it as a concept, not gameplay. |

Generation spends credits. A request for the asset is approval. Batch related assets in one `compose_project` call and keep using the same `project_id` so the style carries over. Share the `projectUrl`, and follow runs with `get_job_status`, passing the `jobId` as `job_id`.

## 3. Check before using

Download with `curl -fsSL "<media url>" -o <path>` into the engine's folder. Never overwrite existing art; add `-v2`.

- Sprites: frames are evenly spaced and the same size, and the background is truly transparent. Slice locally if the engine needs single frames.
- Textures: view one tiled 2×2 or 4×4 and look for seams.
- 3D: open the model in the engine or a viewer, and check its scale and orientation.
- Pixel art: import with point (nearest) filtering, no compression.

Report what you made, where it lives and the `projectUrl`.
