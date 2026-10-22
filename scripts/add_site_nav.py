#!/usr/bin/env python3
"""Put the site nav bar (scripts/site_nav.html + css/site-nav.css) on every Holmstead page, or refresh it.

    python3 scripts/add_site_nav.py

Safe to re-run: it replaces an existing <nav class="hn"> block rather than adding a second one, so edit
site_nav.html and re-run to change the nav everywhere. NAV_PAGES is the list scripts/check_site.py
enforces; a new Holmstead page (every /demo/<app>/ page included) goes on it.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Holmstead's own pages. Deliberately NOT here: built apps synced from Holm (witstead/, musicroom/,
# onthehuh/ and any later venue folder), other brands with their own nav (oatyretreats/, stjudes/),
# and tapster/, which only redirects to /tapstead/.
NAV_PAGES = [
    "index.html", "404.html", "alerts/index.html", "delete-account/index.html", "hello-nina/index.html",
    "privacy/index.html", "ps-family/index.html", "support/index.html", "tapstead/index.html", "terms/index.html",
]
CURRENT = {"index.html": "hn-home", "tapstead/index.html": "hn-tapstead", "support/index.html": "hn-support"}  # link id
CSS = '<link rel="stylesheet" href="/css/site-nav.css">'


def nav_pages():
    """NAV_PAGES plus every demo page, so a new demo can't be missed."""
    demos = []
    demo_root = os.path.join(ROOT, "demo")
    if os.path.isdir(demo_root):
        for d in sorted(os.listdir(demo_root)):
            if os.path.isfile(os.path.join(demo_root, d, "index.html")):
                demos.append(f"demo/{d}/index.html")
    return NAV_PAGES + demos


def nav_html(page):
    html = open(os.path.join(ROOT, "scripts", "site_nav.html"), encoding="utf-8").read().strip()
    link_id = CURRENT.get(page)
    if link_id:
        href = re.search(rf'href="([^"]+)" id="{link_id}"', html).group(1)
        html = html.replace(f'id="{link_id}"', f'id="{link_id}" aria-current="page"', 1)
        html = re.sub(rf'(<details.*?<a href="{re.escape(href)}")', r'\1 aria-current="page"', html, count=1, flags=re.S)
    return html


def main():
    for page in nav_pages():
        path = os.path.join(ROOT, page)
        s = open(path, encoding="utf-8").read()
        before = s
        if CSS not in s:
            s = s.replace("</head>", f"{CSS}\n</head>", 1)
        nav = nav_html(page)
        if re.search(r'<nav class="hn".*?</nav>', s, flags=re.S):
            s = re.sub(r'<nav class="hn".*?</nav>', lambda m: nav, s, count=1, flags=re.S)
        else:
            s = re.sub(r"(<body[^>]*>)", lambda m: m.group(1) + "\n" + nav, s, count=1)
        if s != before:
            open(path, "w", encoding="utf-8").write(s)
            print("updated", page)
    return 0


if __name__ == "__main__":
    sys.exit(main())
