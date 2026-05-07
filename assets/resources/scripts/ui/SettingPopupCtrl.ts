/**
 * SettingPopupCtrl - 设置弹窗控制器
 * 
 * 功能说明：
 * - 管理设置弹窗的显示/隐藏
 * - 控制背景音乐开关
 * - 控制音效开关
 * - 控制震动开关
 * - 设置数据持久化（使用 localStorage）
 * 
 * 场景节点对应：
 * - SettingPopup 根节点
 *   ├── bg: 背景
 *   ├── btn_close: 关闭按钮
 *   ├── toggle_music: 音乐开关（包含 Label 显示开关状态）
 *   ├── toggle_sound: 音效开关
 *   └── toggle_vibrate: 震动开关
 * 
 * 使用方式：
 * 将此脚本挂载到 SettingPopup 根节点上，配置各节点引用
 */

import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity } from 'cc';

// 解构装饰器
const { ccclass, property } = _decorator;

/**
 * 设置数据接口
 */
interface SettingsData {
    /** 背景音乐是否开启 */
    musicEnabled: boolean;
    /** 音效是否开启 */
    soundEnabled: boolean;
    /** 震动是否开启 */
    vibrateEnabled: boolean;
}

@ccclass('SettingPopupCtrl')
export class SettingPopupCtrl extends Component {

    /**
     * 关闭按钮节点
     */
    @property({ type: Node, displayName: '关闭按钮', tooltip: 'btn_close 节点' })
    closeBtnNode: Node | null = null;

    /**
     * 音乐开关节点
     */
    @property({ type: Node, displayName: '音乐开关', tooltip: 'toggle_music 节点' })
    musicToggleNode: Node | null = null;

    /**
     * 音效开关节点
     */
    @property({ type: Node, displayName: '音效开关', tooltip: 'toggle_sound 节点' })
    soundToggleNode: Node | null = null;

    /**
     * 震动开关节点
     */
    @property({ type: Node, displayName: '震动开关', tooltip: 'toggle_vibrate 节点' })
    vibrateToggleNode: Node | null = null;

    /**
     * 音乐状态显示 Label
     */
    @property({ type: Label, displayName: '音乐状态', tooltip: 'toggle_music 下的状态 Label' })
    musicStatusLabel: Label | null = null;

    /**
     * 音效状态显示 Label
     */
    @property({ type: Label, displayName: '音效状态', tooltip: 'toggle_sound 下的状态 Label' })
    soundStatusLabel: Label | null = null;

    /**
     * 震动状态显示 Label
     */
    @property({ type: Label, displayName: '震动状态', tooltip: 'toggle_vibrate 下的状态 Label' })
    vibrateStatusLabel: Label | null = null;

    /**
     * 本地存储的键名
     */
    private readonly STORAGE_KEY = 'xianzheng_settings';

    /**
     * 设置数据
     */
    private _settings: SettingsData = {
        musicEnabled: true,
        soundEnabled: true,
        vibrateEnabled: true
    };

    /**
     * 是否正在显示中
     */
    private _isShowing: boolean = false;

    /**
     * 组件加载时调用
     * 初始化设置和事件监听
     */
    onLoad() {
        // 加载设置
        this.loadSettings();

        // 绑定关闭按钮事件
        if (this.closeBtnNode) {
            this.closeBtnNode.on(Node.EventType.TOUCH_END, this.onCloseClick, this);
        }

        // 绑定音乐开关事件
        if (this.musicToggleNode) {
            this.musicToggleNode.on(Node.EventType.TOUCH_END, this.onMusicToggleClick, this);
        }

        // 绑定音效开关事件
        if (this.soundToggleNode) {
            this.soundToggleNode.on(Node.EventType.TOUCH_END, this.onSoundToggleClick, this);
        }

        // 绑定震动开关事件
        if (this.vibrateToggleNode) {
            this.vibrateToggleNode.on(Node.EventType.TOUCH_END, this.onVibrateToggleClick, this);
        }

        // 初始隐藏
        this.node.active = false;

        console.log('[SettingPopupCtrl] 初始化完成');
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        if (this.closeBtnNode) {
            this.closeBtnNode.off(Node.EventType.TOUCH_END, this.onCloseClick, this);
        }
        if (this.musicToggleNode) {
            this.musicToggleNode.off(Node.EventType.TOUCH_END, this.onMusicToggleClick, this);
        }
        if (this.soundToggleNode) {
            this.soundToggleNode.off(Node.EventType.TOUCH_END, this.onSoundToggleClick, this);
        }
        if (this.vibrateToggleNode) {
            this.vibrateToggleNode.off(Node.EventType.TOUCH_END, this.onVibrateToggleClick, this);
        }
    }

