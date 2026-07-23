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

import { _decorator, Component, Animation, AnimationClip } from 'cc';

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

    private _isLooping: boolean = false;

    private _hideTimer: number | null = null;

    private onAnimationFinished(): void {
        this.stop();
    }

    private clearFinishedListener(): void {
        this.animation?.node.off(Animation.EventType.FINISHED, this.onAnimationFinished, this);
    }

    /**
     * 开始播放（非循环模式）
     */
    play(duration: number = 0): void {
        if (!this.animation) {
            console.warn('[VfxController] play 失败: animation 为空');
            return;
        }

        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        this.clearFinishedListener();

        this.node.active = true;
        this._isPlaying = true;
        this._isLooping = false;

        const clip = this.animation.defaultClip ?? this.animation.clips[0] ?? null;
        if (!clip) {
            console.warn('[VfxController] play: 没有可用的动画剪辑');
            this.stop();
            return;
        }
        clip.wrapMode = AnimationClip.WrapMode.Normal;

        // 停止已有播放并重置时间，确保每次都能从头开始播放
        this.animation.stop();
        const state = this.animation.getState(clip.name);
        if (state) {
            state.wrapMode = AnimationClip.WrapMode.Normal;
            state.time = 0;
        }
        this.animation.play(clip.name);

        const hideTime = duration > 0 ? duration : this.defaultDuration;

        if (hideTime > 0) {
            this._hideTimer = window.setTimeout(() => {
                this.stop();
            }, hideTime * 1000);
        } else {
            this.animation.node.once(Animation.EventType.FINISHED, this.onAnimationFinished, this);
        }
    }

    /**
     * 开始循环播放（如果已在循环中则不重启动画）
     */
    playLooping(): void {
        console.log(`[VfxController] === playLooping 开始 ===`);
        console.log(`[VfxController] node=${this.node?.name}`);
        console.log(`[VfxController] node.active=${this.node?.active}`);
        console.log(`[VfxController] animation=${!!this.animation}`);
        console.log(`[VfxController] _isLooping=${this._isLooping}`);
        console.log(`[VfxController] _isPlaying=${this._isPlaying}`);

        if (!this.animation) {
            console.warn('[VfxController] playLooping 失败: animation 为空');
            return;
        }

        if (this._isLooping) {
            console.log('[VfxController] playLooping: 已在循环中，跳过重启');
            return;
        }

        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        this.clearFinishedListener();

        const clipName = this.animation.defaultClip?.name ?? (this.animation.clips.length > 0 ? this.animation.clips[0].name : '');
        console.log(`[VfxController] defaultClip=${this.animation.defaultClip?.name}`);
        console.log(`[VfxController] clips.length=${this.animation.clips.length}`);
        console.log(`[VfxController] clips=[${this.animation.clips.map(c => c.name).join(', ')}]`);
        console.log(`[VfxController] clipName='${clipName}'`);

        if (!clipName) {
            console.warn('[VfxController] playLooping: 无可用动画');
            return;
        }

        // 先激活节点
        this.node.active = true;
        this._isPlaying = true;
        this._isLooping = true;

        // 检查父节点状态
        let parentActive = true;
        let p = this.node.parent;
        const parentChain: string[] = [];
        while (p) {
            parentChain.push(`${p.name}(active=${p.active})`);
            if (!p.active) parentActive = false;
            p = p.parent;
        }
        console.log(`[VfxController] 父节点链: ${parentChain.join(' -> ')}`);
        console.log(`[VfxController] 节点激活后 self.active=${this.node.active}, 可渲染=${this.node.activeInHierarchy}`);

        // 设置循环模式到 clip
        for (const clip of this.animation.clips) {
            clip.wrapMode = AnimationClip.WrapMode.Loop;
        }

        console.log(`[VfxController] 设置 scheduleOnce 延迟播放...`);

        // 延迟一帧播放，确保 Animation 状态机完成初始化
        this.scheduleOnce(() => {
            console.log(`[VfxController] === scheduleOnce 回调执行 ===`);
            console.log(`[VfxController] callback: animation=${!!this.animation}, _isLooping=${this._isLooping}`);

            if (!this.animation || !this._isLooping) {
                console.warn('[VfxController] callback: animation 为空或 _isLooping=false，跳过');
                return;
            }

            const clipName = this.animation.defaultClip?.name ?? this.animation.clips[0].name;
            console.log(`[VfxController] callback: clipName='${clipName}'`);
            console.log(`[VfxController] callback: node.active=${this.node.active}, activeInHierarchy=${this.node.activeInHierarchy}`);

            this.animation.stop();
            console.log(`[VfxController] callback: stop() 已调用`);

            // 获取或创建动画状态
            let state = this.animation.getState(clipName);
            console.log(`[VfxController] callback: getState('${clipName}')=${state ? '存在' : 'null'}`);

            if (!state) {
                const clip = this.animation.defaultClip ?? this.animation.clips[0];
                state = this.animation.createState(clip, clipName);
                console.log(`[VfxController] callback: 创建了 state '${clipName}'`);
            }

            console.log(`[VfxController] callback: state.wrapMode=${state.wrapMode}, state.time=${state.time}, state.duration=${state.duration}`);

            state.wrapMode = AnimationClip.WrapMode.Loop;
            state.time = 0;

            this.animation.play(clipName);
            console.log(`[VfxController] callback: play() 已调用`);

            // 检查播放后状态
            const checkState = this.animation.getState(clipName);
            console.log(`[VfxController] callback: play后 state.isPlaying=${checkState?.isPlaying}, state.time=${checkState?.time}`);
            console.log(`[VfxController] === playLooping 结束 ===`);
        }, 0);
    }

    /**
     * 停止循环播放（不停止动画，只是标记为非循环）
     */
    stopLooping(): void {
        if (!this.animation) return;

        this.clearFinishedListener();

        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        this.animation.stop();
        this.node.active = false;
        this._isPlaying = false;
        this._isLooping = false;
    }

    /**
     * 停止 VFX 特效
     */
    stop(): void {
        if (!this.animation) return;

        this.clearFinishedListener();

        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }

        this.animation.stop();
        this.node.active = false;
        this._isPlaying = false;
        this._isLooping = false;
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

    onLoad() {
        if (!this.animation) {
            this.animation = this.node.getComponent(Animation);
        }

        if (this.animation && this.animation.defaultClip) {
            console.log(`[VfxController] 初始化完成，动画: ${this.animation.defaultClip.name}`);
        } else {
            console.warn('[VfxController] 未找到 Animation 组件或默认动画剪辑');
        }
    }

    onDestroy() {
        this.clearFinishedListener();
        if (this._hideTimer !== null) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
    }
}
