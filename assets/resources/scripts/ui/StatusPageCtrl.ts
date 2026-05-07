/**
 * StatusPageCtrl - 状态页面控制器
 * 
 * 功能说明：
 * - 管理 StatusPage 页面的显示/隐藏
 * - 显示预期收益、生涯统计、属性展示
 * - 处理返回按钮（回到 MainPage）
 * 
 * 场景节点对应：
 * - StatusPage（挂载此脚本）
 *   ├── bg: 背景
 *   ├── title: 标题栏
 *   │   ├── bg
 *   │   ├── 返回: 返回按钮
 *   │   ├── 排行榜: 标题文字
 *   │   └── Label: 标题 Label
 *   ├── prediction: 预期收益
 *   │   ├── bg
 *   │   ├── 边框 (1)
 *   │   ├── Label: 预期收益标题
 *   │   └── Label-001: 预期收益数值
 *   ├── record_section: 记录区域
 *   │   ├── bg
 *   │   └── record
 *   │       ├── total_flip_count: 总翻转次数
 *   │       │   ├── bg
 *   │       │   ├── 边框2
 *   │       │   ├── desc: 描述文字
 *   │       │   └── Label-001: 数值
 *   │       ├── highest_streak: 最高连击
 *   │       │   ├── bg
 *   │       │   ├── 边框2
 *   │       │   ├── desc
 *   │       │   └── Label-001: 数值
 *   │       ├── total_critical_count: 总暴击次数
 *   │       │   ├── bg
 *   │       │   ├── 边框2
 *   │       │   ├── desc
 *   │       │   └── Label-001: 数值
 *   │       └── total_auto_time: 总自动时间
 *   │           ├── bg
 *   │           ├── 边框2
 *   │           ├── desc
 *   │           └── Label-001: 数值
 *   └── upgrades: 属性展示
 *       ├── value: 面值属性
 *       │   ├── bg
 *       │   ├── icon
 *       │   ├── name: 名称
 *       │   ├── currentValue: 当前值
 *       │   ├── desc: 描述
 *       │   └── 极窄金框
 *       ├── speed: 速度属性
 *       ├── lucky: 幸运属性
 *       ├── critical: 暴击属性
 *       ├── criticalBonus: 暴击加成属性
 *       ├── pity: 保底属性
 *       ├── streakBonus: 连击加成属性
 *       └── time: 自动时间属性
 */

import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';
import { NumberFormatter } from '../utils/NumberFormatter';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('StatusPageCtrl')
export class StatusPageCtrl extends Component {

    /**
     * 返回按钮节点
     */
    @property({ type: Node, displayName: '返回按钮', tooltip: 'StatusPage/title/返回 节点' })
    backBtnNode: Node | null = null;

    /**
     * 预期收益 Label 节点
     */
    @property({ type: Label, displayName: '预期收益', tooltip: 'StatusPage/prediction/Label-001 节点的 Label 组件' })
    expectedValueLabel: Label | null = null;

    /**
     * 总翻转次数 Label 节点
     */
    @property({ type: Label, displayName: '总翻转次数', tooltip: 'StatusPage/record_section/record/total_flip_count/Label-001' })
    totalFlipCountLabel: Label | null = null;

    /**
     * 最高连击 Label 节点
     */
    @property({ type: Label, displayName: '最高连击', tooltip: 'StatusPage/record_section/record/highest_streak/Label-001' })
    highestStreakLabel: Label | null = null;

    /**
     * 总暴击次数 Label 节点
     */
    @property({ type: Label, displayName: '总暴击次数', tooltip: 'StatusPage/record_section/record/total_critical_count/Label-001' })
    totalCriticalCountLabel: Label | null = null;

    /**
     * 总自动时间 Label 节点
     */
    @property({ type: Label, displayName: '总自动时间', tooltip: 'StatusPage/record_section/record/total_auto_time/Label-001' })
    totalAutoTimeLabel: Label | null = null;

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

        console.log('[StatusPageCtrl] 初始化完成');
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
     * 显示状态页面
     */
    show(): void {
        this.node.active = true;
        this.refreshUI();
    }

    /**
     * 隐藏状态页面
     */
    hide(): void {
        this.node.active = false;
    }

    /**
     * 刷新所有 UI 显示
     */
    private refreshUI(): void {
        if (!this._gameManager) return;

        // 更新预期收益
        if (this.expectedValueLabel) {
            const ev = this._gameManager.getExpectedValue();
            this.expectedValueLabel.string = NumberFormatter.formatMoney(ev);
        }

        // 更新生涯统计
        const stats = this._gameManager.getPlayerData().getStats();

        if (this.totalFlipCountLabel) {
            this.totalFlipCountLabel.string = `${stats.totalFlips}`;
        }

        if (this.highestStreakLabel) {
            this.highestStreakLabel.string = `${stats.maxStreak}`;
        }

        if (this.totalCriticalCountLabel) {
            this.totalCriticalCountLabel.string = `${stats.totalCrits}`;
        }

        if (this.totalAutoTimeLabel) {
            this.totalAutoTimeLabel.string = NumberFormatter.formatTime(stats.totalAutoTime);
        }
    }
}
