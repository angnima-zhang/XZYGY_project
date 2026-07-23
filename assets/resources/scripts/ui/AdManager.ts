/**
 * AdManager - 小游戏广告管理器
 * 
 * 功能说明：
 * - 分别管理 TapTap、微信激励视频广告的全生命周期
 * - 提供单例访问方式
 * - 处理广告加载、展示、关闭事件
 * - 支持测试模式（未开通流量主时使用）
 * 
 * 使用方式：
 * 1. 将此脚本挂载到场景中的任意节点（推荐 Canvas）
 * 2. 在编辑器中配置广告位ID
 * 3. 其他组件通过 AdManager.getInstance() 获取实例
 * 
 * 测试模式：
 * - 仅供编辑器预览或微信测试配置使用
 * - 正式环境未检测到广告 API 时不会模拟成功或发放奖励
 * 
 * 作者：Trae AI
 * 创建时间：2026-05-20
 */

import { _decorator, Component, Node } from 'cc';
import { EDITOR, PREVIEW } from 'cc/env';

const { ccclass, property } = _decorator;

/**
 * 广告管理器单例
 */
@ccclass('AdManager')
export class AdManager extends Component {

    /**
     * 激励视频广告位ID
     * 开通流量主后在微信公众平台创建广告位获取
     */
    @property({
        displayName: '激励视频广告位ID',
        tooltip: '开通流量主后填写广告位ID，格式: adunit-xxxxxxxxxxxxxxxx'
    })
    rewardedAdUnitId: string = 'adunit-xxxxxxxxxxxxxxxx';

    /**
     * TapTap 激励视频推广位ID
     * 在 Dirichlet 媒体管理平台创建推广位后获取
     */
    @property({
        displayName: 'TapTap激励视频推广位ID',
        tooltip: 'Dirichlet推广位ID，对应tap.createRewardedVideoAd的adUnitId'
    })
    tapRewardedAdUnitId: string = '1059595';

    /**
     * 是否使用测试模式
     * true: 模拟广告播放，直接发放奖励（未开通流量主时使用）
     * false: 调用真实微信广告SDK
     * TapTap 推广位始终调用真实 tap API，不受此开关影响
     */
    @property({
        displayName: '微信/编辑器模拟模式',
        tooltip: '勾选后微信或编辑器模拟广告；TapTap推广位仍调用真实tap API'
    })
    testMode: boolean = true;

    private static _instance: AdManager | null = null;

    private rewardedVideoAd: any = null;
    private _isAdReady: boolean = false;
    private _isPlaying: boolean = false;
    private _isTestModeActive: boolean = false;
    private _onRewardCallback: ((success: boolean) => void) | null = null;

    /** 广告是否已就绪（可以展示） */
    get isAdReady(): boolean {
        return this._isAdReady;
    }

    /** 是否正在播放广告 */
    get isPlaying(): boolean {
        return this._isPlaying;
    }

    static getInstance(): AdManager | null {
        return AdManager._instance;
    }

    onLoad() {
        if (AdManager._instance) {
            console.warn('[AdManager] 已存在实例，销毁当前实例');
            this.destroy();
            return;
        }
        AdManager._instance = this;
    }

    start(): void {
        this.initializePlatformAd();
    }

    private initializePlatformAd(): void {
        const runtime = globalThis as any;

        // TapTap 小游戏可能同时提供 wx 兼容层，因此必须优先判断 tap。
        if (runtime.tap) {
            this.initRewardedVideoAd(runtime.tap, this.tapRewardedAdUnitId, 'TapTap');
            return;
        }

        // 微信小游戏继续沿用原有的模拟模式开关，不影响微信现有配置。
        if (runtime.wx) {
            if (this.testMode) {
                this._isTestModeActive = true;
                console.log('[AdManager] 初始化完成（微信模拟模式）');
                return;
            }

            this.initRewardedVideoAd(runtime.wx, this.rewardedAdUnitId, '微信');
            return;
        }

        // 只有编辑器/预览环境允许在没有平台 API 时模拟成功。
        if ((EDITOR || PREVIEW) && this.testMode) {
            this._isTestModeActive = true;
            console.log('[AdManager] 初始化完成（编辑器模拟模式）');
            return;
        }

        this._isTestModeActive = false;
        console.error('[AdManager] 正式环境未检测到广告 API，已禁用模拟奖励');
    }

    onDestroy() {
        if (AdManager._instance === this) {
            AdManager._instance = null;
        }
        this.destroyAd();
    }

