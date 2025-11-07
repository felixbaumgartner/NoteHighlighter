#!/usr/bin/env python3
"""
Generate PNG icons for the Note Highlighter Chrome extension.
Requires Pillow: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Error: Pillow is not installed.")
    print("Install it with: pip install Pillow")
    exit(1)

import os


def create_icon(size):
    """Create a simple icon for the extension."""
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Calculate dimensions based on size
    padding = size // 8
    radius = size // 2 - padding

    # Draw gradient-like circle (simplified as solid color)
    draw.ellipse(
        [padding, padding, size - padding, size - padding],
        fill=(102, 126, 234, 255),  # Purple-blue color
        outline=(118, 75, 162, 255),  # Darker purple
        width=max(1, size // 32)
    )

    # Draw highlighter pen (simplified)
    pen_width = size // 3
    pen_height = size // 2
    pen_x = (size - pen_width) // 2
    pen_y = (size - pen_height) // 2

    # Pen body
    draw.rectangle(
        [pen_x, pen_y, pen_x + pen_width, pen_y + pen_height],
        fill=(255, 215, 0, 255),  # Gold color
        outline=(255, 165, 0, 255)  # Orange outline
    )

    # Pen tip
    tip_points = [
        (pen_x + pen_width // 4, pen_y + pen_height),
        (pen_x + 3 * pen_width // 4, pen_y + pen_height),
        (pen_x + pen_width // 2, pen_y + pen_height + pen_height // 4)
    ]
    draw.polygon(tip_points, fill=(255, 165, 0, 255))

    # Highlight marks
    mark_y = pen_y + pen_height // 3
    draw.rectangle(
        [pen_x - 2, mark_y, pen_x + pen_width + 2, mark_y + size // 16],
        fill=(255, 235, 59, 180)  # Yellow with transparency
    )

    return img


def main():
    """Generate all required icon sizes."""
    sizes = [16, 48, 128]
    icons_dir = 'icons'

    # Create icons directory if it doesn't exist
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)

    print("Generating icons...")

    for size in sizes:
        filename = os.path.join(icons_dir, f'icon{size}.png')
        icon = create_icon(size)
        icon.save(filename, 'PNG')
        print(f"✓ Created {filename} ({size}x{size})")

    print("\nAll icons generated successfully!")
    print(f"Icons saved in: {os.path.abspath(icons_dir)}")


if __name__ == '__main__':
    main()
