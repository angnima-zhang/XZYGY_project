/**
 * CoinController - 硬币控制器
 * 
 * 功能说明：
 * - 处理硬币点击交互
 * - 播放抛硬币动画（Y轴旋转模拟翻转）
 * - 根据 GameManager 的结果显示正/反面
 * - 显示飘字效果（得分、暴击、连击等）
 * 
 * 动画流程：
 * 1. 用户点击硬币 -> 触发翻转动画
 * 2. 硬币Y轴旋转（模拟抛硬币）
 * 3. 动画结束后显示正/反面
 * 4. 根据结果显示暴击/连击/保底等特效
 * 
 * 场景节点对应：
 * - Coin 节点（硬币主体，需挂载此脚本）
 * - criticalHit 节点（暴击特效，默认隐藏）
 * - bonus 节点（奖金显示）
 * - critical 节点（暴击计数）
 * - addScore 节点（飘字，+100,000,000）
 * - streak 节点（连击显示）
 * - autoing 节点（自动中状态）
 * - pity 节点（保底特效）
 * 
 * 使用方式：
 * 将此脚本挂载到 Coin 节点上即可
 */

import { _decorator, Component, Node, Label, Sprite, Tween, tween, Vec3, UIOpacity, Color } from 'cc';
import { GameManager, FlipResult } from '../core/GameManager';
import { VfxManager } from './VfxManager';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('CoinController')
export class CoinController extends Component {

    /**
     * 暴击特效节点（默认隐藏）
     */
    @property({ type: Node, displayName: '暴击特效节点', tooltip: 'criticalHit 节点' })
    criticalHitNode: Node | null = null;

    /**
     * 奖金显示节点
     */
    @property({ type: Node, displayName: '奖金显示节点', tooltip: 'bonus 节点' })
    bonusNode: Node | null = null;

    /**
     * 暴击计数节点
     */
    @property({ type: Node, displayName: '暴击计数节点', tooltip: 'critical 节点' })
    criticalNode: Node | null = null;

    /**
     * 飘字节点（+100,000,000）
     */
    @property({ type: Node, displayName: '飘字节点', tooltip: 'addScore 节点' })
    addScoreNode: Node | null = null;

    /**
     * 连击显示节点
     */
    @property({ type: Node, displayName: '连击显示节点', tooltip: 'streak 节点' })
    streakNode: Node | null = null;

    /**
     * 自动中状态节点
     */
    @property({ type: Node, displayName: '自动中状态节点', tooltip: 'autoing 节点' })
    autoingNode: Node | null = null;

    /**
     * 保底特效节点
     */
    @property({ type: Node, displayName: '保底特效节点', tooltip: 'pity 节点' })
    pityNode: Node | null = null;

    /**
     * 硬币 Sprite 组件引用（用于切换正/反面贴图）
     */
    private _coinSprite: Sprite | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * VFX 管理器实例
     */
    private _vfxManager: VfxManager | null = null;

    /**
     * 是否正在播放动画中
     */
    private _isAnimating: boolean = false;

    /**
     * 当前连击计数（用于显示）
     */
    private _currentStreakDisplay: number = 0;

    /**
     * 暴击计数（用于显示）
     */
    private _critCountDisplay: number = 0;

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        // 获取硬币 Sprite 组件
        this._coinSprite = this.node.getComponent(Sprite);

        // 获取游戏管理器实例
        this._gameManager = GameManager.getInstance();

        // 获取 VFX 管理器实例
        this._vfxManager = this._gameManager.getVfxManager();

        // 注册翻转事件回调
        this._gameManager.onFlip(this.onFlipResult.bind(this));

        // 绑定硬币点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onCoinClick, this);

