import { Color, Graphics, Node, UITransform } from 'cc';
import { C, CFG } from './GameConfig';
import { fillRect, gOf, mkNode } from './UiUtil';

interface Gem {
    node: Node;
    colorIdx: number;
    c: number; // 列
    r: number; // 行（0 = 顶行）
}

/** 消消乐棋盘：交换、≥3 消除、下落补充、连锁倍率，产出能量 */
export class Match3Board {
    private root: Node;
    private grid: (Gem | null)[][] = []; // grid[列][行]
    private gemsRoot: Node;
    private selRing: Node;
    private state: 'idle' | 'busy' = 'idle';
    private selected: Gem | null = null;
    private combo = 0;
    private wait = 0;
    private onEnergy: (amount: number) => void;

    constructor(root: Node, onEnergy: (amount: number) => void) {
        this.root = root;
        this.onEnergy = onEnergy;
        const m = CFG.match;

        // 面板底色
        const bw = m.cols * m.cell + 16;
        const bh = m.rows * m.cell + 16;
        const ut = root.getComponent(UITransform) || root.addComponent(UITransform);
        ut.setContentSize(bw, bh);
        fillRect(gOf(root), bw, bh, new Color(30, 34, 44, 235), 10);

        this.gemsRoot = mkNode(root, 'gems', bw, bh);
        for (let c = 0; c < m.cols; c++) {
            this.grid[c] = [];
            for (let r = 0; r < m.rows; r++) {
                this.grid[c][r] = this.newGem(c, r);
            }
        }

        // 选中高亮圈
        this.selRing = mkNode(this.gemsRoot, 'sel', m.cell, m.cell);
        const g = gOf(this.selRing);
        g.lineWidth = 4;
        g.strokeColor = Color.WHITE;
        g.roundRect(-m.cell * 0.45, -m.cell * 0.45, m.cell * 0.9, m.cell * 0.9, 8);
        g.stroke();
        this.selRing.active = false;

        // 开局避免已有三连
        for (let pass = 0; pass < 30; pass++) {
            const runs = this.findRuns();
            if (runs.keys.size === 0) break;
            runs.keys.forEach((k) => {
                const [c, r] = k.split(',').map(Number);
                this.recolor(this.grid[c][r]!);
            });
        }
    }

    private newGem(c: number, r: number): Gem {
        const colorIdx = Math.floor(Math.random() * CFG.match.colorCount);
        const n = mkNode(this.gemsRoot, `gem_${c}_${r}`, CFG.match.cell, CFG.match.cell);
        const gem: Gem = { node: n, colorIdx, c, r };
        this.drawGem(gem);
        this.place(gem);
        n.on(Node.EventType.TOUCH_END, () => this.onTap(gem), this);
        return gem;
    }

    private recolor(gem: Gem): void {
        gem.colorIdx = Math.floor(Math.random() * CFG.match.colorCount);
        gem.node.getComponent(Graphics)!.clear();
        this.drawGem(gem);
    }

    private drawGem(gem: Gem): void {
        const g = gem.node.getComponent(Graphics)!;
        const s = CFG.match.cell * 0.86;
        g.fillColor = C(CFG.gemHexes[gem.colorIdx % CFG.gemHexes.length]);
        g.roundRect(-s / 2, -s / 2, s, s, 9);
        g.fill();
        g.fillColor = new Color(255, 255, 255, 60);
        g.roundRect(-s / 2 + 4, s / 2 - 10, s - 8, 6, 3);
        g.fill();
    }

    private place(gem: Gem): void {
        const m = CFG.match;
        const x = (gem.c - (m.cols - 1) / 2) * m.cell;
        const y = ((m.rows - 1) / 2 - gem.r) * m.cell;
        gem.node.setPosition(x, y, 0);
    }

