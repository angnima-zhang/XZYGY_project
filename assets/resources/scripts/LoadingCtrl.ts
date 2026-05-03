import { _decorator, Component, Node, ProgressBar, Label, director } from 'cc';

const { ccclass, property } = _decorator;

/**
 * LoadingCtrl - Loading 场景控制器
 *
 * 流程：进入游戏 → 展示 loading 界面
 *       → 后台 preloadScene('main')，进度条 + 百分比数字实时更新
 *       → 加载完成 → 自动跳转 main.scene
 *
 * 挂载位置：loading.scene / Canvas
 *
 * 节点结构：
 *   Canvas
 *   ├── progress (id:23)  ← progressNode 引用此节点（挂有 ProgressBar 组件）
 *   │   └── ProgressBar (id:24)
 *   │       └── Bar (id:25)
 *   └── load (id:33)
 *       ├── desc (id:34)  ← "加载中..."文字
 *       └── num  (id:37)  ← 百分比数字 Label，脚本更新此节点
 */
@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {

    /** 进度条节点（挂有 ProgressBar 组件） */
    @property(Node)
    progressNode: Node | null = null;

    private _progressBar: ProgressBar | null = null;

    /** 百分比数字 Label（load/num 节点上的 Label） */
    private _percentLabel: Label | null = null;

    /** preloadScene 回调的目标进度 [0~1] */
    private _targetProgress: number = 0;

    /** 进度当前显示值 [0~1] */
    private _displayProgress: number = 0;

    /** 加载是否已完成 */
    private _loaded: boolean = false;

    /** 进度插值速度（越大响应越快但越急促） */
    private readonly LERP_SPEED: number = 1.5;

    onLoad() {
        // 运行时找不到 progressNode 则在 Canvas 子树中查找
        if (!this.progressNode) {
            this.progressNode = this.node.getChildByName('progress') ?? null;
        }
        if (this.progressNode) {
            this._progressBar = this.progressNode.getComponent(ProgressBar);
        }
        if (!this._progressBar) {
            console.warn('[LoadingCtrl] 未找到 ProgressBar 组件，请确认 progressNode 引用指向挂有 ProgressBar 组件的节点');
        }

        // 百分比 Label 路径：Canvas → load → num
        const loadNode = this.node.getChildByName('load');
        const numNode = loadNode?.getChildByName('num');
        this._percentLabel = numNode?.getComponent(Label) ?? null;
        if (!this._percentLabel) {
            console.warn('[LoadingCtrl] 未找到百分比 Label，请确认存在 load/num 节点并挂有 Label 组件');
        }
    }

    start() {
        // 重置进度条
        if (this._progressBar) {
            this._progressBar.progress = 0;
        }
        // 初始化百分比显示
        if (this._percentLabel) {
            this._percentLabel.string = '0%';
        }
        console.log('[LoadingCtrl] 开始加载 main.scene');
        this.startPreload();
    }

    update(dt: number) {
        // 平滑插值追赶目标进度
        if (Math.abs(this._displayProgress - this._targetProgress) > 0.001) {
            const delta = (this._targetProgress - this._displayProgress) * this.LERP_SPEED * dt;
            this._displayProgress += delta;
            if (delta > 0 && this._displayProgress > this._targetProgress) {
                this._displayProgress = this._targetProgress;
            } else if (delta < 0 && this._displayProgress < this._targetProgress) {
                this._displayProgress = this._targetProgress;
            }
            // 更新进度条
            if (this._progressBar) {
                this._progressBar.progress = this._displayProgress;
            }
        }

        // 更新百分比数字（每帧都更新，无阈值）
        if (this._percentLabel) {
            const pct = Math.floor(this._displayProgress * 100);
            this._percentLabel.string = `${pct}%`;
        }

        // 预加载完成 → 跳转 main.scene
        if (this._loaded) {
            this._loaded = false;
            console.log('[LoadingCtrl] 加载完成，跳转 main.scene');
            director.loadScene('main', (err) => {
                if (err) {
                    console.error('[LoadingCtrl] loadScene(main) 失败:', err.message);
                }
            });
        }
    }

    /**
     * 启动后台预加载
     */
    private startPreload(): void {
        director.preloadScene(
            'main',
            (completedCount: number, totalCount: number) => {
                if (totalCount > 0) {
                    this._targetProgress = completedCount / totalCount;
                } else {
                    this._targetProgress = 0;
                }
            },
            (error: Error | null) => {
                if (error) {
                    console.error('[LoadingCtrl] preloadScene(main) 失败:', error.message);
                    this._loaded = true;
                    return;
                }
                console.log('[LoadingCtrl] main.scene 预加载完成');
                this._targetProgress = 1.0;
                this._loaded = true;
            }
        );
    }
}
