"""Make the small app logos used in Holmstead emails (launch alerts).

Email apps fetch images at full size, so the 1024 px site logos are shrunk to 96 px (shown at 48 px, sharp on
retina) with the rounded corners baked in, because some mail apps ignore CSS border-radius.
Re-run after changing a logo in images/:  python3 scripts/make-email-icons.py
"""
from PIL import Image, ImageDraw

SIZE, RADIUS = 96, 22
# email file name -> source logo (Gradestead's site file is still named studystead.png)
SOURCES = {
    'waystead': 'waystead', 'wordstead': 'wordstead', 'broodstead': 'broodstead', 'healstead': 'healstead',
    'witstead': 'witstead', 'gradestead': 'studystead', 'holmstead': 'holmstead', 'blockstead': 'blockstead',
}

mask = Image.new('L', (SIZE * 4, SIZE * 4), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE * 4 - 1, SIZE * 4 - 1), RADIUS * 4, fill=255)
mask = mask.resize((SIZE, SIZE), Image.LANCZOS)

for out, src in SOURCES.items():
    im = Image.open(f'images/{src}.png').convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    base = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 255))  # logos sit on black; fill any transparent bits
    base.alpha_composite(im)
    base.putalpha(mask)
    base.save(f'images/email/{out}.png', optimize=True)
    print(out)
