---
name: app-promo-materials
description: |
  Plan and make launch, store, ad and campaign graphics with Glif: real app screens turned into store listings and launch posts, or a coordinated set of product photos, ads, a short video and a jingle for any product. Use when: "App Store screenshots", "Play Store feature graphic", "launch graphics", "Product Hunt images", "social posts for the launch", "carousel", "promo banner", "static ad", "Meta ads", "ad creatives", "ad concepts", "angles to test", "UGC-style ads", "turn these reviews into ads", "product photos for my shop", "Amazon or Shopify listing images", "lifestyle shots of this product", "social media calendar", "a week of posts", "launch campaign", "poster series", "mood board", "storyboard this ad", "resize this ad for every format", "headline variations", "YouTube thumbnail", "X header", "email header". NOT for: logos and icons (use app-icons-and-logos), images inside the site or OG images (use web-visuals), demo videos (use app-demo-videos), one-off edits (use edit-images).
compatibility: Requires the Glif MCP server at https://glif.app/api/mcp.
---

Turn a product into polished promo graphics. For an app, that means real screens. For anything else, it means the user's product photos and references. The user's explicit instructions come first, within host safety rules.

## 1. Pick the deliverables

Pin down the subject, audience, mood, formats and any references. Ask only about gaps that would change the result. Then pick deliverables from these menus, or the user's own list.

Store and launch sizes:

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

Campaign sets:

- **Ad creative:** UGC-style creator video (9:16, script, captions), product ad video, carousel (3 to 6 cards), static banners, unboxing.
- **Product photos:** studio hero on white, flat-lay, lifestyle scene, multi-angle set, detail close-up, what's in the box. Ask how many (2, 4 or 8) and keep the product identical to the user's photo.
- **Social calendar:** a week or a month of posts with captions and hashtags.
- **Series:** a repeatable format, such as a daily 40-second short. Save the recipe so each episode continues the same project.

Make the winner first, then resize it for each placement without cropping.

## 2. Gather real material

Promo graphics must show the real product. Don't invent screens, features, reviews, awards, press logos or partner logos. Turning real reviews into ads is fine when the user supplies them.

- Use the user's screenshots and product photos if they have them.
- For an app without screenshots, run it and capture screens with Playwright at the device size. For a 1320×2868 iPhone shot, use a 440×956 viewport with `deviceScaleFactor: 3`.
- Use demo data. Never capture real customer data, emails or keys.

Upload each screen, product photo and the logo with `upload_file` (with shell access, pass `filename` and run the returned `command`), only when the user agrees to send them to Glif. In the brief, say: "Place the uploaded logo and screenshots exactly. Don't redraw them."

## 3. Write the copy and angles

Draft the angles in text first; that's free. Write one short headline per graphic, 2 to 6 words, about a benefit the screen or product really shows. For ads, write 3 to 5 headline options so the user can test them. Offer about 4 variants per piece, not dozens, unless the user asks. For video, offer a storyboard of stills before animating.

Show the copy before generating. Check names and claims against the code, README or product page. Thumbnails need one honest hook that matches the video, readable at about 120 px wide.

## 4. Settle the look, then make the set

A request for these graphics is approval to spend credits. If the user only asked to plan or preview, show the draft and wait. Do not ask again after a clear request.

1. If there's no settled style yet, ask Glif for 2 or 3 layout directions on one hero graphic, such as the first App Store screenshot or the lead ad. The user picks.
2. Continue the same project (`project_id`) and make the full set in that style, in one `compose_project` call. For each graphic, give:
   - filename, exact pixel size and the attached screen or photo it uses
   - the exact headline text, in quotes
   - layout: device frame or floating screen, headline position, background
   - shared style: brand colors (hex), fonts or mood

For a video or audio item in the set, such as a UGC clip or a jingle, write its brief in the same call the way the audio-and-video skill does: shots with camera and action, the exact script in quotes, or music mood, tempo and length. Download those results with the same `curl` step and check them with `ffprobe`.

Describe creative goals; Glif picks the models. Leave `intelligence` unset unless the user asks for `lite`, `smart` or `genius`. Ask Glif to report each output's size.

Useful follow-ups in the same project:

- **Resize:** "Recompose this finished graphic for every size in the list. Don't crop the product or the text."
- **Headline variants:** the same visual with each headline option.
- **Animated version:** a short MP4 loop of a social card.
- **Reference layout:** the user supplies an ad they like. Copy its structure only, never another brand's assets, logos or footage.

Share the `projectUrl`. Follow each run with `get_job_status`, passing the `jobId` as `job_id`. Show new media as it arrives without repeats. A pending status is not a reason to run again, and never retry a failure on your own.

## 5. Check and save

Download into a folder outside the shipped site, such as `marketing/`, with `curl -fsSL "<media url>" -o <path>`. Use one folder per channel, like `marketing/app-store/01-home.png`.

Check every file:

- exact pixel size (`file`, `sips -g pixelWidth -g pixelHeight` or `magick identify`)
- spelling of every headline, letter by letter
- the screen or product inside matches the real thing, and the logo is unchanged
- App Store files have no alpha channel. Flatten them locally if needed.

If a headline is misspelled or a screen got redrawn, ask Glif to fix that one file in the same project. Or set the text locally: build a small HTML page with the Glif background, the real screenshot and the headline, then screenshot it with Playwright at the exact size.

List what you made and where it is. Uploading to stores or posting is the user's call.
