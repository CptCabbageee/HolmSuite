#!/usr/bin/env python3
"""Static-site health check: fails the build if a page references a local
file (href/src) that doesn't actually exist, or if a page isn't findable
(check_findability). Runs on every push/PR against
main so a broken link or image never sits unnoticed on the live site."""

import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import urldefrag, urlparse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CHECK_ATTRS = {"href", "src"}
SKIP_HREF_PREFIXES = ("mailto:", "tel:", "javascript:", "#")


class LinkCollector(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in CHECK_ATTRS and value:
                self.links.append(value)


def resolve_local_path(page_path, link):
    """Map an href/src found in `page_path` to a filesystem path, or None
    if it's not a local reference this check can verify (external URL,
    anchor, mailto, etc.)."""
    if link.startswith(SKIP_HREF_PREFIXES):
        return None
    link, _frag = urldefrag(link)
    if not link:
        return None
    parsed = urlparse(link)
    if parsed.scheme or parsed.netloc:
        return None  # external URL — not this check's job

    if link.startswith("/"):
        rel = link.lstrip("/")
        base_dir = ROOT
    else:
        rel = link
        base_dir = os.path.dirname(page_path)

    target = os.path.normpath(os.path.join(base_dir, rel))

    if not target.startswith(ROOT):
        return None  # escaped the repo root — not ours to check

    # A directory reference (or one ending in "/") resolves to its index.html,
    # matching how GitHub Pages serves static directories.
    if target.endswith("/") or (os.path.isdir(target) and not os.path.splitext(target)[1]):
        target = os.path.join(target, "index.html")

    return target


def find_html_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d != ".git"]
        for name in filenames:
            if name.endswith(".html"):
                yield os.path.join(dirpath, name)


class HeadCollector(HTMLParser):
    """The findability tags of one page (Holm .claude/web-seo.md)."""

    def __init__(self):
        super().__init__()
        self.title = ""
        self._in_title = False
        self.description = None
        self.canonical = None
        self.noindex = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "title":
            self._in_title = True
        elif tag == "meta" and a.get("name") == "description":
            self.description = (a.get("content") or "").strip()
        elif tag == "meta" and a.get("name") == "robots" and "noindex" in (a.get("content") or ""):
            self.noindex = True
        elif tag == "link" and a.get("rel") == "canonical":
            self.canonical = a.get("href")

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False

    def handle_data(self, data):
        if self._in_title:
            self.title += data


def check_findability():
    """Every index.html must either say noindex (and stay out of the sitemap) or carry a title, a
    description and a canonical link to its own address, and be listed in sitemap.xml. robots.txt
    must point at the sitemap. George, 2026-10-14: "Make this standard work for everything on the web"
    (Holm .claude/web-seo.md). The automatic sync-* rebuilds run this too, so an app that drops its
    tags stops here."""
    problems = []
    sitemap_path = os.path.join(ROOT, "sitemap.xml")
    robots_path = os.path.join(ROOT, "robots.txt")
    if not os.path.exists(sitemap_path):
        return ["sitemap.xml is missing"]
    with open(sitemap_path, encoding="utf-8") as f:
        listed = set(re.findall(r"<loc>\s*([^<\s]+)\s*</loc>", f.read()))
    if not os.path.exists(robots_path):
        problems.append("robots.txt is missing")
    else:
        with open(robots_path, encoding="utf-8") as f:
            if "Sitemap: https://holmsuite.com/sitemap.xml" not in f.read():
                problems.append("robots.txt doesn't point at https://holmsuite.com/sitemap.xml")

    for page_path in find_html_files():
        if os.path.basename(page_path) != "index.html":
            continue
        rel_dir = os.path.relpath(os.path.dirname(page_path), ROOT)
        url = "https://holmsuite.com/" + ("" if rel_dir == "." else rel_dir.replace(os.sep, "/") + "/")
        head = HeadCollector()
        with open(page_path, encoding="utf-8") as f:
            head.feed(f.read())
        name = os.path.relpath(page_path, ROOT)
        if head.noindex:
            if url in listed:
                problems.append(f"{name}: says noindex but is listed in sitemap.xml")
            continue
        if not head.title.strip():
            problems.append(f"{name}: no <title>")
        if not head.description:
            problems.append(f"{name}: no <meta name=\"description\">")
        if head.canonical != url:
            problems.append(f"{name}: canonical should be {url} (found {head.canonical})")
        if url not in listed:
            problems.append(f"{name}: {url} is not in sitemap.xml")
    return problems


def main():
    findability = check_findability()
    if findability:
        print(f"Found {len(findability)} findability problem(s) (Holm .claude/web-seo.md):\n")
        for p in findability:
            print(f"  {p}")
        print()
    broken = []
    for page_path in find_html_files():
        with open(page_path, encoding="utf-8") as f:
            html = f.read()
        collector = LinkCollector()
        collector.feed(html)
        for link in collector.links:
            target = resolve_local_path(page_path, link)
            if target is None:
                continue
            if not os.path.exists(target):
                broken.append((os.path.relpath(page_path, ROOT), link))

    if broken:
        print(f"Found {len(broken)} broken local link(s)/reference(s):\n")
        for page, link in broken:
            print(f"  {page} -> {link}")
        return 1

    print("All local links and asset references resolve.")
    if findability:
        return 1
    print("Every page is findable or marked noindex.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
