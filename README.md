# Keystone Power Holdings website (preview)

A multi-page static site for Keystone Power Holdings, LLC, a solar developer, financier and owner. It has no framework and runs on any static host (Netlify, Vercel, GitHub Pages, cPanel).

## Pages
| Page | File |
| --- | --- |
| Home: hero, live energy counter, savings estimator, sectors, process, projects, footprint map, founders, quotes, news | `index.html` |
| Solutions: sectors, financing models, PPA vs. buying comparison, estimator, FAQ | `solutions.html` |
| Utility-scale: utilities and landowners, land check tool, process, FAQ | `utility-scale.html` |
| Projects: 19 projects (filter and sort), case studies, footprint map | `projects.html` |
| About: story, values, founder bios, milestones, offices | `about.html` |
| News: press archive | `news.html` |
| Start a project: 4-step qualifying enquiry with routing and lead score | `contact.html` |
| Not found | `404.html` |

## Editing
The HTML pages in this folder are **generated**. Edit the source, then rebuild:

```bash
python3 _src/build.py
```

- `_src/pages/*.html`: the body of each page (the meta block at the top sets the title and description)
- `_src/partials/*.html`: header, footer, CTA, estimator, tile map, founder cards, project tiles
- `assets/css/main.css`: design tokens at the top (colors, type scale, spacing), then components and breakpoints
- `assets/js/site.js`: menu, header, estimator, live counter, slider, map tooltips, project filters, enquiry wizard, land check
- `assets/js/motion.js`: GSAP, ScrollTrigger and Lenis animations (respects `prefers-reduced-motion`)

## Connecting the enquiry flow
Everything is in **`assets/js/config.js`**:

- `formEndpoint`: any URL that accepts a JSON POST (HubSpot/Salesforce web-to-lead, Formspree, a Make.com or Zapier webhook). Each enquiry includes sector, site, scale, state, timeline, contact details, `priority_score`, `priority` (A/B/C), `routed_to` office and `indicative_size`.
- `email`: used when `formEndpoint` is empty. The enquiry opens a pre-filled email instead.
- `bookingUrl`: optional scheduling link offered on the thank-you screen.
- `offices`: names and phone numbers used for routing by state.

## Preview locally
```bash
python3 -m http.server 8080
```
Then open http://localhost:8080.

## Credits
Photography: Unsplash and Pexels (free commercial license). Fonts: Archivo and JetBrains Mono (SIL Open Font License), self-hosted.
