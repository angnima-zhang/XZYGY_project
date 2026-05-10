/**
 * MainSceneController - 主场景入口控制器
 * 
 * 功能说明：
 * - 初始化游戏核心系统（GameManager、AudioManager）
 * - 管理页面切换（MainPage ↔ UpgradePage ↔ StatusPage）
 * - 管理弹窗显示/隐藏（SettingPopup）
 * - 绑定主界面按钮事件
 * 
 * 场景结构：
 * Canvas
 * ├── MainPage（主游戏页面）
 * ├── UpgradePage（升级页面）
 * ├── StatusPage（状态页面）
 * └── Toast（提示弹窗，非激活）
 */

import { _decorator, Component, Node, Label, log, Button } from 'cc';
import { GameManager } from './core/GameManager';
import { AudioManager } from './core/AudioManager';
import { VfxManager } from './ui/VfxManager';
import { UpgradePageCtrl } from './ui/UpgradePageCtrl';
import { StatusPageCtrl } from './ui/StatusPageCtrl';
import { SettingPopupCtrl } from './ui/SettingPopupCtrl';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('MainSceneController')
export class MainSceneController extends Component {

    /**
     * 设置弹窗控制器引用
     */
    @property({ type: SettingPopupCtrl, displayName: '设置弹窗', tooltip: 'MainPage/SettingPopup 节点上的 SettingPopupCtrl 组件' })
    settingPopup: SettingPopupCtrl | null = null;

    /**
     * 升级页面控制器引用
     */
    @property({ type: UpgradePageCtrl, displayName: '升级页面', tooltip: 'UpgradePage 节点上的 UpgradePageCtrl 组件' })
    upgradePage: UpgradePageCtrl | null = null;

    /**
     * 状态页面控制器引用
     */
    @property({ type: StatusPageCtrl, displayName: '状态页面', tooltip: 'StatusPage 节点上的 StatusPageCtrl 组件' })
    statusPage: StatusPageCtrl | null = null;

    /**
     * 设置按钮节点
     */
    @property({ type: Node, displayName: '设置按钮', tooltip: 'MainPage/UI/TopSection/button_setting 节点' })
    settingBtnNode: Node | null = null;

    /**
     * 升级按钮节点
     */
    @property({ type: Node, displayName: '升级按钮', tooltip: 'MainPage/UI/BottomSection/buttons/button_shop 节点' })
    upgradeBtnNode: Node | null = null;

    /**
     * 状态按钮节点
     */
    @property({ type: Node, displayName: '状态按钮', tooltip: 'MainPage/UI/BottomSection/buttons/button_status 节点' })
    statusBtnNode: Node | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 音效管理器实例
     */
    private _audioManager: AudioManager | null = null;

    /**
     * VFX 管理器实例
     */
    private _vfxManager: VfxManager | null = null;

    /**
     * 当前显示的页面（'main' | 'upgrade' | 'status'）
     */
    private _currentPage: 'main' | 'upgrade' | 'status' = 'main';

    /**
     * 组件加载时调用
     * 初始化所有系统
     */
    onLoad() {
        log('[MainSceneController] 开始初始化主场景...');

        // 1. 初始化音效管理器
        this._audioManager = AudioManager.getInstance();
        this._audioManager.init();

        // 2. 初始化游戏管理器
        this._gameManager = GameManager.getInstance();

        // 3. 获取 VFX 管理器
        this._vfxManager = this.getComponent(VfxManager);
        if (this._vfxManager) {
            this._gameManager.setVfxManager(this._vfxManager);
            log('[MainSceneController] VFX 管理器已连接');
        } else {
            log('[MainSceneController] 警告: 未找到 VFX 管理器');
        }

        // 4. 查找 SettingPopup 组件
        if (!this.settingPopup) {
            const settingPopupNode = this.node.getChildByName('MainPage')?.getChildByName('SettingPopup');
            if (settingPopupNode) {
                this.settingPopup = settingPopupNode.getComponent(SettingPopupCtrl);
                log('[MainSceneController] 自动查找并绑定 SettingPopup 组件');
            } else {
                log('[MainSceneController] ⚠️ 未找到 SettingPopup 节点');
            }
        } else {
            log('[MainSceneController] SettingPopup 组件已配置');
        }

        // 5. 绑定按钮事件
        this.bindButtonEvents();

        // 6. 设置初始页面状态
        this.showMainPage();

        log('[MainSceneController] 初始化完成！');
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        try {
            if (this.settingBtnNode && this.settingBtnNode.isValid) {
                const btn = this.settingBtnNode.getComponent(Button);
                if (btn && btn.node && btn.node.isValid) {
                    btn.node.off(Button.EventType.CLICK, this.onSettingClick, this);
                }
            }
            if (this.upgradeBtnNode && this.upgradeBtnNode.isValid) {
                const btn = this.upgradeBtnNode.getComponent(Button);
                if (btn && btn.node && btn.node.isValid) {
                    btn.node.off(Button.EventType.CLICK, this.onUpgradeClick, this);
                }
            }
            if (this.statusBtnNode && this.statusBtnNode.isValid) {
                const btn = this.statusBtnNode.getComponent(Button);
                if (btn && btn.node && btn.node.isValid) {
                    btn.node.off(Button.EventType.CLICK, this.onStatusClick, this);
                }
            }
        } catch (e) {
            console.warn('[MainSceneController] onDestroy cleanup error:', e);
        }
    }

