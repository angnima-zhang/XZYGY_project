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

import { _decorator, Component, Node, BlockInputEvents } from 'cc';
import { AudioManager } from '../core/AudioManager';

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
        this.loadSettings();

        if (this.closeBtnNode) {
            this.closeBtnNode.on(Node.EventType.TOUCH_END, this.onCloseClick, this);
        }

        // 音乐开关：on 和 off 都要绑定事件
        if (this.musicToggleNode) {
            const musicOnNode = this.musicToggleNode.getChildByName('on');
            const musicOffNode = this.musicToggleNode.getChildByName('off');
            if (musicOnNode) musicOnNode.on(Node.EventType.TOUCH_END, this.onMusicToggleClick, this);
            if (musicOffNode) musicOffNode.on(Node.EventType.TOUCH_END, this.onMusicToggleClick, this);
        }

        // 音效开关：on 和 off 都要绑定事件
        if (this.soundToggleNode) {
            const sfxOnNode = this.soundToggleNode.getChildByName('on');
            const sfxOffNode = this.soundToggleNode.getChildByName('off');
            if (sfxOnNode) sfxOnNode.on(Node.EventType.TOUCH_END, this.onSoundToggleClick, this);
            if (sfxOffNode) sfxOffNode.on(Node.EventType.TOUCH_END, this.onSoundToggleClick, this);
        }

        // 震动开关：on 和 off 都要绑定事件
        if (this.vibrateToggleNode) {
            const vibOnNode = this.vibrateToggleNode.getChildByName('on');
            const vibOffNode = this.vibrateToggleNode.getChildByName('off');
            if (vibOnNode) vibOnNode.on(Node.EventType.TOUCH_END, this.onVibrateToggleClick, this);
            if (vibOffNode) vibOffNode.on(Node.EventType.TOUCH_END, this.onVibrateToggleClick, this);
        }

        console.log('[SettingPopupCtrl] 初始化完成');
    }

    /**
     * 组件启用时调用
     */
    onEnable() {
        const audioManager = AudioManager.getInstance();
        this._settings.musicEnabled = audioManager.isBgmEnabled();
        this._settings.soundEnabled = audioManager.isSoundEnabled();
        this.loadSettings();
        this.refreshUI();
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        try {
            if (this.closeBtnNode && this.closeBtnNode.isValid) {
                this.closeBtnNode.off(Node.EventType.TOUCH_END, this.onCloseClick, this);
            }
            if (this.musicToggleNode && this.musicToggleNode.isValid) {
                this.musicToggleNode.off(Node.EventType.TOUCH_END, this.onMusicToggleClick, this);
            }
            // if (this.musicOffNode && this.musicOffNode.isValid) {
            //     this.musicOffNode.off(Node.EventType.TOUCH_END, this.onMusicToggleClick, this);
            // }
            if (this.soundToggleNode && this.soundToggleNode.isValid) {
                this.soundToggleNode.off(Node.EventType.TOUCH_END, this.onSoundToggleClick, this);
            }
            // if (this.soundOffNode && this.soundOffNode.isValid) {
            //     this.soundOffNode.off(Node.EventType.TOUCH_END, this.onSoundToggleClick, this);
            // }
            if (this.vibrateToggleNode && this.vibrateToggleNode.isValid) {
                this.vibrateToggleNode.off(Node.EventType.TOUCH_END, this.onVibrateToggleClick, this);
            }
            // if (this.vibrateOffNode && this.vibrateOffNode.isValid) {
            //     this.vibrateOffNode.off(Node.EventType.TOUCH_END, this.onVibrateToggleClick, this);
            // }
        } catch (e) {
            console.warn('[SettingPopupCtrl] onDestroy cleanup error:', e);
        }
    }

    /**
     * 显示设置弹窗
     */
    show(): void {
        console.log('[SettingPopupCtrl] show() 被调用');
        console.log('[SettingPopupCtrl] _isShowing:', this._isShowing);
        console.log('[SettingPopupCtrl] node:', this.node);
        console.log('[SettingPopupCtrl] node.active:', this.node ? this.node.active : 'node为空');
        
        if (this._isShowing) {
            console.log('[SettingPopupCtrl] 已经在显示中，返回');
            return;
        }

        this._isShowing = true;
        this.node.active = true;
        console.log('[SettingPopupCtrl] 设置 node.active = true 后:', this.node.active);
        
        // 启用 BlockInputEvents 阻止点击穿透
        this.enableBlockInputEvents(true);
        
        this.refreshUI();
        console.log('[SettingPopupCtrl] refreshUI() 调用完成');
    }

    /**
     * 隐藏设置弹窗
     */
    hide(): void {
        console.log('[SettingPopupCtrl] hide() 被调用');
        console.log('[SettingPopupCtrl] _isShowing:', this._isShowing);
        if (!this._isShowing) {
            console.log('[SettingPopupCtrl] 已经在隐藏状态，返回');
            return;
        }

        // 禁用 BlockInputEvents 恢复点击
        this.enableBlockInputEvents(false);
        
        this._isShowing = false;
        this.node.active = false;
        console.log('[SettingPopupCtrl] 设置 node.active = false 后:', this.node.active);
    }

    /**
     * 控制 BlockInputEvents 组件的启用/禁用
     */
    private enableBlockInputEvents(enabled: boolean): void {
        if (!this.node) return;
        
        let blockEvents = this.node.getComponentInChildren(BlockInputEvents);
        if (!blockEvents) {
            blockEvents = this.node.addComponent(BlockInputEvents);
        }
        blockEvents.enabled = enabled;
        console.log('[SettingPopupCtrl] BlockInputEvents 设置为:', enabled);
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
        console.log('[SettingPopupCtrl] onMusicToggleClick 被调用');
        console.log('[SettingPopupCtrl] 当前 musicEnabled:', this._settings.musicEnabled);
        
        this._settings.musicEnabled = !this._settings.musicEnabled;
        console.log('[SettingPopupCtrl] 切换后 musicEnabled:', this._settings.musicEnabled);
        
        this.saveSettings();
        
        const audioManager = AudioManager.getInstance();
        console.log('[SettingPopupCtrl] 调用 audioManager.setBgmEnabled:', this._settings.musicEnabled);
        audioManager.setBgmEnabled(this._settings.musicEnabled);
        
        this.refreshUI();
        console.log('[SettingPopupCtrl] 音乐开关处理完成');
    }

    /**
     * 音效开关点击事件处理
     */
    private onSoundToggleClick(): void {
        console.log('[SettingPopupCtrl] onSoundToggleClick 被调用');
        console.log('[SettingPopupCtrl] 当前 soundEnabled:', this._settings.soundEnabled);
        
        this._settings.soundEnabled = !this._settings.soundEnabled;
        console.log('[SettingPopupCtrl] 切换后 soundEnabled:', this._settings.soundEnabled);
        
        this.saveSettings();
        
        const audioManager = AudioManager.getInstance();
        console.log('[SettingPopupCtrl] 调用 audioManager.setSoundEnabled:', this._settings.soundEnabled);
        audioManager.setSoundEnabled(this._settings.soundEnabled);
        
        this.refreshUI();
        console.log('[SettingPopupCtrl] 音效开关处理完成');
    }

    /**
     * 震动开关点击事件处理
     */
    private onVibrateToggleClick(): void {
        console.log('[SettingPopupCtrl] onVibrateToggleClick 被调用');
        console.log('[SettingPopupCtrl] 当前 vibrateEnabled:', this._settings.vibrateEnabled);
        
        this._settings.vibrateEnabled = !this._settings.vibrateEnabled;
        console.log('[SettingPopupCtrl] 切换后 vibrateEnabled:', this._settings.vibrateEnabled);
        
        this.saveSettings();
        this.refreshUI();

        console.log(`[SettingPopupCtrl] 震动: ${this._settings.vibrateEnabled ? '开启' : '关闭'}`);
        
        if (this._settings.vibrateEnabled) {
            this.triggerVibration();
        }
        
        console.log('[SettingPopupCtrl] 震动开关处理完成');
    }

    /**
     * 触发震动
     * 仅在微信小游戏或支持 Vibration API 的浏览器中生效
     */
    private triggerVibration(): void {
        if (typeof wx !== 'undefined' && typeof wx.vibrateShort === 'function') {
            wx.vibrateShort({ type: 'light' });
        } else if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }

    /**
     * 刷新所有 UI 显示（切换 on/off 节点的显示/隐藏）
     */
    private refreshUI(): void {
        console.log('[SettingPopupCtrl] refreshUI 被调用');
        console.log('[SettingPopupCtrl] 设置状态:', this._settings);
        
        // 更新音乐开关状态
        if (this.musicToggleNode) {
            console.log('[SettingPopupCtrl] musicToggleNode:', this.musicToggleNode.name);
            const onNode = this.musicToggleNode.getChildByName('on');
            const offNode = this.musicToggleNode.getChildByName('off');
            console.log('[SettingPopupCtrl] music on:', onNode ? onNode.name : '未找到');
            console.log('[SettingPopupCtrl] music off:', offNode ? offNode.name : '未找到');
            if (onNode) {
                onNode.active = this._settings.musicEnabled;
                console.log('[SettingPopupCtrl] music on.active =', this._settings.musicEnabled);
            }
            if (offNode) {
                offNode.active = !this._settings.musicEnabled;
                console.log('[SettingPopupCtrl] music off.active =', !this._settings.musicEnabled);
            }
        } else {
            console.log('[SettingPopupCtrl] ️ musicToggleNode 为空');
        }

        // 更新音效开关状态
        if (this.soundToggleNode) {
            console.log('[SettingPopupCtrl] soundToggleNode:', this.soundToggleNode.name);
            const onNode = this.soundToggleNode.getChildByName('on');
            const offNode = this.soundToggleNode.getChildByName('off');
            console.log('[SettingPopupCtrl] sfx on:', onNode ? onNode.name : '未找到');
            console.log('[SettingPopupCtrl] sfx off:', offNode ? offNode.name : '未找到');
            if (onNode) {
                onNode.active = this._settings.soundEnabled;
                console.log('[SettingPopupCtrl] sfx on.active =', this._settings.soundEnabled);
            }
            if (offNode) {
                offNode.active = !this._settings.soundEnabled;
                console.log('[SettingPopupCtrl] sfx off.active =', !this._settings.soundEnabled);
            }
        } else {
            console.log('[SettingPopupCtrl] ️ soundToggleNode 为空');
        }

        // 更新震动开关状态
        if (this.vibrateToggleNode) {
            console.log('[SettingPopupCtrl] vibrateToggleNode:', this.vibrateToggleNode.name);
            const onNode = this.vibrateToggleNode.getChildByName('on');
            const offNode = this.vibrateToggleNode.getChildByName('off');
            console.log('[SettingPopupCtrl] vib on:', onNode ? onNode.name : '未找到');
            console.log('[SettingPopupCtrl] vib off:', offNode ? offNode.name : '未找到');
            if (onNode) {
                onNode.active = this._settings.vibrateEnabled;
                console.log('[SettingPopupCtrl] vib on.active =', this._settings.vibrateEnabled);
            }
            if (offNode) {
                offNode.active = !this._settings.vibrateEnabled;
                console.log('[SettingPopupCtrl] vib off.active =', !this._settings.vibrateEnabled);
            }
        } else {
            console.log('[SettingPopupCtrl] ⚠️ vibrateToggleNode 为空');
        }
        
        console.log('[SettingPopupCtrl] refreshUI 完成');
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
