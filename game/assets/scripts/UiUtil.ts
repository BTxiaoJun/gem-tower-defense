import { Color, Graphics, Label, Node, resources, Sprite, SpriteFrame, UITransform } from 'cc';

/** 创建一个带 UITransform 的节点并挂到父节点下，layer 跟随父节点（保证能被 UI 相机渲染） */
export function mkNode(parent: Node, name: string, w: number, h: number): Node {
    const n = new Node();
    n.name = name;
    n.layer = parent.layer;
    const ut = n.addComponent(UITransform);
    ut.setContentSize(w, h);
    parent.addChild(n);
    return n;
}

/** 异步加载 resources/art/ 下的贴图到节点 Sprite；传 w/h 则按指定尺寸显示（否则用原图尺寸） */
export function setSprite(node: Node, art: string, w?: number, h?: number): void {
    let sp = node.getComponent(Sprite);
    if (!sp) sp = node.addComponent(Sprite);
    sp.sizeMode = Sprite.SizeMode.RAW;
    resources.load(`art/${art}/spriteFrame`, SpriteFrame, (err, sf) => {
        if (err || !sf || !node.isValid) return;
        sp.spriteFrame = sf;
        if (w !== undefined && h !== undefined) {
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            node.getComponent(UITransform)!.setContentSize(w, h);
        }
    });
}

/** 在节点上取/建 Graphics */
export function gOf(n: Node): Graphics {
    let g = n.getComponent(Graphics);
    if (!g) g = n.addComponent(Graphics);
    return g;
}

/** 画一个居中的实心矩形（节点局部坐标，锚点为中心） */
export function fillRect(g: Graphics, w: number, h: number, color: Color, radius = 0): void {
    g.fillColor = color;
    if (radius > 0) g.roundRect(-w / 2, -h / 2, w, h, radius);
    else g.rect(-w / 2, -h / 2, w, h);
    g.fill();
}

/** 创建文本节点 */
export function mkLabel(parent: Node, text: string, size: number, color: Color): Label {
    const n = mkNode(parent, 'label', 100, 30);
    const l = n.addComponent(Label);
    l.string = text;
    l.fontSize = size;
    l.lineHeight = size + 4;
    l.color = color;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.verticalAlign = Label.VerticalAlign.CENTER;
    return l;
}

/** 创建一个贴图按钮，返回外壳节点；点击回调由调用方注册 */
export function mkButton(parent: Node, w: number, h: number, title: string, art: string): Node {
    const btn = mkNode(parent, 'btn_' + title, w, h);
    setSprite(btn, art, w, h);
    mkLabel(btn, title, Math.floor(h * 0.3), Color.WHITE);
    return btn;
}