    /**
     * 显示设置弹窗
     * 带有渐入动画
     */
    show(): void {
        if (this._isShowing) return;

        this._isShowing = true;
        this.node.active = true;

        // 刷新 UI 显示
        this.refreshUI();

        // 播放渐入动画
        this.playShowAnimation();
    }

    /**
     * 隐藏设置弹窗
     * 带有渐出动画
     */
    hide(): void {
        if (!this._isShowing) return;

        this._isShowing = false;

        // 播放渐出动画
        this.playHideAnimation();
    }

    /**
     * 关闭按钮点击事件处理
     */
    private onCloseClick(): void {
        this.hide();
    }

    /**
     * 音乐开关点击事件处理
     */
    private onMusicToggleClick(): void {
        this._settings.musicEnabled = !this._settings.musicEnabled;
        this.saveSettings();
        this.refreshUI();

        console.log(`[SettingPopupCtrl] 音乐: ${this._settings.musicEnabled ? '开启' : '关闭'}`);
        
        // TODO: 通知 AudioManager 更新音乐状态
    }

    /**
     * 音效开关点击事件处理
     */
    private onSoundToggleClick(): void {
        this._settings.soundEnabled = !this._settings.soundEnabled;
        this.saveSettings();
        this.refreshUI();

        console.log(`[SettingPopupCtrl] 音效: ${this._settings.soundEnabled ? '开启' : '关闭'}`);
        
        // TODO: 通知 AudioManager 更新音效状态
    }

    /**
     * 震动开关点击事件处理
     */
    private onVibrateToggleClick(): void {
        this._settings.vibrateEnabled = !this._settings.vibrateEnabled;
        this.saveSettings();
        this.refreshUI();

        console.log(`[SettingPopupCtrl] 震动: ${this._settings.vibrateEnabled ? '开启' : '关闭'}`);
    }

    /**
     * 刷新所有 UI 显示
     */
    private refreshUI(): void {
        // 更新音乐状态显示
        if (this.musicStatusLabel) {
            this.musicStatusLabel.string = this._settings.musicEnabled ? '开' : '关';
        }

        // 更新音效状态显示
        if (this.soundStatusLabel) {
            this.soundStatusLabel.string = this._settings.soundEnabled ? '开' : '关';
        }

        // 更新震动状态显示
        if (this.vibrateStatusLabel) {
            this.vibrateStatusLabel.string = this._settings.vibrateEnabled ? '开' : '关';
        }
    }

    /**
     * 播放显示动画
     * 缩放 + 淡入效果
     */
    private playShowAnimation(): void {
        // 初始状态：缩小 + 透明
        this.node.setScale(new Vec3(0.8, 0.8, 1));
        
        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = this.node.addComponent(UIOpacity);
        }
        opacity.opacity = 0;

        // 缩放动画
        tween(this.node)
            .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .start();

        // 透明度动画
        tween(opacity)
            .to(0.3, { opacity: 255 })
            .start();
    }

    /**
     * 播放隐藏动画
     * 缩放 + 淡出效果
     */
    private playHideAnimation(): void {
        let opacity = this.node.getComponent(UIOpacity);
        if (!opacity) {
            opacity = this.node.addComponent(UIOpacity);
        }

        // 缩放动画
        tween(this.node)
            .to(0.2, { scale: new Vec3(0.9, 0.9, 1) })
            .call(() => {
                this.node.active = false;
            })
            .start();

        // 透明度动画
        tween(opacity)
            .to(0.2, { opacity: 0 })
            .start();
    }

    /**
     * 保存设置到本地存储
     */
    private saveSettings(): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._settings));
        } catch (e) {
            console.error('[SettingPopupCtrl] 保存设置失败:', e);
        }
    }

    /**
     * 从本地存储加载设置
     * 如果没有存档，则使用默认设置
     */
    private loadSettings(): void {
        try {
            const saveStr = localStorage.getItem(this.STORAGE_KEY);
            if (!saveStr) {
                console.log('[SettingPopupCtrl] 未找到设置，使用默认设置');
                return;
            }
            
            this._settings = JSON.parse(saveStr);
            console.log('[SettingPopupCtrl] 设置加载成功');
        } catch (e) {
            console.error('[SettingPopupCtrl] 加载设置失败:', e);
        }
    }

    /**
     * 获取音乐是否开启
     * @returns 是否开启
     */
    isMusicEnabled(): boolean {
        return this._settings.musicEnabled;
    }

    /**
     * 获取音效是否开启
     * @returns 是否开启
     */
    isSoundEnabled(): boolean {
        return this._settings.soundEnabled;
    }

    /**
     * 获取震动是否开启
     * @returns 是否开启
     */
    isVibrateEnabled(): boolean {
        return this._settings.vibrateEnabled;
    }
}