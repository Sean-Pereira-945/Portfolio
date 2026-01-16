from PIL import Image
img = Image.open('static/models/Computer/baked_computer.jpg')
grids = 4
width, height = img.size
seg_w = width // grids
seg_h = height // grids
for gy in range(grids):
    for gx in range(grids):
        crop = img.crop((gx*seg_w, gy*seg_h, (gx+1)*seg_w, (gy+1)*seg_h))
        small = crop.resize((40, 20)).convert('L')
        gradients = ' .:-=+*#%@'
        print(f'--- Segment ({gx},{gy}) ---')
        for y in range(20):
            row = ''.join(gradients[pixel*len(gradients)//256] for pixel in small.crop((0,y,40,y+1)).getdata())
            print(row)
