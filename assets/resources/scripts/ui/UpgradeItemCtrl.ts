/**
 * UpgradeItemCtrl - 单个升级项控制器
 * 
 * 功能说明：
 * - 管理单个升级项的 UI 显示（名称、数值、价格）
 * - 处理升级按钮点击事件
 * - 实时更新升级项的状态
 * 
 * 场景节点对应（每个升级项的结构）：
 * - 根节点（挂载此脚本）
 *   ├── bg: 背景
 *   ├── icon: 图标
 *   ├── name: 标题（升级项名称）
 *   ├── currentValue: 当前值
 *   ├── to: 箭头（"→"）
 *   ├── nextValue: 升级后值
 *   ├── buy: 价格按钮
 *   ├── ad: 广告按钮
 *   └── vfx: 升级特效（非激活）
 * 
 * 使用方式：
 * 1. 将此脚本挂载到升级项根节点上
 * 2. 在属性面板中选择对应的升级类型
 * 3. 配置各子节点引用
 * 
 * 示例：
 * - value 节点 -> 升级项类型: 'value'
 * - speed 节点 -> 升级项类型: 'speed'
 * - lucky 节点 -> 升级项类型: 'lucky'
 */

import { _decorator, Component, Node, Label, Button, Sprite, Color, Enum } from 'cc';
import { GameManager } from '../core/GameManager';
import { UpgradeType } from '../core/PlayerData';
import { PlayerData } from '../core/PlayerData';
import { NumberFormatter } from '../utils/NumberFormatter';

// 解构装饰器
const { ccclass, property } = _decorator;

/**
 * 升级项控制器类
 */
@ccclass('UpgradeItemCtrl')
export class UpgradeItemCtrl extends Component {

    /**
     * 升级项类型
     * 需要在编辑器中选择对应的升级类型
     */
    @property({
        type: Enum({
            '面值': 0,
            '速度': 1,
            '幸运': 2,
            '暴击': 3,
            '暴击加成': 4,
            '保底': 5,
            '连击加成': 6,
            '自动时间': 7
        }),
        displayName: '升级项类型',
        tooltip: '选择此升级项对应的类型'
    })
    upgradeTypeIndex: number = 0;

    /**
     * 升级项类型映射
     */
    private readonly UPGRADE_TYPE_MAP: UpgradeType[] = [
        'value',
        'speed',
        'lucky',
        'critical',
        'criticalBonus',
        'pity',
        'streakBonus',
        'time'
    ];

    /**
     * 获取当前升级项类型
     */
    private get upgradeType(): UpgradeType {
        return this.UPGRADE_TYPE_MAP[this.upgradeTypeIndex] || 'value';
    }

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
     * 升级后值 Label 节点
     */
    @property({ type: Label, displayName: '升级后值', tooltip: 'nextValue 节点的 Label 组件' })
    nextValueLabel: Label | null = null;

    /**
     * 价格 Label 节点
     */
    @property({ type: Label, displayName: '价格', tooltip: 'buy/price 节点的 Label 组件' })
    priceLabel: Label | null = null;

    /**
     * 升级按钮节点（余额购买）
     */
    @property({ type: Node, displayName: '升级按钮（余额）', tooltip: 'buy 按钮节点' })
    upgradeButtonNode: Node | null = null;

    /**
     * 广告按钮节点（看广告免费升级）
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
     * 升级按钮的原始颜色（缓存）
     */
    private _upgradeButtonOriginalColor: Color | null = null;

    private _flipCallback: ((result: any) => void) | null = null;

    private _balanceChangeCallback: (() => void) | null = null;

