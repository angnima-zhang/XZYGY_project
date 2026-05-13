/**
 * CoinController - 硬币控制器
 * 
 * 功能说明：
 * - 处理硬币点击交互
 * - 播放抛硬币动画（Y轴旋转模拟翻转）
 * - 根据 GameManager 的结果显示正/反面
 * - 显示飘字效果（得分、暴击、连击等）
 * - 翻转时禁用除设置按钮外的所有按钮并置灰
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

import { _decorator, Component, Node, Label, Sprite, Tween, tween, Vec3, UIOpacity, Color, Button, Animation } from 'cc';
import { GameManager, FlipResult } from '../core/GameManager';
import { VfxManager } from './VfxManager';

// 解构装饰器
const { ccclass, property } = _decorator;

/**
 * 按钮状态缓存
 */
interface ButtonState {
    node: Node;
    interactable: boolean;
    color: Color;
}

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
     * 翻转动画时长（秒）
     */
    @property({
        displayName: '翻转动画时长',
        tooltip: '翻硬币动画的持续时间，单位秒，保留2位小数',
        step: 0.01,
        min: 0.01
    })
    flipDuration: number = 1.5;

    /**
     * 硬币 Sprite 组件引用（用于切换正/反面贴图）
     */
    private _coinSprite: Sprite | null = null;

    /**
     * 硬币 Animation 组件引用（用于播放翻转动画）
     */
    private _coinAnimation: Animation | null = null;

    /**
     * 动画名称（必须与 Animation 组件中的动画剪辑名称一致）
     */
    private readonly FLIP_ANIM_NAME = 'coin_flip';

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
     * 按钮状态缓存列表
     */
    private _buttonStates: ButtonState[] = [];

    /**
     * 置灰颜色
     */
    private readonly GRAY_COLOR = new Color(128, 128, 128, 255);

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        console.log('[CoinController] === onLoad 开始 ===');
        
        // 获取硬币 Sprite 组件
        this._coinSprite = this.node.getComponent(Sprite);
        console.log('[CoinController] Sprite 组件:', this._coinSprite ? '已找到' : '未找到');

        // 获取硬币 Animation 组件
        this._coinAnimation = this.node.getComponent(Animation);
        console.log('[CoinController] Animation 组件:', this._coinAnimation ? '已找到' : '未找到');
        
        // 如果找到 Animation 组件，打印详细信息
        if (this._coinAnimation) {
            console.log('[CoinController] Animation clips:', this._coinAnimation.clips);
            console.log('[CoinController] Animation defaultClip:', this._coinAnimation.defaultClip?.name);
            console.log('[CoinController] Animation 当前播放状态:', this._coinAnimation.isPlaying);
        }

        // 获取游戏管理器实例
        this._gameManager = GameManager.getInstance();

        // 获取 VFX 管理器实例
        this._vfxManager = this._gameManager.getVfxManager();

        // 注册翻转事件回调
        this._gameManager.onFlip(this.onFlipResult.bind(this));

        // 绑定硬币点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onCoinClick, this);

        // 监听动画结束事件
        if (this._coinAnimation) {
            this._coinAnimation.on(Animation.EventType.FINISHED, this.onFlipAnimationFinished, this);
            console.log('[CoinController] 已注册动画结束事件监听器');
        }

        console.log('[CoinController] === onLoad 完成 ===');
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

        // 停止动画
        if (this._coinAnimation) {
            this._coinAnimation.off(Animation.EventType.FINISHED, this.onFlipAnimationFinished, this);
        }

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
     * 使用 Animation 组件播放翻转动画
     */
    private playFlipAnimation(): void {
        console.log('[CoinController] ================================');
        console.log('[CoinController] === playFlipAnimation 被调用 ===');
        console.log('[CoinController] ================================');

        // 重置防重入标志
        this._flipFinishedHandled = false;
        
        this._isAnimating = true;
        console.log('[CoinController] _isAnimating 设置为 true');

        // 禁用除设置按钮外的所有按钮并置灰
        console.log('[CoinController] 调用 disableAllButtons()');
        this.disableAllButtons();

        if (this._coinAnimation) {
            console.log('[CoinController] Animation 组件存在，准备播放动画');
            console.log('[CoinController] 要播放的动画名称:', this.FLIP_ANIM_NAME);
            console.log('[CoinController] Animation 组件当前的 clips:', this._coinAnimation.clips.map(c => c.name));
            console.log('[CoinController] Animation 当前是否正在播放:', this._coinAnimation.isPlaying);
            console.log('[CoinController] 设置的目标时长:', this.flipDuration);

            // 先停止当前动画，避免状态冲突
            try {
                this._coinAnimation.stop();
                console.log('[CoinController] 已停止之前的动画');
            } catch (e) {
                console.warn('[CoinController] 停止动画时出错:', e);
            }

            // 尝试播放动画
            try {
                this._coinAnimation.play(this.FLIP_ANIM_NAME);
                
                // 获取 AnimationState 并调整播放速度
                const animState = this._coinAnimation.getState(this.FLIP_ANIM_NAME);
                if (animState) {
                    const originalDuration = animState.duration;
                    console.log('[CoinController] 动画原始时长:', originalDuration);
                    
                    // 计算播放速度：原始时长 / 目标时长
                    const speed = originalDuration / this.flipDuration;
                    animState.speed = speed;
                    console.log('[CoinController] 设置播放速度:', speed);
                    console.log('[CoinController] 预期播放时长:', originalDuration / speed);
                }
                
                console.log('[CoinController] 动画播放方法已调用');
                console.log('[CoinController] 动画播放后 isPlaying 状态:', this._coinAnimation.isPlaying);
                console.log('[CoinController] 动画播放后 currentClip 名称:', this._coinAnimation.currentClip?.name || 'null');
            } catch (error) {
                console.error('[CoinController] 播放动画时发生异常:', error);
                console.error('[CoinController] 动画播放失败，执行状态恢复');
                this.recoverAnimationState();
            }
        } else {
            console.warn('[CoinController] === Animation 组件未找到，使用备用方案 ===');

            // 备用方案：使用 tween 旋转
            const duration = this._gameManager.getAnimDuration();
            console.log('[CoinController] 使用 tween 旋转，持续时间:', duration);
            tween(this.node)
                .by(duration, { eulerAngles: new Vec3(0, 1800, 0) })
                .call(() => {
                    this.onFlipAnimationFinished();
                })
                .start();
        }
    }

    /**
     * 翻转动画结束回调
     * 注意：此方法可能被多次触发，需要防重入
     */
    private _flipFinishedHandled: boolean = false;

    private onFlipAnimationFinished(): void {
        // 防止重复触发
        if (this._flipFinishedHandled) {
            console.log('[CoinController] onFlipAnimationFinished 已处理过，跳过');
            return;
        }
        this._flipFinishedHandled = true;

        console.log('[CoinController] ================================');
        console.log('[CoinController] === onFlipAnimationFinished 被调用 ===');
        console.log('[CoinController] ================================');
        console.log('[CoinController] 翻转动画结束，调用 flipCoin');

        // 调用 GameManager 处理逻辑
        const result = this._gameManager.flipCoin();

        // 如果 flipCoin 返回 null（正在翻转中），也要恢复状态
        if (!result) {
            console.warn('[CoinController] flipCoin 返回 null，手动恢复动画状态');
            this.recoverAnimationState();
        }
    }

    /**
     * 恢复动画状态（用于异常情况下的状态恢复）
     */
    private recoverAnimationState(): void {
        console.log('[CoinController] 执行状态恢复');
        
        // 恢复所有按钮
        this.enableAllButtons();

        // 重置动画状态
        this._isAnimating = false;
        this._flipFinishedHandled = false;
    }

    /**
     * 处理翻转结果（由 GameManager 回调触发）
     * @param result 翻转结果
     */
    private onFlipResult(result: FlipResult): void {
        console.log('[CoinController] ================================');
        console.log('[CoinController] === onFlipResult 被调用 ===');
        console.log('[CoinController] ================================');
        console.log('[CoinController] 翻转结果:', JSON.stringify(result));
        
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

        // 恢复所有按钮
        console.log('[CoinController] 调用 enableAllButtons() 恢复按钮');
        this.enableAllButtons();

        this._isAnimating = false;
        console.log('[CoinController] _isAnimating 设置为 false');
    }

    /**
     * 禁用所有按钮（除设置按钮外）并置灰
     */
    private disableAllButtons(): void {
        this._buttonStates = [];

        // 从 Canvas 开始查找所有按钮
        const canvas = this.node.scene.getChildByName('Canvas');
        if (!canvas) return;

        this.collectAndDisableButtons(canvas);
    }

    /**
     * 递归收集并禁用按钮
     */
    private collectAndDisableButtons(node: Node): void {
        // 跳过设置按钮
        if (node.name === 'button_setting' || node.name === 'close') {
            return;
        }

        // 检查是否有 Button 组件
        const button = node.getComponent(Button);
        if (button) {
            const sprite = node.getComponent(Sprite);
            const originalColor = sprite ? sprite.color.clone() : new Color(255, 255, 255, 255);

            // 缓存原始状态
            this._buttonStates.push({
                node: node,
                interactable: button.interactable,
                color: originalColor
            });

            // 禁用按钮并置灰
            button.interactable = false;
            if (sprite) {
                sprite.color = this.GRAY_COLOR;
            }
        }

        // 递归处理子节点
        node.children.forEach(child => {
            this.collectAndDisableButtons(child);
        });
    }

    /**
     * 恢复所有按钮
     */
    private enableAllButtons(): void {
        this._buttonStates.forEach(state => {
            const button = state.node.getComponent(Button);
            if (button) {
                button.interactable = state.interactable;
            }

            const sprite = state.node.getComponent(Sprite);
            if (sprite) {
                sprite.color = state.color;
            }
        });

        this._buttonStates = [];
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
