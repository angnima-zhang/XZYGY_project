/**
 * StatsPopupCtrl - 属性面板控制器
 * 
 * 功能说明：
 * - 管理属性面板的显示/隐藏
 * - 展示预期收益（大数字）
 * - 展示4个统计卡片：
 *   1. 总抛硬币次数
 *   2. 总暴击次数
 *   3. 历史最高余额
 *   4. 历史最高连击
 * - 展示8个属性值：
 *   1. 面值
 *   2. 动画速度
 *   3. 正面概率
 *   4. 暴击率
 *   5. 暴击加成
 *   6. 保底
 *   7. 连击加成
 *   8. 自动持续时间
 * 
 * 场景节点对应：
 * - StatsPopup 根节点
 *   ├── bg: 背景
 *   ├── btn_close: 关闭按钮
 *   ├── expectedValue: 预期收益 Label
 *   ├── stat1_totalFlips: 总抛硬币次数
 *   ├── stat2_totalCrits: 总暴击次数
 *   ├── stat3_maxBalance: 历史最高余额
 *   ├── stat4_maxStreak: 历史最高连击
 *   ├── attr1_value: 面值
 *   ├── attr2_animSpeed: 动画速度
 *   ├── attr3_headProb: 正面概率
 *   ├── attr4_critRate: 暴击率
 *   ├── attr5_critBonus: 暴击加成
 *   ├── attr6_pity: 保底
 *   ├── attr7_streakBonus: 连击加成
 *   └── attr8_autoDuration: 自动持续时间
 * 
 * 使用方式：
 * 将此脚本挂载到 StatsPopup 根节点上，配置各节点引用
 */

import { _decorator, Component, Node, Label, tween, Vec3, UIOpacity } from 'cc';
import { GameManager } from '../core/GameManager';
import { UpgradeType } from '../core/PlayerData';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('StatsPopupCtrl')
export class StatsPopupCtrl extends Component {

    /**
     * 关闭按钮节点
     */
    @property({ type: Node, displayName: '关闭按钮', tooltip: 'btn_close 节点' })
    closeBtnNode: Node | null = null;

    /**
     * 预期收益 Label
     */
    @property({ type: Label, displayName: '预期收益', tooltip: 'expectedValue 节点的 Label 组件' })
    expectedValueLabel: Label | null = null;

    /**
     * 统计1：总抛硬币次数 Label
     */
    @property({ type: Label, displayName: '总抛硬币次数', tooltip: 'stat1_totalFlips 节点的 Label 组件' })
    stat1TotalFlipsLabel: Label | null = null;

    /**
     * 统计2：总暴击次数 Label
     */
    @property({ type: Label, displayName: '总暴击次数', tooltip: 'stat2_totalCrits 节点的 Label 组件' })
    stat2TotalCritsLabel: Label | null = null;

    /**
     * 统计3：历史最高余额 Label
     */
    @property({ type: Label, displayName: '历史最高余额', tooltip: 'stat3_maxBalance 节点的 Label 组件' })
    stat3MaxBalanceLabel: Label | null = null;

    /**
     * 统计4：历史最高连击 Label
     */
    @property({ type: Label, displayName: '历史最高连击', tooltip: 'stat4_maxStreak 节点的 Label 组件' })
    stat4MaxStreakLabel: Label | null = null;

    /**
     * 属性1：面值 Label
     */
    @property({ type: Label, displayName: '面值', tooltip: 'attr1_value 节点的 Label 组件' })
    attr1ValueLabel: Label | null = null;

    /**
     * 属性2：动画速度 Label
     */
    @property({ type: Label, displayName: '动画速度', tooltip: 'attr2_animSpeed 节点的 Label 组件' })
    attr2AnimSpeedLabel: Label | null = null;

    /**
     * 属性3：正面概率 Label
     */
    @property({ type: Label, displayName: '正面概率', tooltip: 'attr3_headProb 节点的 Label 组件' })
    attr3HeadProbLabel: Label | null = null;

    /**
     * 属性4：暴击率 Label
     */
    @property({ type: Label, displayName: '暴击率', tooltip: 'attr4_critRate 节点的 Label 组件' })
    attr4CritRateLabel: Label | null = null;

    /**
     * 属性5：暴击加成 Label
     */
    @property({ type: Label, displayName: '暴击加成', tooltip: 'attr5_critBonus 节点的 Label 组件' })
    attr5CritBonusLabel: Label | null = null;

    /**
     * 属性6：保底 Label
     */
    @property({ type: Label, displayName: '保底', tooltip: 'attr6_pity 节点的 Label 组件' })
    attr6PityLabel: Label | null = null;

    /**
     * 属性7：连击加成 Label
     */
    @property({ type: Label, displayName: '连击加成', tooltip: 'attr7_streakBonus 节点的 Label 组件' })
    attr7StreakBonusLabel: Label | null = null;

