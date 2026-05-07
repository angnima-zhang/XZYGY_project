/**
 * MainSceneController - 主场景入口控制器
 * 
 * 功能说明：
 * - 主场景的入口脚本，挂载到 Canvas 节点上
 * - 初始化所有游戏系统（GameManager、AudioManager 等）
 * - 管理弹窗的显示/隐藏（升级面板、属性面板、设置弹窗）
 * - 处理主界面按钮点击事件（升级按钮、属性按钮、设置按钮）
 * 
 * 场景节点对应：
 * - Canvas 根节点（挂载此脚本）
 *   ├── MainPage (主游戏页面)
 *   │   ├── bg (背景)
 *   │   ├── CoinSection (硬币区域)
 *   │   ├── UI (顶部区域)
 *   │   │   ├── TopSection
 *   │   │   │   ├── button_setting (设置按钮)
 *   │   │   │   ├── socre (余额显示)
 *   │   │   │   ├── need (进度条)
 *   │   │   │   └── hitCount (抛币次数)
 *   │   │   └── BottomSection
 *   │   │       ├── button_shop (升级按钮)
 *   │   │       └── button_status (属性按钮)
 *   │   └── UpgradeSection (常驻升级区)
 *   │       ├── value (面值升级)
 *   │       ├── speed (速度升级)
 *   │       └── auto (自动升级)
 *   ├── SettingPopup (设置弹窗)
 *   ├── ShopPopup (升级面板)
 *   └── StatsPopup (属性面板)
 * 
 * 使用方式：
 * 将此脚本挂载到 Canvas 节点上，然后配置各弹窗节点的引用
 */

