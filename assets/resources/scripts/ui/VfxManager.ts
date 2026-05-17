/**
 * VfxManager - VFX 特效和音效统一管理器
 * 
 * 功能说明：
 * - 管理所有 vfx 节点的播放/停止
 * - 管理所有音效的播放（通过编辑器拖拽配置）
 * - VFX 和音效联动播放
 * 
 * 使用方法：
 * 1. 将此脚本挂载到 Canvas 节点
 * 2. 在属性检查器中配置所有 VFX 节点引用
 * 3. 在属性检查器中配置所有音效 AudioClip 引用（从 audios 文件夹拖入）
 * 4. 通过代码调用对应方法触发
 * 
 * 音效配对建议（仅供参考，可在编辑器中自由调整）：
 * - 点击硬币音效 -> 点击硬币.mp3
 * - 正面音效 -> 正面.mp3 或 小奖.mp3
 * - 暴击音效 -> 暴击.mp3
 * - 升级音效 -> 升级.mp3
 * - 保底音效 -> 大奖.mp3 或 中奖.mp3
 * - 连击音效 -> 金币.mp3 或 小声钱.mp3
 * - 自动开始音效 -> 提示.mp3 或 滴.mp3
 */

import { _decorator, Component, Node, AudioClip } from 'cc';
import { VfxController } from './VfxController';
import { UpgradeType } from '../core/PlayerData';
import { AudioManager } from '../core/AudioManager';

// 解构装饰器
const { ccclass, property } = _decorator;

/**
 * VFX 管理器类
 */
@ccclass('VfxManager')
export class VfxManager extends Component {

    // ==================== 核心玩法 VFX 节点配置 ====================

    /**
     * 保底特效节点 (MainPage/CoinSection/pity/vfx)
     */
    @property({ type: Node, displayName: '保底特效', tooltip: 'MainPage/CoinSection/pity/vfx 节点' })
    pityVfx: Node | null = null;

    /**
     * 暴击特效节点 (MainPage/CoinSection/criticalHit/vfx)
     */
    @property({ type: Node, displayName: '暴击特效', tooltip: 'MainPage/CoinSection/criticalHit/vfx 节点' })
    criticalHitVfx: Node | null = null;

    /**
     * 连击特效节点 (MainPage/CoinSection/streak/vfx)
     */
    @property({ type: Node, displayName: '连击特效', tooltip: 'MainPage/CoinSection/streak 节点' })
    streakVfx: Node | null = null;

    /**
     * 自动翻转特效节点 (MainPage/CoinSection/autoing/vfx)
     */
    @property({ type: Node, displayName: '自动翻转计时特效', tooltip: 'MainPage/CoinSection/autoing 节点' })
    autoingVfx: Node | null = null;

    // ==================== MainPage/UpgradeSection 升级 VFX（3个） ====================

    /**
     * 面值升级特效节点（MainPage）
     */
    @property({ type: Node, displayName: '面值升级特效（主页）', tooltip: 'MainPage/UpgradeSection/value/vfx 节点' })
    valueVfxMainPage: Node | null = null;

    /**
     * 速度升级特效节点（MainPage）
     */
    @property({ type: Node, displayName: '速度升级特效（主页）', tooltip: 'MainPage/UpgradeSection/speed/vfx 节点' })
    speedVfxMainPage: Node | null = null;

    /**
     * 自动翻转购买特效节点（MainPage）
     */
    @property({ type: Node, displayName: '自动翻转购买特效', tooltip: 'MainPage/UpgradeSection/auto/vfx 节点' })
    autoVfxMainPage: Node | null = null;

    // ==================== UpgradePage 升级 VFX（8个） ====================

    /**
     * 面值升级特效节点（UpgradePage）
     */
    @property({ type: Node, displayName: '面值升级特效（升级页）', tooltip: 'UpgradePage/upgrades/value/vfx 节点' })
    valueVfxUpgradePage: Node | null = null;

