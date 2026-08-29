import sys
from PIL import Image, ImageDraw

def remove_bg(input_path, output_path):
    try:
        # Open and convert to RGBA
        img = Image.open(input_path).convert("RGBA")
        
        # Get dimensions
        width, height = img.size
        
        # We will floodfill from all 4 corners just to be safe
        corners = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
        
        # We want to replace the background with fully transparent pixels
        transparent_color = (255, 255, 255, 0)
        
        # Threshold: how far from the corner pixel color to still be considered background
        # Pillow's thresh is exactly what we need. 
        # But wait, floodfill changes pixels in place.
        for corner in corners:
            # We must use thresh in floodfill (requires Pillow >= 8.2.0)
            ImageDraw.floodfill(img, corner, transparent_color, thresh=30)
            
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} to {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) == 3:
        remove_bg(sys.argv[1], sys.argv[2])
    else:
        print("Usage: python remove_bg_fast.py in.jpg out.png")
