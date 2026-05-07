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
 *   ├── title: 标题（升级项名称）
 *   ├── desc: 描述（当前数值）
 *   ├── price: 价格（升级价格）
 *   └── button: 升级按钮
 * 
 * 使用方式：
 * 1. 将此脚本挂载到升级项根节点上（如 value、speed、auto 节点）
 * 2. 在属性面板中配置升级项类型（UpgradeType）
 * 3. 配置各子节点引用
 * 
 * 示例：
 * - value 节点 -> UpgradeType: 'value' (面值升级)
 * - speed 节点 -> UpgradeType: 'animSpeed' (动画速度升级)
 * - auto 节点 -> UpgradeType: 'autoDuration' (自动持续时间升级)
 */

import { _decorator, Component, Node, Label, Button, Sprite, Color, Enum } from 'cc';
import { GameManager } from '../core/GameManager';
import { UpgradeType } from '../core/PlayerData';

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
            '动画速度': 1,
            '正面概率': 2,
            '暴击率': 3,
            '暴击加成': 4,
            '保底': 5,
            '连击加成': 6,
            '自动持续时间': 7
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
        'animSpeed',
        'headProb',
        'critRate',
        'critBonus',
        'pity',
        'streakBonus',
        'autoDuration'
    ];

    /**
     * 获取当前升级项类型
     */
    private get upgradeType(): UpgradeType {
        return this.UPGRADE_TYPE_MAP[this.upgradeTypeIndex] || 'value';
    }

    /**
     * 标题 Label 节点
     * 显示升级项名称（如：面值、动画速度）
     */
    @property({ type: Label, displayName: '标题', tooltip: 'title 节点的 Label 组件' })
    titleLabel: Label | null = null;

    /**
     * 价格 Label 节点
     * 显示升级价格（如：5）
     */
    @property({ type: Label, displayName: '价格', tooltip: 'price 节点的 Label 组件' })
    priceLabel: Label | null = null;

    /**
     * 升级按钮节点（余额购买）
     * 余额不足时会置灰
     */
    @property({ type: Node, displayName: '升级按钮（余额）', tooltip: '余额购买按钮节点' })
    upgradeButtonNode: Node | null = null;

    /**
     * 广告按钮节点（看广告免费升级）
     * 始终保持原色，不受余额影响
     */
    @property({ type: Node, displayName: '广告按钮', tooltip: '广告按钮节点（保持原色）' })
    adButtonNode: Node | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 置灰颜色（半透明白色）
     */
    private readonly GRAY_COLOR = new Color(128, 128, 128, 255);

    /**
     * 正常颜色
     */
    private readonly NORMAL_COLOR = new Color(255, 255, 255, 255);

    /**
     * 升级按钮的原始颜色（缓存）
     */
    private _upgradeButtonOriginalColor: Color | null = null;

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        // 获取游戏管理器实例
        this._gameManager = GameManager.getInstance();

        // 初始化标题
        this.updateTitle();

        // 缓存升级按钮的原始颜色（用于恢复）
        if (this.upgradeButtonNode) {
            const sprite = this.upgradeButtonNode.getComponent(Sprite);
            if (sprite) {
                this._upgradeButtonOriginalColor = sprite.color.clone();
            }
            // 绑定升级按钮点击事件
            this.upgradeButtonNode.on(Node.EventType.TOUCH_END, this.onUpgradeClick, this);
        }

        // 绑定广告按钮点击事件（如果存在）
        if (this.adButtonNode) {
            this.adButtonNode.on(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
        }

        console.log(`[UpgradeItemCtrl] 初始化完成，类型: ${this.upgradeType}`);
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
        if (this.upgradeButtonNode) {
            this.upgradeButtonNode.off(Node.EventType.TOUCH_END, this.onUpgradeClick, this);
        }
        if (this.adButtonNode) {
            this.adButtonNode.off(Node.EventType.TOUCH_END, this.onAdButtonClick, this);
        }
    }

    /**
     * 升级按钮点击事件处理（余额购买）
     */
    private onUpgradeClick(): void {
        if (!this._gameManager) return;

        // 检查余额是否足够
        const currentPrice = this._gameManager.getUpgradePrice(this.upgradeType as UpgradeType);
        const balance = this._gameManager.getBalance();
        
        if (balance < currentPrice) {
            console.warn(`[UpgradeItemCtrl] 余额不足，需要: ${currentPrice}, 当前: ${balance}`);
            return;
        }

        // 执行升级
        const success = this._gameManager.buyUpgrade(this.upgradeType as UpgradeType);

        if (success) {
            console.log(`[UpgradeItemCtrl] 升级成功: ${this.upgradeType}`);
            // 升级成功后刷新 UI
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
        // 1. 检查广告是否可用
        // 2. 播放激励视频广告
        // 3. 广告播放成功后免费升级
        // 4. 刷新 UI
    }

    /**
     * 刷新所有 UI 显示
     * 包括价格、按钮状态
     */
    private refreshUI(): void {
        if (!this._gameManager) return;

        // 更新价格显示
        this.updatePriceDisplay();

        // 更新按钮状态（余额不足时变灰）
        this.updateButtonState();
    }

    /**
     * 更新标题显示
     */
    private updateTitle(): void {
        if (!this.titleLabel || !this._gameManager) return;

        const upgradeNames: Record<UpgradeType, string> = {
            'value': '面值',
            'animSpeed': '动画速度',
            'headProb': '正面概率',
            'critRate': '暴击率',
            'critBonus': '暴击加成',
            'pity': '保底',
            'streakBonus': '连击加成',
            'autoDuration': '自动持续时间'
        };
        const config = { name: upgradeNames[this.upgradeType] || '未知' };
        this.titleLabel.string = config.name;
    }

    /**
     * 更新价格显示
     */
    private updatePriceDisplay(): void {
        if (!this.priceLabel || !this._gameManager) return;

        const currentPrice = this._gameManager.getUpgradePrice(this.upgradeType as UpgradeType);
        this.priceLabel.string = `${currentPrice}`;
    }

    /**
     * 更新按钮状态
     * 余额不足时：
     * - 升级按钮置灰并禁用
     * - 广告按钮保持原色
     */
    private updateButtonState(): void {
        if (!this._gameManager) return;

        const currentPrice = this._gameManager.getUpgradePrice(this.upgradeType as UpgradeType);
        const balance = this._gameManager.getBalance();
        const canAfford = balance >= currentPrice;

        // 更新升级按钮状态
        if (this.upgradeButtonNode) {
            const button = this.upgradeButtonNode.getComponent(Button);
            const sprite = this.upgradeButtonNode.getComponent(Sprite);

            if (button) {
                // 余额不足时禁用交互
                button.interactable = canAfford;
            }

            if (sprite) {
                if (canAfford) {
                    // 余额充足：恢复原始颜色
                    if (this._upgradeButtonOriginalColor) {
                        sprite.color = this._upgradeButtonOriginalColor;
                    }
                } else {
                    // 余额不足：置灰
                    sprite.color = this.GRAY_COLOR;
                }
            }
        }

        // 广告按钮始终保持原色，不受余额影响
        if (this.adButtonNode) {
            const adButton = this.adButtonNode.getComponent(Button);
            if (adButton) {
                // 广告按钮始终可交互
                adButton.interactable = true;
            }
        }
    }
}