    /**
     * 速度升级特效节点（UpgradePage）
     */
    @property({ type: Node, displayName: '速度升级特效（升级页）', tooltip: 'UpgradePage/upgrades/speed/vfx 节点' })
    speedVfxUpgradePage: Node | null = null;

    /**
     * 幸运升级特效节点
     */
    @property({ type: Node, displayName: '幸运升级特效', tooltip: 'UpgradePage/upgrades/lucky/vfx 节点' })
    luckyVfx: Node | null = null;

    /**
     * 暴击升级特效节点
     */
    @property({ type: Node, displayName: '暴击升级特效', tooltip: 'UpgradePage/upgrades/critical/vfx 节点' })
    criticalVfx: Node | null = null;

    /**
     * 暴击加成升级特效节点
     */
    @property({ type: Node, displayName: '暴击加成升级特效', tooltip: 'UpgradePage/upgrades/criticalBonus/vfx 节点' })
    criticalBonusVfx: Node | null = null;

    /**
     * 保底升级特效节点
     */
    @property({ type: Node, displayName: '保底升级特效', tooltip: 'UpgradePage/upgrades/pity/vfx 节点' })
    pityUpgradeVfx: Node | null = null;

    /**
     * 连击加成升级特效节点
     */
    @property({ type: Node, displayName: '连击加成升级特效', tooltip: 'UpgradePage/upgrades/streakBonus/vfx 节点' })
    streakBonusVfx: Node | null = null;

    /**
     * 自动时间升级特效节点
     */
    @property({ type: Node, displayName: '自动时间升级特效', tooltip: 'UpgradePage/upgrades/time/vfx 节点' })
    timeUpgradeVfx: Node | null = null;

    // ==================== 音效配置（在编辑器中拖拽配置） ====================

