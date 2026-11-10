#!/usr/bin/env python3
"""LVGL A4 → PNG (white tint). See firmware-taby amoled-1.64/icons."""
from pathlib import Path
from PIL import Image

def a4_to_rgba(data: bytes, w: int, h: int, rgb=(255, 255, 255)):
    pixels = []
    for b in data:
        pixels.append(((b >> 4) & 0x0F) * 17)
        pixels.append((b & 0x0F) * 17)
    pixels = pixels[: w * h]
    img = Image.new("RGBA", (w, h))
    r, g, b = rgb
    for i, a in enumerate(pixels):
        img.putpixel((i % w, i // w), (r, g, b, a))
    return img

def main():
    src = Path("public/icons/a4")
    out = Path("public/icons/png")
    out.mkdir(parents=True, exist_ok=True)
    for f in sorted(src.glob("*.a4")):
        data = f.read_bytes()
        n = len(data) * 2
        side = int(n ** 0.5)
        img = a4_to_rgba(data, side, side)
        img.resize((24, 24), Image.Resampling.LANCZOS).save(out / f"{f.stem}.png")
        img.save(out / f"{f.stem}@2x.png")
        print(f.stem, side)
if __name__ == "__main__":
    main()
