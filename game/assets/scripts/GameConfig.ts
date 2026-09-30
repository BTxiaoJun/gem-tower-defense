import { Color } from 'cc';

/** M1 玩法模板的全部可调数值都集中在这里，试玩后改这里即可 */
export const CFG = {
    energyMax: 200,
    match: {
        cols: 6,
        rows: 6,
        colorCount: 4,
        cell: 46,
        baseEnergy: 10,   // 每消除一枚的基础能量
        bigBonus: 20,     // 单次消除波里有 ≥4 连时的额外能量
        waveDelay: 0.22,  // 连锁每波之间的停顿（秒）
    },
    bases: { hp: 1000, size: 64 },
    towers: { range: 240, dmg: 12, cd: 1.0 },
    units: [
        { name: '小明', cost: 30, hp: 60, dps: 10, speed: 100, r: 13, hex: '#5ad0ff' },
        { name: '小刚', cost: 70, hp: 150, dps: 20, speed: 70, r: 17, hex: '#7cff6b' },
        { name: '大宝', cost: 150, hp: 400, dps: 35, speed: 48, r: 23, hex: '#ffb44d' },
    ] as UnitDef[],
    skills: {
        fireball: { name: '火球', cost: 60, dmg: 80, hits: 3 },
        rage: { name: '狂暴', cost: 50, duration: 5, speedMul: 1.5 },
    },
    ai: { income: 25, interval: 3, weights: [5, 3, 1], burstChance: 0.15 },
    gemHexes: ['#ff5a5a', '#5ab0ff', '#8aff70', '#ffd85a'],
};

export interface UnitDef {
    name: string;
    cost: number;
    hp: number;
    dps: number;
    speed: number;
    r: number;
    hex: string;
}

export function C(hex: string): Color {
    return new Color().fromHEX(hex);
}
