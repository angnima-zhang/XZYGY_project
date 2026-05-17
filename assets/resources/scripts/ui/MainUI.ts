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
     * 余额变更回调引用（用于 onDestroy 中移除）
     */
    private _balanceChangeCallback: (() => void) | null = null;

    /**
     * 组件加载时调用
     * 初始化组件引用和事件监听
     */
    onLoad() {
        this._gameManager = GameManager.getInstance();
        console.log('[MainUI] onLoad, _gameManager:', !!this._gameManager);
        console.log('[MainUI] onLoad, balanceLabel:', this.balanceLabel ? '已绑定' : '未绑定');
        console.log('[MainUI] onLoad, flipCountLabel:', this.flipCountLabel ? '已绑定' : '未绑定');
        console.log('[MainUI] onLoad, needAmountLabel:', this.needAmountLabel ? '已绑定' : '未绑定');
        console.log('[MainUI] onLoad, progressBar:', this.progressBar ? '已绑定' : '未绑定');

        // 注册翻转事件回调
        this._gameManager.onFlip(this.onFlipResult.bind(this));
        console.log('[MainUI] 翻转事件回调已注册');

        // 注册余额变更回调（购买升级时触发）
        this._balanceChangeCallback = this.onBalanceChanged.bind(this);
        this._gameManager.onBalanceChange(this._balanceChangeCallback);
        console.log('[MainUI] 余额变更回调已注册');

        console.log('[MainUI] 初始化完成');
    }

    onEnable() {
        console.log('[MainUI] onEnable 被调用');
        this.refreshAllUI();
    }

    /**
     * 组件销毁时调用
     * 清理事件监听
     */
    onDestroy() {
        if (this._gameManager) {
            this._gameManager.offFlip(this.onFlipResult.bind(this));
            if (this._balanceChangeCallback) {
                this._gameManager.offBalanceChange(this._balanceChangeCallback);
            }
        }
    }

    /**
     * 余额变更回调（升级购买等触发）
     */
    private onBalanceChanged(): void {
        console.log('[MainUI] onBalanceChanged 被调用');
        this.updateBalance();
        this.updateNeedAmount();
    }

    /**
     * 每帧更新调用
     * 处理余额动画过渡
     */
    update(dt: number): void {
        const diff = this._targetBalance - this._displayedBalance;
        if (Math.abs(diff) < 0.01) {
            // 接近目标值，直接对齐并写入最终结果
            if (Math.abs(diff) > 0.0001) {
                this._displayedBalance = this._targetBalance;
                if (this.balanceLabel) {
                    this.balanceLabel.string = this.formatNumber(Math.floor(this._displayedBalance));
                }
            }
            return;
        }

        const speed = 20;
        this._displayedBalance += diff * speed * dt;

        if (this.balanceLabel) {
            this.balanceLabel.string = this.formatNumber(Math.floor(this._displayedBalance));
        }
    }

    private onFlipResult(result: FlipResult): void {
        console.log('[MainUI] onFlipResult 被调用, result:', result ? `isHead=${result.isHead}, score=${result.score}, streak=${result.streak}` : 'result为空');
        if (!result) {
            console.warn('[MainUI] onFlipResult 失败: result 为空');
            return;
        }

        // 更新抛币次数
        this.updateFlipCount();

        // 更新余额
        this.updateBalance();

        // 更新进度条
        this.updateProgressBar();

        // 更新还需金额
        this.updateNeedAmount();
        console.log('[MainUI] onFlipResult 处理完成');
    }

    private refreshAllUI(): void {
        console.log('[MainUI] refreshAllUI 被调用');
        if (!this._gameManager) {
            console.warn('[MainUI] refreshAllUI 失败: _gameManager 为空');
            return;
        }

        // 更新余额
        this._targetBalance = this._gameManager.getBalance();
        this._displayedBalance = this._targetBalance;
        console.log('[MainUI] refreshAllUI, targetBalance:', this._targetBalance, ', displayedBalance:', this._displayedBalance);

        if (this.balanceLabel) {
            this.balanceLabel.string = this.formatNumber(Math.floor(this._displayedBalance));
            console.log('[MainUI] refreshAllUI, balanceLabel 设置为:', this.balanceLabel.string);
        } else {
            console.warn('[MainUI] refreshAllUI, balanceLabel 未绑定');
        }

        // 更新抛币次数
        this.updateFlipCount();

        // 更新进度条
        this.updateProgressBar();

        // 更新还需金额
        this.updateNeedAmount();
        console.log('[MainUI] refreshAllUI 完成');
    }

    private updateBalance(): void {
        if (!this._gameManager) {
            console.warn('[MainUI] updateBalance 失败: _gameManager 为空');
            return;
        }

        const prevTarget = this._targetBalance;
        this._targetBalance = this._gameManager.getBalance();
        console.log(`[MainUI] updateBalance, prevTarget=${prevTarget} -> newTarget=${this._targetBalance}`);
    }

    private updateFlipCount(): void {
        if (!this._gameManager) {
            console.warn('[MainUI] updateFlipCount 失败: _gameManager 为空');
            return;
        }
        if (!this.flipCountLabel) {
            console.warn('[MainUI] updateFlipCount 失败: flipCountLabel 未绑定');
            return;
        }

        const flipCount = this._gameManager.getPlayerData().getStats().totalFlips;
        console.log(`[MainUI] updateFlipCount, 总翻转次数=${flipCount}, flipCountLabel当前值=${this.flipCountLabel.string}`);
        this.flipCountLabel.string = `${flipCount}`;
        console.log(`[MainUI] updateFlipCount, flipCountLabel更新为=${this.flipCountLabel.string}`);
    }

    private updateProgressBar(): void {
        if (!this._gameManager) {
            console.warn('[MainUI] updateProgressBar 失败: _gameManager 为空');
            return;
        }
        if (!this.progressBar) {
            console.warn('[MainUI] updateProgressBar 失败: progressBar 未绑定');
            return;
        }

        const balance = this._gameManager.getBalance();
        const targetBalance = this._gameManager.getPlayerData().TARGET_BALANCE;
        const progress = Math.min(1, balance / targetBalance);
        console.log(`[MainUI] updateProgressBar, balance=${balance}, target=${targetBalance}, progress=${progress}`);
        this.progressBar.progress = progress;
        console.log(`[MainUI] updateProgressBar, progressBar.progress 更新为=${this.progressBar.progress}`);
    }

    private updateNeedAmount(): void {
        if (!this._gameManager) {
            console.warn('[MainUI] updateNeedAmount 失败: _gameManager 为空');
            return;
        }
        if (!this.needAmountLabel) {
            console.warn('[MainUI] updateNeedAmount 失败: needAmountLabel 未绑定');
            return;
        }

        const balance = this._gameManager.getBalance();
        const targetBalance = this._gameManager.getPlayerData().TARGET_BALANCE;
        const needAmount = Math.max(0, targetBalance - balance);
        const oldText = this.needAmountLabel.string;
        this.needAmountLabel.string = this.formatNumber(Math.ceil(needAmount));
        console.log(`[MainUI] updateNeedAmount, balance=${balance}, target=${targetBalance}, needAmount=${needAmount}, oldText=${oldText} -> newText=${this.needAmountLabel.string}`);
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
