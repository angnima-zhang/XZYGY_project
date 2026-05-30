/**
 * GameManager - 游戏核心管理器（单例模式）
 * 
 * 功能说明：
 * - 管理抛硬币核心逻辑（正反面判定、暴击、连击、保底）
 * - 计算每次翻转的得分
 * - 管理自动翻转状态
 * - 提供事件通知机制，供 UI 层订阅
 * 
 * GDD v1.2 得分公式：
 * 单次得分 = 面值 + 暴击加成（若有暴击）+ 连击加成 × 连击数
 * 
 * 保底机制：
 * - 连续背面次数达到"保底"值时，下一次必出正面
 * 
 * 暴击与连击：
 * - 暴击和连击是独立触发的
 * - 暴击时连击数继续累加
 * 
 * 使用方式：
 * const gm = GameManager.getInstance();
 * gm.flipCoin();  // 抛一次硬币
 */

import { PlayerData, UpgradeType } from './PlayerData';
import { VfxManager } from '../ui/VfxManager';

/**
 * 抛硬币结果接口
 */
interface FlipResult {
    /** 是否正面 */
    isHead: boolean;
    /** 是否暴击 */
    isCrit: boolean;
    /** 当前连击数 */
    streak: number;
    /** 本次得分 */
    score: number;
    /** 保底计数（连续背面次数） */
    pityCount: number;
    /** 是否由保底触发（保底后必出的正面） */
    wasPityTrigger?: boolean;
}

/**
 * 翻转事件回调类型
 */
type FlipCallback = (result: FlipResult) => void;

type BalanceChangeCallback = () => void;

type AutoFlipStartCallback = (duration: number) => void;

type AutoFlipStopCallback = () => void;

type AutoFlipTickCallback = (remaining: number) => void;

export class GameManager {
    /** 单例实例 */
    private static _instance: GameManager | null = null;

    /** 获取单例实例 */
    static getInstance(): GameManager {
        if (!this._instance) {
            this._instance = new GameManager();
        }
        return this._instance;
    }

    /** 玩家数据管理器实例 */
    private _playerData: PlayerData;

    /** VFX 管理器实例（延迟获取） */
    private _vfxManager: VfxManager | null = null;

    /** 翻转事件回调列表 */
    private _flipCallbacks: FlipCallback[] = [];

    /** 余额变更回调列表 */
    private _balanceChangeCallbacks: BalanceChangeCallback[] = [];

    /** 自动翻转开始回调列表 */
    private _autoFlipStartCallbacks: AutoFlipStartCallback[] = [];

    /** 自动翻转停止回调列表 */
    private _autoFlipStopCallbacks: AutoFlipStopCallback[] = [];

    /** 自动翻转每秒心跳回调列表 */
    private _autoFlipTickCallbacks: AutoFlipTickCallback[] = [];

    /** 是否正在翻转中（防止动画期间重复点击） */
    private _isFlipping: boolean = false;

    /** 自动翻转定时器 ID */
    private _autoFlipTimer: number | null = null;

    /** 自动翻转是否正在进行 */
    private _isAutoFlipping: boolean = false;

    /** 自动翻转累计时间（秒） */
    private _autoFlipAccumulatedTime: number = 0;

    /** 初始化 */
    private constructor() {
        this._playerData = PlayerData.getInstance();
    }

    /**
     * 设置 VFX 管理器
     * @param vfxManager VFX 管理器实例
     */
    setVfxManager(vfxManager: VfxManager): void {
        this._vfxManager = vfxManager;
    }

    /**
     * 获取 VFX 管理器
     * @returns VFX 管理器实例
     */
    getVfxManager(): VfxManager | null {
        return this._vfxManager;
    }

    /**
     * 注册翻转事件回调
     * @param callback 回调函数，接收 FlipResult 参数
     */
    onFlip(callback: FlipCallback): void {
        this._flipCallbacks.push(callback);
    }

    /**
     * 移除翻转事件回调
     * @param callback 要移除的回调函数
     */
    offFlip(callback: FlipCallback): void {
        const index = this._flipCallbacks.indexOf(callback);
        if (index >= 0) {
            this._flipCallbacks.splice(index, 1);
        }
    }

    /**
     * 注册余额变更事件回调
     */
    onBalanceChange(callback: BalanceChangeCallback): void {
        this._balanceChangeCallbacks.push(callback);
    }

