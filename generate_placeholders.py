from PIL import Image, ImageDraw

def create_placeholder(filename, size, color):
    img = Image.new('RGB', size, color=color)
    draw = ImageDraw.Draw(img)
    draw.text((size[0]//4, size[1]//2), filename, fill=(255, 255, 255))
    img.save(filename)
    print(f"Created {filename}")

import os
os.makedirs('assets', exist_ok=True)
os.chdir('assets')

create_placeholder('icon.png', (1024, 1024), (73, 109, 137))
create_placeholder('adaptive-icon.png', (1024, 1024), (73, 109, 137))
create_placeholder('favicon.png', (48, 48), (73, 109, 137))
create_placeholder('splash-icon.png', (1242, 2436), (73, 109, 137))
