import os
from PIL import Image

images_to_convert = [
    ("images/profile_0826.png", "images/profile_0826.webp"),
    ("images/hanhwa.jpeg", "images/hanhwa.webp"),
    ("images/IMG_0036.JPG", "images/IMG_0036.webp"),
    ("images/IMG_1747.JPEG", "images/IMG_1747.webp"),
    ("images/IMG_8214.JPG", "images/IMG_8214.webp"),
    ("images/IMG_8705.JPG", "images/IMG_8705.webp"),
    ("images/IMG_0453.JPG", "images/IMG_0453.webp"),
    ("images/IMG_8065 2.jpg", "images/IMG_8065_2.webp")
]

for input_path, output_path in images_to_convert:
    try:
        if os.path.exists(input_path):
            img = Image.open(input_path)
            # Convert to RGB if necessary (e.g. for PNGs with transparency)
            if img.mode in ("RGBA", "LA"):
                # For WebP, RGBA is supported, but sometimes it's good to ensure compatibility.
                # However, profile image might need transparency.
                pass 
            
            img.save(output_path, "WEBP", quality=80)
            print(f"Converted {input_path} to {output_path}")
            
            old_size = os.path.getsize(input_path)
            new_size = os.path.getsize(output_path)
            print(f"Size reduction: {old_size/1024:.2f}KB -> {new_size/1024:.2f}KB ({(1-new_size/old_size)*100:.1f}%)")
        else:
            print(f"File not found: {input_path}")
    except Exception as e:
        print(f"Failed to convert {input_path}: {e}")
