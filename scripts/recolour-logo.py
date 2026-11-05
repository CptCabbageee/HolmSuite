"""Recolour a flat one-colour logo on black to a new colour, keeping its soft edges.

Used when an app's own icon file doesn't suit the site (Waystead's is cropped and not square, so its clean
1024 px site logo is recoloured instead).  python scripts/recolour-logo.py images/waystead.png 637F00
"""
import sys
from PIL import Image

path, new = sys.argv[1], sys.argv[2].lstrip('#')
target = [int(new[i:i + 2], 16) for i in (0, 2, 4)]
im = Image.open(path).convert('RGBA')
px = im.load()
top = max(max(px[x, y][:3]) for x in range(im.width) for y in range(im.height))
for y in range(im.height):
    for x in range(im.width):
        r, g, b, a = px[x, y]
        t = max(r, g, b) / top
        px[x, y] = (round(target[0] * t), round(target[1] * t), round(target[2] * t), a)
im.save(path, optimize=True)
