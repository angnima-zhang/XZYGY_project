/**
 * PlayerData - 玩家数据管理器（单例模式）
 * 
 * 功能说明：
 * - 管理玩家的游戏数据（余额、8种升级项数值和价格、生涯统计）
 * - 实现本地存储和读取（使用 localStorage）
 * - 每日凌晨4点自动重置
 * 
 * GDD v1.2 升级项定义：
 * 1. value（面值）- 初始值1，初始价格5，乘法增长
 * 2. speed（速度）- 初始值5秒，初始价格5，除法增长
 * 3. lucky（幸运/正面概率）- 初始值50%，初始价格5，乘法增长
 * 4. critical（暴击率）- 初始值0%，初始价格5，乘法增长
 * 5. criticalBonus（暴击加成）- 初始值0，初始价格5，乘法增长
 * 6. pity（保底）- 初始值20次，初始价格5，固定递减
 * 7. streakBonus（连击加成）- 初始值0，初始价格5，乘法增长
 * 8. time（自动时间）- 初始值10秒，初始价格5，乘法增长
 * 
 * 使用方式：
 * const data = PlayerData.getInstance();
 * data.addBalance(100);           // 增加余额
 * data.upgradeValue('value');     // 升级面值
 */

import { TapCloudSave } from './TapCloudSave';

/**
 * 升级项类型枚举（与场景节点名保持一致）
 */
type UpgradeType = 
    | 'value'           // 1. 面值
    | 'speed'           // 2. 动画速度
    | 'lucky'           // 3. 正面概率/幸运
    | 'critical'        // 4. 暴击率
    | 'criticalBonus'   // 5. 暴击加成
    | 'pity'            // 6. 保底
    | 'streakBonus'     // 7. 连击加成
    | 'time';           // 8. 自动持续时间

/**
 * 升级项配置接口
 */
interface UpgradeConfig {
    /** 升级项名称（显示用） */
    name: string;
    /** 初始值 */
    initialValue: number;
    /** 初始价格 */
    initialPrice: number;
    /** 增长类型：乘法/除法/固定递减 */
    growthType: 'multiply' | 'divide' | 'fixed';
    /** 增长系数 */
    growthFactor: number;
    /** 单位 */
    unit: string;
    /** 价格增长系数 */
    priceGrowthFactor: number;
}

/**
 * 升级项当前状态接口
 */
interface UpgradeState {
    /** 当前数值 */
    value: number;
    /** 当前价格 */
    price: number;
    /** 已升级次数 */
    level: number;
}

/**
 * 生涯统计接口
 */
interface CareerStats {
    /** 总翻转次数 */
    totalFlips: number;
    /** 总暴击次数 */
    totalCrits: number;
    /** 历史最高余额 */
    maxBalance: number;
    /** 历史最高连击 */
    maxStreak: number;
    /** 累计自动时间（秒） */
    totalAutoTime: number;
}

/**
 * 玩家完整数据接口（用于序列化存储）
 */
interface PlayerDataSave {
    /** 当前余额 */
    balance: number;
    /** 8种升级项状态 */
    upgrades: Record<UpgradeType, UpgradeState>;
    /** 生涯统计 */
    stats: CareerStats;
    /** 当前连击数 */
    currentStreak: number;
    /** 当前保底计数器（连续背面次数） */
    pityCounter: number;
    /** 上次重置时间戳 */
    lastResetTime: number;
    /** 今日是否已达目标 */
    wonToday: boolean;
    /** 玩家主动顺延后的下一次重置时间戳（旧存档没有此字段） */
    dailyResetPostponeUntil?: number;
}

export class PlayerData {
    /** 单例实例 */
    private static _instance: PlayerData | null = null;

    /** 获取单例实例 */
    static getInstance(): PlayerData {
        if (!this._instance) {
            this._instance = new PlayerData();
        }
        return this._instance;
    }

    /** 本地存储的键名 */
    private readonly STORAGE_KEY = 'xianzheng_player_data_v3';

    /** 本次启动是否成功读取了已有存档 */
    private _loadedFromSave: boolean = false;

    /** 价格每升级 3 次降低 0.1，最低保持 1.1 倍。 */
    private static readonly PRICE_GROWTH_STEP_LEVELS = 3;
    private static readonly PRICE_GROWTH_DECREMENT = 0.1;
    private static readonly PRICE_GROWTH_MIN_FACTOR = 1.1;

