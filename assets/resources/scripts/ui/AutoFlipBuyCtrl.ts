/**
 * AutoFlipBuyCtrl - MainPage 自动翻转购买控制器
 * 
 * 功能说明：
 * - MainPage 的 auto 节点不是升级，而是购买自动翻转功能
 * - 点击按钮后消耗余额并调用 GameManager.startAutoFlip()
 * - 余额不足时按钮置灰，广告按钮保持原色
 * 
 * 场景节点对应：
 * - MainPage/UpgradeSection/auto（挂载此脚本）
 *   ├── bg: 背景
 *   ├── icon: 图标
 *   ├── title: 标题（自动翻转）
 *   ├── price: 价格
 *   ├── button: 购买按钮
 *   └── button_ad: 广告按钮
 */

import { _decorator, Component, Node, Label, Button, Sprite, Color } from 'cc';
import { GameManager } from '../core/GameManager';

// 解构装饰器
const { ccclass, property } = _decorator;

/**
 * 自动翻转购买控制器类
 */
@ccclass('AutoFlipBuyCtrl')
export class AutoFlipBuyCtrl extends Component {

    /**
     * 标题 Label 节点
     */
    @property({ type: Label, displayName: '标题', tooltip: 'title 节点的 Label 组件' })
    titleLabel: Label | null = null;

    /**
     * 价格 Label 节点
     */
    @property({ type: Label, displayName: '价格', tooltip: 'price 节点的 Label 组件' })
    priceLabel: Label | null = null;

    /**
     * 购买按钮节点（余额购买）
     * 余额不足时会置灰
     */
    @property({ type: Node, displayName: '购买按钮（余额）', tooltip: '余额购买按钮节点' })
    buyButtonNode: Node | null = null;

    /**
     * 广告按钮节点（看广告免费自动翻转）
     * 始终保持原色，不受余额影响
     */
    @property({ type: Node, displayName: '广告按钮', tooltip: '广告按钮节点（保持原色）' })
    adButtonNode: Node | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 置灰颜色
     */
    private readonly GRAY_COLOR = new Color(128, 128, 128, 255);

    /**
     * 购买按钮的原始颜色（缓存）
     */
    private _buyButtonOriginalColor: Color | null = null;

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        this._gameManager = GameManager.getInstance();

        // 初始化标题
        if (this.titleLabel) {
            this.titleLabel.string = '自动翻转';
        }

        // 缓存购买按钮的原始颜色
        if (this.buyButtonNode) {
            const sprite = this.buyButtonNode.getComponent(Sprite);
            if (sprite) {
                this._buyButtonOriginalColor = sprite.color.clone();
            }
            this.buyButtonNode.on(Node.EventType.TOUCH_END, this.onBuyClick, this);
        }

        // 绑定广告按钮点击事件
        if (this.adButtonNode) {
            this.adButtonNode.on(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
        }

        console.log('[AutoFlipBuyCtrl] 初始化完成');
    }

    /**
     * 组件启用时调用
     * 刷新 UI 显示
     */
    onEnable() {
        this.refreshUI();
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        if (this.buyButtonNode) {
            this.buyButtonNode.off(Node.EventType.TOUCH_END, this.onBuyClick, this);
        }
        if (this.adButtonNode) {
            this.adButtonNode.off(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
        }
    }

    /**
     * 购买按钮点击事件处理
     */
    private onBuyClick(): void {
        if (!this._gameManager) return;

        // 检查是否已经在自动翻转中
        if (this._gameManager.isAutoFlipping()) {
            console.warn('[AutoFlipBuyCtrl] 已经在自动翻转中');
            return;
        }

        const price = this._gameManager.getUpgradeValue('autoDuration');
        const balance = this._gameManager.getBalance();

        if (balance < price) {
            console.warn(`[AutoFlipBuyCtrl] 余额不足，需要: ${price}, 当前: ${balance}`);
            return;
        }

        // 扣除余额
        this._gameManager.getPlayerData().subtractBalance(price);

        // 启动自动翻转
        this._gameManager.startAutoFlip();

        console.log('[AutoFlipBuyCtrl] 购买自动翻转成功');
        this.refreshUI();
    }

    /**
     * 广告按钮点击事件处理
     * TODO: 接入微信小游戏广告 SDK
     */
    private onAdButtonClick(): void {
        console.log('[AutoFlipBuyCtrl] 广告按钮点击，准备播放广告...');

        // TODO: 实现广告播放逻辑
        // 1. 检查广告是否可用
        // 2. 播放激励视频广告
        // 3. 广告播放成功后免费启动自动翻转
        // 4. 刷新 UI
    }

    /**
     * 刷新所有 UI 显示
     */
    private refreshUI(): void {
        if (!this._gameManager) return;

        // 更新价格显示
        this.updatePriceDisplay();

        // 更新按钮状态
        this.updateButtonState();
    }

    /**
     * 更新价格显示
     * 价格是 autoDuration 升级项的当前值
     */
    private updatePriceDisplay(): void {
        if (!this.priceLabel || !this._gameManager) return;

        const price = this._gameManager.getUpgradeValue('autoDuration');
        this.priceLabel.string = `${price}`;
    }

    /**
     * 更新按钮状态
     * 余额不足时：
     * - 购买按钮置灰并禁用
     * - 广告按钮保持原色
     */
    private updateButtonState(): void {
        if (!this._gameManager) return;

        const price = this._gameManager.getUpgradeValue('autoDuration');
        const balance = this._gameManager.getBalance();
        const canAfford = balance >= price;
        const isAutoFlipping = this._gameManager.isAutoFlipping();

        // 更新购买按钮状态
        if (this.buyButtonNode) {
            const button = this.buyButtonNode.getComponent(Button);
            const sprite = this.buyButtonNode.getComponent(Sprite);

            if (button) {
                button.interactable = canAfford && !isAutoFlipping;
            }

            if (sprite) {
                if (canAfford && !isAutoFlipping) {
                    if (this._buyButtonOriginalColor) {
                        sprite.color = this._buyButtonOriginalColor;
                    }
                } else {
                    sprite.color = this.GRAY_COLOR;
                }
            }
        }

        // 广告按钮始终保持原色
        if (this.adButtonNode) {
            const adButton = this.adButtonNode.getComponent(Button);
            if (adButton) {
                adButton.interactable = true;
            }
        }
    }
}
