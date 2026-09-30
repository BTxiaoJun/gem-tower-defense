# -*- coding: utf-8 -*-
"""《宝石塔防》程序化美术生成器：按星际2宝石迷阵风格产出全套贴图。
运行：python tools/gen_art.py   输出：game/assets/resources/art/*.png
所有贴图按显示尺寸的 1~2 倍生成，代码里用 setContentSize 缩放。"""
import os, random
from PIL import Image, ImageDraw, ImageFilter, ImageChops, ImageOps

random.seed(7)
OUT = os.path.join(os.path.dirname(__file__), '..', 'game', 'assets', 'resources', 'art')
os.makedirs(OUT, exist_ok=True)

FACTION_BLUE = (58, 123, 213)
FACTION_RED = (213, 58, 58)
METAL_D = (30, 34, 42)
METAL_L = (74, 82, 98)


def vgrad(size, top, bottom):
    g = Image.linear_gradient('L').resize(size)
    return ImageOps.colorize(g, black=top, white=bottom).convert('RGBA')


def noise(size, strength=24):
    n = Image.frombytes('L', size, bytes(bytearray(random.randrange(256) for _ in range(size[0] * size[1]))))
    return n.point(lambda v: 128 + (v - 128) * strength // 255)


def radial_mask(size, invert=False):
    m = Image.radial_gradient('L').resize(size)
    return ImageOps.invert(m) if invert else m


def save(img, name):
    img.save(os.path.join(OUT, name))
    print('  ', name, img.size)


def gloss_disc(size, color, ring_color):
    """光泽圆形筹码：金属外圈 + 径向渐变主体 + 顶部高光"""
    s2 = (size, size)
    img = Image.new('RGBA', s2, (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = size // 2
    r_outer = m - 3
    # 金属外圈
    d.ellipse([m - r_outer, m - r_outer, m + r_outer, m + r_outer], fill=(52, 58, 70, 255))
    d.ellipse([m - r_outer + 2, m - r_outer + 2, m + r_outer - 2, m + r_outer - 2],
              fill=tuple(min(255, c + 26) for c in ring_color[:3]) + (255,))
    # 主体径向渐变
    r_in = r_outer - 8
    disc = Image.new('L', s2, 0)
    dd = ImageDraw.Draw(disc)
    dd.ellipse([m - r_in, m - r_in, m + r_in, m + r_in], fill=255)
    grad = ImageOps.colorize(radial_mask(s2, invert=True), black=tuple(max(0, c - 46) for c in color[:3]),
                             white=tuple(min(255, c + 42) for c in color[:3])).convert('RGBA')
    grad.putalpha(disc)
    img = Image.alpha_composite(img, grad)
    # 底部暗缘 + 顶部高光
    shade = Image.new('RGBA', s2, (0, 0, 0, 0))
    ds = ImageDraw.Draw(shade)
    ds.ellipse([m - r_in, m, m + r_in, m + r_in], fill=(0, 0, 0, 70))
    shade.putalpha(ImageChops.multiply(shade.getchannel('A'), disc))
    img = Image.alpha_composite(img, shade)
    hl = Image.new('RGBA', s2, (0, 0, 0, 0))
    dh = ImageDraw.Draw(hl)
    dh.ellipse([m - r_in * 0.55, m - r_in * 0.85, m + r_in * 0.1, m - r_in * 0.25], fill=(255, 255, 255, 110))
    dh.ellipse([m - r_in * 0.3, m - r_in * 0.7, m - r_in * 0.12, m - r_in * 0.52], fill=(255, 255, 255, 190))
    hl.putalpha(ImageChops.multiply(hl.getchannel('A'), disc))
    img = Image.alpha_composite(img, hl)
    return img


def gem_with_shape(size, color, shape):
    """在光泽筹码上叠形状：shield/diamond/orb/bolt"""
    img = gloss_disc(size, color, (88, 96, 112))
    d = ImageDraw.Draw(img)
    m = size // 2
    r = int(size * 0.27)
    white = (245, 248, 255, 235)
    dark = tuple(max(0, c - 60) for c in color[:3]) + (255,)
    if shape == 'shield':  # 盾牌
        pts = [(m - r, m - r * 0.9), (m + r, m - r * 0.9), (m + r, m + r * 0.2),
               (m, m + r), (m - r, m + r * 0.2)]
        d.polygon(pts, fill=white)
        d.polygon([(m - r * 0.45, m - r * 0.45), (m + r * 0.45, m - r * 0.45), (m, m + r * 0.35)], fill=dark)
    elif shape == 'diamond':  # 菱形水晶
        d.polygon([(m, m - r * 1.25), (m + r * 0.85, m), (m, m + r * 1.25), (m - r * 0.85, m)], fill=white)
        d.line([(m, m - r * 1.25), (m, m + r * 1.25)], fill=dark, width=max(2, size // 40))
    elif shape == 'orb':  # 能量球
        d.ellipse([m - r * 0.9, m - r * 0.9, m + r * 0.9, m + r * 0.9], fill=white)
        d.ellipse([m - r * 0.45, m - r * 0.45, m + r * 0.45, m + r * 0.45], fill=dark)
    elif shape == 'bolt':  # 闪电
        b = r * 1.2
        d.polygon([(m + b * 0.25, m - b), (m - b * 0.55, m + b * 0.15), (m - b * 0.05, m + b * 0.15),
                   (m - b * 0.3, m + b), (m + b * 0.55, m - b * 0.2), (m + b * 0.05, m - b * 0.2)], fill=white)
    return img


def gen_gems():
    save(gem_with_shape(92, (232, 74, 74), 'shield'), 'gem_red.png')
    save(gem_with_shape(92, (64, 148, 255), 'diamond'), 'gem_blue.png')
    save(gem_with_shape(92, (94, 208, 84), 'orb'), 'gem_green.png')
    save(gem_with_shape(92, (255, 196, 48), 'bolt'), 'gem_yellow.png')


def gen_sel_ring():
    s = 92
    img = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([4, 4, s - 4, s - 4], radius=14, outline=(255, 255, 255, 230), width=6)
    img = img.filter(ImageFilter.GaussianBlur(1))
    save(img, 'sel_ring.png')


def gen_bars():
    w, h = 584, 60
    slot = vgrad((w, h), (16, 18, 24, 255), (34, 38, 48, 255))
    d = ImageDraw.Draw(slot)
    d.rounded_rectangle([2, 2, w - 2, h - 2], radius=12, outline=(90, 98, 114, 255), width=4)
    d.rounded_rectangle([6, 6, w - 6, h - 6], radius=9, outline=(0, 0, 0, 160), width=3)
    save(slot, 'bar_slot.png')

    fill = vgrad((w, h), (90, 176, 255, 255), (34, 108, 235, 255))
    df = ImageDraw.Draw(fill)
    df.rectangle([0, 0, w, h * 0.28], fill=(190, 226, 255, 160))
    glow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    dg = ImageDraw.Draw(glow)
    dg.rounded_rectangle([0, 0, w - 1, h - 1], radius=12, outline=(140, 200, 255, 200), width=3)
    fill = Image.alpha_composite(fill, glow.filter(ImageFilter.GaussianBlur(2)))
    save(fill, 'bar_fill.png')


def metal_panel(w, h, grooves):
    img = vgrad((w, h), (56, 62, 76, 255), (32, 36, 45, 255))
    # 横向拉丝（仅在 RGB 上做混合，避免污染 alpha 通道）
    streaks = noise((w, max(2, h // 14)), 18).resize((w, h))
    rgb = ImageChops.overlay(img.convert('RGB'), streaks.convert('RGB'))
    img = rgb.convert('RGBA')
    d = ImageDraw.Draw(img)
    # 外框斜面
    d.rectangle([0, 0, w - 1, h - 1], outline=(18, 20, 26, 255), width=6)
    d.rectangle([6, 6, w - 7, h - 7], outline=(112, 122, 140, 255), width=3)
    d.rectangle([10, 10, w - 11, h - 11], outline=(12, 14, 18, 255), width=2)
    # 凹槽分隔线
    for gy in grooves:
        d.line([(14, gy), (w - 14, gy)], fill=(10, 12, 16, 255), width=5)
        d.line([(14, gy + 5), (w - 14, gy + 5)], fill=(104, 112, 128, 255), width=2)
    # 角落铆钉
    for cx in (26, w - 26):
        for cy in (26, h // 2, h - 26):
            d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(20, 22, 28, 255))
            d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(120, 130, 148, 255))
    # 红色阵营徽记（左右居中）
    for ex in (w - 52, 52):
        sign = 1 if ex == w - 52 else -1
        cy = h // 2
        pts = [(ex + 18 * sign, cy - 30), (ex - 12 * sign, cy - 30), (ex - 12 * sign, cy + 8),
               (ex + 18 * sign, cy + 30), (ex + 18 * sign, cy + 8)]
        d.polygon(pts, fill=(150, 36, 36, 255))
        d.polygon([(ex + 12 * sign, cy - 20), (ex - 6 * sign, cy - 20), (ex - 6 * sign, cy + 2),
                   (ex + 12 * sign, cy + 16)], fill=(214, 70, 70, 255))
    return img


def gen_panel():
    save(metal_panel(720, 1440, [96, 716, 840, 1240]).resize((360, 720), Image.LANCZOS), 'panel.png')


def gen_buttons():
    card = metal_panel(240, 144, [])
    d = ImageDraw.Draw(card)
    d.rounded_rectangle([10, 10, 230, 134], radius=12, outline=(12, 14, 18, 255), width=3)
    save(card.resize((120, 72), Image.LANCZOS), 'btn_unit.png')

    s = 184
    skill = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(skill)
    d.ellipse([4, 4, s - 4, s - 4], fill=(38, 44, 56, 255))
    d.ellipse([10, 10, s - 10, s - 10], outline=(120, 132, 152, 255), width=5)
    inner = vgrad((s - 52, s - 52), (46, 96, 190, 255), (24, 48, 110, 255))
    mask = Image.new('L', (s - 52, s - 52), 0)
    dm = ImageDraw.Draw(mask)
    dm.ellipse([0, 0, s - 53, s - 53], fill=255)
    inner.putalpha(mask)
    skill.alpha_composite(inner, (26, 26))
    d = ImageDraw.Draw(skill)
    d.ellipse([s * 0.3, s * 0.2, s * 0.55, s * 0.4], fill=(190, 220, 255, 120))
    save(skill.resize((92, 92), Image.LANCZOS), 'btn_skill.png')


def faction_ring(base_img, color, size):
    d = ImageDraw.Draw(base_img)
    m = size // 2
    d.ellipse([6, 6, size - 6, size - 6], outline=color + (255,), width=10)
    return base_img


def gen_field():
    # 地面：石板 + 裂缝 + 苔痕 + 暗角
    w, h = 1280, 720
    ground = vgrad((w, h), (52, 54, 50, 255), (30, 32, 30, 255))
    d = ImageDraw.Draw(ground)
    tile = 80
    for ty in range(0, h, tile):
        for tx in range(0, w, tile):
            jitter = random.randrange(-7, 8)
            c = 58 + jitter
            d.rectangle([tx + 2, ty + 2, min(tx + tile - 2, w), min(ty + tile - 2, h)],
                        fill=(c, c + 2, c - 2, 255))
    for _ in range(40):
        x, y = random.randrange(w), random.randrange(h)
        for _ in range(random.randrange(3, 7)):
            nx, ny = x + random.randrange(-46, 46), y + random.randrange(-30, 30)
            d.line([(x, y), (nx, ny)], fill=(24, 25, 23, 255), width=2)
            x, y = nx, ny
    for _ in range(14):
        x, y = random.randrange(w), random.randrange(h)
        rw, rh = random.randrange(60, 200), random.randrange(40, 120)
        d.ellipse([x, y, x + rw, y + rh], fill=(48, 58, 40, 60))
    dots = noise((w, h), 30)
    rgb = ImageChops.overlay(ground.convert('RGB'), dots.convert('RGB'))
    ground = rgb.convert('RGBA')
    vig = radial_mask((w, h)).point(lambda v: 120 + v * 135 // 255)
    black = Image.new('RGBA', (w, h), (0, 0, 0, 255))
    ground.putalpha(vig)
    ground = Image.alpha_composite(black, ground)
    save(ground, 'ground.png')

    # 基地：金属要塞方块
    for name, col in (('base_blue', FACTION_BLUE), ('base_red', FACTION_RED)):
        s = 128
        b = metal_panel(s, s, [])
        d = ImageDraw.Draw(b)
        d.rounded_rectangle([14, 14, s - 14, s - 14], radius=14, fill=col + (255,))
        core = radial_mask((s, s), invert=True).point(lambda v: v * 70 // 255)
        glow = Image.merge('RGBA', (Image.new('L', (s, s), 255),) * 3 + (core,))
        b = Image.alpha_composite(b, glow)
        d = ImageDraw.Draw(b)
        d.ellipse([s * 0.32, s * 0.32, s * 0.68, s * 0.68], fill=(240, 246, 255, 230))
        save(b, name + '.png')

    # 箭塔：圆形炮塔
    for name, col in (('tower_blue', FACTION_BLUE), ('tower_red', FACTION_RED)):
        s = 96
        t = Image.new('RGBA', (s, s), (0, 0, 0, 0))
        d = ImageDraw.Draw(t)
        d.ellipse([6, 6, s - 6, s - 6], fill=(46, 52, 64, 255))
        d.ellipse([16, 16, s - 16, s - 16], fill=col + (255,))
        d.ellipse([s * 0.36, s * 0.36, s * 0.64, s * 0.64], fill=(235, 240, 250, 255))
        d.rectangle([s // 2 - 4, 8, s // 2 + 4, s // 2], fill=(28, 32, 40, 255))
        save(t, name + '.png')

    # 单位：三种体型 × 双阵营
    radii = [30, 40, 52]  # 128 画布上的半径，对应游戏内 r 13/17/23 的视觉层级
    cores = [(120, 220, 255), (130, 235, 120), (255, 190, 90)]
    for idx in range(3):
        for fac, col in (('p', FACTION_BLUE), ('e', FACTION_RED)):
            s = 128
            u = Image.new('RGBA', (s, s), (0, 0, 0, 0))
            d = ImageDraw.Draw(u)
            r = radii[idx]
            disc = gloss_disc(s, cores[idx], (70, 78, 92)).getchannel('A')
            body = gloss_disc(s, cores[idx], col)
            # 缩小身体到目标半径：以外圈透明裁切
            mask = Image.new('L', (s, s), 0)
            dm = ImageDraw.Draw(mask)
            dm.ellipse([s // 2 - r - 12, s // 2 - r - 12, s // 2 + r + 12, s // 2 + r + 12], fill=255)
            body.putalpha(ImageChops.multiply(body.getchannel('A'), mask))
            u = Image.alpha_composite(u, body)
            d = ImageDraw.Draw(u)
            d.ellipse([s // 2 - r - 12, s // 2 - r - 12, s // 2 + r + 12, s // 2 + r + 12],
                      outline=col + (255,), width=8)
            # 阵营徽记点
            d.regular_polygon((s // 2, s // 2, r * 0.42), n_sides=6, rotation=15,
                              fill=col + (235,))
            save(u, f'unit_{idx}_{fac}.png')


if __name__ == '__main__':
    print('生成美术资源到', os.path.abspath(OUT))
    gen_gems()
    gen_sel_ring()
    gen_bars()
    gen_panel()
    gen_buttons()
    gen_field()
    print('完成，共', len(os.listdir(OUT)), '个文件')
