/**
 * ButtonStateManager - 按钮状态管理器
 * 
 * 功能说明：
 * - 管理游戏中所有按钮的状态
 * - 在硬币翻转时禁用除设置按钮外的所有按钮
 * - 翻转结束后恢复所有按钮状态
 * 
 * 场景节点对应：
 * - button_setting: 设置按钮（翻转时不禁用）
 * - button_shop: 商店按钮
 * - button_status: 状态按钮
 * - UpgradeSection 下的所有 buy 和 ad 按钮
 * 
 * 使用方式：
 * 将此脚本挂载到 Canvas 节点上
 */

import { _decorator, Component, Node, Button, Sprite, Color } from 'cc';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('ButtonStateManager')
export class ButtonStateManager extends Component {

    /**
     * 设置按钮节点（翻转时不禁用）
     */
    @property({ type: Node, displayName: '设置按钮', tooltip: 'button_setting 节点' })
    settingButton: Node | null = null;

    /**
     * 商店按钮节点
     */
    @property({ type: Node, displayName: '商店按钮', tooltip: 'button_shop 节点' })
    shopButton: Node | null = null;

    /**
     * 状态按钮节点
     */
    @property({ type: Node, displayName: '状态按钮', tooltip: 'button_status 节点' })
    statusButton: Node | null = null;

    /**
     * 升级区域的所有升级项按钮（MainPage）
     */
    @property({ type: Node, displayName: '升级区域（MainPage）', tooltip: 'UpgradeSection 节点' })
    upgradeSectionMain: Node | null = null;

    /**
     * 置灰颜色
     */
    private readonly GRAY_COLOR = new Color(128, 128, 128, 255);

    /**
     * 按钮原始状态缓存
     */
    private _buttonStates: Map<string, { interactable: boolean; color: Color }> = new Map();

    /**
     * 是否正在翻转中
     */
    private _isFlipping: boolean = false;

    /**
     * 禁用所有按钮（硬币翻转时调用）
     */
    public disableAllButtons(): void {
        if (this._isFlipping) return;
        this._isFlipping = true;

        console.log('[ButtonStateManager] 禁用所有按钮（硬币翻转中）');

        // 禁用商店按钮
        if (this.shopButton) {
            this.disableButton(this.shopButton, 'shopButton');
        }

        // 禁用状态按钮
        if (this.statusButton) {
            this.disableButton(this.statusButton, 'statusButton');
        }

        // 禁用 MainPage 升级区域的所有按钮
        if (this.upgradeSectionMain) {
            this.disableUpgradeSectionButtons(this.upgradeSectionMain);
        }
    }

    /**
     * 恢复所有按钮（翻转结束后调用）
     */
    public enableAllButtons(): void {
        if (!this._isFlipping) return;
        this._isFlipping = false;

        console.log('[ButtonStateManager] 恢复所有按钮');

        // 恢复商店按钮
        if (this.shopButton) {
            this.enableButton(this.shopButton, 'shopButton');
        }

        // 恢复状态按钮
        if (this.statusButton) {
            this.enableButton(this.statusButton, 'statusButton');
        }

        // 恢复 MainPage 升级区域的所有按钮
        if (this.upgradeSectionMain) {
            this.enableUpgradeSectionButtons(this.upgradeSectionMain);
        }
    }

    /**
     * 禁用单个按钮
     */
    private disableButton(buttonNode: Node, key: string): void {
        const button = buttonNode.getComponent(Button);
        const sprite = buttonNode.getComponent(Sprite);

        if (button) {
            this._buttonStates.set(key, {
                interactable: button.interactable,
                color: sprite ? sprite.color.clone() : new Color(255, 255, 255, 255)
            });
            button.interactable = false;
        }

        if (sprite) {
            sprite.color = this.GRAY_COLOR;
        }
    }

    /**
     * 启用单个按钮
     */
    private enableButton(buttonNode: Node, key: string): void {
        const button = buttonNode.getComponent(Button);
        const sprite = buttonNode.getComponent(Sprite);
        const savedState = this._buttonStates.get(key);

        if (button && savedState) {
            button.interactable = savedState.interactable;
        }

        if (sprite && savedState) {
            sprite.color = savedState.color;
        }
    }

    /**
     * 禁用升级区域的所有按钮
     */
    private disableUpgradeSectionButtons(section: Node): void {
        // 遍历所有子节点
        section.children.forEach(child => {
            const buyButton = child.getChildByName('buy');
            const adButton = child.getChildByName('ad');

            if (buyButton) {
                const buyKey = `buy_${child.name}`;
                this.disableButton(buyButton, buyKey);
            }

            if (adButton) {
                const adKey = `ad_${child.name}`;
                this.disableButton(adButton, adKey);
            }
        });
    }

    /**
     * 启用升级区域的所有按钮
     */
    private enableUpgradeSectionButtons(section: Node): void {
        // 遍历所有子节点
        section.children.forEach(child => {
            const buyButton = child.getChildByName('buy');
            const adButton = child.getChildByName('ad');

            if (buyButton) {
                const buyKey = `buy_${child.name}`;
                this.enableButton(buyButton, buyKey);
            }

            if (adButton) {
                const adKey = `ad_${child.name}`;
                this.enableButton(adButton, adKey);
            }
        });
    }
}