    /**
     * 组件加载时调用
     */
    onLoad() {
        this._gameManager = GameManager.getInstance();

        // 缓存升级按钮的原始颜色
        if (this.upgradeButtonNode) {
            const sprite = this.upgradeButtonNode.getComponent(Sprite);
            if (sprite) {
                this._upgradeButtonOriginalColor = sprite.color.clone();
            }
            this.upgradeButtonNode.on(Node.EventType.TOUCH_END, this.onUpgradeClick, this);
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

        console.log(`[UpgradeItemCtrl] 初始化完成，类型: ${this.upgradeType}`);
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
            if (this.upgradeButtonNode && this.upgradeButtonNode.isValid) {
                this.upgradeButtonNode.off(Node.EventType.TOUCH_END, this.onUpgradeClick, this);
            }
            if (this.adButtonNode && this.adButtonNode.isValid) {
                this.adButtonNode.off(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
            }
        } catch (e) {
            console.warn('[UpgradeItemCtrl] onDestroy cleanup error:', e);
        }
    }

    private _onEventCallback(): void {
        if (this.node.activeInHierarchy) {
            this.refreshUI();
        }
    }

    /**
     * 升级按钮点击事件处理（余额购买）
     */
    private onUpgradeClick(): void {
        if (!this._gameManager) return;

        const currentPrice = this._gameManager.getUpgradePrice(this.upgradeType);
        const balance = this._gameManager.getBalance();
        
        if (balance < currentPrice) {
            console.warn(`[UpgradeItemCtrl] 余额不足，需要: ${currentPrice}, 当前: ${balance}`);
            return;
        }

        const success = this._gameManager.buyUpgrade(this.upgradeType);

        if (success) {
            console.log(`[UpgradeItemCtrl] 升级成功: ${this.upgradeType}`);
            this.refreshUI();
        } else {
            console.warn(`[UpgradeItemCtrl] 升级失败: 余额不足`);
        }
    }

    /**
     * 广告按钮点击事件处理（看广告免费升级）
     * TODO: 接入微信小游戏广告 SDK
     */
    private onAdButtonClick(): void {
        console.log(`[UpgradeItemCtrl] 广告按钮点击，准备播放广告...`);
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
     * 更新标题显示
     */
    private updateTitle(): void {
        if (!this.titleLabel || !this._gameManager) return;

        const config = this._gameManager.getPlayerData().getUpgradeConfig(this.upgradeType);
        this.titleLabel.string = config.name;
    }

    /**
     * 更新数值显示
     */
    private updateValueDisplay(): void {
        if (!this.currentValueLabel || !this.nextValueLabel || !this._gameManager) return;

        const currentValue = this._gameManager.getUpgradeValue(this.upgradeType);
        const nextValue = this._gameManager.calculateNextUpgradeValue(this.upgradeType);

        let currentStr: string;
        let nextStr: string;

        switch (this.upgradeType) {
            case 'value':
            case 'criticalBonus':
            case 'streakBonus':
                currentStr = NumberFormatter.formatMoney(currentValue);
                nextStr = NumberFormatter.formatMoney(nextValue);
                break;
            case 'speed':
                currentStr = NumberFormatter.formatTimeDecimal(currentValue);
                nextStr = NumberFormatter.formatTimeDecimal(nextValue);
                break;
            case 'time':
                currentStr = NumberFormatter.formatTime(currentValue);
                nextStr = NumberFormatter.formatTime(nextValue);
                break;
            case 'lucky':
            case 'critical':
                currentStr = NumberFormatter.formatPercent(currentValue);
                nextStr = NumberFormatter.formatPercent(nextValue);
                break;
            case 'pity':
                currentStr = NumberFormatter.formatCount(currentValue);
                nextStr = NumberFormatter.formatCount(nextValue);
                break;
            default:
                currentStr = currentValue.toString();
                nextStr = nextValue.toString();
                break;
        }

        this.currentValueLabel.string = currentStr;
        this.nextValueLabel.string = nextStr;
    }

    /**
     * 更新价格显示
     */
    private updatePriceDisplay(): void {
        if (!this.priceLabel || !this._gameManager) return;

        const currentPrice = this._gameManager.getUpgradePrice(this.upgradeType);
        this.priceLabel.string = `${currentPrice}`;
    }

    /**
     * 更新按钮状态
     * 余额不足时升级按钮置灰，广告按钮保持原色
     */
    private updateButtonState(): void {
        if (!this._gameManager) return;

        const currentPrice = this._gameManager.getUpgradePrice(this.upgradeType);
        const balance = this._gameManager.getBalance();
        const canAfford = balance >= currentPrice;
        const isAtLimit = this._isUpgradeAtLimit();
        const canBuy = canAfford && !isAtLimit;

        if (this.upgradeButtonNode) {
            const button = this.upgradeButtonNode.getComponent(Button);
            const sprite = this.upgradeButtonNode.getComponent(Sprite);

            if (button) {
                button.interactable = canBuy;
            }

            if (sprite) {
                if (canBuy) {
                    if (this._upgradeButtonOriginalColor) {
                        sprite.color = this._upgradeButtonOriginalColor;
                    }
                } else {
                    sprite.color = this.GRAY_COLOR;
                }
            }
        }

        if (this.adButtonNode) {
            const adButton = this.adButtonNode.getComponent(Button);
            if (adButton) {
                adButton.interactable = !isAtLimit;
            }
        }
    }

    private _isUpgradeAtLimit(): boolean {
        const currentValue = this._gameManager.getUpgradeValue(this.upgradeType);
        const minValue = PlayerData.UPGRADE_MIN_VALUE[this.upgradeType];
        return minValue > 0 && currentValue <= minValue;
    }
}