    /**
     * 初始化激励视频广告
     */
    private initRewardedVideoAd(adApi: any, adUnitId: string, platformName: string) {
        if (!adApi) {
            console.warn(`[AdManager] 当前环境不支持${platformName}广告功能`);
            return;
        }

        if (!adApi.createRewardedVideoAd) {
            console.warn(`[AdManager] 当前${platformName}版本不支持激励视频广告`);
            return;
        }

        try {
            // 创建广告实例（全局单例）
            this.rewardedVideoAd = adApi.createRewardedVideoAd({
                adUnitId
            });

            if (!this.rewardedVideoAd) {
                console.error('[AdManager] 创建广告实例失败');
                return;
            }

            // 监听加载成功
            this.rewardedVideoAd.onLoad(() => {
                console.log(`[AdManager] ${platformName}激励视频广告加载成功`);
                this._isAdReady = true;
            });

            // 监听加载失败
            this.rewardedVideoAd.onError((err: any) => {
                console.error(`[AdManager] ${platformName}激励视频广告加载失败:`, err);
                this._isAdReady = false;
            });

            // 监听用户关闭广告
            this.rewardedVideoAd.onClose((res: any) => {
                const isEnded = res?.isEnded === true;
                console.log(`[AdManager] 用户关闭${platformName}广告, isEnded:`, isEnded);
                this._isPlaying = false;
                this._isAdReady = false;

                if (isEnded) {
                    // 用户看完了广告
                    console.log('[AdManager] 用户看完了广告，发放奖励');
                    this._onRewardCallback?.(true);
                } else {
                    // 用户中途关闭
                    console.log('[AdManager] 用户中途关闭了广告，不发放奖励');
                    this._onRewardCallback?.(false);
                }

                this._onRewardCallback = null;
            });

            // 预加载广告
            void this.loadAd().catch(() => undefined);

            console.log(`[AdManager] ${platformName}激励视频广告初始化完成`);

        } catch (e) {
            console.error(`[AdManager] 初始化${platformName}广告失败:`, e);
        }
    }

    /**
     * 加载广告
     */
    private loadAd(): Promise<void> {
        if (!this.rewardedVideoAd) {
            return Promise.reject('广告实例未初始化');
        }

        return this.rewardedVideoAd.load()
            .then(() => {
                console.log('[AdManager] 广告加载成功');
            })
            .catch((err: any) => {
                console.warn('[AdManager] 广告加载失败:', err);
                return Promise.reject(err);
            });
    }

    /**
     * 展示激励视频广告
     * @param onReward 奖励回调，参数为是否完整观看（true=发放奖励）
     * @returns Promise，展示成功或失败
     */
    showRewardedAd(onReward?: (success: boolean) => void): Promise<void> {
        // TapTap API 可能晚于场景 onLoad 注入，用户点击时再检查一次。
        if (!this.rewardedVideoAd) {
            const tapApi = (globalThis as any).tap;
            if (tapApi) {
                this._isTestModeActive = false;
                this.initRewardedVideoAd(tapApi, this.tapRewardedAdUnitId, 'TapTap');
            }
        }

        // 测试模式：直接模拟成功
        if (this._isTestModeActive) {
            return this.showTestAd(onReward);
        }

        return new Promise((resolve, reject) => {
            if (!this.rewardedVideoAd) {
                console.warn('[AdManager] 广告实例未初始化，无法展示广告');
                reject('广告实例未初始化');
                return;
            }

            if (this._isPlaying) {
                console.warn('[AdManager] 广告正在播放中');
                reject('广告正在播放中');
                return;
            }

            // 保存奖励回调
            if (onReward) {
                this._onRewardCallback = onReward;
            }

            this._isPlaying = true;

            // 展示广告
            this.rewardedVideoAd.show()
                .then(() => {
                    console.log('[AdManager] 广告展示成功');
                    resolve();
                })
                .catch((err: any) => {
                    console.warn('[AdManager] 广告展示失败，尝试重新加载:', err);
                    // 展示失败时，尝试重新加载后再展示
                    this.rewardedVideoAd.load()
                        .then(() => {
                            return this.rewardedVideoAd.show();
                        })
                        .then(() => {
                            console.log('[AdManager] 重新加载后广告展示成功');
                            resolve();
                        })
                        .catch((loadErr: any) => {
                            console.error('[AdManager] 重新加载广告也失败了:', loadErr);
                            this._isPlaying = false;
                            this._isAdReady = false;
                            this._onRewardCallback = null;
                            reject(loadErr);
                        });
                });
        });
    }

    /**
     * 测试模式：模拟广告播放
     */
    private showTestAd(onReward?: (success: boolean) => void): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this._isPlaying) {
                console.warn('[AdManager] 广告正在播放中');
                reject('广告正在播放中');
                return;
            }

            this._isPlaying = true;

            console.log('[AdManager] === 测试模式：模拟广告播放 ===');
            console.log('[AdManager] 模拟广告播放中...');

            // 模拟广告播放延迟（2秒）
            setTimeout(() => {
                console.log('[AdManager] 模拟广告播放完成，用户看完了完整视频');
                this._isPlaying = false;

                // 测试模式直接发放奖励
                onReward?.(true);

                console.log('[AdManager] === 测试模式：广告结束 ===');
                resolve();
            }, 2000);
        });
    }

    /**
     * 销毁广告实例
     */
    private destroyAd() {
        if (this.rewardedVideoAd) {
            try {
                this.rewardedVideoAd.offLoad();
                this.rewardedVideoAd.offError();
                this.rewardedVideoAd.offClose();
            } catch (e) {
                // 忽略销毁错误
            }
            this.rewardedVideoAd = null;
            this._isAdReady = false;
        }
    }
}
