import { _decorator, Color, Component, director, game, Game, Node, UITransform } from 'cc';
import { CFG, VERSION } from './GameConfig';
import { BattleField } from './BattleField';
import { Hud } from './Hud';
import { Match3Board } from './Match3Board';
import { Save } from './SaveManager';
import { mkLabel, mkNode, setSprite } from './UiUtil';

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
    private wins = 0;
    private losses = 0;
    private saveTimer = 0;

    start(): void {
        const ut = this.node.getComponent(UITransform);
        const W = ut ? ut.width : 960;
        const H = ut ? ut.height : 640;

        // 战场层
        const bfRoot = mkNode(this.node, 'battlefield', W, H);
        bfRoot.setPosition(0, 0, 0);
        this.battle = new BattleField(bfRoot, W, H, (win) => this.onGameOver(win));

        // 右侧金属面板背景（压在战场之上、控件之下）
        const panelBg = mkNode(this.node, 'panelbg', 360, H);
        panelBg.setPosition(W / 2 - 180, 0, 0);
        setSprite(panelBg, 'panel', 360, H);

        // 右侧消消乐面板
        const panelX = W / 2 - 180;
        const boardH = CFG.match.rows * CFG.match.cell + 16;
        const boardRoot = mkNode(this.node, 'match3', 10, 10);
        boardRoot.setPosition(panelX, H / 2 - boardH / 2 - 54, 0);
        this.board = new Match3Board(boardRoot, (n) => this.addEnergy(n));

        // HUD
        const hudRoot = mkNode(this.node, 'hud', W, H);
        hudRoot.setPosition(0, 0, 0);
        this.hud = new Hud(hudRoot, W, H, {
            onSummon: (i) => this.trySummon(i),
            onSkill: (i) => this.trySkill(i),
            onRestart: () => director.loadScene('main'),
        });

        // 读档：有进行中的战斗就自动续玩
        const data = Save.load();
        if (data) {
            this.wins = data.wins;
            this.losses = data.losses;
            if (data.battle) {
                this.energy = data.battle.energy;
                this.battle.restoreBattle(data.battle);
            }
        }
        this.hud.setEnergy(this.energy);

        // 版本号角标
        const verLabel = mkLabel(hudRoot, `${VERSION} 内测版`, 14, new Color(140, 150, 165, 255));
        verLabel.node.setPosition(W / 2 - 70, -H / 2 + 16, 0);

        // 退出/切后台时兜底存档
        game.on(Game.EVENT_HIDE, this.saveNow, this);
    }

    update(dt: number): void {
        this.board.update(dt);
        this.battle.update(dt);
        const hp = this.battle.factionHp();
        this.hud.setFactionHp(hp.p, hp.e);
        if (!this.over) {
            this.saveTimer += dt;
            if (this.saveTimer >= 5) {
                this.saveTimer = 0;
                this.saveNow();
            }
        }
    }

    private saveNow(): void {
        if (this.over) return;
        Save.write({ wins: this.wins, losses: this.losses, battle: this.battle.snapshotBattle(this.energy) });
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
        if (win) this.wins++;
        else this.losses++;
        Save.write({ wins: this.wins, losses: this.losses, battle: null }); // 结束后清掉战斗快照，只留战绩
        this.hud.showResult(win, `总战绩：${this.wins} 胜 ${this.losses} 负`);
    }
}