    /** 游戏目标金额（1亿） */
    readonly TARGET_BALANCE = 100_000_000;

    /** 每日重置时间（凌晨4点） */
    private readonly RESET_HOUR = 4;

    /** 一天的毫秒数 */
    private static readonly DAY_MS = 24 * 60 * 60 * 1000;

    /** 升级项最小值限制 */
    static readonly UPGRADE_MIN_VALUE: Record<UpgradeType, number> = {
        value: 0,
        speed: 0.10,
        lucky: 0,
        critical: 0,
        criticalBonus: 0,
        pity: 1,
        streakBonus: 0,
        time: 0
    };

    /** 升级项最大值限制 */
    static readonly UPGRADE_MAX_VALUE: Record<UpgradeType, number> = {
        value: 0,
        speed: 0,
        lucky: 100,
        critical: 100,
        criticalBonus: 0,
        pity: 0,
        streakBonus: 0,
        time: 0
    };

    /** 8种升级项的固定配置（不会随游戏进度变化） */
    private UPGRADE_CONFIGS: Record<UpgradeType, UpgradeConfig> = {
        value: {
            name: '面值',
            initialValue: 1,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '',
            priceGrowthFactor: 2
        },
        speed: {
            name: '速度',
            initialValue: 2,
            initialPrice: 5,
            growthType: 'fixed',
            growthFactor: -0.1,
            unit: '秒',
            priceGrowthFactor: 2
        },
        lucky: {
            name: '幸运',
            initialValue: 50,
            initialPrice: 5,
            growthType: 'fixed',
            growthFactor: 1,
            unit: '%',
            priceGrowthFactor: 2
        },
        critical: {
            name: '暴击率',
            initialValue: 1,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '%',
            priceGrowthFactor: 2
        },
        criticalBonus: {
            name: '暴击加成',
            initialValue: 1,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '',
            priceGrowthFactor: 2
        },
        pity: {
            name: '保底',
            initialValue: 5,
            initialPrice: 123,
            growthType: 'fixed',
            growthFactor: -1,
            unit: '次',
            priceGrowthFactor: 2
        },
        streakBonus: {
            name: '连击加成',
            initialValue: 1,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '',
            priceGrowthFactor: 2
        },
        time: {
            name: '自动时间',
            initialValue: 10,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '秒',
            priceGrowthFactor: 2
        }
    };

    /** 当前余额 */
    private _balance: number = 0;

    /** 8种升级项的当前状态 */
    private _upgrades: Record<UpgradeType, UpgradeState> = {} as Record<UpgradeType, UpgradeState>;

    /** 生涯统计 */
    private _stats: CareerStats = {
        totalFlips: 0,
        totalCrits: 0,
        maxBalance: 0,
        maxStreak: 0,
        totalAutoTime: 0
    };

    /** 当前连击数 */
    private _currentStreak: number = 0;

    /** 当前保底计数器（连续背面次数） */
    private _pityCounter: number = 0;

    /** 上次重置时间戳 */
    private _lastResetTime: number = 0;

    /** 玩家主动顺延后的下一次重置时间戳 */
    private _dailyResetPostponeUntil: number = 0;

    /** 今日是否已达目标 */
    private _wonToday: boolean = false;

    /** 初始化数据 */
    private constructor() {
        this.load();
    }

    // ==================== 余额相关 ====================

    /**
     * 获取当前余额
     * @returns 余额数值
     */
    getBalance(): number {
        return this._balance;
    }

    /**
     * 增加余额
     * @param amount 增加的数量
     */
    addBalance(amount: number): void {
        this._balance += amount;
        // 更新历史最高余额
        if (this._balance > this._stats.maxBalance) {
            this._stats.maxBalance = this._balance;
        }
        console.log(`[PlayerData] 余额增加: +${amount}, 当前余额: ${this._balance}`);
        this.save();
    }

    /**
     * 减少余额（用于购买升级）
     * @param amount 减少的数量
     * @returns 是否成功（余额不足时返回false）
     */
    subtractBalance(amount: number): boolean {
        if (this._balance < amount) {
            console.warn(`[PlayerData] 余额不足，需要: ${amount}, 当前: ${this._balance}`);
            return false;
        }
        this._balance -= amount;
        console.log(`[PlayerData] 余额减少: -${amount}, 当前余额: ${this._balance}`);
        this.save();
        return true;
    }

