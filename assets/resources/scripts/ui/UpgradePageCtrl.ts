/**
 * UpgradePageCtrl - 升级页面控制器
 * 
 * 功能说明：
 * - 管理 UpgradePage 页面的显示/隐藏
 * - 管理页面内的 8 个升级项
 * - 处理返回按钮（回到 MainPage）
 * - 显示当前余额
 * 
 * 场景节点对应：
 * - UpgradePage（挂载此脚本）
 *   ├── bg: 背景
 *   ├── title: 标题栏
 *   │   ├── bg
 *   │   ├── 返回: 返回按钮
 *   │   ├── 升级: 标题文字
 *   │   └── Label: 标题 Label
 *   ├── money: 余额显示
 *   │   ├── bg
 *   │   ├── Label: 余额数值
 *   │   ├── desc
 *   │   └── 极窄金框
 *   └── upgrades: 升级项列表
 *       ├── value（挂载 UpgradeItemCtrl，Index=0）
 *       ├── speed（挂载 UpgradeItemCtrl，Index=1）
 *       ├── lucky（挂载 UpgradeItemCtrl，Index=2）
 *       ├── critical（挂载 UpgradeItemCtrl，Index=3）
 *       ├── criticalBonus（挂载 UpgradeItemCtrl，Index=4）
 *       ├── pity（挂载 UpgradeItemCtrl，Index=5）
 *       ├── streakBonus（挂载 UpgradeItemCtrl，Index=6）
 *       └── time（挂载 UpgradeItemCtrl，Index=7）
 */

import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('UpgradePageCtrl')
export class UpgradePageCtrl extends Component {

    /**
     * 返回按钮节点
     */
    @property({ type: Node, displayName: '返回按钮', tooltip: 'UpgradePage/title/返回 节点' })
    backBtnNode: Node | null = null;

    /**
     * 余额 Label 节点
     */
    @property({ type: Label, displayName: '余额', tooltip: 'UpgradePage/money/Label 节点的 Label 组件' })
    balanceLabel: Label | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 组件加载时调用
     */
    onLoad() {
        this._gameManager = GameManager.getInstance();

        // 绑定返回按钮事件
        if (this.backBtnNode) {
            this.backBtnNode.on(Node.EventType.TOUCH_END, this.onBackClick, this);
        }

        // 初始隐藏
        this.node.active = false;

        console.log('[UpgradePageCtrl] 初始化完成');
    }

    /**
     * 组件销毁时调用
     */
    onDestroy() {
        if (this.backBtnNode) {
            this.backBtnNode.off(Node.EventType.TOUCH_END, this.onBackClick, this);
        }
    }

    /**
     * 返回按钮点击事件处理
     */
    private onBackClick(): void {
        this.hide();
    }

    /**
     * 显示升级页面
     */
    show(): void {
        this.node.active = true;
        this.refreshUI();
    }

    /**
     * 隐藏升级页面
     */
    hide(): void {
        this.node.active = false;
    }

    /**
     * 刷新所有 UI 显示
     */
    private refreshUI(): void {
        if (!this._gameManager) return;

        // 更新余额显示
        if (this.balanceLabel) {
            const balance = this._gameManager.getBalance();
            this.balanceLabel.string = `${balance}`;
        }
    }
}
