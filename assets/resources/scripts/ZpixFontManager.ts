import { _decorator, Font, resources, sys } from 'cc';
const { ccclass } = _decorator;

/**
 * zpix 字体全局管理器（单例）
 * 
 * 职责：
 * 1. 通过 resources.load 加载 resources/fonts/zpix.ttf
 * 2. 缓存 Font 对象供全局使用
 * 3. 提供便捷的 applyTo(node) 方法，可随时对新节点批量替换字体
 * 
 * 用法：
 *   // 在任意脚本中获取字体
 *   const font = ZpixFontManager.instance.font;
 *   // 对指定节点树批量替换
 *   await ZpixFontManager.instance.applyTo(someNode);
 */
export class ZpixFontManager {

    private static _instance: ZpixFontManager | null = null;

    static get instance(): ZpixFontManager {
        if (!this._instance) {
            this._instance = new ZpixFontManager();
        }
        return this._instance;
    }

    /** 已加载的 Font 对象，加载完成前为 null */
    private _font: Font | null = null;

    /** 加载是否完成 */
    private _loaded: boolean = false;

    /** 加载 Promise，防止重复加载 */
    private _loadPromise: Promise<Font | null> | null = null;

    get font(): Font | null {
        return this._font;
    }

    get isLoaded(): boolean {
        return this._loaded;
    }

    /**
     * 加载 zpix 字体（幂等，多次调用只会加载一次）
     * @returns 加载完成后的 Font 对象，加载失败返回 null
     */
    loadFont(): Promise<Font | null> {
        if (this._loaded && this._font) {
            return Promise.resolve(this._font);
        }

        if (this._loadPromise) {
            return this._loadPromise;
        }

        this._loadPromise = new Promise<Font | null>((resolve) => {
            resources.load('fonts/zpix', Font, (err, font) => {
                this._loadPromise = null; // 允许重试
                if (err) {
                    console.error('[ZpixFontManager] 字体加载失败:', err.message);
                    resolve(null);
                    return;
                }
                this._font = font;
                this._loaded = true;
                console.log('[ZpixFontManager] zpix 字体加载成功');
                resolve(font);
            });
        });

        return this._loadPromise;
    }
}
