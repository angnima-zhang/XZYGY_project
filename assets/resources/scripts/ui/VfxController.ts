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

const { ccclass, property } = _decorator;

@ccclass('VfxController')
export class VfxController extends Component {

    @property({ type: Animation, displayName: '动画组件', tooltip: 'vfx 节点上的 Animation 组件' })
    animation: Animation | null = null;

    @property({ displayName: '默认时长(秒)', tooltip: '0=播放完整动画，>0=指定时长后自动隐藏' })
    defaultDuration: number = 0;

    @property({ displayName: '循环播放', tooltip: '是否循环播放动画' })
    loop: boolean = false;

    private _isPlaying: boolean = false;

    private _hideTimer: number | null = null;

    onLoad() {
        if (!this.animation) {
            this.animation = this.node.getComponent(Animation);
        }

        if (this.animation && this.animation.defaultClip) {
            console.log(`[VfxController] 初始化完成，动画: ${this.animation.defaultClip.name}`);
        } else {
            console.warn('[VfxController] 未找到 Animation 组件或默认动画剪辑');
        }

        this.node.active = false;
    }

    onDestroy() {
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
    }

    play(duration: number = 0): void {
        if (!this.animation) {
            console.warn('[VfxController] play 失败: animation 为空');
            return;
        }

        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        this.node.active = true;
        this._isPlaying = true;

        if (this.animation.clips.length > 0) {
            this.animation.clips[0].wrapMode = this.loop ? 2 : 0;
        } else {
            console.warn('[VfxController] play: animation.clips 为空，跳过 wrapMode 设置');
        }

        this.animation.play();

        if (!this.loop) {
            const hideTime = duration > 0 ? duration : this.defaultDuration;

            if (hideTime > 0) {
                this._hideTimer = window.setTimeout(() => {
                    this.stop();
                }, hideTime * 1000);
            } else {
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