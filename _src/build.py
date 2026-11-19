#!/usr/bin/env python3
"""
Static-site builder for the Keystone Power Holdings site.

  _src/pages/*.html     page bodies, starting with  <!--meta {...json...} -->
  _src/partials/*.html  shared pieces, included with {{> name}}

Placeholders:
  {{> partial}}         include _src/partials/partial.html
  {{icon:name}}         inline SVG icon (see ICONS below)
  {{mark}}              the Keystone logo mark
  {{page.key}}          a value from the page's meta block
  {{nav:key}}           aria-current="page" when the page's "nav" matches

Run:  python3 _src/build.py      (writes the finished pages next to _src/)
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "_src"
# Live address of the site. Change to "https://www.keystoneph.com" when it moves to Keystone's domain.
SITE_URL = "https://keystoneph.codebunny.net"

def svg(body, sw="1.7", fill="none"):
    return (f'<svg viewBox="0 0 24 24" fill="{fill}" stroke="currentColor" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{body}</svg>')

ICONS = {
    "arrow": svg('<path d="M5 12h14M13 6l6 6-6 6"/>', "1.8"),
    "arrow-ur": svg('<path d="M7 17 17 7M8 7h9v9"/>', "1.8"),
    "arrow-down": svg('<path d="M12 5v14M6 13l6 6 6-6"/>', "1.8"),
    "arrow-left": svg('<path d="M19 12H5M11 18l-6-6 6-6"/>', "1.8"),
    "plus": svg('<path d="M12 5v14M5 12h14"/>', "1.8"),
    "phone": svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>'),
    "mail": svg('<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>'),
    "pin": svg('<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.6"/>'),
    "linkedin": '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.79-1.7-2.79-1.7 0-1.96 1.33-1.96 2.7V21h-4z"/></svg>',
    "check": svg('<path d="m5 12.5 4.5 4.5L19 7.5"/>', "2.2"),
    "x": svg('<path d="M6 6l12 12M18 6 6 18"/>', "2"),
    "bolt": svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    "sun": svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    "leaf": svg('<path d="M11 20A7 7 0 0 1 4 13c0-6 6-9 16-10-1 10-4 16-10 16"/><path d="M2 22c3-4 6-7 11-10"/>'),
    "shield": svg('<path d="M12 22s8-3.6 8-10V5l-8-3-8 3v7c0 6.4 8 10 8 10z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>'),
    "dollar": svg('<circle cx="12" cy="12" r="9.5"/><path d="M15 8.6c-.6-.9-1.7-1.4-3-1.4-1.8 0-3 .9-3 2.3 0 3.3 6 1.8 6 5 0 1.4-1.3 2.4-3 2.4-1.4 0-2.6-.6-3.2-1.6M12 5.5v13"/>'),
    "chart": svg('<path d="M3 3v18h18"/><path d="m7 14 4-4 3 3 6-6"/><path d="M15 7h5v5"/>'),
    "building": svg('<path d="M3 21h18M5 21V7l7-4 7 4v14"/><path d="M9 21v-5h6v5M9 10h.01M15 10h.01M9 13.5h.01M15 13.5h.01"/>'),
    "school": svg('<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5M22 9v6"/>'),
    "factory": svg('<path d="M2 21h20M3 21V10l5 3V10l5 3V10l5 3V4h3v17"/><path d="M7 17h2M12 17h2"/>'),
    "heart": svg('<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/>'),
    "drop": svg('<path d="M12 2.7s7 7.3 7 12.3a7 7 0 0 1-14 0c0-5 7-12.3 7-12.3z"/><path d="M8.5 15a3.5 3.5 0 0 0 3.5 3.5"/>'),
    "grid": svg('<path d="M4 21 8 3h8l4 18z"/><path d="M6 12h12M5 16.5h14M7 7.5h10M12 3v18"/>'),
    "tower": svg('<path d="M8 22 12 2l4 20M9.5 15h5M10.4 10h3.2M5 7h14M7 7l5 5 5-5"/>'),
    "land": svg('<path d="M2 20h20M4 20l4-7 3 4 3-6 6 9"/><circle cx="17.5" cy="5.5" r="2.5"/>'),
    "roof": svg('<path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="m8 12.5 3-2 5 3.5-3 2z"/>'),
    "carport": svg('<path d="M3 7h18l-2 3H5z"/><path d="M6 10v10M18 10v10"/><path d="M8 17.5h8l-1-3H9z"/>'),
    "users": svg('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
    "clock": svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    "file": svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>'),
    "wrench": svg('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>'),
    "hammer": svg('<path d="m15 12-8.5 8.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 15 22 10.6l-6.4-6.4a4 4 0 0 0-5.7 0L9 5l6 6"/>'),
    "search": svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    "calendar": svg('<rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M16 2.5v4M8 2.5v4M3 10h18"/>'),
    "spark": '<svg viewBox="0 0 40 40" fill="currentColor" aria-hidden="true"><path d="M20 2c1.2 11.6 6.4 16.8 18 18-11.6 1.2-16.8 6.4-18 18-1.2-11.6-6.4-16.8-18-18C13.6 18.8 18.8 13.6 20 2z"/></svg>',
    "news": svg('<path d="M4 4h13v16H6a2 2 0 0 1-2-2z"/><path d="M17 8h3v10a2 2 0 0 1-2 2M8 8h5M8 12h5M8 16h3"/>'),
}

MARK = ('<svg class="brand__mark" viewBox="0 0 48 48" aria-hidden="true">'
        '<path d="M6 6h36l-8 36H14z" fill="url(#kmg)"/>'
        '<path d="M24 14.5a7.5 7.5 0 0 1 7.5 7.5h-15a7.5 7.5 0 0 1 7.5-7.5z" fill="#0F2B24"/>'
        '<path d="M13.2 26h21.6M15 31h18M16.8 36h14.4" stroke="#0F2B24" stroke-width="2" stroke-linecap="round"/>'
        '</svg>')


def render(text, meta, depth=0):
    if depth > 8:
        raise RuntimeError("include depth exceeded")

    def inc(m):
        name = m.group(1).strip()
        return render((SRC / "partials" / f"{name}.html").read_text(), meta, depth + 1)

    text = re.sub(r"\{\{>\s*([\w-]+)\s*\}\}", inc, text)
    text = re.sub(r"\{\{icon:([\w-]+)\}\}", lambda m: ICONS[m.group(1)], text)
    text = text.replace("{{mark}}", MARK)
    text = re.sub(r"\{\{nav:([\w-]+)\}\}",
                  lambda m: 'aria-current="page"' if meta.get("nav") == m.group(1) else "", text)
    text = re.sub(r"\{\{page\.([\w-]+)\}\}", lambda m: str(meta.get(m.group(1), "")), text)
    return text


IMG_WIDTHS = (480, 960, 1440)


def responsive_images(html):
    """Give every photo a srcset of the pre-sized variants (480/960/1440 + original)
    and async decoding, so phones and laptops never decode a 2000px file they
    do not need. An img may carry its own sizes="" to override the default."""
    def fix(m):
        tag = m.group(0)
        src = re.search(r'src="assets/img/([\w-]+)\.webp"', tag)
        if not src or "srcset=" in tag:
            return tag
        name = src.group(1)
        if not (ROOT / "assets/img" / f"{name}-480.webp").exists():
            return tag
        full = re.search(r'width="(\d+)"', tag)
        full_w = full.group(1) if full else "2000"
        srcset = ", ".join(f"assets/img/{name}-{w}.webp {w}w" for w in IMG_WIDTHS) + f", assets/img/{name}.webp {full_w}w"
        extra = f' srcset="{srcset}"'
        if "sizes=" not in tag:
            extra += ' sizes="(max-width: 760px) 92vw, 48vw"'
        if "decoding=" not in tag:
            extra += ' decoding="async"'
        return tag[:-1].rstrip("/").rstrip() + extra + ">"
    return re.sub(r"<img\b[^>]*>", fix, html)


def build():
    layout = (SRC / "partials" / "layout.html").read_text()
    for page in sorted((SRC / "pages").glob("*.html")):
        raw = page.read_text()
        m = re.match(r"\s*<!--meta\s*(\{.*?\})\s*-->", raw, re.S)
        meta = json.loads(m.group(1)) if m else {}
        body = raw[m.end():] if m else raw
        meta.setdefault("slug", page.name)
        meta["canonical"] = SITE_URL + "/" + ("" if page.name == "index.html" else page.name)
        meta.setdefault("og_image", "assets/img/og-image.jpg")
        meta["site_url"] = SITE_URL
        meta.setdefault("htmlclass", "" if page.name == "index.html" else "no-preloader")
        html = render(layout, meta)
        html = html.replace("{{BODY}}", render(body, meta))
        (ROOT / page.name).write_text(responsive_images(html))
        print("built", page.name)


if __name__ == "__main__":
    build()
