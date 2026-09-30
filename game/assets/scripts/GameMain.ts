import { _decorator, Component, director, Node, UITransform } from 'cc';
import { CFG } from './GameConfig';
import { BattleField } from './BattleField';
import { Hud } from './Hud';
import { Match3Board } from './Match3Board';
import { mkNode } from './UiUtil';

const { ccclass } = _decorator;

/**
 * 游戏总入口：把本脚本挂在 Canvas 节点上即可。
 * 所有内容在运行时用代码构建（M1 玩法模板，全色块占位）。
 */
@ccclass('GameMain')
export class GameMain extends Component {
    private energy = 40; // 开局送一点能量
    private battle!: BattleField;
    private board!: Match3Board;
    private hud!: Hud;
    private over = false;

    start(): void {
        const ut = this.node.getComponent(UITransform);
        const W = ut ? ut.width : 960;
        const H = ut ? ut.height : 640;

        // 战场层
        const bfRoot = mkNode(this.node, 'battlefield', W, H);
        bfRoot.setPosition(0, 0, 0);
        this.battle = new BattleField(bfRoot, W, H, (win) => this.onGameOver(win));

        // 右侧消消乐面板
        const panelX = W / 2 - 180;
        const boardH = CFG.match.rows * CFG.match.cell + 16;
        const boardRoot = mkNode(this.node, 'match3', 10, 10);
        boardRoot.setPosition(panelX, H / 2 - boardH / 2 - 24, 0);
        this.board = new Match3Board(boardRoot, (n) => this.addEnergy(n));

        // HUD
        const hudRoot = mkNode(this.node, 'hud', W, H);
        hudRoot.setPosition(0, 0, 0);
        this.hud = new Hud(hudRoot, W, H, {
            onSummon: (i) => this.trySummon(i),
            onSkill: (i) => this.trySkill(i),
            onRestart: () => director.loadScene('main'),
        });
        this.hud.setEnergy(this.energy);
    }

    update(dt: number): void {
        this.board.update(dt);
        this.battle.update(dt);
    }

    private addEnergy(n: number): void {
        if (this.over) return;
        this.energy = Math.min(CFG.energyMax, this.energy + n);
        this.hud.setEnergy(this.energy);
    }

    private trySummon(idx: number): void {
        if (this.over) return;
        const def = CFG.units[idx];
        if (this.energy < def.cost) return;
        this.energy -= def.cost;
        this.hud.setEnergy(this.energy);
        this.battle.spawnUnit(1, idx);
    }

    private trySkill(idx: number): void {
        if (this.over) return;
        if (idx === 0) {
            if (this.energy < CFG.skills.fireball.cost) return;
            this.energy -= CFG.skills.fireball.cost;
            this.battle.fireball();
        } else {
            if (this.energy < CFG.skills.rage.cost) return;
            this.energy -= CFG.skills.rage.cost;
            this.battle.rage();
        }
        this.hud.setEnergy(this.energy);
    }

    private onGameOver(win: boolean): void {
        this.over = true;
        this.hud.showResult(win);
    }
}
