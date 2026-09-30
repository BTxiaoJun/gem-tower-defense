import { sys } from 'cc';
import { VERSION } from './GameConfig';

/**
 * 自动存档（三端通用）：底层是 sys.localStorage。
 * 网页 = 浏览器本地存储；Windows/Android 原生 = 应用数据目录，重装会丢。
 * 战斗中每 5 秒 + 退出/切后台时自动保存，重开游戏自动续玩。
 */

export interface UnitSnapshot {
    defIdx: number;
    side: 1 | -1;
    lane: 0 | 1;
    x: number;
    y: number;
    hp: number;
    rageT: number;
}

export interface BaseSnapshot {
    side: 1 | -1;
    lane: 0 | 1;
    hp: number;
}

export interface BattleSnapshot {
    energy: number;
    aiEnergy: number;
    playerSummons: number;
    bases: BaseSnapshot[];
    units: UnitSnapshot[];
}

export interface SaveData {
    ver: string;
    wins: number;
    losses: number;
    battle: BattleSnapshot | null;
    savedAt: number;
}

const KEY = 'gem-tower-defense-save';

export const Save = {
    load(): SaveData | null {
        try {
            const raw = sys.localStorage.getItem(KEY);
            if (!raw) return null;
            const d = JSON.parse(raw) as SaveData;
            if (typeof d.wins !== 'number' || typeof d.losses !== 'number') return null;
            return d;
        } catch {
            return null;
        }
    },

    write(data: Omit<SaveData, 'ver' | 'savedAt'>): void {
        try {
            const d: SaveData = { ...data, ver: VERSION, savedAt: Date.now() };
            sys.localStorage.setItem(KEY, JSON.stringify(d));
        } catch {
            // 存储不可用时静默跳过，游戏照常可玩
        }
    },
};
