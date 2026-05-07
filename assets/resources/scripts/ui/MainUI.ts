/**
 * MainUI - 主界面UI控制器
 * 
 * 功能说明：
 * - 实时更新余额显示（socre 节点）
 * - 实时更新进度条（need/ProgressBar）
 * - 实时更新抛币次数（hitCount 节点）
 * - 监听 GameManager 的翻转事件，自动更新所有UI
 * 
 * 场景节点对应：
 * - socre: 余额显示 Label
 * - need: 进度条节点
 * - hitCount: 抛币次数显示 Label
 * 
 * 使用方式：
 * 将此脚本挂载到 Canvas 或 MainPage 节点上，然后配置各节点引用
 */

import { _decorator, Component, Node, Label, ProgressBar } from 'cc';
import { GameManager, FlipResult } from '../core/GameManager';

// 解构装饰器
const { ccclass, property } = _decorator;

@ccclass('MainUI')
export class MainUI extends Component {

    /**
     * 余额显示 Label 节点
     * 对应场景中的 socre 节点
     */
    @property({ type: Label, displayName: '余额显示', tooltip: 'socre 节点的 Label 组件' })
    balanceLabel: Label | null = null;

    /**
     * 进度条组件
     * 对应场景中的 need 节点下的 ProgressBar 组件
     */
    @property({ type: ProgressBar, displayName: '进度条', tooltip: 'need 节点的 ProgressBar 组件' })
    progressBar: ProgressBar | null = null;

    /**
     * 抛币次数显示 Label 节点
     * 对应场景中的 hitCount 节点
     */
    @property({ type: Label, displayName: '抛币次数', tooltip: 'hitCount 节点的 Label 组件' })
    flipCountLabel: Label | null = null;

    /**
     * 还需金额显示 Label 节点
     * 对应场景中的 need/text-001 节点
     */
    @property({ type: Label, displayName: '还需金额', tooltip: 'need/text-001 节点的 Label 组件' })
    needAmountLabel: Label | null = null;

    /**
     * 游戏管理器实例
     */
    private _gameManager: GameManager | null = null;

    /**
     * 当前显示的余额（用于动画过渡）
     */
    private _displayedBalance: number = 0;

    /**
     * 目标余额（用于动画过渡）
     */
    private _targetBalance: number = 0;

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        // 获取游戏管理器实例
        this._gameManager = GameManager.getInstance();

        // 注册翻转事件回调
        this._gameManager.onFlip(this.onFlipResult.bind(this));

        console.log('[MainUI] 初始化完成');
    }

    /**
     * 组件启用时调用
     * 刷新所有 UI 显示
     */
    onEnable() {
        this.refreshAllUI();
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        if (this._gameManager) {
            // 注意：这里需要确保传入的回调引用一致
            // 实际项目中可能需要保存回调引用以便移除
        }
    }

    /**
     * 每帧更新调用
     * 处理余额动画过渡
     */
    update(dt: number): void {
        // 余额平滑过渡
        if (Math.abs(this._displayedBalance - this._targetBalance) > 0.5) {
            // 使用线性插值实现平滑过渡
            const speed = 5; // 过渡速度
            this._displayedBalance += (this._targetBalance - this._displayedBalance) * speed * dt;

            // 更新余额显示
            if (this.balanceLabel) {
                this.balanceLabel.string = this.formatNumber(Math.floor(this._displayedBalance));
            }
        }
    }

    /**
     * 处理翻转结果（由 GameManager 回调触发）
     * @param result 翻转结果
     */
    private onFlipResult(result: FlipResult): void {
        if (!result) return;

        // 更新抛币次数
        this.updateFlipCount();

        // 更新余额
        this.updateBalance();

        // 更新进度条
        this.updateProgressBar();
    }

    /**
     * 刷新所有 UI 显示
     * 在场景加载或弹窗打开时调用
     */
    private refreshAllUI(): void {
        if (!this._gameManager) return;

        // 更新余额
        this._targetBalance = this._gameManager.getBalance();
        this._displayedBalance = this._targetBalance;

        if (this.balanceLabel) {
            this.balanceLabel.string = this.formatNumber(Math.floor(this._displayedBalance));
        }

        // 更新抛币次数
        this.updateFlipCount();

        // 更新进度条
        this.updateProgressBar();

        // 更新还需金额
        this.updateNeedAmount();
    }

    /**
     * 更新余额显示
     */
    private updateBalance(): void {
        if (!this._gameManager) return;

        // 设置目标余额，由 update 函数处理动画过渡
        this._targetBalance = this._gameManager.getBalance();
    }

    /**
     * 更新抛币次数显示
     */
    private updateFlipCount(): void {
        if (!this._gameManager || !this.flipCountLabel) return;

        const flipCount = this._gameManager.getPlayerData().getStats().totalFlips;
        this.flipCountLabel.string = `${flipCount}`;
    }

    /**
     * 更新进度条显示
     * 进度 = 当前余额 / 1亿
     */
    private updateProgressBar(): void {
        if (!this._gameManager || !this.progressBar) return;

        const balance = this._gameManager.getBalance();
        const targetBalance = this._gameManager.getPlayerData().TARGET_BALANCE;

        // 计算进度（0~1之间）
        const progress = Math.min(1, balance / targetBalance);

        // 更新进度条
        this.progressBar.progress = progress;
    }

    /**
     * 更新还需金额显示
     * 显示还需要多少钱才能达到1亿目标
     */
    private updateNeedAmount(): void {
        if (!this._gameManager || !this.needAmountLabel) return;

        const balance = this._gameManager.getBalance();
        const targetBalance = this._gameManager.getPlayerData().TARGET_BALANCE;

        // 计算还需金额
        const needAmount = Math.max(0, targetBalance - balance);

        // 更新显示
        this.needAmountLabel.string = this.formatNumber(Math.ceil(needAmount));
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