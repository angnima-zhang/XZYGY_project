/**
 * ShopPopupCtrl - 升级面板控制器
 * 
 * 功能说明：
 * - 管理升级面板的显示/隐藏
 * - 展示所有8种升级项的列表
 * - 处理升级购买逻辑
 * - 提供自动抛硬币按钮
 * 
 * 场景节点对应：
 * - ShopPopup 根节点
 *   ├── bg: 背景
 *   ├── value: 面值升级项
 *   ├── speed: 动画速度升级项
 *   ├── auto: 自动持续时间升级项
 *   ├── headProb: 正面概率升级项
 *   ├── critRate: 暴击率升级项
 *   ├── critBonus: 暴击加成升级项
 *   ├── pity: 保底升级项
 *   ├── streakBonus: 连击加成升级项
 *   ├── btn_auto: 自动抛硬币按钮
 *   └── btn_close: 关闭按钮
 * 
 * 使用方式：
 * 将此脚本挂载到 ShopPopup 根节点上，配置各节点引用
 */

import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';
import { UpgradeType } from '../core/PlayerData';
import { UpgradeItemCtrl } from './UpgradeItemCtrl';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('ShopPopupCtrl')
export class ShopPopupCtrl extends Component {

    /**
     * 关闭按钮节点
     */
    @property({ type: Node, displayName: '关闭按钮', tooltip: 'btn_close 节点' })
    closeBtnNode: Node | null = null;

    /**
     * 自动抛硬币按钮节点
     */
    @property({ type: Node, displayName: '自动抛硬币按钮', tooltip: 'btn_auto 节点' })
    autoFlipBtnNode: Node | null = null;

    /**
     * 升级项根节点列表
     * 用于批量刷新所有升级项的 UI
     */
    @property({ type: [Node], displayName: '升级项节点列表', tooltip: '所有升级项的根节点' })
    upgradeItemNodes: Node[] = [];

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 是否正在显示中
     */
    private _isShowing: boolean = false;

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        // 获取游戏管理器实例
        this._gameManager = GameManager.getInstance();

        // 绑定关闭按钮事件
        if (this.closeBtnNode) {
            this.closeBtnNode.on(Node.EventType.TOUCH_END, this.onCloseClick, this);
        }

        // 绑定自动抛硬币按钮事件
        if (this.autoFlipBtnNode) {
            this.autoFlipBtnNode.on(Node.EventType.TOUCH_END, this.onAutoFlipClick, this);
        }

        // 初始隐藏
        this.node.active = false;

        console.log('[ShopPopupCtrl] 初始化完成');
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        if (this.closeBtnNode) {
            this.closeBtnNode.off(Node.EventType.TOUCH_END, this.onCloseClick, this);
        }
        if (this.autoFlipBtnNode) {
            this.autoFlipBtnNode.off(Node.EventType.TOUCH_END, this.onAutoFlipClick, this);
        }
    }

    /**
     * 显示升级面板
     * 带有渐入动画
     */
    show(): void {
        if (this._isShowing) return;

        this._isShowing = true;
        this.node.active = true;

        // 刷新所有升级项 UI
        this.refreshAllUpgrades();

        // 播放渐入动画
        this.playShowAnimation();
    }

    /**
     * 隐藏升级面板
     * 带有渐出动画
     */
    hide(): void {
        if (!this._isShowing) return;

        this._isShowing = false;

        // 播放渐出动画
        this.playHideAnimation();
    }

    /**
     * 刷新所有升级项的 UI 显示
     */
    private refreshAllUpgrades(): void {
        this.upgradeItemNodes.forEach(node => {
            const ctrl = node.getComponent(UpgradeItemCtrl);
            if (ctrl) {
                // 通过 UpgradeItemCtrl 的公开方法刷新 UI
                // 通过 UpgradeItemCtrl 的公开方法刷新 UI
                // 注意：需要在 UpgradeItemCtrl 中将 refreshUI 改为 public 方法
                (ctrl as any).refreshUI();
            }
        });
    }

    /**
     * 关闭按钮点击事件处理
     */
    private onCloseClick(): void {
        this.hide();
    }

    /**
     * 自动抛硬币按钮点击事件处理
     */
    private onAutoFlipClick(): void {
        if (!this._gameManager) return;

        if (this._gameManager.isAutoFlipping()) {
            // 如果正在自动翻转，停止它
            this._gameManager.stopAutoFlip();
        } else {
            // 否则开始自动翻转
            this._gameManager.startAutoFlip();
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
}