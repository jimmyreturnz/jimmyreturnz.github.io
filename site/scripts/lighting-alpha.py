# The skin's lightingN frames are additive art on opaque black. Turn brightness into alpha so the black disappears on any background.
# The 4K hold heads/bodies and the 7K keys sit on opaque black too (black on osu!'s black lanes, but here it hides the receptors and the
# stage hint): fade near-black pixels (max channel < 40) to transparent, leaving the coloured art untouched.
# Run once after skin-to-json.mjs: python lighting-alpha.py
import glob
from PIL import Image
D = '../../assets/skin/mania/'
for f in glob.glob(D + 'lightingN-*.png'):
    im = Image.open(f).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, _ = px[x, y]; a = max(r, g, b)
            px[x, y] = (255 * r // a, 255 * g // a, 255 * b // a, a) if a else (0, 0, 0, 0)
    im.save(f)
for f in glob.glob(D + 'Arrownote_mania-note*[HL].png') + glob.glob(D + 'mania-key*.png'):
    im = Image.open(f).convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]; m = max(r, g, b)
            if m < 40: px[x, y] = (r, g, b, a * m // 40)
    im.save(f)
