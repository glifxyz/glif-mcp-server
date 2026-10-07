---
name: app-promo-materials
description: |
  Make launch, store and ad graphics for an app you are building, using real screens of the app and Glif for the design. Use when: "App Store screenshots", "Play Store feature graphic", "launch graphics", "Product Hunt images", "social posts for the launch", "carousel", "promo banner", "static ad", "Meta ads", "ad creatives", "resize this ad for every format", "headline variations", "YouTube thumbnail for our launch video", "X header", "email header", "replicate this ad layout for our app". NOT for: logos and icons (use app-icons-and-logos), images inside the site or OG images (use web-visuals), demo videos (use app-demo-videos), campaigns not tied to the app (use campaign-concepts).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Turn real screens of the app into polished promo graphics. The user's explicit instructions come first, within host safety rules.

## 1. Pick the deliverables

Ask which ones the user needs. Common sizes:

| Deliverable | Size (px) |
| --- | --- |
| iPhone App Store screenshots | 1320×2868 or 1290×2796, portrait |
| iPad App Store screenshots | 2064×2752, portrait |
| Google Play feature graphic | 1024×500 |
| Product Hunt gallery | 1270×760 |
| YouTube thumbnail | 1280×720 |
| X post | 1600×900 |
| LinkedIn post | 1200×627 |
| Square post | 1080×1080 |
| Feed post or carousel card (4:5) | 1080×1350, 3 to 6 cards |
| Story or Reel cover (9:16) | 1080×1920 |
| X header | 1500×500 |

Store rules change. Check App Store Connect and Play Console for the sizes they currently require. App Store screenshots must be PNG or JPEG with no transparency.

## 2. Capture real screens

Promo graphics must show the real app. Don't invent screens, features, reviews, awards or press logos.

- Use the user's screenshots if they have them.
- Otherwise run the app and capture screens with Playwright at the device size. For a 1320×2868 iPhone shot, use a 440×956 viewport with `deviceScaleFactor: 3`.
- Use demo data. Never capture real customer data, emails or keys.

Upload each screen and the logo with `upload_file` (with shell access, pass `filename` and run the returned `command`). In the brief, say: "Place the uploaded logo and screenshots exactly. Don't redraw them."

## 3. Write the copy

Write one short headline per graphic, 2 to 6 words, about a benefit the screen really shows. For ads, write 3 to 5 headline options so the user can test them. Show the copy before generating. Check names and claims against the code and README.

Thumbnails need one honest hook that matches the video, readable at about 120 px wide.

## 4. Settle the look, then make the set

A request for these graphics is approval to spend credits.

1. If there's no settled style yet, ask Glif for 2 or 3 layout directions on one hero graphic, such as the first App Store screenshot. The user picks.
2. Continue the same project (`project_id`) and make the full set in that style, in one `compose_project` call. For each graphic, give:
   - filename, exact pixel size and the attached screen it uses
   - the exact headline text, in quotes
   - layout: device frame or floating screen, headline position, background
   - shared style: brand colors (hex), fonts or mood

Ask Glif to report each output's size.

Useful follow-ups in the same project:

- **Resize:** "Recompose this finished graphic for every size in the list. Don't crop the product or the text."
- **Headline variants:** the same visual with each headline option.
- **Animated version:** a short MP4 loop of a social card.
- **Reference layout:** the user supplies an ad they like. Copy its structure only, never another brand's assets, logos or footage.

Share the `projectUrl`. Follow each run with `get_job_status`, passing the `jobId` as `job_id`. A pending status is not a reason to run again.

## 5. Check and save

Download into a folder outside the shipped site, such as `marketing/`, with `curl -fsSL "<media url>" -o <path>`. Use one folder per channel, like `marketing/app-store/01-home.png`.

Check every file:

- exact pixel size (`file`, `sips -g pixelWidth -g pixelHeight` or `magick identify`)
- spelling of every headline, letter by letter
- the screen inside matches the real app, and the logo is unchanged
- App Store files have no alpha channel. Flatten them locally if needed.

If a headline is misspelled or a screen got redrawn, ask Glif to fix that one file in the same project. Or set the text locally: build a small HTML page with the Glif background, the real screenshot and the headline, then screenshot it with Playwright at the exact size.

List what you made and where it is. Uploading to stores or posting is the user's call.
