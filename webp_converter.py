from PIL import Image

img = Image.open("./images/ebook/page4.PNG")

img.save("./images/ebook/page4.webp", "WEBP", lossless=True)