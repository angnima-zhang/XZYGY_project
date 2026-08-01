/**
 * AdManager - 小游戏广告管理器
 * 
 * 功能说明：
 * - 管理 TapTap 激励视频广告与微信分享奖励
 * - 提供单例访问方式
 * - 处理广告加载/关闭以及微信分享离开/返回事件
 * - 支持编辑器测试模式
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

import { _decorator, Component, EventTarget, Node } from 'cc';
import { EDITOR, PREVIEW } from 'cc/env';

const { ccclass, property } = _decorator;

interface WechatShareRewardRecord {
    date: string;
    count: number;
}

/**
 * 广告管理器单例
 */
@ccclass('AdManager')
export class AdManager extends Component {

    /**
     * 微信激励视频广告位ID
     * 微信每日分享奖励用尽后使用
     */
    @property({
        displayName: '微信激励视频广告位ID',
        tooltip: '每日5次分享奖励用尽后使用，格式: adunit-xxxxxxxxxxxxxxxx'
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
     * 是否使用编辑器测试模式
     * true: 编辑器预览时模拟广告播放并发放奖励
     * TapTap 广告和微信分享均不受此开关影响
     */
    @property({
        displayName: '编辑器模拟模式',
        tooltip: '仅供编辑器预览模拟奖励；TapTap调用真实广告，微信调用分享'
    })
    testMode: boolean = true;

    private static _instance: AdManager | null = null;
    private static readonly WECHAT_SHARE_REWARD_LIMIT = 5;
    private static readonly WECHAT_SHARE_REWARD_STORAGE_KEY = 'xianzheng_wechat_share_rewards_v1';
    private static readonly WECHAT_REWARD_MODE_CHANGED = 'wechat-reward-mode-changed';
    private static readonly _wechatRewardModeEvents = new EventTarget();

    private rewardedVideoAd: any = null;
    private _isAdReady: boolean = false;
    private _isPlaying: boolean = false;
    private _isTestModeActive: boolean = false;
    private _onRewardCallback: ((success: boolean) => void) | null = null;
    private _wechatApi: any = null;
    private _shareHiddenAt: number | null = null;
    private _shareResolve: (() => void) | null = null;
    private _shareReject: ((reason?: any) => void) | null = null;
    private _wechatLogManager: any = null;
    private _lastWechatShareRewardEnabled: boolean | null = null;

    private readonly _wechatShareTitle: string = '我在《挣一个亿先》挑战破亿，快来试试！';

    private readonly _onWechatHide = (): void => {
        if (this._isPlaying && this._shareResolve) {
            this._shareHiddenAt = Date.now();
            this.logWechatEvent('reward_share_hidden');
        }
    };

    private readonly _onWechatShow = (options?: any): void => {
        const source = options?.query?.from;
        if (source) {
            this.logWechatEvent('mini_game_show', { source });
        }

        if (!this._isPlaying || !this._shareResolve || this._shareHiddenAt === null) {
            return;
        }

        const elapsed = Date.now() - this._shareHiddenAt;
        const success = elapsed >= 2000;
        console.log(`[AdManager] 微信分享返回，离开游戏 ${elapsed}ms，判定为${success ? '成功' : '失败'}`);
        this.logWechatEvent('reward_share_returned', { elapsed, success });
        this.finishWechatShare(success);
    };

    private createWechatShareOptions(source: string): { title: string; query: string } {
        return {
            title: this._wechatShareTitle,
            query: `from=${source}`,
        };
    }

    /** 转发图使用微信小游戏后台已配置的默认图片。 */
    private readonly _onWechatShareAppMessage = (): { title: string; query: string } => {
        return this.createWechatShareOptions('menu_share');
    };

    private readonly _onWechatShareTimeline = (): { title: string; query: string } => {
        return this.createWechatShareOptions('timeline_share');
    };

    private readonly _onWechatCopyUrl = (): { query: string } => ({ query: 'from=copy_link' });

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

    /** TapTap 可能提供 wx 兼容层，因此必须排除 tap 后才算微信小游戏。 */
    static isWechatSharePlatform(): boolean {
        const runtime = globalThis as any;
        return !runtime.tap && !!runtime.wx;
    }

    /** 微信每天前 5 次成功分享可领取奖励；达到上限后切换为激励视频广告。 */
    static shouldUseWechatShareReward(): boolean {
        if (!AdManager.isWechatSharePlatform()) {
            return false;
        }

        return AdManager.getWechatShareRewardRecord().count < AdManager.WECHAT_SHARE_REWARD_LIMIT;
    }

    static onWechatRewardModeChanged(callback: () => void, target: object): void {
        AdManager._wechatRewardModeEvents.on(AdManager.WECHAT_REWARD_MODE_CHANGED, callback, target);
    }

    static offWechatRewardModeChanged(callback: () => void, target: object): void {
        AdManager._wechatRewardModeEvents.off(AdManager.WECHAT_REWARD_MODE_CHANGED, callback, target);
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

        // 微信小游戏使用分享奖励；TapTap 仍使用激励视频广告。
        if (runtime.wx) {
            this.initWechatShare(runtime.wx);
            this.syncWechatRewardMode();
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
        this.unregisterWechatShareLifecycle();
        this.destroyAd();
    }

    private initWechatShare(wxApi: any): void {
        if (this._wechatApi === wxApi) {
            return;
        }

        this.unregisterWechatShareLifecycle();
        this._wechatApi = wxApi;
        this._wechatLogManager = wxApi.getLogManager?.({ level: 1 }) ?? null;
        this._wechatApi.onHide?.(this._onWechatHide);
        this._wechatApi.onShow?.(this._onWechatShow);
        this._wechatApi.showShareMenu?.({
            menus: ['shareAppMessage', 'shareTimeline'],
            success: () => this.logWechatEvent('share_menu_enabled'),
            fail: (error: any) => this.logWechatEvent('share_menu_enable_failed', { error: error?.errMsg ?? 'unknown' }),
        });
        this._wechatApi.onShareAppMessage?.(this._onWechatShareAppMessage);
        this._wechatApi.onShareTimeline?.(this._onWechatShareTimeline);
        this._wechatApi.onCopyUrl?.(this._onWechatCopyUrl);
        this.logWechatEvent('mini_game_open');
        console.log('[AdManager] 微信分享奖励初始化完成');
    }

    private syncWechatRewardMode(): void {
        const enabled = AdManager.shouldUseWechatShareReward();
        if (this._lastWechatShareRewardEnabled !== null && this._lastWechatShareRewardEnabled !== enabled) {
            AdManager._wechatRewardModeEvents.emit(AdManager.WECHAT_REWARD_MODE_CHANGED);
        }
        this._lastWechatShareRewardEnabled = enabled;
    }

    private static getWechatShareRewardRecord(): WechatShareRewardRecord {
        const today = AdManager.getLocalDateKey();
        const wxApi = (globalThis as any).wx;
        const raw = wxApi?.getStorageSync?.(AdManager.WECHAT_SHARE_REWARD_STORAGE_KEY);

        try {
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (parsed?.date === today) {
                return {
                    date: today,
                    count: Math.min(AdManager.WECHAT_SHARE_REWARD_LIMIT, Math.max(0, Number(parsed.count) || 0)),
                };
            }
        } catch (error) {
            console.warn('[AdManager] 读取微信分享次数失败，按未分享处理:', error);
        }

        return { date: today, count: 0 };
    }

    private static getLocalDateKey(): string {
        const now = new Date();
        const month = `${now.getMonth() + 1}`.padStart(2, '0');
        const day = `${now.getDate()}`.padStart(2, '0');
        return `${now.getFullYear()}-${month}-${day}`;
    }

    private recordWechatShareSuccess(): void {
        const record = AdManager.getWechatShareRewardRecord();
        if (record.count >= AdManager.WECHAT_SHARE_REWARD_LIMIT) {
            return;
        }

        record.count += 1;
        const wxApi = (globalThis as any).wx;
        try {
            wxApi?.setStorageSync?.(AdManager.WECHAT_SHARE_REWARD_STORAGE_KEY, record);
            this.logWechatEvent('reward_share_counted', { count: record.count });
        } catch (error) {
            console.warn('[AdManager] 保存微信分享次数失败:', error);
        }

        this.syncWechatRewardMode();
    }

    private logWechatEvent(event: string, payload?: Record<string, string | number | boolean>): void {
        const detail = payload ? ` ${JSON.stringify(payload)}` : '';
        const message = `[XianZhengYiGeYi] ${event}${detail}`;
        this._wechatLogManager?.info?.(message);
        console.log(`[AdManager] ${message}`);
    }

    private unregisterWechatShareLifecycle(): void {
        if (!this._wechatApi) {
            return;
        }

        this._wechatApi.offHide?.(this._onWechatHide);
        this._wechatApi.offShow?.(this._onWechatShow);
        this._wechatApi.offShareAppMessage?.(this._onWechatShareAppMessage);
        this._wechatApi.offShareTimeline?.(this._onWechatShareTimeline);
        this._wechatApi.offCopyUrl?.(this._onWechatCopyUrl);
        this._wechatApi = null;
        this._wechatLogManager = null;
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
        if (AdManager.isWechatSharePlatform()) {
            if (AdManager.shouldUseWechatShareReward()) {
                return this.showWechatShare(onReward);
            }

            const wxApi = (globalThis as any).wx;
            if (!this.rewardedVideoAd) {
                this.initRewardedVideoAd(wxApi, this.rewardedAdUnitId, '微信');
            }
        }

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

    /** 微信无分享完成回调，按离开小游戏到返回的时长判定结果。 */
    private showWechatShare(onReward?: (success: boolean) => void): Promise<void> {
        const wxApi = (globalThis as any).wx;
        if (!wxApi?.shareAppMessage) {
            onReward?.(false);
            return Promise.reject('当前微信版本不支持分享功能');
        }

        if (this._isPlaying) {
            return Promise.reject('分享正在进行中');
        }

        this.initWechatShare(wxApi);

        return new Promise<void>((resolve, reject) => {
            this._isPlaying = true;
            this._shareHiddenAt = null;
            this._shareResolve = resolve;
            this._shareReject = reject;
            this._onRewardCallback = onReward || null;

            try {
                this.logWechatEvent('reward_share_requested');
                wxApi.shareAppMessage(this.createWechatShareOptions('reward_share'));
            } catch (error) {
                this.finishWechatShare(false, error);
            }
        });
    }

    private finishWechatShare(success: boolean, error?: unknown): void {
        const onReward = this._onRewardCallback;
        const resolve = this._shareResolve;
        const reject = this._shareReject;

        this._isPlaying = false;
        this._shareHiddenAt = null;
        this._shareResolve = null;
        this._shareReject = null;
        this._onRewardCallback = null;

        if (success && !error) {
            this.recordWechatShareSuccess();
        }

        this.logWechatEvent('reward_share_finished', {
            success,
            error: !!error,
        });

        if (error) {
            reject?.(error);
        } else {
            resolve?.();
        }
        onReward?.(success);
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
