import { _decorator, Component, Node, ProgressBar, Label, director } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('LoadingCtrl')
export class LoadingCtrl extends Component {

    @property({ type: ProgressBar, displayName: '进度条组件' })
    progressBar: ProgressBar | null = null;

    @property({ type: Label, displayName: '百分比标签' })
    percentLabel: Label | null = null;

    @property({ type: Label, displayName: '描述标签' })
    descLabel: Label | null = null;

    private _currentProgress: number = 0;

    start() {
        if (this.progressBar) {
            this.progressBar.progress = 0;
            console.log('[LoadingCtrl] 进度条已重置');
        }
        if (this.percentLabel) {
            this.percentLabel.string = '0%';
            console.log('[LoadingCtrl] 百分比标签已设置');
        }
        if (this.descLabel) {
            this.descLabel.string = '加载中...';
            console.log('[LoadingCtrl] 描述标签已设置');
        }

        this.simulateLoading();
    }

    update(dt: number) {
        if (this.progressBar && this.percentLabel) {
            this.progressBar.progress = this._currentProgress;
            const pct = Math.floor(this._currentProgress * 100);
            this.percentLabel.string = `${pct}%`;
        }
    }

    private simulateLoading() {
        const totalSteps = 100;
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            this._currentProgress = currentStep / totalSteps;
            
            if (currentStep >= totalSteps) {
                clearInterval(interval);
                setTimeout(() => {
                    director.loadScene('main');
                }, 500);
            }
        }, 30);
    }
}