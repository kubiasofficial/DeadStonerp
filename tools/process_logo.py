from collections import deque
from pathlib import Path

from PIL import Image


root = Path(__file__).resolve().parents[1]
source = root / "obrazky" / "logo.png"
target = root / "obrazky" / "logo-transparent.png"

image = Image.open(source).convert("RGBA")
pixels = image.load()
width, height = image.size
visited = bytearray(width * height)
queue = deque()

for x in range(width):
    queue.append((x, 0))
    queue.append((x, height - 1))
for y in range(height):
    queue.append((0, y))
    queue.append((width - 1, y))

while queue:
    x, y = queue.popleft()
    index = y * width + x
    if visited[index]:
        continue
    visited[index] = 1
    red, green, blue, _ = pixels[x, y]
    luminance = (red * 299 + green * 587 + blue * 114) // 1000
    spread = max(red, green, blue) - min(red, green, blue)
    if luminance > 38 or spread > 24:
        continue
    alpha = max(0, min(255, int((luminance - 8) * 8.5)))
    pixels[x, y] = (red, green, blue, alpha)
    if x:
        queue.append((x - 1, y))
    if x + 1 < width:
        queue.append((x + 1, y))
    if y:
        queue.append((x, y - 1))
    if y + 1 < height:
        queue.append((x, y + 1))

alpha = image.getchannel("A")
bounds = alpha.getbbox()
if bounds:
    padding = 8
    left = max(0, bounds[0] - padding)
    top = max(0, bounds[1] - padding)
    right = min(width, bounds[2] + padding)
    bottom = min(height, bounds[3] + padding)
    image = image.crop((left, top, right, bottom))

image.save(target, optimize=True)
