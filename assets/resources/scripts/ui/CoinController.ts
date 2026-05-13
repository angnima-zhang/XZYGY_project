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

import { _decorator, Component, Node, Label, Sprite, SpriteFrame, Tween, tween, Vec3, UIOpacity, Color, Button, Animation, resources, SpriteFrame as CCSpriteFrame } from 'cc';
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

/**
 * 动画帧数据
 */
interface AnimFrameData {
    frame: number;
    spriteFrame: string;
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
                // 如果结果是正面，替换最后60帧的精灵帧
                if (pendingResult?.isHead && this._coinSprite) {
                    console.log('[CoinController] 结果为正面，将替换最后60帧的精灵帧');
                    this.replaceLast60FramesWithZhengmian(pendingResult.isCrit);
                }

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
     * 替换动画最后60帧的精灵帧为正面图片
     * @param isCrit 是否暴击
     */
    private async replaceLast60FramesWithZhengmian(isCrit: boolean): Promise<void> {
        if (!this._coinSprite) return;

        console.log('[CoinController] 开始替换最后60帧的精灵帧');

        // 正面图片的路径映射（从 processed_frame_001 到 processed_frame_060）
        const zhengmianFrameUuids: string[] = [
            '6ac09bff-f685-436d-9049-35fb8271bf21', // processed_frame_001
            '82d15a55-ec4f-42be-a19f-38a2c0066463', // processed_frame_002
            'a26d5157-1cfb-4118-aba0-816e6080b7ed', // processed_frame_003
            'b25a5126-6c12-4ec3-a81e-1d3b4131ecd7', // processed_frame_004
            '746a2a6c-e02c-46b1-9041-9e2814a873ac', // processed_frame_005
            'c5b93cca-11ca-4d0a-8c5a-a677dc68378f', // processed_frame_006
            '2f799a79-5d84-460c-ae8b-c0ce60269686', // processed_frame_007
            '9a900b5f-09de-43b0-8d35-9619c7bb8c8b', // processed_frame_008
            '859fbe84-d6f5-4251-9c46-dde7ac1b8889', // processed_frame_009
            '08d37773-7ec7-4724-9a9d-36b0f1553dfe', // processed_frame_010
            '2fed28b0-814f-4d15-9317-30d1229311de', // processed_frame_011
            'c664426a-e731-4b8a-95fa-403a3e67be85', // processed_frame_012
            'f26267dc-2405-4b4d-a165-a8a999481982', // processed_frame_013
            '976ea28f-a91a-4974-960b-78f5c0c38b7c', // processed_frame_014
            'ef6d4bc2-882b-4291-88be-cc7809f5705f', // processed_frame_015
            '39f8977a-239d-4a2b-9d6d-66177ebc8cdb', // processed_frame_016
            'd8fdcaa4-c196-4022-a44a-843def3b168f', // processed_frame_017
            '5706c310-6881-4ebb-8792-c887464685d0', // processed_frame_018
            'f467944c-ef3a-431e-8063-f9ae5e0d0259', // processed_frame_019
            'e13beb9b-8735-410f-abe2-2673c4a739a9', // processed_frame_020
            '79784b08-8383-4277-ae8e-7849a04a486d', // processed_frame_021
            'c42b3e36-64ed-4d7f-a4cd-2a293d56d95c', // processed_frame_022
            '04b44477-2d13-4afd-9357-6bd16ce314ed', // processed_frame_023
            '796c85b5-b320-4bc0-b78b-cf290a083a37', // processed_frame_024
            'e7472c08-2020-428a-999c-8c9d8f76c070', // processed_frame_025
            'd97c01f8-03bd-4e98-b2e5-a020daf8abf8', // processed_frame_026
            '55fb52e1-245a-4303-a0f4-203286c4fd25', // processed_frame_027
            'adec3de7-bd5a-405e-a6fd-6816fa8c605f', // processed_frame_028
            'f5d931d5-7b29-4677-9102-b6e218710b1c', // processed_frame_029
            '003aedd9-4084-43db-afe0-64714c525321', // processed_frame_030
            'e50f5b98-0ea7-4c6e-91f8-be40885b9d9e', // processed_frame_031
            '1a5f9499-7291-41f5-8c5d-ae5abd3c7d35', // processed_frame_032
            '8c20c654-1876-44ff-96ad-9b557506cb84', // processed_frame_033
            '13fe3a1a-7ed1-4f2b-b36f-62b45bb5f79b', // processed_frame_034
            'ca640e96-991e-4bf0-a82e-5049f752af57', // processed_frame_035
            '7d68a878-d169-4cf9-8d9b-82c377789d87', // processed_frame_036
            '9b1f6486-6780-475a-99c9-0ad7d22b2b8b', // processed_frame_037
            '6abc8ac2-0bc6-4e7a-9094-88aca7b1ffd9', // processed_frame_038
            '1a1a8030-c4b1-42bb-a7e9-b10ab8448a8e', // processed_frame_039
            '72d0a692-06ac-49f2-aeb0-6a6ea7bf743e', // processed_frame_040
            'e09e1496-5eff-4bba-94bc-87ab0b2ae422', // processed_frame_041
            '33fda8d3-0399-4fd1-b877-2eb06559e325', // processed_frame_042
            'a2b6e89a-6b6a-41a2-9097-ce8d4ba075dc', // processed_frame_043
            'b9405754-ca53-4270-9c9c-c7985afd7acd', // processed_frame_044
            '4082ffa6-c8c4-469e-afa5-47af6f75c631', // processed_frame_045
            'b52175cd-0f13-4752-b869-23888ceeb62c', // processed_frame_046
            'f8185677-bfc6-485f-aa88-bbe904413445', // processed_frame_047
            'e5168dcf-afd9-48b9-a101-364211c6fbd0', // processed_frame_048
            '13cc9721-05b6-46c5-9356-af20caa8db0b', // processed_frame_049
            '5ff78388-459f-4e11-9c81-6c3962849a56', // processed_frame_050
            'cd4ab9e0-59c3-4486-8a55-002a0c14dc3a', // processed_frame_051
            'da525fa4-610f-4d7c-8bae-17a37c71311c', // processed_frame_052
            '1172a4fb-881c-4b30-8b2f-9581ab90db90', // processed_frame_053
            'cffd6273-4f56-43e8-bcab-9e9026ff9a9d', // processed_frame_054
            '226b30e0-480f-448f-9cd3-92b1d315b6e4', // processed_frame_055
            'ea5ed53f-630c-4cb9-b17e-064a7a7bcfca', // processed_frame_056
            'ff2513d4-5a34-4344-95e3-6b802f34d368', // processed_frame_057
            'e223f24c-245a-44bd-9b45-aa841358a5b8', // processed_frame_058
            '8c95b212-e287-460c-a4de-88e09f3afe58', // processed_frame_059
            '34e42390-d08f-4283-825a-9e5fc28e1348', // processed_frame_060
        ];

        try {
            // 获取动画剪辑
            const clip = this._coinAnimation.getClip(this.FLIP_ANIM_NAME);
            if (!clip) {
                console.warn('[CoinController] 找不到动画剪辑:', this.FLIP_ANIM_NAME);
                return;
            }

            // 获取动画总帧数（通过 spriteFrame 关键帧数量计算）
            const spriteTracks = clip.findTrack('spriteFrame', 'SpriteComponent');
            if (!spriteTracks || spriteTracks.length === 0) {
                console.warn('[CoinController] 找不到 spriteFrame 轨道');
                return;
            }

            const track = spriteTracks[0];
            const keyframes = track.keyframes;
            console.log('[CoinController] 动画总关键帧数:', keyframes.length);

            // 计算最后60帧的起始索引
            const last60StartIndex = Math.max(0, keyframes.length - 60);
            console.log('[CoinController] 最后60帧起始索引:', last60StartIndex);

            // 替换最后60帧的 spriteFrame
            for (let i = last60StartIndex; i < keyframes.length; i++) {
                const frameIndex = i - last60StartIndex; // 0-59
                const uuid = zhengmianFrameUuids[frameIndex] + '@f9941';
                
                try {
                    const spriteFrame = await this.loadSpriteFrame(uuid);
                    if (spriteFrame) {
                        keyframes[i].value = spriteFrame;
                    }
                } catch (e) {
                    console.warn('[CoinController] 加载精灵帧失败:', uuid, e);
                }
            }

            console.log('[CoinController] 成功替换', keyframes.length - last60StartIndex, '个关键帧');
        } catch (error) {
            console.error('[CoinController] 替换关键帧时出错:', error);
        }
    }

    /**
     * 通过 UUID 加载 SpriteFrame
     */
    private loadSpriteFrame(uuid: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            resources.load(uuid.replace(/@f9941$/, ''), SpriteFrame, (err, spriteFrame) => {
                if (err) {
                    console.warn('[CoinController] 加载 SpriteFrame 失败:', uuid, err);
                    resolve(null);
                } else {
                    resolve(spriteFrame);
                }
            });
        });
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
