#!/usr/bin/env python3
"""Static-site health check: fails the build if a page references a local
file (href/src) that doesn't actually exist. Runs on every push/PR against
main so a broken link or image never sits unnoticed on the live site."""

import os
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


def main():
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
    return 0


if __name__ == "__main__":
    sys.exit(main())
