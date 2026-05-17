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
 *   ├── name: 标题（自动翻转）
 *   ├── currentValue: 当前自动时间值
 *   ├── buy: 购买按钮
 *   ├── ad: 广告按钮
 *   └── vfx: 特效（非激活）
 */

import { _decorator, Component, Node, Label, Button, Sprite, Color } from 'cc';
import { GameManager } from '../core/GameManager';
import { NumberFormatter } from '../utils/NumberFormatter';
import { PlayerData } from '../core/PlayerData';

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
    @property({ type: Label, displayName: '标题', tooltip: 'name 节点的 Label 组件' })
    titleLabel: Label | null = null;

    /**
     * 当前值 Label 节点
     */
    @property({ type: Label, displayName: '当前值', tooltip: 'currentValue 节点的 Label 组件' })
    currentValueLabel: Label | null = null;

    /**
     * 价格 Label 节点
     */
    @property({ type: Label, displayName: '价格', tooltip: 'buy 节点下的 Label 组件' })
    priceLabel: Label | null = null;

    /**
     * 购买按钮节点（余额购买）
     */
    @property({ type: Node, displayName: '购买按钮（余额）', tooltip: 'buy 按钮节点' })
    buyButtonNode: Node | null = null;

    /**
     * 广告按钮节点（看广告免费自动翻转）
     */
    @property({ type: Node, displayName: '广告按钮', tooltip: 'ad 按钮节点（保持原色）' })
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

    private _flipCallback: ((result: any) => void) | null = null;

    private _balanceChangeCallback: (() => void) | null = null;

    /**
     * 组件加载时调用
     */
    onLoad() {
        this._gameManager = GameManager.getInstance();

        // 缓存购买按钮的原始颜色
        if (this.buyButtonNode) {
            const sprite = this.buyButtonNode.getComponent(Sprite);
            if (sprite) {
                this._buyButtonOriginalColor = sprite.color.clone();
            }
            this.buyButtonNode.on(Node.EventType.TOUCH_END, this.onBuyClick, this);
        }

        if (this.adButtonNode) {
            this.adButtonNode.on(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
        }

        // 注册翻转事件回调，实时刷新按钮状态
        this._flipCallback = this._onEventCallback.bind(this);
        this._gameManager.onFlip(this._flipCallback);

        // 注册余额变更回调，实时刷新按钮状态
        this._balanceChangeCallback = this._onEventCallback.bind(this);
        this._gameManager.onBalanceChange(this._balanceChangeCallback);

        console.log('[AutoFlipBuyCtrl] 初始化完成');
    }

    onEnable() {
        this.refreshUI();
    }

    onDestroy() {
        try {
            if (this._gameManager) {
                if (this._flipCallback) {
                    this._gameManager.offFlip(this._flipCallback);
                }
                if (this._balanceChangeCallback) {
                    this._gameManager.offBalanceChange(this._balanceChangeCallback);
                }
            }
            if (this.buyButtonNode && this.buyButtonNode.isValid) {
                this.buyButtonNode.off(Node.EventType.TOUCH_END, this.onBuyClick, this);
            }
            if (this.adButtonNode && this.adButtonNode.isValid) {
                this.adButtonNode.off(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
            }
        } catch (e) {
            console.warn('[AutoFlipBuyCtrl] onDestroy cleanup error:', e);
        }
    }

    private _onEventCallback(): void {
        if (this.node.activeInHierarchy) {
            this.refreshUI();
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

        // 价格是 time 升级项的当前价格
        const price = this._gameManager.getUpgradePrice('time');
        const balance = this._gameManager.getBalance();

        if (balance < price) {
            console.warn(`[AutoFlipBuyCtrl] 余额不足，需要: ${price}, 当前: ${balance}`);
            return;
        }

        // 扣除余额
        this._gameManager.getPlayerData().subtractBalance(price);

        // 通知余额变更
        this._gameManager.notifyBalanceChange();

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
    }

    /**
     * 刷新所有 UI 显示
     */
    private refreshUI(): void {
        if (!this._gameManager) return;

        this.updateValueDisplay();
        this.updatePriceDisplay();
        this.updateButtonState();
    }

    /**
     * 更新当前值显示（自动时间值）
     */
    private updateValueDisplay(): void {
        if (!this.currentValueLabel || !this._gameManager) return;

        const value = this._gameManager.getUpgradeValue('time');
        this.currentValueLabel.string = NumberFormatter.formatTime(value);
    }

    /**
     * 更新价格显示
     */
    private updatePriceDisplay(): void {
        if (!this.priceLabel || !this._gameManager) return;

        const price = this._gameManager.getUpgradePrice('time');
        this.priceLabel.string = `${price}`;
    }

    /**
     * 更新按钮状态
     */
    private updateButtonState(): void {
        if (!this._gameManager) return;

        const price = this._gameManager.getUpgradePrice('time');
        const balance = this._gameManager.getBalance();
        const canAfford = balance >= price;
        const isAutoFlipping = this._gameManager.isAutoFlipping();
        const isAtLimit = this._isUpgradeAtLimit();
        const canBuy = canAfford && !isAutoFlipping && !isAtLimit;

        if (this.buyButtonNode) {
            const button = this.buyButtonNode.getComponent(Button);
            const sprite = this.buyButtonNode.getComponent(Sprite);

            if (button) {
                button.interactable = canBuy;
            }

            if (sprite) {
                if (canBuy) {
                    if (this._buyButtonOriginalColor) {
                        sprite.color = this._buyButtonOriginalColor;
                    }
                } else {
                    sprite.color = this.GRAY_COLOR;
                }
            }
        }

        if (this.adButtonNode) {
            const adButton = this.adButtonNode.getComponent(Button);
            if (adButton) {
                adButton.interactable = !isAtLimit && !isAutoFlipping;
            }
        }
    }

    private _isUpgradeAtLimit(): boolean {
        const currentValue = this._gameManager.getUpgradeValue('time');
        const minValue = PlayerData.UPGRADE_MIN_VALUE['time'];
        return minValue > 0 && currentValue <= minValue;
    }
}
