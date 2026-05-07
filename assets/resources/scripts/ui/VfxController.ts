/**
 * VfxController - 单个 VFX 特效控制器
 * 
 * 功能说明：
 * - 挂载到每个 vfx 节点上
 * - 控制 Animation 组件播放帧动画
 * - 支持单次播放、循环播放、定时隐藏
 * 
 * 场景节点对应：
 * - 每个升级项/功能节点下的 vfx 节点
 *   - pity/vfx
 *   - criticalHit/vfx
 *   - streak/vfx
 *   - autoing/vfx
 *   - addScore/vfx
 *   - bonus/vfx
 *   - critical/vfx
 *   - value/vfx
 *   - speed/vfx
 *   - auto/vfx
 *   - headProb/vfx
 *   - critRate/vfx
 *   - critBonus/vfx
 * 
 * 使用方式：
 * 将此脚本挂载到 vfx 节点上，然后通过 VfxManager 调用 play/stop 方法
 */

import { _decorator, Component, Animation } from 'cc';

// 解构装饰器
const { ccclass, property } = _decorator;

/**
 * VFX 控制器类
 */
@ccclass('VfxController')
export class VfxController extends Component {

    /**
     * Animation 组件引用
     * 用于播放帧动画
     */
    @property({ type: Animation, displayName: '动画组件', tooltip: 'vfx 节点上的 Animation 组件' })
    animation: Animation | null = null;

    /**
     * 默认播放时长（秒）
     * 0 表示播放完整动画剪辑
     */
    @property({ displayName: '默认时长(秒)', tooltip: '0=播放完整动画，>0=指定时长后自动隐藏' })
    defaultDuration: number = 0;

    /**
     * 是否循环播放
     * 用于 autoing 等需要持续显示的特效
     */
    @property({ displayName: '循环播放', tooltip: '是否循环播放动画' })
    loop: boolean = false;

    /**
     * 是否正在播放中
     */
    private _isPlaying: boolean = false;

    /**
     * 定时器 ID（用于定时隐藏）
     */
    private _hideTimer: number | null = null;

    /**
     * 组件加载时调用
     * 初始化 Animation 组件
     */
    onLoad() {
        if (!this.animation) {
            this.animation = this.node.getComponent(Animation);
        }

        if (this.animation && this.animation.defaultClip) {
            console.log(`[VfxController] 初始化完成，动画: ${this.animation.defaultClip.name}`);
        } else {
            console.warn('[VfxController] 未找到 Animation 组件或默认动画剪辑');
        }

        // 初始隐藏
        this.node.active = false;
    }

    /**
     * 组件销毁时调用
     * 清理定时器
     */
    onDestroy() {
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
    }

    /**
     * 播放 VFX 特效（单次）
     * @param duration 持续时长（秒），0 表示使用默认时长
     */
    play(duration: number = 0): void {
        if (!this.animation) return;

        // 清除之前的定时器
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        // 激活节点
        this.node.active = true;
        this._isPlaying = true;

        // 设置循环模式
        this.animation.wrapMode = this.loop ? Animation.WrapMode.Loop : Animation.WrapMode.Normal;

        // 播放动画
        this.animation.play();

        // 如果不是循环播放，且指定了时长，则定时隐藏
        if (!this.loop) {
            const hideTime = duration > 0 ? duration : this.defaultDuration;
            
            if (hideTime > 0) {
                // 指定时长后隐藏
                this._hideTimer = window.setTimeout(() => {
                    this.stop();
                }, hideTime * 1000);
            } else {
                // 监听动画播放结束事件
                const onFinished = () => {
                    this.stop();
                    this.animation?.node.off(Animation.EventType.FINISHED, onFinished);
                };
                this.animation.node.on(Animation.EventType.FINISHED, onFinished);
            }
        }
    }

    /**
     * 停止 VFX 特效
     */
    stop(): void {
        if (!this.animation) return;

        // 清除定时器
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        // 停止动画
        this.animation.stop();

        // 隐藏节点
        this.node.active = false;
        this._isPlaying = false;
    }

    /**
     * 检查是否正在播放
     * @returns 是否播放中
     */
    isPlaying(): boolean {
        return this._isPlaying;
    }

    /**
     * 暂停 VFX 特效
     */
    pause(): void {
        if (this.animation && this._isPlaying) {
            this.animation.pause();
        }
    }

    /**
     * 恢复 VFX 特效
     */
    resume(): void {
        if (this.animation && this._isPlaying) {
            this.animation.resume();
        }
    }
}