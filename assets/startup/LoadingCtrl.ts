/**
 * LoadingCtrl - 启动加载界面控制器
 *
 * 启动页必须位于主包中，先显示界面，再按需加载 resources 分包。
 */

import {
    _decorator,
    assetManager,
    AssetManager,
    Component,
    director,
    EventTouch,
    input,
    Input,
    Label,
    ProgressBar
} from 'cc';
import { StartupCloudRestore } from './StartupCloudRestore';

const { ccclass, property } = _decorator;

@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {
    @property({
        type: ProgressBar,
        displayName: '进度条组件',
        tooltip: '拖入 progress/ProgressBar 节点上的 ProgressBar 组件'
    })
    progressBar: ProgressBar | null = null;

    @property({
        type: Label,
        displayName: '百分比标签',
        tooltip: '拖入 load/num 节点上的 Label 组件'
    })
    percentLabel: Label | null = null;

    @property({
        type: Label,
        displayName: '描述标签',
        tooltip: '拖入 load/desc 节点上的 Label 组件'
    })
    descLabel: Label | null = null;

    private _currentProgress = 0;
    private _loading = false;
    private _retryListening = false;

    protected start(): void {
        this.setProgress(0);
        this.setDescription('正在准备游戏...');
        void this.beginLoading();
    }

    protected update(): void {
        if (this.progressBar) {
            this.progressBar.progress = this._currentProgress;
        }
        if (this.percentLabel) {
            this.percentLabel.string = `${Math.floor(this._currentProgress * 100)}%`;
        }
    }

    protected onDestroy(): void {
        this.disableRetry();
    }

    private async beginLoading(): Promise<void> {
        if (this._loading) return;

        this._loading = true;
        this.disableRetry();
        this.setProgress(0);

        try {
            this.setDescription('正在下载游戏资源...');
            const resourcesBundle = await this.loadResourcesBundle();

            this.setProgress(0.82);
            this.setDescription('正在读取云存档...');
            await StartupCloudRestore.restoreBeforeGame();

            this.setProgress(0.9);
            this.setDescription('正在进入游戏...');
            await this.loadMainScene(resourcesBundle);
        } catch (error) {
            console.error('[LoadingCtrl] 启动加载失败:', error);
            this._loading = false;
            this.setDescription('加载失败，点击屏幕重试');
            this.enableRetry();
        }
    }

    private async loadResourcesBundle(): Promise<AssetManager.Bundle> {
        const loadedBundle = assetManager.getBundle('resources');
        if (loadedBundle) {
            this.setProgress(0.8);
            return loadedBundle;
        }

        await this.loadTapSubpackage();

        return new Promise<AssetManager.Bundle>((resolve, reject) => {
            assetManager.loadBundle('resources', (error, bundle) => {
                if (error) {
                    reject(error);
                    return;
                }
                this.setProgress(0.8);
                resolve(bundle);
            });
        });
    }

    /** TapTap 提供真实的分包下载进度；其他平台交给 Cocos AssetManager。 */
    private loadTapSubpackage(): Promise<void> {
        const tap = (globalThis as any).tap;
        if (!tap?.loadSubpackage) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve, reject) => {
            try {
                const task = tap.loadSubpackage({
                    name: 'resources',
                    success: () => resolve(),
                    fail: (error: unknown) => reject(error)
                });

                task?.onProgressUpdate?.((result: { progress?: number }) => {
                    const progress = Math.max(0, Math.min(100, Number(result.progress) || 0));
                    this.setProgress(progress / 100 * 0.8);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    private loadMainScene(bundle: AssetManager.Bundle): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            bundle.loadScene(
                'main',
                (completedCount: number, totalCount: number) => {
                    if (totalCount <= 0) return;
                    this.setProgress(0.9 + completedCount / totalCount * 0.1);
                },
                (error, scene) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    this.setProgress(1);
                    director.runScene(scene);
                    resolve();
                }
            );
        });
    }

    private setProgress(value: number): void {
        this._currentProgress = Math.max(0, Math.min(1, value));
    }

    private setDescription(text: string): void {
        if (this.descLabel) {
            this.descLabel.string = text;
        }
    }

    private enableRetry(): void {
        if (this._retryListening) return;
        this._retryListening = true;
        input.once(Input.EventType.TOUCH_END, this.onRetryTouch, this);
    }

    private disableRetry(): void {
        if (!this._retryListening) return;
        this._retryListening = false;
        input.off(Input.EventType.TOUCH_END, this.onRetryTouch, this);
    }

    private onRetryTouch(_event: EventTouch): void {
        this._retryListening = false;
        void this.beginLoading();
    }
}