    /**
     * 绑定所有按钮事件
     */
    private bindButtonEvents(): void {
        log('[MainSceneController] 开始绑定按钮事件...');
        
        if (this.settingBtnNode) {
            log('[MainSceneController] 找到设置按钮节点');
            const btn = this.settingBtnNode.getComponent(Button);
            if (btn) {
                log('[MainSceneController] 设置按钮Button组件存在，绑定事件');
                btn.node.on(Button.EventType.CLICK, this.onSettingClick, this);
            } else {
                log('[MainSceneController] ⚠️ 设置按钮没有Button组件');
            }
        } else {
            log('[MainSceneController] ⚠️ 设置按钮节点为空');
        }
        
        if (this.upgradeBtnNode) {
            log('[MainSceneController] 找到升级按钮节点');
            const btn = this.upgradeBtnNode.getComponent(Button);
            if (btn) {
                log('[MainSceneController] 升级按钮Button组件存在，绑定事件');
                btn.node.on(Button.EventType.CLICK, this.onUpgradeClick, this);
            }
        }
        
        if (this.statusBtnNode) {
            log('[MainSceneController] 找到状态按钮节点');
            const btn = this.statusBtnNode.getComponent(Button);
            if (btn) {
                log('[MainSceneController] 状态按钮Button组件存在，绑定事件');
                btn.node.on(Button.EventType.CLICK, this.onStatusClick, this);
            }
        }
        
        log('[MainSceneController] settingPopup引用:', this.settingPopup ? '已配置' : '未配置');
        log('[MainSceneController] 按钮事件绑定完成');
    }

    /**
     * 设置按钮点击事件处理
     */
    private onSettingClick(): void {
        log('[MainSceneController] 设置按钮点击');

        if (this._audioManager) {
            this._audioManager.playClick();
        }

        this.showSettingPopup();
    }

    /**
     * 升级按钮点击事件处理
     */
    private onUpgradeClick(): void {
        log('[MainSceneController] 升级按钮点击');

        if (this._audioManager) {
            this._audioManager.playClick();
        }

        this.showUpgradePage();
    }

    /**
     * 状态按钮点击事件处理
     */
    private onStatusClick(): void {
        log('[MainSceneController] 状态按钮点击');

        if (this._audioManager) {
            this._audioManager.playClick();
        }

        this.showStatusPage();
    }

    /**
     * 显示主页面
     */
    private showMainPage(): void {
        this._currentPage = 'main';

        // 隐藏其他页面
        if (this.upgradePage) {
            this.upgradePage.hide();
        }
        if (this.statusPage) {
            this.statusPage.hide();
        }
    }

    /**
     * 显示升级页面
     */
    private showUpgradePage(): void {
        log('[MainSceneController] showUpgradePage 被调用');
        log('[MainSceneController] 当前页面:', this._currentPage);
        log('[MainSceneController] upgradePage引用:', this.upgradePage ? '已配置' : '未配置');
        log('[MainSceneController] statusPage引用:', this.statusPage ? '已配置' : '未配置');

        this._currentPage = 'upgrade';

        // 隐藏其他页面
        if (this.statusPage) {
            log('[MainSceneController] 隐藏 StatusPage');
            this.statusPage.hide();
        } else {
            log('[MainSceneController] ⚠️ statusPage为null，跳过');
        }

        // 显示升级页面
        if (this.upgradePage) {
            log('[MainSceneController] 调用 upgradePage.show()');
            this.upgradePage.show();
            log('[MainSceneController] upgradePage.show() 调用完成');
        } else {
            log('[MainSceneController] ❌ upgradePage为null，无法显示升级页面');
        }
        
        log('[MainSceneController] showUpgradePage 完成');
    }

    /**
     * 显示状态页面
     */
    private showStatusPage(): void {
        log('[MainSceneController] showStatusPage 被调用');
        log('[MainSceneController] 当前页面:', this._currentPage);
        log('[MainSceneController] upgradePage引用:', this.upgradePage ? '已配置' : '未配置');
        log('[MainSceneController] statusPage引用:', this.statusPage ? '已配置' : '未配置');

        this._currentPage = 'status';

        // 隐藏其他页面
        if (this.upgradePage) {
            log('[MainSceneController] 隐藏 UpgradePage');
            this.upgradePage.hide();
        } else {
            log('[MainSceneController] ⚠️ upgradePage为null，跳过');
        }

        // 显示状态页面
        if (this.statusPage) {
            log('[MainSceneController] 调用 statusPage.show()');
            this.statusPage.show();
            log('[MainSceneController] statusPage.show() 调用完成');
        } else {
            log('[MainSceneController] ❌ statusPage为null，无法显示状态页面');
        }
        
        log('[MainSceneController] showStatusPage 完成');
    }

    /**
     * 显示设置弹窗
     */
    private showSettingPopup(): void {
        log('[MainSceneController] showSettingPopup 被调用');
        log('[MainSceneController] settingPopup值:', this.settingPopup);
        
        if (this.settingPopup) {
            log('[MainSceneController] 调用 settingPopup.show()');
            this.settingPopup.show();
            log('[MainSceneController] settingPopup.show() 调用完成');
        } else {
            log('[MainSceneController] ❌ settingPopup为null，无法显示弹窗');
        }
    }

    /**
     * 获取当前页面
     * @returns 当前页面标识
     */
    getCurrentPage(): 'main' | 'upgrade' | 'status' {
        return this._currentPage;
    }
}
