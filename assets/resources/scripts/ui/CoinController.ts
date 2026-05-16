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
 * - critical 节点（暴击计数）
 * - addScore 节点（飘字，+100,000,000）
 * - streak 节点（连击显示）
 * - autoing 节点（自动中状态）
 * - pity 节点（保底特效）
 * - config 节点（挂载 DebugConfig 脚本）
 * 
 * 使用方式：
 * 将此脚本挂载到 Coin 节点上即可
 */

import { _decorator, Component, Node, Label, Sprite, SpriteFrame, Tween, tween, Vec3, UIOpacity, Color, Button, Animation, resources } from 'cc';
import { GameManager, FlipResult } from '../core/GameManager';
import { VfxManager } from './VfxManager';
import { DebugConfig } from './DebugConfig';

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
     * 连击 num Label 节点
     */
    @property({ type: Label, displayName: '连击num', tooltip: 'streak/num 节点的 Label 组件' })
    streakNumLabel: Label | null = null;

    /**
     * 连击 bonus Label 节点
     */
    @property({ type: Label, displayName: '连击bonus', tooltip: 'streak/bonus 节点的 Label 组件' })
    streakBonusLabel: Label | null = null;

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
     * DebugConfig 节点引用（用于获取调试翻转时长）
     */
    @property({ type: Node, displayName: 'DebugConfig节点', tooltip: 'config 节点（挂载 DebugConfig 脚本）' })
    debugConfigNode: Node | null = null;

    /**
     * 从 GameManager 获取翻转动画时长（基于 speed 升级项）
     */
    private getFlipDuration(): number {
        const duration = this._gameManager?.getAnimDuration() ?? 1.5;
        return duration > 0 ? duration : 1.5;
    }

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
     * 缓存翻转回调引用，确保 onDestroy 能正确注销监听。
     */
    private _boundOnFlipResult: (result: FlipResult) => void = this.onFlipResult.bind(this);

    /**
     * 是否正在播放动画中
     */
    private _isAnimating: boolean = false;

    /**
     * 预加载的正面精灵帧缓存
     */
    private _zhengmianFrames: Array<SpriteFrame | null> = [];

    /**
     * 正面帧切换定时器句柄
     */
    private _zhengmianTimerHandle: number = -1;

    /**
     * 正面帧切换启动定时器句柄
     */
    private _zhengmianStartTimerHandle: number = -1;

    /**
     * 当前正面帧索引
     */
    private _zhengmianFrameIndex: number = 0;

    /**
     * 正面帧切换间隔（秒）
     */
    private _zhengmianFrameInterval: number = 0;

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
            console.log('[CoinController] Animation 当前播放状态:', this._coinAnimation.getState(this.FLIP_ANIM_NAME)?.isPlaying ?? false);
        }

        // 获取游戏管理器实例
        this._gameManager = GameManager.getInstance();

        // 获取 VFX 管理器实例
        this._vfxManager = this._gameManager.getVfxManager();

        // 注册翻转事件回调
        this._gameManager.onFlip(this._boundOnFlipResult);

        // 绑定硬币点击事件
        this.node.on(Node.EventType.TOUCH_END, this.onCoinClick, this);

        // 监听动画结束事件
        if (this._coinAnimation) {
            this._coinAnimation.on(Animation.EventType.FINISHED, this.onFlipAnimationFinished, this);
            console.log('[CoinController] 已注册动画结束事件监听器');
        }

        console.log('[CoinController] === onLoad 完成 ===');

        // 预加载正面精灵帧
        this.preloadZhengmianFrames();
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
        // 停止定时器
        this.unscheduleZhengmianTimer();

        // 停止所有针对此节点的 Tween 动画
        Tween.stopAllByTarget(this.node);

        // 停止动画
        if (this._coinAnimation) {
            this._coinAnimation.off(Animation.EventType.FINISHED, this.onFlipAnimationFinished, this);
        }

        // 移除事件监听
        if (this._gameManager) {
            this._gameManager.offFlip(this._boundOnFlipResult);
        }
        this.node.off(Node.EventType.TOUCH_END, this.onCoinClick, this);
    }

    /**
     * 硬币点击事件处理
     */
    private onCoinClick(): void {
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

        // 准备翻转结果（不修改游戏状态）
        const pendingResult = this._gameManager.prepareFlip();
        console.log('[CoinController] 预定的翻转结果:', pendingResult?.isHead ? '正面' : '背面');

        // 触发翻转动画（传入预定结果）
        this.playFlipAnimation(pendingResult);
    }

    /**
     * 播放抛硬币动画
     * 使用 Animation 组件播放翻转动画
     * @param pendingResult 预定的翻转结果，用于动态替换精灵帧
     */
    private playFlipAnimation(pendingResult: FlipResult | null): void {
        console.log('[CoinController] === playFlipAnimation ===');
        console.log('[CoinController] 结果:', pendingResult?.isHead ? '正面' : '背面');

        this._flipFinishedHandled = false;
        this._isAnimating = true;
        this.disableAllButtons();

        this.unscheduleZhengmianTimer();

        if (this._coinAnimation) {
            this._coinAnimation.stop();

            if (pendingResult?.isHead) {
                this.scheduleZhengmianSwitch();
            }

            this._coinAnimation.play(this.FLIP_ANIM_NAME);

            const animState = this._coinAnimation.getState(this.FLIP_ANIM_NAME);
            if (animState) {
                const speed = animState.duration / this.getFlipDuration();
                animState.speed = speed;
            }

            console.log('[CoinController] 动画已开始');
        } else {
            const duration = this._gameManager.getAnimDuration();
            tween(this.node)
                .by(duration, { eulerAngles: new Vec3(0, 1800, 0) })
                .call(() => this.onFlipAnimationFinished())
                .start();
        }
    }

    /**
     * 预加载正面60帧精灵
     */
    private preloadZhengmianFrames(): void {
        const paths: string[] = [];
        for (let i = 1; i <= 60; i++) {
            const frameNo = i < 10 ? `00${i}` : i < 100 ? `0${i}` : `${i}`;
            paths.push(`images/正面/processed_frame_${frameNo}/spriteFrame`);
        }

        let loaded = 0;
        this._zhengmianFrames = new Array(paths.length).fill(null);

        paths.forEach((path, index) => {
            resources.load(path, SpriteFrame, (err, sf) => {
                loaded++;
                if (err) {
                    console.warn('[CoinController] 预加载正面帧失败:', path);
                } else {
                    this._zhengmianFrames[index] = sf;
                }
                if (loaded === paths.length) {
                    console.log('[CoinController] 正面帧预加载完成:', this._zhengmianFrames.filter(Boolean).length, '/ 60');
                }
            });
        });
    }

    /**
     * 安排正面帧切换定时器
     */
    private scheduleZhengmianSwitch(): void {
        const clip = this._coinAnimation?.defaultClip;
        if (!clip) return;

        let totalKeyframes = 0;
        let keyframeTimes: number[] = [];

        for (const track of clip.tracks) {
            const channel = (track as any)._channel;
            if (channel?._curve) {
                const values = channel._curve._values;
                const times = channel._curve._times;
                if (values && Array.isArray(values) && times && Array.isArray(times)) {
                    totalKeyframes = values.length;
                    keyframeTimes = times;
                    break;
                }
            }
        }

        if (totalKeyframes === 0) return;

        const last60Start = Math.max(0, totalKeyframes - 60);
        const debugDuration = this.getFlipDuration();
        const speed = debugDuration > 0
            ? (this._coinAnimation.getState(this.FLIP_ANIM_NAME)?.duration || 1.37) / debugDuration
            : 1;
        const startTime = keyframeTimes[last60Start] / speed;

        this._zhengmianFrameInterval = (totalKeyframes > last60Start + 1)
            ? (keyframeTimes[last60Start + 1] - keyframeTimes[last60Start]) / speed
            : 0.01;

        this._zhengmianStartTimerHandle = window.setTimeout(() => {
            this._zhengmianStartTimerHandle = -1;
            this.startZhengmianFrameSwap();
        }, Math.max(0, startTime * 1000));
        console.log('[CoinController] 正面帧切换将在', startTime.toFixed(3), '秒后开始');
    }

    /**
     * 开始逐帧切换正面精灵帧
     */
    private startZhengmianFrameSwap(): void {
        if (!this._isAnimating) return;

        this._zhengmianFrameIndex = 0;
        console.log('[CoinController] 开始正面帧切换');

        const swapFrame = () => {
            if (!this._isAnimating || !this._coinSprite) {
                this.unscheduleZhengmianTimer();
                return;
            }

            if (this._zhengmianFrameIndex < this._zhengmianFrames.length) {
                const frame = this._zhengmianFrames[this._zhengmianFrameIndex];
                if (frame) {
                    this._coinSprite.spriteFrame = frame;
                }
                this._zhengmianFrameIndex++;

                if (this._zhengmianFrameIndex >= this._zhengmianFrames.length) {
                    this.unscheduleZhengmianTimer();
                }
            }
        };

        swapFrame();
        this.unscheduleZhengmianTimer();
        this._zhengmianTimerHandle = setInterval(swapFrame, this._zhengmianFrameInterval * 1000);
    }

    /**
     * 停止正面帧切换定时器
     */
    private unscheduleZhengmianTimer(): void {
        if (this._zhengmianStartTimerHandle >= 0) {
            clearTimeout(this._zhengmianStartTimerHandle);
            this._zhengmianStartTimerHandle = -1;
        }

        if (this._zhengmianTimerHandle >= 0) {
            clearInterval(this._zhengmianTimerHandle);
            this._zhengmianTimerHandle = -1;
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

        this.unscheduleZhengmianTimer();

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
            const critBonus = this._gameManager.getUpgradeValue('criticalBonus');
            this.showCriticalEffect(critBonus);
        }

        // 更新连击显示
        const streakBonusValue = result.streak > 0 ? this._gameManager.getUpgradeValue('streakBonus') * result.streak : 0;
        this.updateStreakDisplay(result.streak, streakBonusValue);

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
     * @param critBonus 暴击加成
     */
    private showCriticalEffect(critBonus: number): void {
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
     * @param streakBonus 连击加成
     */
    private updateStreakDisplay(streak: number, streakBonus: number): void {
        this._currentStreakDisplay = streak;

        if (!this.streakNode) return;

        // 更新 num（连击数）
        if (this.streakNumLabel) {
            this.streakNumLabel.string = `x${streak}`;
        }

        // 更新 bonus（连击加成）
        if (this.streakBonusLabel) {
            this.streakBonusLabel.string = `+${this.formatNumber(streakBonus)}`;
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

        // 暴击计数 > 0 时显示
        if (this.criticalNode) {
            this.criticalNode.active = this._critCountDisplay > 0;
        }
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
