from PIL import Image

img = Image.open("images/icon.PNG")

img.save("icon.webp", "WEBP", lossless=True)