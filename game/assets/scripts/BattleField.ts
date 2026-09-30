import { Color, Graphics, Label, Node } from 'cc';
import { C, CFG, UnitDef } from './GameConfig';
import { BattleSnapshot } from './SaveManager';
import { fillRect, gOf, mkLabel, mkNode, setSprite } from './UiUtil';

interface Unit {
    node: Node;
    def: UnitDef;
    defIdx: number;
    side: 1 | -1;   // 1 = 玩家，-1 = 敌方
    lane: 0 | 1;    // 0 = 上路，1 = 下路
    hp: number;
    maxHp: number;
    rageT: number;
    alive: boolean;
}

interface Tower {
    node: Node;
    side: 1 | -1;
    lane: 0 | 1;
    x: number;
    y: number;
    cd: number;
}

interface Base {
    node: Node;
    side: 1 | -1;
    lane: 0 | 1;
    hp: number;
    maxHp: number;
    x: number;
    y: number;
    barFill: Graphics;
    label: Label;
    alive: boolean;
}

interface Fx { x: number; y: number; t: number; r: number; hex: string; }

/** 战场：双路推进、中场箭塔、基地血量、敌方 AI、胜负判定 */
export class BattleField {
    private root: Node;
    private overlay: Graphics;
    private units: Unit[] = [];
    private towers: Tower[] = [];
    private bases: Base[] = [];
    private fx: Fx[] = [];
    private aiEnergy = 0;
    private aiTimer = CFG.ai.interval;
    private playerSummons = 0;
    private over = false;
    private onGameOver: (win: boolean) => void;
    private playerBaseX: number;
    private enemyBaseX: number;
    private laneYs: number[] = [95, -95];

    constructor(root: Node, W: number, H: number, onGameOver: (win: boolean) => void) {
        this.root = root;
        this.onGameOver = onGameOver;

        // 石板地面（最底层）
        const groundN = mkNode(root, 'ground', W, H);
        groundN.setPosition(0, 0, 0);
        setSprite(groundN, 'ground', W, H);

        const bx0 = -W / 2 + 50;
        const bx1 = W / 2 - 370; // 右侧留给消消乐面板
        this.playerBaseX = bx0;
        this.enemyBaseX = bx1;
        this.laneYs = [H * 0.16, -H * 0.16];
        const laneY = this.laneYs;
        const towerPX = bx0 + (bx1 - bx0) * 0.34;
        const towerEX = bx0 + (bx1 - bx0) * 0.66;

        // 中线装饰
        const mid = mkNode(root, 'midline', 2, H - 40);
        fillRect(gOf(mid), 2, H - 40, new Color(255, 255, 255, 36), 0);

        for (const lane of [0, 1] as const) {
            const y = laneY[lane];
            this.makeBase(1, lane, bx0, y);
            this.makeBase(-1, lane, bx1, y);
            this.makeTower(1, lane, towerPX, y);
            this.makeTower(-1, lane, towerEX, y);
        }

        this.overlay = gOf(mkNode(root, 'overlay', W, H));
    }

    private makeBase(side: 1 | -1, lane: 0 | 1, x: number, y: number): void {
        const s = CFG.bases.size;
        const n = mkNode(this.root, `base_${side > 0 ? 'p' : 'e'}${lane}`, s, s);
        n.setPosition(x, y, 0);
        setSprite(n, side > 0 ? 'base_blue' : 'base_red', s, s);
        const label = mkLabel(n, '1000', 16, Color.WHITE);
        const barW = s + 16;
        const bar = mkNode(n, 'bar', barW, 8);
        bar.setPosition(0, s / 2 + 10, 0);
        fillRect(gOf(bar), barW, 8, new Color(0, 0, 0, 160), 3);
        const fillN = mkNode(bar, 'fill', barW - 4, 5);
        const barFill = gOf(fillN);
        fillRect(barFill, barW - 4, 5, C('#5dff70'), 2);

        this.bases.push({
            node: n, side, lane, hp: CFG.bases.hp, maxHp: CFG.bases.hp,
            x, y, barFill, label, alive: true,
        });
    }

    private makeTower(side: 1 | -1, lane: 0 | 1, x: number, y: number): void {
        const n = mkNode(this.root, `tower_${side > 0 ? 'p' : 'e'}${lane}`, 36, 36);
        n.setPosition(x, y, 0);
        setSprite(n, side > 0 ? 'tower_blue' : 'tower_red', 40, 40);
        this.towers.push({ node: n, side, lane, x, y, cd: Math.random() * CFG.towers.cd });
    }

    /** 召唤一个单位。side 1=玩家 -1=敌方，idx=CFG.units 下标 */
    spawnUnit(side: 1 | -1, idx: number): void {
        const lane = (side > 0
            ? (this.playerSummons++ % 2)
            : Math.floor(Math.random() * 2)) as 0 | 1;
        const y = this.laneYs[lane] + (Math.random() * 28 - 14);
        const x = side > 0 ? this.playerBaseX + 34 : this.enemyBaseX - 34;
        this.createUnit(side, idx, lane, x, y, CFG.units[idx].hp, 0);
    }

