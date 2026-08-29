import sys
from PIL import Image

def remove_white_bg(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # item is (R, G, B, A)
            # If the pixel is very bright/white (e.g. R, G, B all > 230)
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                # Calculate how white it is to make a smooth alpha gradient?
                # Actually, just making it fully transparent works for solid white backgrounds.
                newData.append((255, 255, 255, 0))
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Successfully processed {input_path} and saved to {output_path}")
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python remove_bg.py <input.jpg> <output.png>")
    else:
        remove_white_bg(sys.argv[1], sys.argv[2])