import { _decorator, Component, Node } from 'cc';
import { GameManager } from './core/GameManager';
import { AudioManager } from './core/AudioManager';
import { VfxManager } from './ui/VfxManager';
import { ShopPopupCtrl } from './ui/ShopPopupCtrl';
import { StatsPopupCtrl } from './ui/StatsPopupCtrl';
import { SettingPopupCtrl } from './ui/SettingPopupCtrl';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {

    /**
     * 设置弹窗节点
     */
    @property({ type: Node, displayName: '设置弹窗', tooltip: 'SettingPopup 节点' })
    settingPopupNode: Node | null = null;

    /**
     * 升级面板节点
     */
    @property({ type: Node, displayName: '升级面板', tooltip: 'ShopPopup 节点' })
    shopPopupNode: Node | null = null;

    /**
     * 属性面板节点
     */
    @property({ type: Node, displayName: '属性面板', tooltip: 'StatsPopup 节点' })
    statsPopupNode: Node | null = null;

    /**
     * 设置按钮节点
     */
    @property({ type: Node, displayName: '设置按钮', tooltip: 'button_setting 节点' })
    settingBtnNode: Node | null = null;

    /**
     * 升级按钮节点
     */
    @property({ type: Node, displayName: '升级按钮', tooltip: 'button_shop 节点' })
    shopBtnNode: Node | null = null;

    /**
     * 属性按钮节点
     */
    @property({ type: Node, displayName: '属性按钮', tooltip: 'button_status 节点' })
    statsBtnNode: Node | null = null;

    /**
     * VFX 管理器节点
     */
    @property({ type: Node, displayName: 'VFX 管理器', tooltip: '挂载了 VfxManager 的节点' })
    vfxManagerNode: Node | null = null;

    /**
     * 设置弹窗控制器
     */
    private _settingPopupCtrl: SettingPopupCtrl | null = null;

    /**
     * 升级面板控制器
     */
    private _shopPopupCtrl: ShopPopupCtrl | null = null;

    /**
     * 属性面板控制器
     */
    private _statsPopupCtrl: StatsPopupCtrl | null = null;

    /**
     * 组件加载时调用
     * 初始化所有游戏系统
     */
    onLoad() {
        console.log('[MainSceneController] 初始化主场景...');

        // 初始化音频管理器
        const audioManager = AudioManager.getInstance();
        audioManager.init();
        console.log('[MainSceneController] AudioManager 已初始化');

        // 初始化游戏管理器
        const gameManager = GameManager.getInstance();

        // 初始化 VFX 管理器并连接到 GameManager
        if (this.vfxManagerNode) {
            const vfxManager = this.vfxManagerNode.getComponent(VfxManager);
            if (vfxManager) {
                gameManager.setVfxManager(vfxManager);
                console.log('[MainSceneController] VfxManager 已初始化并连接');
            } else {
                console.warn('[MainSceneController] VfxManager 组件未找到');
            }
        }

        console.log('[MainSceneController] GameManager 已初始化');

        // 获取弹窗控制器
        if (this.settingPopupNode) {
            this._settingPopupCtrl = this.settingPopupNode.getComponent(SettingPopupCtrl);
        }
        if (this.shopPopupNode) {
            this._shopPopupCtrl = this.shopPopupNode.getComponent(ShopPopupCtrl);
        }
        if (this.statsPopupNode) {
            this._statsPopupCtrl = this.statsPopupNode.getComponent(StatsPopupCtrl);
        }

        // 绑定按钮事件
        this.bindButtonEvents();

        console.log('[MainSceneController] 主场景初始化完成');
    }

    /**
     * 组件启用时调用
     * 播放 BGM
     */
    onEnable() {
        // 播放背景音乐
        AudioManager.getInstance().playBGM();
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        // 解绑按钮事件
        this.unbindButtonEvents();
    }

    /**
     * 绑定按钮点击事件
     */
    private bindButtonEvents(): void {
        if (this.settingBtnNode) {
            this.settingBtnNode.on(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
        if (this.shopBtnNode) {
            this.shopBtnNode.on(Node.EventType.TOUCH_END, this.onShopBtnClick, this);
        }
        if (this.statsBtnNode) {
            this.statsBtnNode.on(Node.EventType.TOUCH_END, this.onStatsBtnClick, this);
        }
    }

    /**
     * 解绑按钮点击事件
     */
    private unbindButtonEvents(): void {
        if (this.settingBtnNode) {
            this.settingBtnNode.off(Node.EventType.TOUCH_END, this.onSettingBtnClick, this);
        }
        if (this.shopBtnNode) {
            this.shopBtnNode.off(Node.EventType.TOUCH_END, this.onShopBtnClick, this);
        }
        if (this.statsBtnNode) {
            this.statsBtnNode.off(Node.EventType.TOUCH_END, this.onStatsBtnClick, this);
        }
    }

    /**
     * 设置按钮点击事件处理
     */
    private onSettingBtnClick(): void {
        // 播放点击音效
        AudioManager.getInstance().playClick();

        // 关闭其他弹窗
        this.closeAllPopups();

        // 打开设置弹窗
        if (this._settingPopupCtrl) {
            this._settingPopupCtrl.show();
        }
    }

    /**
     * 升级按钮点击事件处理
     */
    private onShopBtnClick(): void {
        // 播放点击音效
        AudioManager.getInstance().playClick();

        // 关闭其他弹窗
        this.closeAllPopups();

        // 打开升级面板
        if (this._shopPopupCtrl) {
            this._shopPopupCtrl.show();
        }
    }

    /**
     * 属性按钮点击事件处理
     */
    private onStatsBtnClick(): void {
        // 播放点击音效
        AudioManager.getInstance().playClick();

        // 关闭其他弹窗
        this.closeAllPopups();

        // 打开属性面板
        if (this._statsPopupCtrl) {
            this._statsPopupCtrl.show();
        }
    }

    /**
     * 关闭所有弹窗
     */
    private closeAllPopups(): void {
        if (this._settingPopupCtrl) {
            this._settingPopupCtrl.hide();
        }
        if (this._shopPopupCtrl) {
            this._shopPopupCtrl.hide();
        }
        if (this._statsPopupCtrl) {
            this._statsPopupCtrl.hide();
        }
    }
}