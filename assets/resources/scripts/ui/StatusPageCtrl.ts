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
     * 属性-面值 currentValue Label
     */
    @property({ type: Label, displayName: '面值', tooltip: 'StatusPage/upgrades/value/currentValue' })
    valueLabel: Label | null = null;

    /**
     * 属性-速度 currentValue Label
     */
    @property({ type: Label, displayName: '速度', tooltip: 'StatusPage/upgrades/speed/currentValue' })
    speedLabel: Label | null = null;

    /**
     * 属性-幸运 currentValue Label
     */
    @property({ type: Label, displayName: '幸运', tooltip: 'StatusPage/upgrades/lucky/currentValue' })
    luckyLabel: Label | null = null;

    /**
     * 属性-暴击 currentValue Label
     */
    @property({ type: Label, displayName: '暴击率', tooltip: 'StatusPage/upgrades/critical/currentValue' })
    criticalLabel: Label | null = null;

    /**
     * 属性-暴击加成 currentValue Label
     */
    @property({ type: Label, displayName: '暴击加成', tooltip: 'StatusPage/upgrades/criticalBonus/currentValue' })
    criticalBonusLabel: Label | null = null;

    /**
     * 属性-保底 currentValue Label
     */
    @property({ type: Label, displayName: '保底', tooltip: 'StatusPage/upgrades/pity/currentValue' })
    pityLabel: Label | null = null;

    /**
     * 属性-连击加成 currentValue Label
     */
    @property({ type: Label, displayName: '连击加成', tooltip: 'StatusPage/upgrades/streakBonus/currentValue' })
    streakBonusLabel: Label | null = null;

    /**
     * 属性-自动时间 currentValue Label
     */
    @property({ type: Label, displayName: '自动时间', tooltip: 'StatusPage/upgrades/time/currentValue' })
    timeLabel: Label | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 记录初始 X 坐标（固定值，避免 Widget 组件影响）
     */
    private _originalX: number = -720;

    /**
     * 组件加载时调用
     */
    onLoad() {
        this._gameManager = GameManager.getInstance();

        // 绑定返回按钮事件
        if (this.backBtnNode) {
            this.backBtnNode.on(Node.EventType.TOUCH_END, this.onBackClick, this);
        }

        // 记录初始 X 位置，不再通过 active 控制显示/隐藏
        this._originalX = this.node.position.x;
        console.log('[StatusPageCtrl] 初始化完成，初始 X:', this._originalX);
    }

    /**
     * 组件销毁时调用
     */
    onDestroy() {
        if (this.backBtnNode && this.backBtnNode.isValid) {
            this.backBtnNode.off(Node.EventType.TOUCH_END, this.onBackClick, this);
        }
    }

    /**
     * 返回按钮点击事件处理
     */
    private onBackClick(): void {
        console.log('[StatusPageCtrl] onBackClick 被调用');
        this.hide();
    }

    /**
     * 显示状态页面（X 坐标归零）
     */
    show(): void {
        console.log('[StatusPageCtrl] show() 被调用');
        console.log('[StatusPageCtrl] 设置 X = 0');
        this.node.setPosition(0, 0, 0);
        this.refreshUI();
        console.log('[StatusPageCtrl] show() 完成');
    }

    /**
     * 隐藏状态页面（恢复初始 X 坐标）
     */
    hide(): void {
        console.log('[StatusPageCtrl] hide() 被调用');
        console.log('[StatusPageCtrl] 恢复 X:', this._originalX);
        this.node.setPosition(this._originalX, 0, 0);
        console.log('[StatusPageCtrl] hide() 完成');
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

        this.refreshUpgrades();
    }

    /**
     * 刷新 8 个属性 currentValue
     */
    private refreshUpgrades(): void {
        if (!this._gameManager) return;

        if (this.valueLabel) {
            this.valueLabel.string = NumberFormatter.formatMoney(this._gameManager.getUpgradeValue('value'));
        }

        if (this.speedLabel) {
            this.speedLabel.string = NumberFormatter.formatTimeDecimal(this._gameManager.getUpgradeValue('speed'));
        }

        if (this.luckyLabel) {
            this.luckyLabel.string = NumberFormatter.formatPercent(this._gameManager.getUpgradeValue('lucky'));
        }

        if (this.criticalLabel) {
            this.criticalLabel.string = NumberFormatter.formatPercent(this._gameManager.getUpgradeValue('critical'));
        }

        if (this.criticalBonusLabel) {
            this.criticalBonusLabel.string = NumberFormatter.formatMoney(this._gameManager.getUpgradeValue('criticalBonus'));
        }

        if (this.pityLabel) {
            this.pityLabel.string = NumberFormatter.formatCount(this._gameManager.getUpgradeValue('pity'));
        }

        if (this.streakBonusLabel) {
            this.streakBonusLabel.string = NumberFormatter.formatMoney(this._gameManager.getUpgradeValue('streakBonus'));
        }

        if (this.timeLabel) {
            this.timeLabel.string = NumberFormatter.formatTime(this._gameManager.getUpgradeValue('time'));
        }
    }
}
