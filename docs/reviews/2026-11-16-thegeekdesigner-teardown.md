# Teardown: thegeekdesigner.com (inspiration only)

Static analysis of the public HTML, JS and CSS (REA `analyze-javascript-application` plus reading the files). Nothing is copied into this project: no code, images or cursors.

## Stack
- Plain multi-page HTML site; every link is a full page load (no SPA, no view transitions).
- jQuery 3.3.1 + a small `main.js` (~11 KB) + `plugins.js` (~32 KB of jQuery plugins).
- Plugins: **jQuery.Marquee** (scrolling text rows), **Featherlight** (lightbox, used as the full-screen menu), **tbFavAnime** (animated favicon), **parallax.js 3.1** (mouse-driven layered hero), **animate.css** (stock keyframes such as `slideInUp`).
- ~20 custom CSS keyframes: `intro`/`home-intro` (first-visit intro), `crt-flicker`, `tilt`, `shift*`, `textshift*`, `reveal`, a rainbow text effect. Custom PNG cursors.

## Techniques, and what we do with them
| Technique on their site | Take? | Our version |
|---|---|---|
| Full-screen menu overlay that slides up, one big marquee row per item | **Yes** | Vectorheart menu overlay: one row per Portfolio page, slow marquee, pauses on hover/focus, respects reduced motion |
| Marquee rows (left/right alternating, pause on hover) | **Yes, sparingly** | CSS/GSAP marquee for the menu and Shoutouts names only; never for body text |
| Hovering a word recolours the whole page (body class swap) | **Yes** | Hovering a page row in the menu tints the overlay with that page's colour |
| Floating image appears on hover | Maybe | Small vectorheart motif follows the hovered row |
| Mouse parallax hero (layered depth) | **Yes** | Lobby background layers (rings, hearts, blobs) shift slightly with the pointer; off on touch and reduced motion |
| Animated favicon cycling frames | **Yes** (cheap, fun) | Heart favicon "beats" (2–4 frames) |
| First-visit intro, skipped on return (`no-intro` class) | Already planned | Our Intro (≤4 s, Skip from frame one) |
| Header changes style after scrolling past the hero (`nav-scroll`) | Yes | Header shrinks/solidifies on scroll |
| CRT flicker, tilt, text-shift glitches, blink | **No** | Hard to read and fails our flash/motion rules |
| Huge all-caps repeated text as the main way to read content | **No** | Owner: "hard to read, I don't want that style". Content stays calm, horizontal, high contrast |
| Custom cursor images | No | Pointer stays native (accessibility, touch) |

## Takeaway
The "wow" comes from a few cheap tricks applied with confidence: the full-screen menu, marquees, colour swaps on hover, a parallax hero. All are achievable with GSAP + CSS in our stack, and none need jQuery. Readability rules from `docs/FEATURES.md` win whenever they conflict.