        console.log('[CoinController] 初始化完成');
    }

    /**
     * 组件启用时调用
     * 重置 UI 状态
     */
    onEnable() {
        this.resetUIState();
    }

    /**
     * 组件销毁时调用
     * 清理事件监听和所有 Tween 动画
     */
    onDestroy() {
        // 停止所有针对此节点的 Tween 动画
        Tween.stopAllByTarget(this.node);

        // 移除事件监听
        if (this._gameManager) {
            this._gameManager.offFlip(this.onFlipResult.bind(this));
        }
        this.node.off(Node.EventType.TOUCH_END, this.onCoinClick, this);
    }

    /**
     * 硬币点击事件处理
     * @param event 触摸事件
     */
    private onCoinClick(event: Event): void {
        // 如果正在动画中，忽略点击
        if (this._isAnimating) {
            console.log('[CoinController] 正在动画中，忽略点击');
            return;
        }

        // 检查是否达到胜利条件
        if (this._gameManager.checkWinCondition()) {
            console.log('[CoinController] 已达到目标，停止翻转');
            return;
        }

        // 播放点击音效
        this._vfxManager?.playCoinClick();

        // 触发翻转
        this.playFlipAnimation();
    }

    /**
     * 播放抛硬币动画
     * Y轴旋转模拟硬币翻转
     */
    private playFlipAnimation(): void {
        this._isAnimating = true;

        // 获取动画时长（从 GameManager 获取）
        const duration = this._gameManager.getAnimDuration();

        console.log(`[CoinController] 开始翻转动画，时长: ${duration} 秒`);

        // 保存原始 Y 轴旋转角度
        const originalEuler = this.node.eulerAngles.clone();

        // Y轴旋转动画（模拟硬币翻转）
        // 旋转 5 圈（1800度）
        tween(this.node)
            .by(duration, { eulerAngles: new Vec3(0, 1800, 0) })
            .call(() => {
                // 动画结束后调用 GameManager 处理逻辑
                this._gameManager.flipCoin();
            })
            .start();
    }

    /**
     * 处理翻转结果（由 GameManager 回调触发）
     * @param result 翻转结果
     */
    private onFlipResult(result: FlipResult): void {
        if (!result) return;

        // 更新 UI 显示
        this.updateUI(result);

        // 显示飘字效果
        if (result.isHead && result.score > 0) {
            this.showScorePopup(result.score, result.isCrit);
        }

        // 显示暴击特效
        if (result.isCrit) {
            this.showCriticalEffect();
        }

        // 更新连击显示
        this.updateStreakDisplay(result.streak);

        // 更新暴击计数显示
        if (result.isCrit) {
            this.updateCritCountDisplay();
        }

        // 检查是否达到胜利条件
        if (this._gameManager.checkWinCondition()) {
            this.showWinEffect();
        }

        this._isAnimating = false;
    }

    /**
     * 更新 UI 状态（正/反面显示）
     * @param result 翻转结果
     */
    private updateUI(result: FlipResult): void {
        if (result.isHead) {
            // 正面：切换为正面贴图
            // TODO: 需要配置正面 SpriteFrame
            console.log('[CoinController] 显示正面');
        } else {
            // 背面：切换为背面贴图
            // TODO: 需要配置背面 SpriteFrame
            console.log('[CoinController] 显示背面');
        }
    }

    /**
     * 显示得分飘字效果
     * @param score 得分
     * @param isCrit 是否暴击
     */
    private showScorePopup(score: number, isCrit: boolean): void {
        if (!this.addScoreNode) return;

        // 获取 Label 组件
        const label = this.addScoreNode.getComponent(Label);
        if (!label) return;

        // 设置显示文字
        label.string = `+${this.formatNumber(score)}`;

        // 如果是暴击，改变颜色
        if (isCrit) {
            label.color = new Color(255, 215, 0, 255); // 金色
        } else {
            label.color = new Color(255, 255, 255, 255); // 白色
        }

        // 重置位置和透明度
        this.addScoreNode.setPosition(0, 0, 0);
        let opacity = this.addScoreNode.getComponent(UIOpacity);
        if (!opacity) {
            opacity = this.addScoreNode.addComponent(UIOpacity);
        }
        opacity.opacity = 255;

        // 飘字动画（向上移动 + 淡出）
        tween(this.addScoreNode)
            .to(1.0, { position: new Vec3(0, 150, 0) })
            .start();

        if (opacity) {
            tween(opacity)
                .to(1.0, { opacity: 0 })
                .call(() => {
                    // 动画结束后隐藏
                    this.addScoreNode.active = false;
                })
                .start();
        }

        // 确保节点激活
        this.addScoreNode.active = true;
    }

    /**
     * 显示暴击特效
     */
    private showCriticalEffect(): void {
        if (!this.criticalHitNode) return;

        // 激活暴击节点
        this.criticalHitNode.active = true;

        // 获取 UIOpacity 组件
        let opacity = this.criticalHitNode.getComponent(UIOpacity);
        if (!opacity) {
            opacity = this.criticalHitNode.addComponent(UIOpacity);
        }
        opacity.opacity = 255;

        // 播放出现动画（放大 + 淡出）
        this.criticalHitNode.setScale(new Vec3(0.5, 0.5, 1));

        tween(this.criticalHitNode)
            .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .start();

        tween(opacity)
            .delay(1.0)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.criticalHitNode.active = false;
            })
            .start();
    }

    /**
     * 更新连击显示
     * @param streak 当前连击数
     */
    private updateStreakDisplay(streak: number): void {
        this._currentStreakDisplay = streak;

        if (!this.streakNode) return;

        // 获取 Label 组件（streak/text001）
        const label = this.streakNode.getComponentInChildren(Label);
        if (label) {
            label.string = `x${streak}`;
        }

        // 连击 > 0 时显示，否则隐藏
        this.streakNode.active = streak > 0;

        // 连击时播放缩放动画
        if (streak > 0) {
            this.streakNode.setScale(new Vec3(1.2, 1.2, 1));
            tween(this.streakNode)
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    /**
     * 更新暴击计数显示
     */
    private updateCritCountDisplay(): void {
        this._critCountDisplay++;

        if (!this.criticalNode) return;

        // 获取 Label 组件（critical/text001）
        const label = this.criticalNode.getComponentInChildren(Label);
        if (label) {
            label.string = `x${this._critCountDisplay}`;
        }

        // 暴击计数 > 0 时显示
        this.criticalNode.active = this._critCountDisplay > 0;
    }

    /**
     * 显示胜利特效
     */
    private showWinEffect(): void {
        console.log('[CoinController] 🎉 达到1亿，胜利！');
        // TODO: 播放胜利动画、弹窗等
    }

    /**
     * 重置 UI 状态
     */
    private resetUIState(): void {
        if (this.criticalHitNode) this.criticalHitNode.active = false;
        if (this.addScoreNode) this.addScoreNode.active = false;
        if (this.streakNode) this.streakNode.active = false;
        if (this.criticalNode) this.criticalNode.active = false;
        if (this.pityNode) this.pityNode.active = false;
        if (this.autoingNode) this.autoingNode.active = false;
        if (this.bonusNode) this.bonusNode.active = false;
    }

    /**
     * 格式化数字（添加千分位分隔符）
     * @param num 数字
     * @returns 格式化后的字符串
     */
    private formatNumber(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}