/**
 * PlayerData - 玩家数据管理器（单例模式）
 * 
 * 功能说明：
 * - 管理玩家的游戏数据（余额、8种升级项数值和价格、生涯统计）
 * - 实现本地存储和读取（使用 localStorage）
 * - 每日凌晨4点自动重置
 * 
 * GDD v1.2 升级项定义：
 * 1. 面值（初始值1，初始价格5，乘法增长）
 * 2. 动画速度（初始值5秒，初始价格5，除法增长）
 * 3. 正面概率（初始值50%，初始价格5，乘法增长）
 * 4. 暴击率（初始值0%，初始价格5，乘法增长）
 * 5. 暴击加成（初始值0，初始价格5，乘法增长）
 * 6. 保底（初始值20次，初始价格5，固定递减）
 * 7. 连击加成（初始值0，初始价格5，乘法增长）
 * 8. 自动持续时间（初始值10秒，初始价格5，乘法增长）
 * 
 * 使用方式：
 * const data = PlayerData.getInstance();
 * data.addBalance(100);           // 增加余额
 * data.upgradeValue('value');     // 升级面值
 */

/**
 * 升级项类型枚举
 */
type UpgradeType = 
    | 'value'           // 1. 面值
    | 'animSpeed'       // 2. 动画速度
    | 'headProb'        // 3. 正面概率
    | 'critRate'        // 4. 暴击率
    | 'critBonus'       // 5. 暴击加成
    | 'pity'            // 6. 保底
    | 'streakBonus'     // 7. 连击加成
    | 'autoDuration';   // 8. 自动持续时间

/**
 * 升级项配置接口
 */
interface UpgradeConfig {
    /** 升级项名称 */
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
    private readonly STORAGE_KEY = 'xianzheng_player_data_v2';

    /** 游戏目标金额（1亿） */
    readonly TARGET_BALANCE = 100_000_000;

    /** 每日重置时间（凌晨4点） */
    private readonly RESET_HOUR = 4;

    /** 8种升级项的固定配置（不会随游戏进度变化） */
    private readonly UPGRADE_CONFIGS: Record<UpgradeType, UpgradeConfig> = {
        value: {
            name: '面值',
            initialValue: 1,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: ''
        },
        animSpeed: {
            name: '动画速度',
            initialValue: 5,
            initialPrice: 5,
            growthType: 'divide',
            growthFactor: 1.2,
            unit: '秒'
        },
        headProb: {
            name: '正面概率',
            initialValue: 50,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '%'
        },
        critRate: {
            name: '暴击率',
            initialValue: 0,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '%'
        },
        critBonus: {
            name: '暴击加成',
            initialValue: 0,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: ''
        },
        pity: {
            name: '保底',
            initialValue: 20,
            initialPrice: 5,
            growthType: 'fixed',
            growthFactor: 1,
            unit: '次'
        },
        streakBonus: {
            name: '连击加成',
            initialValue: 0,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: ''
        },
        autoDuration: {
            name: '自动持续时间',
            initialValue: 10,
            initialPrice: 5,
            growthType: 'multiply',
            growthFactor: 1.2,
            unit: '秒'
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

        switch (config.growthType) {
            case 'multiply':
                return Math.ceil(currentValue * config.growthFactor);
            case 'divide':
                return Math.floor(currentValue / config.growthFactor);
            case 'fixed':
                return currentValue - 1;
            default:
                return currentValue;
        }
    }

    /**
     * 计算升级后的价格（不实际升级，仅预览）
     * @param type 升级项类型
     * @returns 升级后的价格
     */
    calculateNextPrice(type: UpgradeType): number {
        const currentPrice = this.getUpgradePrice(type);
        return Math.ceil(currentPrice * 1.2);
    }

    /**
     * 执行升级（扣除余额，更新数值和价格）
     * @param type 升级项类型
     * @returns 是否升级成功
     */
    doUpgrade(type: UpgradeType): boolean {
        const price = this.getUpgradePrice(type);
        
        // 检查余额是否足够
        if (!this.subtractBalance(price)) {
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
        console.log('[PlayerData] 🎉 今日已达到目标！');
        this.save();
    }

    // ==================== 预期收益计算 ====================

    /**
     * 计算每次正面预期收益
     * 公式：E = 面值 + (暴击率 × 暴击加成) + (正面概率 × 暴击加成) + 连击加成 / 2
     * @returns 预期收益
     */
    calculateExpectedValue(): number {
        const value = this.getUpgradeValue('value');
        const critRate = this.getUpgradeValue('critRate') / 100;
        const critBonus = this.getUpgradeValue('critBonus');
        const headProb = this.getUpgradeValue('headProb') / 100;
        const streakBonus = this.getUpgradeValue('streakBonus');

        const ev = value 
            + (critRate * critBonus) 
            + (headProb * critBonus) 
            + (streakBonus / 2);

        return Math.floor(ev);
    }

    // ==================== 每日重置相关 ====================

    /**
     * 检查当前时间是否超过重置点（凌晨4点）
     * 如果超过且今日未重置过，则执行重置
     */
    private checkAndResetIfNeeded(): void {
        const now = Date.now();
        const lastResetDate = this._lastResetTime ? new Date(this._lastResetTime) : null;
        
        // 计算今天的重置时间（凌晨4点）
        const todayReset = new Date(now);
        todayReset.setHours(this.RESET_HOUR, 0, 0, 0);
        const todayResetTime = todayReset.getTime();
        
        // 如果现在还没到今天的重置时间，使用昨天的重置时间
        const effectiveResetTime = now < todayResetTime 
            ? todayResetTime - 24 * 60 * 60 * 1000 
            : todayResetTime;
        
        // 检查是否需要重置
        if (!lastResetDate || this._lastResetTime < effectiveResetTime) {
            console.log('[PlayerData] 执行每日重置...');
            this.reset();
            this._lastResetTime = now;
            this.save();
        }
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
                wonToday: this._wonToday
            };
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saveData));
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
            const saveStr = localStorage.getItem(this.STORAGE_KEY);
            if (!saveStr) {
                console.log('[PlayerData] 未找到存档，使用初始数据');
                this.initializeDefaultData();
                return;
            }
            
            const saveData: PlayerDataSave = JSON.parse(saveStr);
            this._balance = saveData.balance;
            this._upgrades = saveData.upgrades;
            this._stats = saveData.stats;
            this._currentStreak = saveData.currentStreak;
            this._pityCounter = saveData.pityCounter;
            this._lastResetTime = saveData.lastResetTime;
            this._wonToday = saveData.wonToday;
            
            console.log('[PlayerData] 数据加载成功');
            this.checkAndResetIfNeeded(); // 检查是否需要每日重置
        } catch (e) {
            console.error('[PlayerData] 加载数据失败:', e);
            this.initializeDefaultData();
        }
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