    // ==================== 升级项相关 ====================

    /**
     * 获取升级项的当前数值
     * @param type 升级项类型
     * @returns 当前数值
     */
    getUpgradeValue(type: UpgradeType): number {
        return this._upgrades[type]?.value ?? this.UPGRADE_CONFIGS[type].initialValue;
    }

    /**
     * 获取升级项的当前价格
     * @param type 升级项类型
     * @returns 当前价格
     */
    getUpgradePrice(type: UpgradeType): number {
        return this._upgrades[type]?.price ?? this.UPGRADE_CONFIGS[type].initialPrice;
    }

    /**
     * 获取升级项的已升级次数
     * @param type 升级项类型
     * @returns 已升级次数
     */
    getUpgradeLevel(type: UpgradeType): number {
        return this._upgrades[type]?.level ?? 0;
    }

    /**
     * 获取升级项的配置信息
     * @param type 升级项类型
     * @returns 升级项配置
     */
    getUpgradeConfig(type: UpgradeType): UpgradeConfig {
        return this.UPGRADE_CONFIGS[type];
    }

    /**
     * 计算升级后的数值（不实际升级，仅预览）
     * @param type 升级项类型
     * @returns 升级后的数值
     */
    calculateNextValue(type: UpgradeType): number {
        const config = this.UPGRADE_CONFIGS[type];
        const currentValue = this.getUpgradeValue(type);
        const minValue = PlayerData.UPGRADE_MIN_VALUE[type];
        const maxValue = PlayerData.UPGRADE_MAX_VALUE[type];

        let nextValue: number;
        switch (config.growthType) {
            case 'multiply':
                nextValue = Math.ceil(currentValue * config.growthFactor);
                break;
            case 'divide':
                nextValue = Math.floor(currentValue / config.growthFactor * 100) / 100;
                break;
            case 'fixed':
                nextValue = currentValue + config.growthFactor;
                break;
            default:
                nextValue = currentValue;
        }

        // 限制在上下限范围内
        if (minValue > 0) {
            nextValue = Math.max(minValue, nextValue);
        }
        if (maxValue > 0) {
            nextValue = Math.min(maxValue, nextValue);
        }

        return nextValue;
    }

    /**
     * 计算升级后的价格（不实际升级，仅预览）
     * @param type 升级项类型
     * @returns 升级后的价格
     */
    calculateNextPrice(type: UpgradeType): number {
        if (type === 'pity') {
            return this.getPityPriceAtLevel(this.getUpgradeLevel(type) + 1);
        }

        const currentPrice = this.getUpgradePrice(type);
        const currentLevel = this.getUpgradeLevel(type);
        return Math.ceil(currentPrice * this.getPriceGrowthFactor(type, currentLevel));
    }

    /** 保底价格：123、1234、12345……；达到 1 次保底后不再继续增长。 */
    private getPityPriceAtLevel(level: number): number {
        const maxLevel = Math.max(
            0,
            Math.floor(this.UPGRADE_CONFIGS.pity.initialValue - PlayerData.UPGRADE_MIN_VALUE.pity)
        );
        const normalizedLevel = Math.min(maxLevel, Math.max(0, Math.floor(level)));
        let price = this.UPGRADE_CONFIGS.pity.initialPrice;

        for (let i = 0; i < normalizedLevel; i++) {
            price = price * 10 + i + 4;
        }

        return price;
    }

    /** 获取指定升级次数对应的价格倍率。 */
    private getPriceGrowthFactor(type: UpgradeType, level: number): number {
        const startFactor = this.UPGRADE_CONFIGS[type].priceGrowthFactor;
        const reductionCount = Math.floor(Math.max(0, level) / PlayerData.PRICE_GROWTH_STEP_LEVELS);
        const factor = startFactor - reductionCount * PlayerData.PRICE_GROWTH_DECREMENT;
        const roundedFactor = Math.round(factor * 10) / 10;
        return Math.max(PlayerData.PRICE_GROWTH_MIN_FACTOR, roundedFactor);
    }

