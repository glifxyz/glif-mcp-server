---
name: web-visuals
description: |
  Make images, textures, illustrations and background video for a website or app you are building, with Glif, and wire them into the code. Use when: "add a hero image", "this page needs visuals", "replace these stock photos", "placeholder images", "background texture", "seamless pattern", "paper grain", "section backgrounds", "feature illustrations", "SVG illustration", "empty state art", "404 illustration", "infographic", "blog cover", "OG image", "social share image", "product cutouts for the shop", "looping background video", "scroll animation video", or when a page you're building has empty image slots. NOT for: editing an existing image (use edit-images), logos or icons (use app-icons-and-logos), store or launch graphics (use app-promo-materials), demo videos (use app-demo-videos), game art (use game-assets).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Make the visuals a web page needs and put them in the project. The user's explicit instructions come first, within host safety rules.

## 1. Take inventory

Read the page or component. List each visual slot:

- **Hero:** full-bleed or split, and which side the headline sits on.
- **Section backgrounds:** soft gradients, paper grain, material close-ups.
- **Textures and patterns:** must tile seamlessly.
- **Illustrations:** feature cards, empty states, 404, onboarding. Ask for SVG when the style is flat.
- **Cutouts:** product or people photos on a transparent background, to sit on page colors.
- **Infographics and stat cards:** keep the numbers and labels in HTML; let Glif make the art around them.
- **Device or hardware surface:** a photoreal laptop, phone or panel with a pure `#00FF00` screen area that your code draws live UI into.
- **OG image:** 1200×630, one per major route.
- **Motion (optional):** a looping background, or a scroll-scrubbed hero video.

Use what the user already has first. Never replace a supplied logo, product photo or screenshot. Glif fills the gaps.

## 2. Match the site's style

Pull the palette (CSS variables or Tailwind theme), fonts, mood and any existing images. Put hex colors and a one-line mood in the brief. If a logo or screenshot sets the style, upload it with `upload_file` and attach the returned `fileUrl`.

If the site supports dark mode, ask for matched light and dark versions with the same size and crop.

## 3. Check cost, then batch

Generation spends the user's Glif credits.

- If the user asked for these visuals, go ahead.
- If adding visuals was your idea, show the slot list in one line each and wait for a yes.
- Video uses more credits than images. Offer it; never make it unasked.
- When the look is still open, ask for 2 or 3 directions for the hero first, then make the rest in the chosen style.

Send **one** `compose_project` call for the whole page. For each asset, give:

- filename, such as `hero.png` or `texture-paper.png`
- exact pixel size and aspect ratio
- where it goes and what it must show
- where to leave empty space for headline text

Add these rules to every brief:

- No text, letters, logos or watermarks in images, except an OG card that should carry the page title. Real text stays in HTML.
- Textures: seamless on all four edges, 1:1, low contrast so text on top stays readable.
- Report each output's actual pixel size.

Keep coding with placeholders while it runs. Call `get_job_status` with the `jobId` as `job_id` when you need the results. A pending status or a timeout is not a reason to start another run. Share the `projectUrl`.

## 4. Bring the files home

Never hotlink Glif URLs in shipped code. Download each result into the static folder, such as `public/images/` (Next.js, Vite, Astro) or `static/` (SvelteKit):

```sh
curl -fsSL "<media url>" -o public/images/hero.png
file public/images/hero.png
```

- Use the media's MIME type for the extension. Don't overwrite an existing file; save `hero-v2.png` instead.
- Convert photos to WebP or AVIF if a tool is available, such as `sharp`, `cwebp`, `magick` or `sips`. Aim for about 300 KB for a hero, much less for other images.
- Check each texture by tiling it 2×2. If a seam shows, ask Glif to fix that one in the same project.
- Check real pixel sizes. Resize locally or ask Glif to redo a wrong one. Never upscale.
- Check any text in an OG card letter by letter.

## 5. Wire it in

- Set `width` and `height` (or use the framework's image component) to prevent layout shift.
- Hero: `fetchpriority="high"`, no lazy loading. Everything else: `loading="lazy"`.
- Add `srcset` widths such as 640, 1280 and 1920 when the framework doesn't.
- Write real `alt` text. Use `alt=""` for decorative textures.
- Textures: `background-repeat: repeat` with a sensible `background-size`. Grain overlays work well at 4–10% opacity.
- Background video: `<video autoplay muted loop playsinline poster="...">`, MP4 (H.264), no audio track.
- OG image: absolute URL in `og:image` and `twitter:card` set to `summary_large_image`.

**Scroll-scrubbed hero video.** Ask Glif for 3 to 5 keyframe stills first. After the user approves them, ask for smooth transitions between them, stitched into one MP4 encoded so every frame is a keyframe, for smooth seeking. In code, pause the video and set `video.currentTime = progress * video.duration` on scroll, inside `requestAnimationFrame`. Show the poster image when the user prefers reduced motion.

Then render the page, if you can, at narrow and wide widths, in light and dark mode. Report what you added and where. Report anything you couldn't check.

## When not to use Glif

Simple shapes, gradients, dividers and standard UI icons are better as CSS, hand-written SVG or the project's icon library. Don't spend credits on them.
