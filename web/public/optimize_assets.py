#!/usr/bin/env python3
"""Generate optimized favicon and logo assets from the source image."""

from PIL import Image

SRC = 'favicon.ico'

def main():
    img = Image.open(SRC)
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Generate multi-resolution favicon
    favicon = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
    small = img.resize((64, 64), Image.LANCZOS)
    favicon.paste(small, (0, 0))
    favicon.save('favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print('Generated favicon.ico (~5 KB target)')

    # Generate logo PNGs for PWA
    for size in [192, 512]:
        logo = img.resize((size, size), Image.LANCZOS)
        logo.save(f'logo-{size}.png', optimize=True)
        print(f'Generated logo-{size}.png')

if __name__ == '__main__':
    main()
