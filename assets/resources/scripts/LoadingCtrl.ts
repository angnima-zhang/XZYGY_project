/**
 * LoadingCtrl - 加载界面控制器
 * 
 * 功能说明：
 * - 管理游戏启动时的资源加载流程
 * - 实时更新进度条和百分比显示
 * - 加载完成后自动跳转到主场景
 * 
 * 使用方式：
 * 1. 将此脚本挂载到 loading.scene 的 Canvas 节点上
 * 2. 在属性面板中配置三个引用：进度条组件、百分比标签、描述标签
 * 3. 运行游戏自动执行加载流程
 * 
 * 作者：Trae AI
 * 创建时间：2026-05-06
 */

import { _decorator, Component, Node, ProgressBar, Label, director } from 'cc';

// 解构装饰器，用于定义 CC 类和属性
const { ccclass, property } = _decorator;

/**
 * 加载界面控制器类
 * 负责管理加载进度的显示和场景切换
 */
@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {

    /**
     * 进度条组件引用
     * 需要在编辑器中拖入 ProgressBar 组件
     */
    @property({ 
        type: ProgressBar, 
        displayName: '进度条组件',
        tooltip: '拖入 progress/ProgressBar 节点上的 ProgressBar 组件'
    })
    progressBar: ProgressBar | null = null;

    /**
     * 百分比标签引用
     * 显示当前加载进度的百分比数字（如：50%）
     */
    @property({ 
        type: Label, 
        displayName: '百分比标签',
        tooltip: '拖入 load/num 节点上的 Label 组件'
    })
    percentLabel: Label | null = null;

    /**
     * 描述标签引用
     * 显示加载状态描述文字（如：加载中...）
     */
    @property({ 
        type: Label, 
        displayName: '描述标签',
        tooltip: '拖入 load/desc 节点上的 Label 组件'
    })
    descLabel: Label | null = null;

    /**
     * 当前加载进度值 [0, 1]
     * 0 表示未开始，1 表示加载完成
     */
    private _currentProgress: number = 0;

    /**
     * 组件启动时调用
     * 初始化界面元素并开始模拟加载
     */
    start() {
        // 初始化进度条为 0
        if (this.progressBar) {
            this.progressBar.progress = 0;
            console.log('[LoadingCtrl] 进度条已初始化');
        }

        // 初始化百分比标签显示
        if (this.percentLabel) {
            this.percentLabel.string = '0%';
            console.log('[LoadingCtrl] 百分比标签已初始化');
        }

        // 初始化描述标签显示
        if (this.descLabel) {
            this.descLabel.string = '加载中...';
            console.log('[LoadingCtrl] 描述标签已初始化');
        }

        // 开始模拟加载流程
        this.simulateLoading();
    }

    /**
     * 每帧更新调用
     * 同步进度条和百分比显示
     */
    update(dt: number) {
        // 确保组件引用有效
        if (this.progressBar && this.percentLabel) {
            // 更新进度条显示
            this.progressBar.progress = this._currentProgress;
            
            // 更新百分比文字显示（四舍五入取整）
            const percentage = Math.floor(this._currentProgress * 100);
            this.percentLabel.string = `${percentage}%`;
        }
    }

    /**
     * 模拟加载进度
     * 通过定时器逐步增加进度值，模拟真实加载过程
     * 
     * 设计思路：
     * - 将加载过程分为 100 个步骤
     * - 每 30ms 完成一个步骤
     * - 完成后延迟 500ms 再跳转到主场景，给用户视觉反馈
     */
    private simulateLoading() {
        // 总步骤数，用于计算进度百分比
        const totalSteps = 100;
        // 当前完成的步骤数
        let currentStep = 0;

        // 设置定时器，每 30ms 更新一次进度
        const interval = setInterval(() => {
            // 增加当前步骤
            currentStep++;
            
            // 计算当前进度（0 到 1 之间）
            this._currentProgress = currentStep / totalSteps;

            // 检查是否完成所有步骤
            if (currentStep >= totalSteps) {
                // 清除定时器
                clearInterval(interval);
                
                // 延迟 500ms 后跳转到主场景
                setTimeout(() => {
                    console.log('[LoadingCtrl] 加载完成，跳转到主场景');
                    director.loadScene('main');
                }, 0);
            }
        }, 1); // 每 30ms 更新一次，大约 3 秒完成加载
    }
}