    /**
     * 执行升级（扣除余额，更新数值和价格）
     * @param type 升级项类型
     * @returns 是否升级成功
     */
    doUpgrade(type: UpgradeType): boolean {
        const price = this.getUpgradePrice(type);
        const currentValue = this.getUpgradeValue(type);
        const minValue = PlayerData.UPGRADE_MIN_VALUE[type];
        const maxValue = PlayerData.UPGRADE_MAX_VALUE[type];

        // 检查是否已达上限/下限
        if (minValue > 0 && currentValue <= minValue) {
            console.log(`[PlayerData] ${type} 已达最小值限制: ${currentValue} <= ${minValue}`);
            return false;
        }
        if (maxValue > 0 && currentValue >= maxValue) {
            console.log(`[PlayerData] ${type} 已达最大值限制: ${currentValue} >= ${maxValue}`);
            return false;
        }
        
        // 检查余额是否足够
        if (!this.subtractBalance(price)) {
            this.addBalance(price);
            return false;
        }

        // 计算新数值和新价格
        const newValue = this.calculateNextValue(type);
        const newPrice = this.calculateNextPrice(type);
        const currentLevel = this.getUpgradeLevel(type);

        // 更新升级状态
        this._upgrades[type] = {
            value: newValue,
            price: newPrice,
            level: currentLevel + 1
        };

        console.log(`[PlayerData] 升级成功: ${this.UPGRADE_CONFIGS[type].name} ${this.getUpgradeValue(type)} -> ${newValue}`);
        this.save();
        return true;
    }

    /**
     * 执行免费升级（不扣除余额，只更新数值和价格）
     * 用于广告升级等免费升级场景
     * @param type 升级项类型
     * @returns 是否升级成功
     */
    doFreeUpgrade(type: UpgradeType): boolean {
        const currentValue = this.getUpgradeValue(type);
        const minValue = PlayerData.UPGRADE_MIN_VALUE[type];
        const maxValue = PlayerData.UPGRADE_MAX_VALUE[type];

        // 检查是否已达上限/下限
        if (minValue > 0 && currentValue <= minValue) {
            console.log(`[PlayerData] ${type} 已达最小值限制: ${currentValue} <= ${minValue}`);
            return false;
        }
        if (maxValue > 0 && currentValue >= maxValue) {
            console.log(`[PlayerData] ${type} 已达最大值限制: ${currentValue} >= ${maxValue}`);
            return false;
        }

        // 计算新数值和新价格
        const newValue = this.calculateNextValue(type);
        const newPrice = this.calculateNextPrice(type);
        const currentLevel = this.getUpgradeLevel(type);

        // 更新升级状态
        this._upgrades[type] = {
            value: newValue,
            price: newPrice,
            level: currentLevel + 1
        };

        console.log(`[PlayerData] 免费升级成功: ${this.UPGRADE_CONFIGS[type].name} ${this.getUpgradeValue(type)} -> ${newValue}`);
        this.save();
        return true;
    }

    // ==================== 调试配置相关 ====================

    /**
     * 设置升级项的初始值和初始价格（用于调试）
     */
    setUpgradeConfig(type: UpgradeType, initialValue: number, initialPrice: number, priceGrowthFactor: number): void {
        if (!this.UPGRADE_CONFIGS[type]) return;
        this.UPGRADE_CONFIGS[type].initialValue = initialValue;
        this.UPGRADE_CONFIGS[type].initialPrice = initialPrice;
        this.UPGRADE_CONFIGS[type].priceGrowthFactor = priceGrowthFactor;
    }

    /** 是否在本次启动中读取到了已有存档 */
    hasLoadedSave(): boolean {
        return this._loadedFromSave;
    }