    private createUnit(side: 1 | -1, defIdx: number, lane: 0 | 1, x: number, y: number, hp: number, rageT: number): void {
        const def = CFG.units[defIdx];
        const n = mkNode(this.root, 'unit', def.r * 2 + 12, def.r * 2 + 12);
        n.setPosition(x, y, 0);
        setSprite(n, `unit_${defIdx}_${side > 0 ? 'p' : 'e'}`, def.r * 2 + 12, def.r * 2 + 12);
        mkLabel(n, def.name, 11, new Color(235, 238, 245, 255)).node.setPosition(0, -def.r - 11, 0);

        this.units.push({
            node: n, def, defIdx, side, lane, hp, maxHp: def.hp,
            rageT, alive: true,
        });
    }

    /** 存档：导出当前战场快照 */
    snapshotBattle(energy: number): BattleSnapshot {
        return {
            energy,
            aiEnergy: this.aiEnergy,
            playerSummons: this.playerSummons,
            bases: this.bases.filter((b) => b.alive).map((b) => ({ side: b.side, lane: b.lane, hp: b.hp })),
            units: this.units.filter((u) => u.alive).map((u) => ({
                defIdx: u.defIdx, side: u.side, lane: u.lane,
                x: u.node.position.x, y: u.node.position.y, hp: u.hp, rageT: u.rageT,
            })),
        };
    }

    /** 读档：把快照还原成正在进行的战场 */
    restoreBattle(s: BattleSnapshot): void {
        this.aiEnergy = s.aiEnergy;
        this.playerSummons = s.playerSummons;
        for (const b of s.bases) {
            const target = this.bases.find((x) => x.side === b.side && x.lane === b.lane);
            if (target) target.hp = b.hp;
        }
        for (const u of s.units) {
            this.createUnit(u.side, u.defIdx, u.lane, u.x, u.y, u.hp, u.rageT);
        }
    }

    fireball(): void {
        const sk = CFG.skills.fireball;
        // 找敌情最紧急的路（敌方单位最靠近玩家基地的那条）
        let lane: 0 | 1 = 0;
        let best = Infinity;
        for (const laneIdx of [0, 1] as const) {
            for (const u of this.units) {
                if (u.alive && u.side === -1 && u.lane === laneIdx && u.node.position.x < best) {
                    best = u.node.position.x;
                    lane = laneIdx;
                }
            }
        }
        const targets = this.units
            .filter((u) => u.alive && u.side === -1 && u.lane === lane)
            .sort((a, b) => a.node.position.x - b.node.position.x)
            .slice(0, sk.hits);
        for (const t of targets) {
            t.hp -= sk.dmg;
            this.fx.push({ x: t.node.position.x, y: t.node.position.y, t: 0.35, r: 26, hex: '#ff8c2e' });
        }
        this.fx.push({ x: (this.playerBaseX + this.enemyBaseX) / 2, y: this.laneYs[lane], t: 0.3, r: 60, hex: '#ff5a2e' });
    }

    rage(): void {
        for (const u of this.units) {
            if (u.alive && u.side === 1) u.rageT = CFG.skills.rage.duration;
        }
    }

    /** 面板顶部总览用：双方平均基地血量比 */
    factionHp(): { p: number, e: number } {
        const avg = (side: 1 | -1): number => {
            const bs = this.bases.filter((b) => b.side === side);
            return bs.reduce((s, b) => s + Math.max(0, b.hp / b.maxHp), 0) / bs.length;
        };
        return { p: avg(1), e: avg(-1) };
    }

    update(dt: number): void {
        if (!this.over) this.updateAI(dt);
        this.updateUnits(dt);
        this.updateTowers(dt);
        this.updateFx(dt);
        this.drawOverlay();
        if (!this.over) this.checkGameOver();
    }

    private updateAI(dt: number): void {
        this.aiTimer -= dt;
        if (this.aiTimer > 0) return;
        this.aiTimer = CFG.ai.interval;
        this.aiEnergy = Math.min(CFG.energyMax, this.aiEnergy + CFG.ai.income);

        const affordable: number[] = [];
        for (let i = 0; i < CFG.units.length; i++) {
            if (CFG.units[i].cost <= this.aiEnergy) affordable.push(i);
        }
        if (affordable.length === 0) return;

        const burst = Math.random() < CFG.ai.burstChance;
        let pick = this.weightedPick(affordable);
        this.spawnUnit(-1, pick);
        this.aiEnergy -= CFG.units[pick].cost;
        if (burst) {
            // 偶发一波流：把能量花到花不起为止
            let guard = 12;
            while (guard-- > 0) {
                const cheap = affordable
                    .filter((i) => CFG.units[i].cost <= this.aiEnergy)
                    .sort((a, b) => CFG.units[a].cost - CFG.units[b].cost)[0];
                if (cheap === undefined) break;
                this.spawnUnit(-1, cheap);
                this.aiEnergy -= CFG.units[cheap].cost;
            }
        }
    }