    /**
     * 移除余额变更事件回调
     */
    offBalanceChange(callback: BalanceChangeCallback): void {
        const index = this._balanceChangeCallbacks.indexOf(callback);
        if (index >= 0) {
            this._balanceChangeCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知所有余额变更监听者
     */
    notifyBalanceChange(): void {
        for (const callback of this._balanceChangeCallbacks) {
            callback();
        }
    }

    /**
     * 注册自动翻转开始回调
     */
    onAutoFlipStart(callback: AutoFlipStartCallback): void {
        this._autoFlipStartCallbacks.push(callback);
    }

    /**
     * 移除自动翻转开始回调
     */
    offAutoFlipStart(callback: AutoFlipStartCallback): void {
        const index = this._autoFlipStartCallbacks.indexOf(callback);
        if (index >= 0) {
            this._autoFlipStartCallbacks.splice(index, 1);
        }
    }

    /**
     * 注册自动翻转停止回调
     */
    onAutoFlipStop(callback: AutoFlipStopCallback): void {
        this._autoFlipStopCallbacks.push(callback);
    }

    /**
     * 移除自动翻转停止回调
     */
    offAutoFlipStop(callback: AutoFlipStopCallback): void {
        const index = this._autoFlipStopCallbacks.indexOf(callback);
        if (index >= 0) {
            this._autoFlipStopCallbacks.splice(index, 1);
        }
    }

    /**
     * 注册自动翻转每秒心跳回调
     */
    onAutoFlipTick(callback: AutoFlipTickCallback): void {
        this._autoFlipTickCallbacks.push(callback);
    }

    /**
     * 移除自动翻转每秒心跳回调
     */
    offAutoFlipTick(callback: AutoFlipTickCallback): void {
        const index = this._autoFlipTickCallbacks.indexOf(callback);
        if (index >= 0) {
            this._autoFlipTickCallbacks.splice(index, 1);
        }
    }

    /**
     * 通知自动翻转开始
     */
    private notifyAutoFlipStart(duration: number): void {
        for (const callback of this._autoFlipStartCallbacks) {
            callback(duration);
        }
    }

    /**
     * 通知自动翻转停止
     */
    private notifyAutoFlipStop(): void {
        for (const callback of this._autoFlipStopCallbacks) {
            callback();
        }
    }

    /**
     * 通知自动翻转每秒心跳（剩余时间）
     */
    private notifyAutoFlipTick(remaining: number): void {
        for (const callback of this._autoFlipTickCallbacks) {
            callback(remaining);
        }
    }

    /**
     * 获取当前余额
     * @returns 余额数值
     */
    getBalance(): number {
        return this._playerData.getBalance();
    }

    /**
     * 获取抛硬币动画时长（秒）
     * @returns 动画时长
     */
    getAnimDuration(): number {
        const speed = this._playerData.getUpgradeValue('speed');
        return speed;
    }

    /**
     * 获取自动翻转持续时间（秒）
     * @returns 持续时间
     */
    getAutoDuration(): number {
        return this._playerData.getUpgradeValue('time');
    }

    /**
     * 检查是否正在翻转中
     * @returns 是否翻转中
     */
    isFlipping(): boolean {
        return this._isFlipping;
    }

    /**
     * 检查是否正在自动翻转中
     * @returns 是否自动翻转中
     */
    isAutoFlipping(): boolean {
        return this._isAutoFlipping;
    }

    /**
     * 预定的翻转结果（在动画播放前生成，确保动画和逻辑使用相同的结果）
     */
    private _pendingResult: FlipResult | null = null;

    /**
     * 准备一次抛硬币的结果（生成并存储结果，但不修改游戏状态）
     * 必须在 playFlipAnimation 之前调用
     * @returns 准备的结果
     */
    prepareFlip(): FlipResult {
        const isHead = this.judgeHeadOrTail();
        const isCrit = isHead ? this.judgeCrit() : false;
        const consecutiveCount = this._playerData.getCurrentStreak() + 1;
        const effectiveStreak = consecutiveCount >= 2 ? consecutiveCount : 0;
        const score = isHead ? this.calculateScore(isCrit, effectiveStreak) : 0;
        const pityCount = isHead ? 0 : this._playerData.getPityCounter() + 1;

        // 检查是否触发保底（连续背面达到阈值后，下次必出正面）
        const pityThreshold = this._playerData.getUpgradeValue('pity');
        const wasAtPity = isHead && this._playerData.getPityCounter() >= pityThreshold;

        this._pendingResult = {
            isHead,
            isCrit,
            streak: effectiveStreak,
            score,
            pityCount,
            wasPityTrigger: wasAtPity
        };

        console.log(`[GameManager] prepareFlip: ${isHead ? '正面' : '背面'}, 暴击: ${isCrit}, 连击: ${effectiveStreak}, 得分: ${score}, 保底触发: ${wasAtPity}`);
        return this._pendingResult;
    }

    /**
     * 应用动画前预定好的翻转结果，并同步玩家数据与特效。
     */
    private applyPreparedResult(pending: FlipResult): FlipResult {
        if (pending.isHead) {
            this._playerData.resetPityCounter();
            const consecutiveStreak = pending.streak > 0 ? pending.streak : 1;
            this._playerData.updateStreak(consecutiveStreak);

            // 保底触发时播放保底 VFX
            if (pending.wasPityTrigger) {
                this._vfxManager?.playPity();
            }

            if (pending.isCrit) {
                this._playerData.incrementCritCount();
                this._vfxManager?.playCritical();
            } else {
                this._vfxManager?.playHead();
            }

            if (pending.streak > 0) {
                this._vfxManager?.playStreak();
            }

            if (pending.score > 0) {
                this._playerData.addBalance(pending.score);
                this.notifyBalanceChange();
            }

            return {
                isHead: true,
                isCrit: pending.isCrit,
                streak: pending.streak,
                score: pending.score,
                pityCount: 0
            };
        }

        this._vfxManager?.stopStreak();
        this._playerData.updateStreak(0);
        this._playerData.incrementPityCounter();
        this._vfxManager?.playTail();

        return {
            isHead: false,
            isCrit: false,
            streak: 0,
            score: 0,
            pityCount: this._playerData.getPityCounter()
        };
    }

    /**
     * 获取预定的翻转结果（不消耗）
     * @returns 预定的结果
     */
    getPendingResult(): FlipResult | null {
        return this._pendingResult;
    }

    /**
     * 执行一次抛硬币（使用预存的结果）
     * @returns 抛硬币结果
     */
    flipCoin(): FlipResult | null {
        // 如果没有预存结果，使用旧版随机生成
        if (!this._pendingResult) {
            console.warn('[GameManager] flipCoin 被直接调用，无预存结果，将随机生成');
            return this.flipCoinLegacy();
        }

        // 如果正在翻转中，返回空结果
        if (this._isFlipping) {
            console.warn('[GameManager] 正在翻转中，请勿重复点击');
            return null;
        }

        this._isFlipping = true;

        let result: FlipResult;

        try {
            // 使用预存的结果，应用状态变更
            const pending = this._pendingResult;

            // 增加翻转次数统计
            this._playerData.incrementFlipCount();

            result = this.applyPreparedResult(pending);

            // 触发回调通知 UI 更新
            this.notifyFlip(result);

            console.log(`[GameManager] flipCoin 执行完成: ${result.isHead ? '正面' : '背面'}, 暴击: ${result.isCrit}, 连击: ${result.streak}, 得分: ${result.score}`);
        } catch (error) {
            console.error('[GameManager] flipCoin 执行出错:', error);
            result = null as any;
        } finally {
            // 无论如何都要重置翻转状态
            this._isFlipping = false;
            this._pendingResult = null;
        }

        return result;
    }

    /**
     * 旧版 flipCoin（兼容直接调用，不使用预存结果）
     * @returns 抛硬币结果
     */
    private flipCoinLegacy(): FlipResult | null {
        // 如果正在翻转中，返回空结果
        if (this._isFlipping) {
            console.warn('[GameManager] 正在翻转中，请勿重复点击');
            return null;
        }

        this._isFlipping = true;

        let result: FlipResult;

        try {
            // 增加翻转次数统计
            this._playerData.incrementFlipCount();

            // 判定正反面
            const isHead = this.judgeHeadOrTail();

            if (isHead) {
                // 正面：计算得分
                result = this.processHeadResult();
            } else {
                // 背面：无得分
                result = this.processTailResult();
            }

            // 触发回调通知 UI 更新
            this.notifyFlip(result);

            console.log(`[GameManager] flipCoinLegacy 翻转结果: ${result.isHead ? '正面' : '背面'}, 暴击: ${result.isCrit}, 连击: ${result.streak}, 得分: ${result.score}`);
        } catch (error) {
            console.error('[GameManager] flipCoin 执行出错:', error);
            result = null as any;
        } finally {
            // 无论如何都要重置翻转状态
            this._isFlipping = false;
        }

        return result;
    }

    /**
     * 判定正反面
     * 考虑正面概率升级和保底机制
     * @returns 是否正面
     */
    private judgeHeadOrTail(): boolean {
        // 获取当前正面概率（升级后的值）
        const headProb = this._playerData.getUpgradeValue('lucky') / 100;

        // 检查是否达到保底
        const pityThreshold = this._playerData.getUpgradeValue('pity');
        const pityCounter = this._playerData.getPityCounter();

        if (pityCounter >= pityThreshold) {
            // 达到保底，必出正面
            console.log('[GameManager] 触发保底！必出正面');
            return true;
        }

        // 随机判定
        const random = Math.random();
        return random < headProb;
    }

    /**
     * 处理正面结果
     * 计算暴击、连击、得分
     * @returns 翻转结果
     */
    private processHeadResult(): FlipResult {
        const pityThreshold = this._playerData.getUpgradeValue('pity');
        const wasAtPity = this._playerData.getPityCounter() >= pityThreshold;

        // 重置保底计数器
        this._playerData.resetPityCounter();

        // 保底触发时播放保底 VFX
        if (wasAtPity) {
            this._vfxManager?.playPity();
        }

        // 连击计数：第1次正面不计入连击（streak=0），第2次连续正面开始 streak=1，依此类推
        const prevStreak = this._playerData.getCurrentStreak();
        const consecutiveStreak = prevStreak + 1;
        this._playerData.updateStreak(consecutiveStreak);
        const effectiveStreak = consecutiveStreak > 1 ? consecutiveStreak : 0;

        // 判定是否暴击
        const isCrit = this.judgeCrit();

        if (isCrit) {
            this._playerData.incrementCritCount();
            // 触发暴击 VFX + 音效
            this._vfxManager?.playCritical();
        } else {
            // 正面但非暴击
            this._vfxManager?.playHead();
        }

        // 连击特效（连续2次及以上正面才触发）
        if (effectiveStreak > 0) {
            this._vfxManager?.playStreak();
        }

        // 计算得分
        const score = this.calculateScore(isCrit, effectiveStreak);

        // 增加余额
        this._playerData.addBalance(score);
        this.notifyBalanceChange();

        return {
            isHead: true,
            isCrit: isCrit,
            streak: effectiveStreak,
            score: score,
            pityCount: 0
        };
    }

    /**
     * 处理背面结果
     * 重置连击，增加保底计数
     * @returns 翻转结果
     */
    private processTailResult(): FlipResult {
        // 停止连击特效
        this._vfxManager?.stopStreak();

        // 重置连击
        this._playerData.updateStreak(0);

        // 增加保底计数
        this._playerData.incrementPityCounter();

        // 背面音效
        this._vfxManager?.playTail();

        return {
            isHead: false,
            isCrit: false,
            streak: 0,
            score: 0,
            pityCount: this._playerData.getPityCounter()
        };
    }

    /**
     * 判定是否暴击
     * @returns 是否暴击
     */
    private judgeCrit(): boolean {
        const critRate = this._playerData.getUpgradeValue('critical') / 100;
        if (critRate <= 0) return false;
        
        const random = Math.random();
        return random < critRate;
    }

    /**
     * 计算得分
     * 公式：单次得分 = 面值 + 暴击加成（若有暴击）+ 连击加成 × 连击数
     * @param isCrit 是否暴击
     * @param effectiveStreak 有效连击数（0 或 2+）
     * @returns 得分
     */
    private calculateScore(isCrit: boolean, effectiveStreak: number): number {
        const value = this._playerData.getUpgradeValue('value');
        const critBonus = isCrit ? this._playerData.getUpgradeValue('criticalBonus') : 0;
        const streakBonus = this._playerData.getUpgradeValue('streakBonus');

        const score = value + critBonus + (streakBonus * effectiveStreak);
        return Math.max(0, Math.floor(score));
    }

    /**
     * 购买升级项（扣除余额）
     * @param type 升级项类型
     * @returns 是否购买成功
     */
    buyUpgrade(type: UpgradeType): boolean {
        const success = this._playerData.doUpgrade(type);
        
        if (success) {
            // 触发升级 VFX + 音效
            this._vfxManager?.playUpgrade(type);
            // 通知余额变更
            this.notifyBalanceChange();
        }
        
        return success;
    }

    /**
     * 免费升级（不扣除余额，用于广告升级）
     * @param type 升级项类型
     * @returns 是否升级成功
     */
    buyUpgradeByAd(type: UpgradeType): boolean {
        const success = this._playerData.doFreeUpgrade(type);
        
        if (success) {
            // 触发升级 VFX + 音效
            this._vfxManager?.playUpgrade(type);
            // 通知余额变更（价格已更新）
            this.notifyBalanceChange();
        }
        
        return success;
    }

    /**
     * 获取升级项的当前数值
     * @param type 升级项类型
     * @returns 当前数值
     */
    getUpgradeValue(type: UpgradeType): number {
        return this._playerData.getUpgradeValue(type);
    }

    /**
     * 获取升级项的当前价格
     * @param type 升级项类型
     * @returns 当前价格
     */
    getUpgradePrice(type: UpgradeType): number {
        return this._playerData.getUpgradePrice(type);
    }

    /**
     * 计算升级后的数值（预览）
     * @param type 升级项类型
     * @returns 升级后的数值
     */
    calculateNextUpgradeValue(type: UpgradeType): number {
        return this._playerData.calculateNextValue(type);
    }

    /**
     * 计算升级后的价格（预览）
     * @param type 升级项类型
     * @returns 升级后的价格
     */
    calculateNextUpgradePrice(type: UpgradeType): number {
        return this._playerData.calculateNextPrice(type);
    }

    /**
     * 获取每次正面预期收益
     * @returns 预期收益
     */
    getExpectedValue(): number {
        return this._playerData.calculateExpectedValue();
    }

    /**
     * 获取玩家数据实例（供外部访问）
     * @returns PlayerData 实例
     */
    getPlayerData(): PlayerData {
        return this._playerData;
    }

    /**
     * 检查是否达到胜利条件
     * @returns 是否达到1亿
     */
    checkWinCondition(): boolean {
        return this._playerData.checkWinCondition();
    }

    // ==================== 自动翻转相关 ====================

    /**
     * 开始自动翻转
     * 持续时间为"自动时间"升级项的值
     */
    startAutoFlip(): void {
        if (this._isAutoFlipping) {
            console.warn('[GameManager] 已经在自动翻转中');
            return;
        }

        this._isAutoFlipping = true;
        this._autoFlipAccumulatedTime = 0;

        // 触发自动开始 VFX + 音效
        this._vfxManager?.playAutoing();

        // 播放 UpgradeSection auto VFX（一次）
        this._vfxManager?.playAutoMainPage();

        const duration = this.getAutoDuration();
        console.log(`[GameManager] 开始自动翻转，持续 ${duration} 秒`);

        // 通知 UI
        console.log(`[GameManager] notifyAutoFlipStart 回调数: ${this._autoFlipStartCallbacks.length}`);
        this.notifyAutoFlipStart(duration);

        // 使用 setInterval 按照动画速度定时翻转
        const intervalMs = this.getAnimDuration() * 1000;
        console.log(`[GameManager] 自动翻转间隔: ${intervalMs}ms`);
        
        this._autoFlipTimer = window.setInterval(() => {
            if (!this._isAutoFlipping) {
                this.stopAutoFlip();
                return;
            }

            // 先准备结果，再执行翻转
            this.prepareFlip();
            this.flipCoin();

            this._autoFlipAccumulatedTime += this.getAnimDuration();

            // 通知剩余时间
            const remaining = Math.max(0, duration - this._autoFlipAccumulatedTime);
            this.notifyAutoFlipTick(remaining);

            // 检查是否达到持续时间
            if (this._autoFlipAccumulatedTime >= duration) {
                this.stopAutoFlip();
            }
        }, intervalMs);

        // 立即执行第一次翻转
        this.prepareFlip();
        this.flipCoin();
    }

    /**
     * 停止自动翻转
     */
    stopAutoFlip(): void {
        if (!this._isAutoFlipping) return;

        this._isAutoFlipping = false;
        
        if (this._autoFlipTimer !== null) {
            clearInterval(this._autoFlipTimer);
            this._autoFlipTimer = null;
        }

        // 触发自动停止 VFX + 音效
        this._vfxManager?.stopAutoing();

        // 记录累计自动时间
        this._playerData.addAutoTime(Math.floor(this._autoFlipAccumulatedTime));
        
        // 通知余额变更（确保所有购买按钮刷新状态）
        this.notifyBalanceChange();

        // 通知 UI 自动翻转已停止
        this.notifyAutoFlipStop();
        
        console.log(`[GameManager] 自动翻转停止，累计时间: ${this._autoFlipAccumulatedTime} 秒`);
        this._autoFlipAccumulatedTime = 0;
    }

    /**
     * 通知所有翻转回调
     * @param result 翻转结果
     */
    private notifyFlip(result: FlipResult): void {
        for (const callback of this._flipCallbacks) {
            try {
                callback(result);
            } catch (e) {
                console.error('[GameManager] 翻转回调执行出错:', e);
            }
        }
    }
}

// 导出 FlipResult 类型供外部使用
export type { FlipResult };