    /** 按当前等级重算改动过的基础数值和最新价格，用于存档迁移。 */
    recalculateUpgradeState(): void {
        let changed = false;
        const migratedValueTypes: UpgradeType[] = ['critical', 'criticalBonus', 'pity', 'streakBonus'];
        (Object.keys(this.UPGRADE_CONFIGS) as UpgradeType[]).forEach(type => {
            const state = this._upgrades[type];
            if (!state) return;

            const level = Math.max(0, Math.floor(state.level ?? 0));
            let price: number;
            if (type === 'pity') {
                price = this.getPityPriceAtLevel(level);
            } else {
                price = this.UPGRADE_CONFIGS[type].initialPrice;
                for (let i = 0; i < level; i++) {
                    price = Math.ceil(price * this.getPriceGrowthFactor(type, i));
                }
            }

            if (state.price !== price) {
                state.price = price;
                changed = true;
            }

            if (migratedValueTypes.includes(type)) {
                let value = this.UPGRADE_CONFIGS[type].initialValue;
                for (let i = 0; i < level; i++) {
                    const config = this.UPGRADE_CONFIGS[type];
                    if (config.growthType === 'multiply') {
                        value = Math.ceil(value * config.growthFactor);
                    } else {
                        value += config.growthFactor;
                    }

                    const minValue = PlayerData.UPGRADE_MIN_VALUE[type];
                    const maxValue = PlayerData.UPGRADE_MAX_VALUE[type];
                    if (minValue > 0) value = Math.max(minValue, value);
                    if (maxValue > 0) value = Math.min(maxValue, value);
                }

                if (state.value !== value) {
                    state.value = value;
                    changed = true;
                }
            }
        });

        if (changed) {
            console.log('[PlayerData] 已按最新数值配置重算升级状态');
            this.save();
        }
    }

    /**
     * 设置全局价格增长系数（用于调试）
     */
    // setGlobalGrowthFactor(factor: number): void {
    //     (Object.keys(this.UPGRADE_CONFIGS) as UpgradeType[]).forEach(type => {
    //         this.UPGRADE_CONFIGS[type].growthFactor = factor;
    //     });
    // }

    /**
     * 应用调试配置到当前升级状态（将当前状态重置为配置中的初始值）
     */
    applyDebugConfig(): void {
        (Object.keys(this.UPGRADE_CONFIGS) as UpgradeType[]).forEach(type => {
            const config = this.UPGRADE_CONFIGS[type];
            this._upgrades[type] = {
                value: config.initialValue,
                price: config.initialPrice,
                level: 0
            };
        });
        this._balance = 0;
        this._currentStreak = 0;
        this._pityCounter = 0;
        this._stats = {
            totalFlips: 0,
            totalCrits: 0,
            maxBalance: 0,
            maxStreak: 0,
            totalAutoTime: 0
        };
        this.save();
    }

    // ==================== 生涯统计相关 ====================

    /**
     * 获取生涯统计
     * @returns 生涯统计数据
     */
    getStats(): CareerStats {
        return { ...this._stats };
    }

    /**
     * 增加翻转次数
     */
    incrementFlipCount(): void {
        this._stats.totalFlips += 1;
        this.save();
    }

    /**
     * 增加暴击次数
     */
    incrementCritCount(): void {
        this._stats.totalCrits += 1;
        this.save();
    }

    /**
     * 更新连击数（并检查是否刷新最高连击）
     * @param streak 当前连击数
     */
    updateStreak(streak: number): void {
        this._currentStreak = streak;
        if (streak > this._stats.maxStreak) {
            this._stats.maxStreak = streak;
        }
        this.save();
    }

    /**
     * 获取当前连击数
     * @returns 当前连击数
     */
    getCurrentStreak(): number {
        return this._currentStreak;
    }

    /**
     * 增加自动时间
     * @param seconds 增加的秒数
     */
    addAutoTime(seconds: number): void {
        this._stats.totalAutoTime += seconds;
        this.save();
    }

    // ==================== 连击和保底相关 ====================

    /**
     * 重置保底计数器（出正面时调用）
     */
    resetPityCounter(): void {
        this._pityCounter = 0;
        this.save();
    }

    /**
     * 增加保底计数器（出背面时调用）
     * @returns 是否达到保底阈值（下一次必出正面）
     */
    incrementPityCounter(): boolean {
        this._pityCounter += 1;
        const pityThreshold = this.getUpgradeValue('pity');
        const reached = this._pityCounter >= pityThreshold;
        console.log(`[PlayerData] 保底计数器: ${this._pityCounter}/${pityThreshold}${reached ? ' [已达保底]' : ''}`);
        this.save();
        return reached;
    }

    /**
     * 获取当前保底计数
     * @returns 连续背面次数
     */
    getPityCounter(): number {
        return this._pityCounter;
    }

    // ==================== 胜利条件相关 ====================