    private weightedPick(ids: number[]): number {
        const w = CFG.ai.weights;
        let total = 0;
        for (const i of ids) total += w[i];
        let roll = Math.random() * total;
        for (const i of ids) {
            roll -= w[i];
            if (roll <= 0) return i;
        }
        return ids[ids.length - 1];
    }

    private updateUnits(dt: number): void {
        for (const u of this.units) {
            if (!u.alive) continue;
            if (u.rageT > 0) u.rageT -= dt;
            const pos = u.node.position;
            const dir = u.side;

            // 近战接敌：同路最近敌人
            let engaged = false;
            let bestDx = Infinity;
            let foe: Unit | null = null;
            for (const e of this.units) {
                if (!e.alive || e.side === u.side || e.lane !== u.lane) continue;
                const dx = e.node.position.x - pos.x;
                const adx = Math.abs(dx);
                if (adx < u.def.r + e.def.r + 8 && adx < bestDx) {
                    bestDx = adx;
                    foe = e;
                }
            }
            if (foe) {
                foe.hp -= u.def.dps * dt;
                engaged = true;
            }

            // 敌方基地
            if (!engaged) {
                const targetBase = this.bases.find(
                    (b) => b.alive && b.side !== u.side && b.lane === u.lane,
                );
                if (targetBase) {
                    const stop = targetBase.x - dir * (CFG.bases.size / 2 + u.def.r + 4);
                    if ((dir > 0 && pos.x >= stop) || (dir < 0 && pos.x <= stop)) {
                        targetBase.hp -= u.def.dps * dt;
                        engaged = true;
                    }
                }
            }

            if (!engaged) {
                const spd = u.def.speed * (u.rageT > 0 ? CFG.skills.rage.speedMul : 1);
                u.node.setPosition(pos.x + dir * spd * dt, pos.y, 0);
            }
        }

        // 清理死亡
        for (const u of this.units) {
            if (u.alive && u.hp <= 0) {
                u.alive = false;
                this.fx.push({ x: u.node.position.x, y: u.node.position.y, t: 0.25, r: u.def.r + 8, hex: '#ffffff' });
                u.node.destroy();
            }
        }
        this.units = this.units.filter((u) => u.alive);

        // 基地血量表现与死亡
        for (const b of this.bases) {
            if (!b.alive) continue;
            const ratio = Math.max(0, b.hp / b.maxHp);
            b.label.string = String(Math.max(0, Math.ceil(b.hp)));
            const fw = (CFG.bases.size + 12) * ratio;
            b.barFill.clear();
            fillRect(b.barFill, Math.max(1, fw), 5, ratio > 0.4 ? C('#5dff70') : C('#ff5a5a'), 2);
            if (b.hp <= 0) {
                b.alive = false;
                b.node.destroy();
            }
        }
    }

    private updateTowers(dt: number): void {
        for (const t of this.towers) {
            t.cd -= dt;
            if (t.cd > 0) continue;
            let target: Unit | null = null;
            let best = Infinity;
            for (const u of this.units) {
                if (!u.alive || u.side === t.side || u.lane !== t.lane) continue;
                const d = Math.abs(u.node.position.x - t.x);
                if (d <= CFG.towers.range && d < best) {
                    best = d;
                    target = u;
                }
            }
            if (target) {
                t.cd = CFG.towers.cd;
                target.hp -= CFG.towers.dmg;
                this.fx.push({ x: target.node.position.x, y: target.node.position.y, t: 0.12, r: 8, hex: '#fff2a8' });
            }
        }
    }

    private updateFx(dt: number): void {
        for (const f of this.fx) f.t -= dt;
        this.fx = this.fx.filter((f) => f.t > 0);
    }

    private drawOverlay(): void {
        const g = this.overlay;
        g.clear();
        // 单位血条
        for (const u of this.units) {
            if (!u.alive) continue;
            const pos = u.node.position;
            const w = u.def.r * 2;
            g.fillColor = new Color(0, 0, 0, 150);
            g.rect(pos.x - w / 2, pos.y + u.def.r + 5, w, 4);
            g.fill();
            const ratio = Math.max(0, u.hp / u.maxHp);
            g.fillColor = ratio > 0.4 ? C('#5dff70') : C('#ff5a5a');
            g.rect(pos.x - w / 2, pos.y + u.def.r + 5, w * ratio, 4);
            g.fill();
            if (u.rageT > 0) {
                g.lineWidth = 2;
                g.strokeColor = C('#ff3ba7');
                g.circle(pos.x, pos.y, u.def.r + 4);
                g.stroke();
            }
        }
        // 特效圈
        for (const f of this.fx) {
            g.lineWidth = 3;
            g.strokeColor = new Color().fromHEX(f.hex);
            g.circle(f.x, f.y, f.r * (1.3 - f.t));
            g.stroke();
        }
    }

    private checkGameOver(): void {
        const playerAlive = this.bases.some((b) => b.alive && b.side === 1);
        const enemyAlive = this.bases.some((b) => b.alive && b.side === -1);
        if (!enemyAlive) { this.over = true; this.onGameOver(true); }
        else if (!playerAlive) { this.over = true; this.onGameOver(false); }
    }
}
