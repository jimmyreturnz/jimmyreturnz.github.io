# The skin's lightingN frames are additive art on opaque black. Turn brightness into alpha so the black disappears on any background.
# Run once after skin-to-json.mjs: python lighting-alpha.py
import glob
from PIL import Image
for f in glob.glob('../../assets/skin/mania/lightingN-*.png'):
    im = Image.open(f).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]; a = max(r, g, b)
            px[x, y] = (255 * r // a, 255 * g // a, 255 * b // a, a) if a else (0, 0, 0, 0)
    im.save(f)