    /**
     * 检查是否达到胜利条件（余额达到1亿）
     * @returns 是否达到目标
     */
    checkWinCondition(): boolean {
        return this._balance >= this.TARGET_BALANCE;
    }

    /**
     * 今日是否已达目标
     * @returns 是否达到目标
     */
    hasWonToday(): boolean {
        return this._wonToday;
    }

    /**
     * 标记今日已达到目标
     */
    setWonToday(): void {
        this._wonToday = true;
        console.log('[PlayerData] 今日已达到目标！');
        this.save();
    }

    // ==================== 预期收益计算 ====================

    /**
     * 计算每次正面预期收益
     * @returns 预期收益
     */
    calculateExpectedValue(): number {
        const value = this.getUpgradeValue('value');
        const critRate = this.getUpgradeValue('critical') / 100;
        const critBonus = this.getUpgradeValue('criticalBonus');
        const headProb = this.getUpgradeValue('lucky') / 100;
        const streakBonus = this.getUpgradeValue('streakBonus');
        const streakRate = headProb * headProb;

        const ev = value 
            + (value * critBonus * critRate) 
            + (value * streakBonus * streakRate);

        return Math.floor(ev);
    }

    // ==================== 每日重置相关 ====================

    /** 获取正常规则下，下一次凌晨 4 点重置的时间戳。 */
    private getNextBaseResetTime(now: number): number {
        const nextReset = new Date(now);
        nextReset.setHours(this.RESET_HOUR, 0, 0, 0);
        if (nextReset.getTime() <= now) {
            nextReset.setDate(nextReset.getDate() + 1);
        }

        return nextReset.getTime();
    }

    /** 获取包含玩家顺延设置在内的下一次重置时间戳。 */
    private getNextDailyResetTime(now: number): number {
        if (this._dailyResetPostponeUntil > now) {
            return this._dailyResetPostponeUntil;
        }
        return this.getNextBaseResetTime(now);
    }

    /** 获取距离下一次重置的整秒数。 */
    getSecondsUntilDailyReset(now: number = Date.now()): number {
        return Math.max(0, Math.ceil((this.getNextDailyResetTime(now) - now) / 1000));
    }

    /**
     * 将当前即将到来的重置时间顺延 24 小时。
     * 连续点击会在已顺延的时间基础上继续增加 24 小时。
     * @returns 顺延后的重置时间戳
     */
    postponeNextDailyReset(now: number = Date.now()): number {
        this._dailyResetPostponeUntil = this.getNextDailyResetTime(now) + PlayerData.DAY_MS;
        this.save();
        return this._dailyResetPostponeUntil;
    }

    /**
     * 检查当前时间是否超过重置点（凌晨 4 点）。
     * @returns 本次检查是否执行了重置
     */
    checkDailyReset(now: number = Date.now()): boolean {
        // 玩家已顺延时，在新重置时间到来前不执行每日重置。
        if (this._dailyResetPostponeUntil > now) {
            return false;
        }

        // 计算今天的重置时间（凌晨4点）
        const todayReset = new Date(now);
        todayReset.setHours(this.RESET_HOUR, 0, 0, 0);
        const todayResetTime = todayReset.getTime();

        // 如果现在还没到今天的重置时间，使用昨天的重置时间
        if (now < todayResetTime) {
            todayReset.setDate(todayReset.getDate() - 1);
        }
        const effectiveResetTime = todayReset.getTime();

        // 检查是否需要重置
        if (!this._lastResetTime || this._lastResetTime < effectiveResetTime) {
            console.log('[PlayerData] 执行每日重置...');
            this.reset();
            this._lastResetTime = now;
            this.save();
            return true;
        }

        return false;
    }

    /**
     * 执行重置
     * 将所有数据恢复为初始状态
     */
    private reset(): void {
        console.log('[PlayerData] 重置所有数据');
        this._balance = 0;
        this._currentStreak = 0;
        this._pityCounter = 0;
        this._wonToday = false;
        this._dailyResetPostponeUntil = 0;
        
        // 重置8种升级项为初始值
        (Object.keys(this.UPGRADE_CONFIGS) as UpgradeType[]).forEach(type => {
            const config = this.UPGRADE_CONFIGS[type];
            this._upgrades[type] = {
                value: config.initialValue,
                price: config.initialPrice,
                level: 0
            };
        });

        // 重置生涯统计
        this._stats = {
            totalFlips: 0,
            totalCrits: 0,
            maxBalance: 0,
            maxStreak: 0,
            totalAutoTime: 0
        };

        console.log('[PlayerData] 重置完成');
    }