    @property({ type: AudioClip, displayName: '点击硬币音效', tooltip: '点击硬币时播放', group: '音效配置' })
    coinClickClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '正面音效', tooltip: '抛硬币出正面时播放', group: '音效配置' })
    headClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '背面音效', tooltip: '抛硬币出背面时播放', group: '音效配置' })
    tailClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '暴击音效', tooltip: '触发暴击时播放', group: '音效配置' })
    critClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '升级音效', tooltip: '购买升级时播放', group: '音效配置' })
    upgradeClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '保底音效', tooltip: '触发保底时播放', group: '音效配置' })
    pityClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '连击音效', tooltip: '连击增加时播放', group: '音效配置' })
    streakClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '自动开始音效', tooltip: '开始自动翻转时播放', group: '音效配置' })
    autoStartClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '自动停止音效', tooltip: '停止自动翻转时播放', group: '音效配置' })
    autoStopClip: AudioClip | null = null;

    @property({ type: AudioClip, displayName: '胜利音效', tooltip: '达到1亿时播放', group: '音效配置' })
    winClip: AudioClip | null = null;

    // ==================== 私有变量 ====================

    /**
     * VFX 控制器缓存
     */
    private _controllers: Map<string, VfxController[]> = new Map();

    /**
     * 组件加载时调用
     * 初始化所有 VFX 控制器
     */
    onLoad() {
        // 注册核心玩法 VFX
        this.registerVfx('pity', this.pityVfx);
        this.registerVfx('criticalHit', this.criticalHitVfx);
        this.registerVfx('streak', this.streakVfx);
        this.registerVfx('autoing', this.autoingVfx);

        // 注册 MainPage/UpgradeSection 升级 VFX（3个）
        this.registerVfx('valueMainPage', this.valueVfxMainPage);
        this.registerVfx('speedMainPage', this.speedVfxMainPage);
        this.registerVfx('autoMainPage', this.autoVfxMainPage);

        // 注册 UpgradePage 升级 VFX（8个）
        this.registerVfx('valueUpgradePage', this.valueVfxUpgradePage);
        this.registerVfx('speedUpgradePage', this.speedVfxUpgradePage);
        this.registerVfx('lucky', this.luckyVfx);
        this.registerVfx('critical', this.criticalVfx);
        this.registerVfx('criticalBonus', this.criticalBonusVfx);
        this.registerVfx('pityUpgrade', this.pityUpgradeVfx);
        this.registerVfx('streakBonus', this.streakBonusVfx);
        this.registerVfx('timeUpgrade', this.timeUpgradeVfx);

        let totalCount = 0;
        this._controllers.forEach(arr => totalCount += arr.length);
        console.log(`[VfxManager] 初始化完成，共注册 ${totalCount} 个 VFX 控制器`);

        // 打印 autoing 详细信息
        if (this.autoingVfx) {
            console.log(`[VfxManager] autoingVfx 节点 active=${this.autoingVfx.active}, 子节点数=${this.autoingVfx.children.length}`);
            const ctrl = this.autoingVfx.getComponent(VfxController);
            if (ctrl) {
                console.log(`[VfxManager] autoingVfx VfxController animation=${!!ctrl.animation}, clips=${ctrl.animation?.clips.length ?? 0}`);
            } else {
                console.warn('[VfxManager] autoingVfx 节点未挂载 VfxController!');
            }
        } else {
            console.error('[VfxManager] autoingVfx 节点未配置!');
        }
    }

    /**
     * 注册 VFX 节点
     * @param name VFX 名称
     * @param node VFX 节点
     */
    private registerVfx(name: string, node: Node | null): void {
        if (!node) {
            console.warn(`[VfxManager] VFX 节点未配置: ${name}`);
            return;
        }

        const controller = node.getComponent(VfxController);
        if (!controller) {
            console.warn(`[VfxManager] VFX 节点未挂载 VfxController: ${name}`);
            return;
        }

        if (!this._controllers.has(name)) {
            this._controllers.set(name, []);
        }
        this._controllers.get(name)!.push(controller);
    }

    /**
     * 获取 VFX 控制器列表
     * @param name VFX 名称
     * @returns VFX 控制器列表
     */
    private getControllers(name: string): VfxController[] {
        return this._controllers.get(name) || [];
    }

    /**
     * 播放音效（通过 AudioManager）
     * @param clip 音频片段
     */
    private playAudioClip(clip: AudioClip | null): void {
        if (!clip) return;

        const audioManager = AudioManager.getInstance();
        audioManager.playClip(clip);
    }

    /**
     * 播放 VFX 特效（支持多个同名控制器）
     * @param name VFX 名称
     * @param duration 播放时长（秒），0=使用默认时长
     */
    private playVfx(name: string, duration: number = 0): void {
        const controllers = this.getControllers(name);
        for (const ctrl of controllers) {
            ctrl.play(duration);
        }
    }

    /**
     * 开始循环播放 VFX 特效（已在循环中则不重播）
     * @param name VFX 名称
     */
    private playLoopingVfx(name: string): void {
        const controllers = this.getControllers(name);
        console.log(`[VfxManager] playLoopingVfx('${name}'), controllers=${controllers.length}`);
        for (const ctrl of controllers) {
            console.log(`[VfxManager] 调用 VfxController.playLooping(), node=${ctrl.node?.name}`);
            ctrl.playLooping();
        }
    }

    /**
     * 停止循环播放 VFX 特效
     * @param name VFX 名称
     */
    private stopLoopingVfx(name: string): void {
        const controllers = this.getControllers(name);
        console.log(`[VfxManager] stopLoopingVfx('${name}'), controllers=${controllers.length}`);
        for (const ctrl of controllers) {
            ctrl.stopLooping();
        }
    }

    /**
     * 停止 VFX 特效（支持多个同名控制器）
     * @param name VFX 名称
     */
    private stopVfx(name: string): void {
        const controllers = this.getControllers(name);
        for (const ctrl of controllers) {
            ctrl.stop();
        }
    }

    // ==================== 核心玩法 VFX + 音效 ====================

    /**
     * 播放点击硬币
     * 触发时机：用户点击硬币
     */
    playCoinClick(): void {
        this.playAudioClip(this.coinClickClip);
    }

    /**
     * 播放正面结果
     * 触发时机：抛硬币出正面
     */
    playHead(): void {
        this.playAudioClip(this.headClip);
    }

    /**
     * 播放背面结果
     * 触发时机：抛硬币出背面
     */
    playTail(): void {
        this.playAudioClip(this.tailClip);
    }

    /**
     * 播放保底特效 + 音效
     * 触发时机：连续背面次数达到保底阈值
     */
    playPity(): void {
        this.playVfx('pity', 1.5);
        this.playAudioClip(this.pityClip);
    }

    /**
     * 播放暴击特效 + 音效
     * 触发时机：触发暴击时
     */
    playCritical(): void {
        this.playVfx('criticalHit', 1.0);
        this.playAudioClip(this.critClip);
    }

    /**
     * 开始连击特效循环（持续连击时不重播）
     * 触发时机：连击数持续增加时
     */
    playStreak(): void {
        this.playLoopingVfx('streak');
        this.playAudioClip(this.streakClip);
    }

    /**
     * 停止连击特效循环
     * 触发时机：连击断开时
     */
    stopStreak(): void {
        this.stopLoopingVfx('streak');
    }

    /**
     * 播放自动翻转特效 + 音效
     * 触发时机：开始自动翻转时
     */
    playAutoing(): void {
        console.log('[VfxManager] playAutoing 被调用');
        this.playLoopingVfx('autoing');
        this.playAudioClip(this.autoStartClip);
    }

    /**
     * 停止自动翻转特效 + 音效
     * 触发时机：停止自动翻转时
     */
    stopAutoing(): void {
        console.log('[VfxManager] stopAutoing 被调用');
        this.stopLoopingVfx('autoing');
        this.playAudioClip(this.autoStopClip);
    }

    /**
     * 播放胜利特效 + 音效
     * 触发时机：达到1亿目标
     */
    playWin(): void {
        this.playAudioClip(this.winClip);
    }

    // ==================== 升级 VFX + 音效 ====================

    /**
     * 播放升级特效 + 音效
     * 触发时机：对应升级项购买成功时
     * 注意：value、speed 会在 MainPage 和 UpgradePage 同时播放
     * @param type 升级项类型
     */
    playUpgrade(type: UpgradeType): void {
        const vfxNames = this.getUpgradeVfxNames(type);
        for (const vfxName of vfxNames) {
            this.playVfx(vfxName, 0.8);
        }
        this.playAudioClip(this.upgradeClip);
    }

    /**
     * 获取升级项对应的 VFX 名称列表
     * value、speed 会返回 MainPage 和 UpgradePage 两个名称
     * @param type 升级项类型
     * @returns VFX 名称数组
     */
    private getUpgradeVfxNames(type: UpgradeType): string[] {
        switch (type) {
            case 'value': return ['valueMainPage', 'valueUpgradePage'];
            case 'speed': return ['speedMainPage', 'speedUpgradePage'];
            case 'lucky': return ['lucky'];
            case 'critical': return ['critical'];
            case 'criticalBonus': return ['criticalBonus'];
            case 'pity': return ['pityUpgrade'];
            case 'streakBonus': return ['streakBonus'];
            case 'time': return ['timeUpgrade'];
            default: return ['valueMainPage', 'valueUpgradePage'];
        }
    }

    // ==================== 批量操作 ====================

    /**
     * 停止所有 VFX 特效
     */
    stopAll(): void {
        this._controllers.forEach(arr => arr.forEach(ctrl => ctrl.stop()));
    }

    /**
     * 暂停所有 VFX 特效
     */
    pauseAll(): void {
        this._controllers.forEach(arr => arr.forEach(ctrl => ctrl.pause()));
    }

    /**
     * 恢复所有 VFX 特效
     */
    resumeAll(): void {
        this._controllers.forEach(arr => arr.forEach(ctrl => ctrl.resume()));
    }
}
