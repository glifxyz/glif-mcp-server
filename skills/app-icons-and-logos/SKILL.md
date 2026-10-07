---
name: app-icons-and-logos
description: |
  Design a logo, app icon, favicon set, icon set or brand kit with Glif for an app or site you are building, then export every size and wire it into the code. Use when: "help me design a logo", "make a logo", "design an app icon", "we need a favicon", "PWA icon", "iOS app icon", "Android adaptive icon", "SVG logo", "custom icon set", "illustrated icons for these features", "emoji or sticker pack", "Discord emoji", "mascot", "animate our logo", "logo intro", "make the logo glossy 3D", "brand kit", "visual identity", "brand guidelines", "make it look like our site". NOT for: page images or textures (use web-visuals), editing an existing image (use edit-images), store or launch graphics (use app-promo-materials), game characters (use game-assets).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Create a mark the user picks, then turn it into every file the app needs. The user's explicit instructions come first, within host safety rules.

## 1. Get the brief

Ask only for what's missing:

- product name and one line on what it does
- feel: playful, serious, technical, warm...
- colors to use or avoid
- any existing logo, sketch, screenshot or site URL to build on (upload files with `upload_file`)

If the user already has a logo, use it. Don't redesign it unless asked.

## 2. Explore, then let the user pick

A request for a logo or icon is approval to spend credits on it. Send one `compose_project` call asking for 4 clearly different concepts:

- 1:1, at least 1024×1024, centered with even padding
- flat, bold shapes that still read at 32 px and in one color
- plain background, no mockups, no extra text unless it's a wordmark

Show the concepts and **stop**. The user picks. Never choose for them.

## 3. Make the finals

Continue the same project by passing its `project_id` to `compose_project`. Ask for the chosen concept as:

- an SVG, plus a 2048×2048 transparent PNG master
- one-color versions in black and white
- an icon-only square mark, if the concept has a wordmark
- an opaque square version on the brand background color, for app icons

Glif can make SVG. If a result comes back raster-only, a simple flat mark can be traced locally with `vtracer` or `potrace`. Check the trace against the PNG.

For wordmarks, check the spelling letter by letter. A crisper option is to set the name in a real font next to the mark, in SVG or HTML.

## 4. Export the sizes

Download the finals into the repo, for example `assets/brand/`, with `curl -fsSL "<media url>" -o <path>`. Make the sizes locally from the master with whatever is installed: `sharp`, `magick`, `sips` or `npx png-to-ico`. Never upscale.

**Web head kit** (in `public/` or the framework's static folder):

| File | Size | Notes |
| --- | --- | --- |
| `favicon.ico` | 16, 32, 48 | multi-size ICO |
| `favicon.svg` | vector | from the SVG master |
| `apple-touch-icon.png` | 180×180 | opaque, with padding |
| `icon-192.png`, `icon-512.png` | 192, 512 | listed in `site.webmanifest` |
| `icon-maskable-512.png` | 512×512 | mark inside the center 80% circle, `"purpose": "maskable"` |

Add the `<link rel="icon">`, `apple-touch-icon` and `manifest` tags plus `<meta name="theme-color">`. Look at the favicon at 16 px. If the mark turns to mush, use a simpler glyph or a single letter.

**iOS:** one 1024×1024 PNG with no transparency and square corners. iOS rounds the corners itself.

**Android:** adaptive icon with a foreground and a background layer, each 432×432 px at xxxhdpi. Keep the mark inside the center 264 px. The Play Store listing also needs a 512×512 PNG.

## 5. Optional extras

Offer these after the logo is approved. Each is a separate request.

- **Logo animation:** a 2 to 4 second reveal or burst, MP4 with a transparent or brand-color background, for splash screens and video intros.
- **Restyle:** the same mark as glossy 3D, Y2K chrome or another treatment, on a transparent background.
- **Brand kit:** palette with hex values, font pairing, usage rules and a one-page sheet. Glif can build it from the new logo, or from the user's existing site by its URL. Save the values as CSS variables or Tailwind theme tokens too.
- **Mascot:** a character sheet with front, side and back views plus expressions, so the mascot looks the same everywhere.

## 6. Custom icon sets

For standard UI icons like settings, search or close, use the project's icon library (Lucide, Heroicons and so on) or hand-written SVG. Don't spend credits on them.

For illustrated icons, ask for the whole set in one image so the style matches: a grid of 6 to 12 icons, same stroke weight and palette, plain background. Then ask for each one as SVG or as a 256×256 transparent PNG, named by meaning (`icon-invoices.svg`). Emoji and stickers for Slack or Discord are 128×128 transparent PNGs.

## 7. Finish

Share the `projectUrl`. List every file you wrote and the tags you added. Don't change the user's existing brand files unless they asked.
