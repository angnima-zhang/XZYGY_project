/**
 * SettingPopupCtrl - 设置弹窗控制器
 * 
 * 功能说明：
 * - 管理设置弹窗的显示/隐藏
 * - 控制背景音乐开关（on/off 节点切换显示）
 * - 控制音效开关（on/off 节点切换显示）
 * - 控制震动开关（on/off 节点切换显示）
 * - 设置数据持久化（使用 localStorage）
 * 
 * 场景节点对应：
 * - MainPage/SettingPopup（挂载此脚本）
 *   ├── mask: 遮罩层（点击不关闭）
 *   ├── bg: 背景
 *   ├── title: 标题栏
 *   │   ├── Label: "设置" 文字
 *   │   └── icon: 图标
 *   ├── music: 音乐开关
 *   │   ├── on: 开启状态图标（开启时显示）
 *   │   ├── off: 关闭状态图标（开启时隐藏）
 *   │   └── Label: "音乐" 文字
 *   ├── sfx: 音效开关
 *   │   ├── on-001: 开启状态图标
 *   │   ├── off-001: 关闭状态图标
 *   │   └── Label: "音效" 文字
 *   ├── vib: 震动开关
 *   │   ├── 像素-声音开: 开启状态图标
 *   │   ├── on: 开启状态图标
 *   │   ├── off: 关闭状态图标
 *   │   └── Label: "震动" 文字
 *   └── close: 关闭按钮
 *       └── Label: "关闭" 文字
 * 
 * 使用方式：
 * 将此脚本挂载到 MainPage/SettingPopup 根节点上，配置各节点引用
 */

import { _decorator, Component, Node } from 'cc';

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
    @property({ type: Node, displayName: '关闭按钮', tooltip: 'SettingPopup/close 节点' })
    closeBtnNode: Node | null = null;

    /**
     * 音乐开关节点
     */
    @property({ type: Node, displayName: '音乐开关', tooltip: 'SettingPopup/music 节点' })
    musicToggleNode: Node | null = null;

    /**
     * 音效开关节点
     */
    @property({ type: Node, displayName: '音效开关', tooltip: 'SettingPopup/sfx 节点' })
    soundToggleNode: Node | null = null;

    /**
     * 震动开关节点
     */
    @property({ type: Node, displayName: '震动开关', tooltip: 'SettingPopup/vib 节点' })
    vibrateToggleNode: Node | null = null;

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
     * 组件启用时调用
     */
    onEnable() {
        // 编辑器预览时节点可能未配置，跳过刷新
        if (!this.musicToggleNode && !this.soundToggleNode && !this.vibrateToggleNode) return;
        this.refreshUI();
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
     */
    show(): void {
        if (this._isShowing) return;

        this._isShowing = true;
        this.node.active = true;
        this.refreshUI();
    }

    /**
     * 隐藏设置弹窗
     */
    hide(): void {
        if (!this._isShowing) return;

        this._isShowing = false;
        this.node.active = false;
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
     * 刷新所有 UI 显示（切换 on/off 节点的显示/隐藏）
     */
    private refreshUI(): void {
        // 更新音乐开关状态（切换 on/off 节点）
        if (this.musicToggleNode) {
            const onNode = this.musicToggleNode.getChildByName('on');
            const offNode = this.musicToggleNode.getChildByName('off');
            if (onNode) onNode.active = this._settings.musicEnabled;
            if (offNode) offNode.active = !this._settings.musicEnabled;
        }

        // 更新音效开关状态
        if (this.soundToggleNode) {
            const onNode = this.soundToggleNode.getChildByName('on-001');
            const offNode = this.soundToggleNode.getChildByName('off-001');
            if (onNode) onNode.active = this._settings.soundEnabled;
            if (offNode) offNode.active = !this._settings.soundEnabled;
        }

        // 更新震动开关状态
        if (this.vibrateToggleNode) {
            const onNode = this.vibrateToggleNode.getChildByName('on');
            const offNode = this.vibrateToggleNode.getChildByName('off');
            if (onNode) onNode.active = this._settings.vibrateEnabled;
            if (offNode) offNode.active = !this._settings.vibrateEnabled;
        }
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
     */
    isMusicEnabled(): boolean {
        return this._settings.musicEnabled;
    }

    /**
     * 获取音效是否开启
     */
    isSoundEnabled(): boolean {
        return this._settings.soundEnabled;
    }

    /**
     * 获取震动是否开启
     */
    isVibrateEnabled(): boolean {
        return this._settings.vibrateEnabled;
    }
}
