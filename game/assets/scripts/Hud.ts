import { BlockInputEvents, Color, Graphics, Label, Node, UIOpacity } from 'cc';
import { C, CFG } from './GameConfig';
import { fillRect, gOf, mkButton, mkLabel, mkNode, setSprite } from './UiUtil';

interface HudCallbacks {
    onSummon: (idx: number) => void;
    onSkill: (idx: number) => void;
    onRestart: () => void;
}

/** HUD：能量条、召唤按钮、技能按钮、结算弹层 */
export class Hud {
    private barLabel!: Label;
    private fillNode!: Node;
    private summonBtns: Node[] = [];
    private skillBtns: Node[] = [];
    private resultRoot!: Node;
    private resultLabel!: Label;
    private statsLabel!: Label;
    private fP!: Graphics;
    private fE!: Graphics;
    private cb: HudCallbacks;
    private energy = 0;

    constructor(root: Node, W: number, H: number, cb: HudCallbacks) {
        this.cb = cb;
        const panelX = W / 2 - 180;
        const boardH = CFG.match.rows * CFG.match.cell + 16;

        // 能量条（在消消乐面板下方）
        const barW = CFG.match.cols * CFG.match.cell + 16;
        const barRoot = mkNode(root, 'energybar', barW, 30);
        barRoot.setPosition(panelX, H / 2 - boardH - 74, 0);
        setSprite(barRoot, 'bar_slot', barW, 30);
        const fillN = mkNode(barRoot, 'fill', barW - 8, 12);
        fillN.setPosition(0, -3, 0);
        setSprite(fillN, 'bar_fill', barW - 8, 12);
        this.fillNode = fillN;
        this.barLabel = mkLabel(barRoot, '能量 0', 15, Color.WHITE);
        this.barLabel.node.setPosition(0, 2, 0);

        // 顶部双方基地血量总览（在金属面板最上方）
        const mkFbar = (cx: number, text: string, hex: string): Graphics => {
            const l = mkLabel(root, text, 13, C('#c8d2e0'));
            l.node.setPosition(cx, H / 2 - 16, 0);
            const bar = mkNode(root, 'fbar', 150, 12);
            bar.setPosition(cx, H / 2 - 33, 0);
            fillRect(gOf(bar), 150, 12, new Color(0, 0, 0, 170), 5);
            const f = mkNode(bar, 'fill', 146, 8);
            const fg = gOf(f);
            fillRect(fg, 146, 8, C(hex), 3);
            return fg;
        };
        this.fP = mkFbar(panelX - 85, '我方基地', '#5dff70');
        this.fE = mkFbar(panelX + 85, '敌方基地', '#ff5a5a');

        // 底部按钮条
        const by = -H / 2 + 52;
        const names = CFG.units.map((u) => `${u.name}\n${u.cost}`);
        for (let i = 0; i < names.length; i++) {
            const btn = mkButton(root, 92, 58, names[i], 'btn_unit');
            btn.setPosition(-W / 2 + 70 + i * 108, by, 0);
            btn.addComponent(UIOpacity);
            btn.on(Node.EventType.TOUCH_END, () => this.cb.onSummon(i));
            this.summonBtns.push(btn);
        }
        const skillDefs = [CFG.skills.fireball, CFG.skills.rage];
        for (let i = 0; i < skillDefs.length; i++) {
            const btn = mkButton(root, 92, 58, `${skillDefs[i].name}\n${skillDefs[i].cost}`, 'btn_skill');
            btn.setPosition(-W / 2 + 430 + i * 108, by, 0);
            btn.addComponent(UIOpacity);
            btn.on(Node.EventType.TOUCH_END, () => this.cb.onSkill(i));
            this.skillBtns.push(btn);
        }

        // 结算弹层（默认隐藏）
        this.resultRoot = mkNode(root, 'result', W, H);
        this.resultRoot.setPosition(0, 0, 0);
        fillRect(gOf(this.resultRoot), W, H, new Color(10, 12, 18, 200), 0);
        this.resultRoot.addComponent(BlockInputEvents);
        this.resultLabel = mkLabel(this.resultRoot, '胜利！', 64, Color.WHITE);
        this.statsLabel = mkLabel(this.resultRoot, '', 22, C('#cdd6e4'));
        this.statsLabel.node.setPosition(0, -36, 0);
        const btn = mkButton(this.resultRoot, 180, 56, '再来一局', '#37517a');
        btn.setPosition(0, -110, 0);
        btn.on(Node.EventType.TOUCH_END, () => this.cb.onRestart());
        this.resultRoot.active = false;
    }

    setEnergy(v: number): void {
        this.energy = v;
        const barW = CFG.match.cols * CFG.match.cell + 16;
        const ratio = Math.min(1, v / CFG.energyMax);
        this.fillNode.setContentSize(Math.max(1, (barW - 8) * ratio), 12);
        this.barLabel.string = `能量 ${Math.floor(v)} / ${CFG.energyMax}`;
        // 按钮可用状态
        for (let i = 0; i < this.summonBtns.length; i++) {
            this.setBtnEnabled(this.summonBtns[i], v >= CFG.units[i].cost);
        }
        this.setBtnEnabled(this.skillBtns[0], v >= CFG.skills.fireball.cost);
        this.setBtnEnabled(this.skillBtns[1], v >= CFG.skills.rage.cost);
    }

    /** 面板顶部双方基地血量总览 */
    setFactionHp(p: number, e: number): void {
        this.drawF(this.fP, p);
        this.drawF(this.fE, e);
    }

    private drawF(g: Graphics, ratio: number): void {
        g.node.setContentSize(Math.max(1, 146 * Math.max(0, Math.min(1, ratio))), 8);
    }

    private setBtnEnabled(btn: Node, on: boolean): void {
        btn.getComponent(UIOpacity)!.opacity = on ? 255 : 110;
    }

    showResult(win: boolean, stats: string): void {
        this.resultLabel.string = win ? '胜  利 ！' : '失  败 …';
        this.resultLabel.color = win ? C('#ffd85a') : C('#9aa4b5');
        this.statsLabel.string = stats;
        this.resultRoot.active = true;
    }

    get currentEnergy(): number { return this.energy; }
}
