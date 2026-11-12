#!/usr/bin/env python3
# flatmap.py: where a still is flat. Paints in red the 24 x 24 blocks whose luma moves by less than 0.8 level (the `flat` measure
# of onigam-video/tools/look-measure.py), so that one sees which surface carries the number. numpy and Pillow only.
#   flatmap.py <out.jpg> <image> [--w 1280]
import sys
import numpy as np
from PIL import Image

out, src = sys.argv[1], sys.argv[2]
w = int(sys.argv[sys.argv.index('--w') + 1]) if '--w' in sys.argv else 1280
im = Image.open(src).convert('RGB')
rgb = np.asarray(im).astype(np.float64)
y = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
n = 24
H, W = (y.shape[0] // n) * n, (y.shape[1] // n) * n
sd = y[:H, :W].reshape(H // n, n, W // n, n).swapaxes(1, 2).reshape(H // n, W // n, n * n).std(-1)
flat = np.kron(sd < 0.8, np.ones((n, n), dtype=bool))
o = rgb.copy()
o[:H, :W][flat] = 0.45 * o[:H, :W][flat] + 0.55 * np.array([255, 30, 30])
Image.fromarray(o.astype(np.uint8)).resize((w, round(w * im.height / im.width)), Image.LANCZOS).save(out, quality=88)
print(f'{src}: flat {100.0 * (sd < 0.8).mean():.1f} %')