    // ==================== 本地存储相关 ====================

    /**
     * 保存数据到本地存储
     */
    private save(): void {
        try {
            const saveData: PlayerDataSave = {
                balance: this._balance,
                upgrades: this._upgrades,
                stats: this._stats,
                currentStreak: this._currentStreak,
                pityCounter: this._pityCounter,
                lastResetTime: this._lastResetTime,
                wonToday: this._wonToday,
                dailyResetPostponeUntil: this._dailyResetPostponeUntil
            };
            
            this.writeLocalSave(JSON.stringify(saveData));
        } catch (e) {
            console.error('[PlayerData] 保存数据失败:', e);
        }
    }

    /**
     * 从本地存储加载数据
     * 如果没有存档，则使用初始数据
     */
    private load(): void {
        try {
            const saveStr = this.readLocalSave();
            if (!saveStr) {
                console.log('[PlayerData] 未找到存档，使用初始数据');
                this.initializeDefaultData();
                return;
            }
            
            const saveData: PlayerDataSave = JSON.parse(saveStr);
            this._loadedFromSave = true;
            this._balance = saveData.balance;
            this._upgrades = saveData.upgrades;
            this._stats = saveData.stats;
            this._currentStreak = saveData.currentStreak;
            this._pityCounter = saveData.pityCounter;
            this._lastResetTime = saveData.lastResetTime;
            this._wonToday = saveData.wonToday;
            this._dailyResetPostponeUntil = saveData.dailyResetPostponeUntil ?? 0;
            
            console.log('[PlayerData] 数据加载成功');
            this.checkDailyReset(); // 检查是否需要每日重置
        } catch (e) {
            console.error('[PlayerData] 加载数据失败:', e);
            this.initializeDefaultData();
        }
    }

    /**
     * TapTap 小游戏使用平台缓存；其他平台保持原有 localStorage 行为。
     */
    private writeLocalSave(value: string): void {
        const runtime = globalThis as any;
        if (runtime.tap?.setStorageSync) {
            runtime.tap.setStorageSync(this.STORAGE_KEY, value);
        } else {
            localStorage.setItem(this.STORAGE_KEY, value);
        }

        TapCloudSave.markDirty();
    }

    /**
     * 读取本地存档。TapTap 首次升级时会尝试迁移旧 localStorage 存档。
     */
    private readLocalSave(): string | null {
        const runtime = globalThis as any;
        if (!runtime.tap?.getStorageSync) {
            return localStorage.getItem(this.STORAGE_KEY);
        }

        const tapSave = runtime.tap.getStorageSync(this.STORAGE_KEY);
        if (tapSave !== undefined && tapSave !== null && tapSave !== '') {
            return typeof tapSave === 'string' ? tapSave : JSON.stringify(tapSave);
        }

        const legacySave = runtime.localStorage?.getItem?.(this.STORAGE_KEY) ?? null;
        if (legacySave) {
            runtime.tap.setStorageSync(this.STORAGE_KEY, legacySave);
            console.log('[PlayerData] 已将旧存档迁移到 TapTap 本地缓存');
        }
        return legacySave;
    }

    /**
     * 初始化默认数据（新玩家或数据损坏时调用）
     */
    private initializeDefaultData(): void {
        this._balance = 0;
        this._currentStreak = 0;
        this._pityCounter = 0;
        this._wonToday = false;
        this._lastResetTime = Date.now();
        this._dailyResetPostponeUntil = 0;
        
        // 初始化8种升级项为初始值
        (Object.keys(this.UPGRADE_CONFIGS) as UpgradeType[]).forEach(type => {
            const config = this.UPGRADE_CONFIGS[type];
            this._upgrades[type] = {
                value: config.initialValue,
                price: config.initialPrice,
                level: 0
            };
        });

        // 初始化生涯统计
        this._stats = {
            totalFlips: 0,
            totalCrits: 0,
            maxBalance: 0,
            maxStreak: 0,
            totalAutoTime: 0
        };

        console.log('[PlayerData] 使用初始数据');
    }
}

// 导出升级项类型供外部使用
export type { UpgradeType };