    private onTap(gem: Gem): void {
        if (this.state === 'busy') return;
        if (this.selected === gem) {
            this.setSelected(null);
            return;
        }
        if (this.selected === null) {
            this.setSelected(gem);
            return;
        }
        const a = this.selected;
        const adj = Math.abs(a.c - gem.c) + Math.abs(a.r - gem.r) === 1;
        if (!adj) {
            this.setSelected(gem);
            return;
        }
        this.setSelected(null);
        this.swap(a, gem);
        if (this.findRuns().keys.size === 0) {
            this.swap(a, gem); // 无效交换，退回
        } else {
            this.state = 'busy';
            this.combo = 0;
            this.wait = CFG.match.waveDelay;
        }
    }

    private setSelected(gem: Gem | null): void {
        this.selected = gem;
        this.selRing.active = gem !== null;
        if (gem) this.selRing.setPosition(gem.node.position.x, gem.node.position.y, 0);
    }

    private swap(a: Gem, b: Gem): void {
        const tc = a.c, tr = a.r;
        a.c = b.c; a.r = b.r;
        b.c = tc; b.r = tr;
        this.grid[a.c][a.r] = a;
        this.grid[b.c][b.r] = b;
        this.place(a);
        this.place(b);
    }

    private findRuns(): { keys: Set<string>, maxLen: number } {
        const m = CFG.match;
        const keys = new Set<string>();
        let maxLen = 0;
        const scan = (line: (Gem | null)[], keyOf: (i: number) => string) => {
            let i = 0;
            while (i < line.length) {
                const g = line[i];
                if (!g) { i++; continue; }
                let j = i + 1;
                while (j < line.length && line[j] && line[j]!.colorIdx === g.colorIdx) j++;
                const len = j - i;
                if (len >= 3) {
                    maxLen = Math.max(maxLen, len);
                    for (let k = i; k < j; k++) keys.add(keyOf(k));
                }
                i = j;
            }
        };
        for (let c = 0; c < m.cols; c++) scan(this.grid[c], (r) => `${c},${r}`);
        for (let r = 0; r < m.rows; r++) {
            const line: (Gem | null)[] = [];
            for (let c = 0; c < m.cols; c++) line.push(this.grid[c][r]);
            scan(line, (c) => `${c},${r}`);
        }
        return { keys, maxLen };
    }

    update(dt: number): void {
        if (this.state !== 'busy') return;
        this.wait -= dt;
        if (this.wait > 0) return;
        this.wait = CFG.match.waveDelay;
        this.resolveWave();
    }

    private resolveWave(): void {
        const m = CFG.match;
        const { keys, maxLen } = this.findRuns();
        if (keys.size === 0) {
            this.state = 'idle';
            this.combo = 0;
            return;
        }
        this.combo++;
        let energy = keys.size * m.baseEnergy * this.combo;
        if (maxLen >= 4) energy += m.bigBonus;
        this.onEnergy(energy);

        keys.forEach((k) => {
            const [c, r] = k.split(',').map(Number);
            const gem = this.grid[c][r];
            if (gem) {
                gem.node.destroy();
                this.grid[c][r] = null;
            }
        });
        this.setSelected(null);
        this.applyGravity();
    }

    private applyGravity(): void {
        const m = CFG.match;
        for (let c = 0; c < m.cols; c++) {
            const col: Gem[] = [];
            for (let r = m.rows - 1; r >= 0; r--) {
                const g = this.grid[c][r];
                if (g) col.push(g);
            }
            for (let i = 0; i < col.length; i++) {
                const r = m.rows - 1 - i;
                const g = col[i];
                g.c = c; g.r = r;
                this.grid[c][r] = g;
                this.place(g);
            }
            for (let r = m.rows - 1 - col.length; r >= 0; r--) {
                this.grid[c][r] = null;
            }
            for (let r = 0; r < m.rows; r++) {
                if (!this.grid[c][r]) {
                    const gem = this.newGem(c, r);
                    this.grid[c][r] = gem;
                }
            }
        }
    }
}