    /**
     * 属性8：自动持续时间 Label
     */
    @property({ type: Label, displayName: '自动持续时间', tooltip: 'attr8_autoDuration 节点的 Label 组件' })
    attr8AutoDurationLabel: Label | null = null;

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

        // 初始隐藏
        this.node.active = false;

        console.log('[StatsPopupCtrl] 初始化完成');
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        if (this.closeBtnNode) {
            this.closeBtnNode.off(Node.EventType.TOUCH_END, this.onCloseClick, this);
        }
    }

    /**
     * 显示属性面板
     * 带有渐入动画
     */
    show(): void {
        if (this._isShowing) return;

        this._isShowing = true;
        this.node.active = true;

        // 刷新所有数据
        this.refreshAllData();

        // 播放渐入动画
        this.playShowAnimation();
    }

    /**
     * 隐藏属性面板
     * 带有渐出动画
     */
    hide(): void {
        if (!this._isShowing) return;

        this._isShowing = false;

        // 播放渐出动画
        this.playHideAnimation();
    }

    /**
     * 刷新所有数据
     * 包括预期收益、统计卡片、8个属性值
     */
    private refreshAllData(): void {
        if (!this._gameManager) return;

        // 刷新预期收益
        this.refreshExpectedValue();

        // 刷新统计卡片
        this.refreshStats();

        // 刷新8个属性值
        this.refreshAttributes();
    }

    /**
     * 刷新预期收益
     * 公式：E = 面值 + (暴击率 × 暴击加成) + (正面概率 × 暴击加成) + 连击加成 / 2
     */
    private refreshExpectedValue(): void {
        if (!this.expectedValueLabel || !this._gameManager) return;

        const expectedValue = this._gameManager.getExpectedValue();
        this.expectedValueLabel.string = this.formatNumber(expectedValue);
    }

    /**
     * 刷新统计卡片
     */
    private refreshStats(): void {
        if (!this._gameManager) return;

        const stats = this._gameManager.getPlayerData().getStats();

        // 统计1：总抛硬币次数
        if (this.stat1TotalFlipsLabel) {
            this.stat1TotalFlipsLabel.string = this.formatNumber(stats.totalFlips);
        }

        // 统计2：总暴击次数
        if (this.stat2TotalCritsLabel) {
            this.stat2TotalCritsLabel.string = this.formatNumber(stats.totalCrits);
        }

        // 统计3：历史最高余额
        if (this.stat3MaxBalanceLabel) {
            this.stat3MaxBalanceLabel.string = this.formatNumber(stats.maxBalance);
        }

        // 统计4：历史最高连击
        if (this.stat4MaxStreakLabel) {
            this.stat4MaxStreakLabel.string = this.formatNumber(stats.maxStreak);
        }
    }

    /**
     * 刷新8个属性值
     */
    private refreshAttributes(): void {
        if (!this._gameManager) return;

        // 属性1：面值
        if (this.attr1ValueLabel) {
            const value = this._gameManager.getUpgradeValue('value');
            this.attr1ValueLabel.string = `${value}`;
        }

        // 属性2：动画速度
        if (this.attr2AnimSpeedLabel) {
            const speed = this._gameManager.getUpgradeValue('animSpeed');
            this.attr2AnimSpeedLabel.string = `${speed}秒`;
        }

        // 属性3：正面概率
        if (this.attr3HeadProbLabel) {
            const headProb = this._gameManager.getUpgradeValue('headProb');
            this.attr3HeadProbLabel.string = `${headProb}%`;
        }

        // 属性4：暴击率
        if (this.attr4CritRateLabel) {
            const critRate = this._gameManager.getUpgradeValue('critRate');
            this.attr4CritRateLabel.string = `${critRate}%`;
        }

        // 属性5：暴击加成
        if (this.attr5CritBonusLabel) {
            const critBonus = this._gameManager.getUpgradeValue('critBonus');
            this.attr5CritBonusLabel.string = `${critBonus}`;
        }

        // 属性6：保底
        if (this.attr6PityLabel) {
            const pity = this._gameManager.getUpgradeValue('pity');
            this.attr6PityLabel.string = `${pity}次`;
        }

        // 属性7：连击加成
        if (this.attr7StreakBonusLabel) {
            const streakBonus = this._gameManager.getUpgradeValue('streakBonus');
            this.attr7StreakBonusLabel.string = `${streakBonus}`;
        }

        // 属性8：自动持续时间
        if (this.attr8AutoDurationLabel) {
            const autoDuration = this._gameManager.getUpgradeValue('autoDuration');
            this.attr8AutoDurationLabel.string = `${autoDuration}秒`;
        }
    }

    /**
     * 关闭按钮点击事件处理
     */
    private onCloseClick(): void {
        this.hide();
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

    /**
     * 格式化数字（添加千分位分隔符）
     * @param num 数字
     * @returns 格式化后的字符串
     */
    private formatNumber(num: number): string {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
}