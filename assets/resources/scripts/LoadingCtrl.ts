import { _decorator, Component, Node, ProgressBar, Sprite, director } from 'cc';

const { ccclass, property } = _decorator;

/**
 * LoadingCtrl - Loading 场景控制器
 *
 * 流程：进入游戏 → 立即展示 loading 界面
 *       → 后台 preloadScene('main')，进度条实时更新
 *       → 加载完成 → 自动跳转 main.scene
 *
 * 挂载位置：loading.scene / Canvas 节点
 */
@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {

    /** 进度条节点（ProgressBar 组件所在节点） */
    @property(Node)
    progressNode: Node | null = null;

    private _progressBar: ProgressBar | null = null;
    private _barSprite: Sprite | null = null;

    /** preloadScene 回调的目标进度 [0~1] */
    private _targetProgress: number = 0;

    /** 进度条当前显示进度 [0~1] */
    private _displayProgress: number = 0;

    /** 加载是否已完成 */
    private _loaded: boolean = false;

    /**
     * 进度条插值速度（每秒可追赶的进度量）
     * 调大：进度条响应更快但变化急促
     * 调小：进度条变化更平滑
     */
    private readonly LERP_SPEED: number = 1.5;

    onLoad() {
        // 运行时找不到 progressNode 则在 Canvas 子树中查找
        if (!this.progressNode) {
            this.progressNode = this.node.getChildByName('progress')?.getChildByName('ProgressBar') ?? null;
        }
        if (this.progressNode) {
            this._progressBar = this.progressNode.getComponent(ProgressBar);
            this._barSprite = this._progressBar?.barSprite ?? null;
        }
        if (!this._progressBar) {
            console.warn('[LoadingCtrl] 未找到 ProgressBar 组件，请检查 progressNode 配置');
        }
    }

    start() {
        // 重置进度条为 0%
        if (this._progressBar) {
            this._progressBar.progress = 0;
        }
        // 开始后台加载主场景
        this.startPreload();
    }

    update(dt: number) {
        if (!this._progressBar) return;

        // 平滑插值：displayProgress 追赶 targetProgress
        if (Math.abs(this._displayProgress - this._targetProgress) > 0.001) {
            const delta = (this._targetProgress - this._displayProgress) * this.LERP_SPEED * dt;
            this._displayProgress += delta;
            // 防止overshoot
            if (delta > 0 && this._displayProgress > this._targetProgress) {
                this._displayProgress = this._targetProgress;
            } else if (delta < 0 && this._displayProgress < this._targetProgress) {
                this._displayProgress = this._targetProgress;
            }
            this._progressBar.progress = this._displayProgress;
        }

        // preload 完成 → 切换到 main.scene
        if (this._loaded) {
            this._loaded = false; // 防止重复触发
            director.loadScene('main', (err) => {
                if (err) {
                    console.error('[LoadingCtrl] loadScene(main) 失败:', err.message);
                }
            });
        }
    }

    /**
     * 启动后台预加载
     * 使用 director.preloadScene 获取真实加载进度
     */
    private startPreload(): void {
        director.preloadScene(
            'main',
            (completedCount: number, totalCount: number) => {
                if (totalCount > 0) {
                    this._targetProgress = completedCount / totalCount;
                } else {
                    // 防止 totalCount=0 时出现 NaN
                    this._targetProgress = 0;
                }
            },
            (error: Error | null) => {
                if (error) {
                    console.error('[LoadingCtrl] preloadScene(main) 失败:', error.message);
                    // 降级：直接尝试加载（可能部分资源已缓存）
                    this._loaded = true;
                    return;
                }
                console.log('[LoadingCtrl] main.scene 预加载完成');
                this._targetProgress = 1.0; // 确保进度条走满
                this._loaded = true;
            }
        );
    }
}
