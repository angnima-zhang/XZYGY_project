/**
 * AudioManager - 音效管理器（单例模式）
 * 
 * 功能说明：
 * - 管理背景音乐（BGM）的播放、暂停、恢复
 * - 管理各种音效的播放（点击、正面、背面、暴击、升级等）
 * - 支持音量控制
 * - 支持静音切换
 * 
 * Cocos Creator 3.8 音频系统说明：
 * - 3.x 已移除 audioEngine API
 * - 统一使用 AudioSource 组件播放音频
 * - 长音乐使用 play() 方法
 * - 短音效使用 playOneShot() 方法
 * 
 * 音效类型：
 * - 点击音效：点击硬币时播放
 * - 正面音效：抛硬币出正面时播放
 * - 背面音效：抛硬币出背面时播放
 * - 暴击音效：触发暴击时播放
 * - 升级音效：购买升级时播放
 * 
 * 使用方式：
 * const audio = AudioManager.getInstance();
 * audio.playClick();  // 播放点击音效
 * audio.playBGM();    // 播放背景音乐
 */

import { AudioSource, AudioClip, Node, resources, game, Game } from 'cc';

/**
 * 音效类型枚举
 */
type SoundType = 
    | 'click'         // 点击音效
    | 'head'          // 正面音效
    | 'tail'          // 背面音效
    | 'crit'          // 暴击音效
    | 'upgrade';      // 升级音效

/**
 * 音频资源缓存接口
 */
interface AudioCache {
    /** 音频片段 */
    clip: AudioClip | null;
    /** 是否已加载 */
    loaded: boolean;
}

export class AudioManager {
    /** 单例实例 */
    private static _instance: AudioManager | null = null;

    /** 获取单例实例 */
    static getInstance(): AudioManager {
        if (!this._instance) {
            this._instance = new AudioManager();
        }
        return this._instance;
    }

    /** 本地存储的键名 */
    private readonly STORAGE_KEY = 'xianzheng_audio_settings';

    /** 背景音乐 AudioSource 节点（动态创建） */
    private _bgmNode: Node | null = null;

    /** 背景音乐 AudioSource 组件 */
    private _bgmSource: AudioSource | null = null;

    /** 音效 AudioSource 节点（动态创建） */
    private _soundNode: Node | null = null;

    /** 音效 AudioSource 组件 */
    private _soundSource: AudioSource | null = null;

    /** 音效 AudioClip 缓存 */
    private _soundClips: Record<SoundType, AudioCache> = {
        click: { clip: null, loaded: false },
        head: { clip: null, loaded: false },
        tail: { clip: null, loaded: false },
        crit: { clip: null, loaded: false },
        upgrade: { clip: null, loaded: false }
    };

    /** BGM AudioClip 缓存 */
    private _bgmCache: AudioCache = { clip: null, loaded: false };

    /** 音效文件路径配置 */
    private readonly SOUND_PATHS: Record<SoundType, string> = {
        click: 'audios/点击',
        head: 'audios/正面',
        tail: 'audios/背面',
        crit: 'audios/暴击',
        upgrade: 'audios/升级'
    };

    /** BGM 文件路径 */
    private readonly BGM_PATH = 'audios/BGM';

    /** 音效是否开启 */
    private _soundEnabled: boolean = true;

    /** BGM 是否开启 */
    private _bgmEnabled: boolean = true;

    /** 音效音量（0~1） */
    private _soundVolume: number = 1.0;

    /** BGM 音量（0~1） */
    private _bgmVolume: number = 0.5;

    /** 当前正在播放的 BGM 路径 */
    private _currentBgmPath: string = '';

    /** BGM 是否等待用户交互后才播放（浏览器自动播放限制） */
    private _bgmPendingInteraction: boolean = false;

    /** 回到前台后的 BGM 兜底恢复定时器 */
    private _bgmRecoveryTimer: ReturnType<typeof setTimeout> | null = null;

    /** 私有构造函数 */
    private constructor() {
        this.loadSettings();
        this.initAudioSources();
        game.on(Game.EVENT_SHOW, this.onGameShow, this);
    }

    /** Cocos 先自动恢复被系统打断的音频；下一个任务再检查并兜底续播。 */
    private onGameShow(): void {
        if (this._bgmRecoveryTimer !== null) {
            clearTimeout(this._bgmRecoveryTimer);
        }

        this._bgmRecoveryTimer = setTimeout(() => {
            this._bgmRecoveryTimer = null;
            if (this._bgmEnabled
                && this._bgmCache.loaded
                && this._bgmSource?.clip
                && !this._bgmSource.playing) {
                this.playBGM();
            }
        }, 0);
    }

    /**
     * 初始化 AudioSource 组件
     * 创建用于播放 BGM 和音效的节点
     */
    private initAudioSources(): void {
        // 创建 BGM 节点
        this._bgmNode = new Node('AudioManager_BGM');
        this._bgmSource = this._bgmNode.addComponent(AudioSource);
        this._bgmSource.loop = true;
        this._bgmSource.playOnAwake = false;
        this._bgmSource.volume = this._bgmVolume;

        // 创建音效节点
        this._soundNode = new Node('AudioManager_Sound');
        this._soundSource = this._soundNode.addComponent(AudioSource);
        this._soundSource.loop = false;
        this._soundSource.playOnAwake = false;
        this._soundSource.volume = this._soundVolume;

        console.log('[AudioManager] AudioSource 初始化完成');
    }

    /**
     * 初始化音频管理器
     * 预加载所有音频资源
     */
    init(): void {
        console.log('[AudioManager] 开始预加载音频...');

        // 预加载 BGM
        resources.load(this.BGM_PATH, AudioClip, (err, clip) => {
            if (err) {
                console.warn('[AudioManager] 加载 BGM 失败:', err.message);
                return;
            }
            this._bgmCache = { clip: clip, loaded: true };
            console.log('[AudioManager] BGM 加载成功');
            // 加载完成后立即播放
            this.playBGM();
        });

        // 预加载所有音效
        (Object.keys(this.SOUND_PATHS) as SoundType[]).forEach(type => {
            resources.load(this.SOUND_PATHS[type], AudioClip, (err, clip) => {
                if (err) {
                    console.warn(`[AudioManager] 加载音效 ${type} 失败:`, err.message);
                    return;
                }
                this._soundClips[type] = { clip: clip, loaded: true };
                console.log(`[AudioManager] 音效 ${type} 加载成功`);
            });
        });
    }

    /**
     * 播放背景音乐
     * 如果 BGM 正在播放，则不会重复播放
     * 浏览器有自动播放限制，需要用户交互后才能播放
     */
    playBGM(): void {
        if (!this._bgmEnabled || !this._bgmSource) return;

        // 检查是否已经在播放同一个 BGM
        if (this._bgmSource.playing && this._bgmSource.clip) {
            return;
        }

        // 如果 BGM 未加载，标记等待交互后播放
        if (!this._bgmCache.loaded || !this._bgmCache.clip) {
            this._bgmPendingInteraction = true;
            this._registerFirstInteraction();
            return;
        }

        // 尝试播放
        this._bgmSource.clip = this._bgmCache.clip;
        const playPromise = this._bgmSource.play();
        
        // 如果浏览器返回 Promise（Web 平台），检查是否被阻止
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log('[AudioManager] BGM 开始播放');
            }).catch(() => {
                console.log('[AudioManager] 浏览器阻止自动播放，等待用户交互...');
                this._bgmPendingInteraction = true;
                this._registerFirstInteraction();
            });
        } else {
            console.log('[AudioManager] BGM 开始播放');
        }
    }

    /**
     * 注册首次用户交互监听
     * 浏览器要求用户点击后才能播放音频
     */
    private _registerFirstInteraction(): void {
        if (!this._bgmPendingInteraction) return;
        
        const handler = () => {
            // 用户交互后尝试播放 BGM
            if (this._bgmPendingInteraction) {
                this._bgmPendingInteraction = false;
                this.playBGM();
            }
            // 移除监听
            document.removeEventListener('click', handler);
            document.removeEventListener('touchstart', handler);
        };

        document.addEventListener('click', handler, { once: true });
        document.addEventListener('touchstart', handler, { once: true });
    }

    /**
     * 停止背景音乐
     */
    stopBGM(): void {
        if (this._bgmSource && this._bgmSource.playing) {
            this._bgmSource.stop();
            console.log('[AudioManager] BGM 已停止');
        }
    }

    /**
     * 暂停背景音乐
     */
    pauseBGM(): void {
        if (this._bgmSource && this._bgmSource.playing) {
            this._bgmSource.pause();
        }
    }

    /**
     * 恢复背景音乐
     */
    resumeBGM(): void {
        if (this._bgmSource && !this._bgmSource.playing) {
            this._bgmSource.play();
        }
    }

    /**
     * 播放任意 AudioClip（供 VfxManager 等外部调用）
     * @param clip 音频片段
     * @param volume 音量（0~1）
     */
    playClip(clip: AudioClip | null, volume?: number): void {
        if (!clip || !this._soundEnabled || !this._soundSource) return;
        
        const vol = volume !== undefined ? volume : this._soundVolume;
        this._soundSource.playOneShot(clip, vol);
    }

    /**
     * 播放音效
     * 使用 playOneShot 播放短音效
     * @param type 音效类型
     * @param volumeOverride 覆盖音量（可选）
     */
    playSound(type: SoundType, volumeOverride?: number): void {
        if (!this._soundEnabled || !this._soundSource) return;

        const cache = this._soundClips[type];
        if (!cache.loaded || !cache.clip) {
            console.warn(`[AudioManager] 音效 ${type} 未加载`);
            return;
        }

        const volume = volumeOverride !== undefined ? volumeOverride : this._soundVolume;
        this._soundSource.playOneShot(cache.clip, volume);
    }

    /**
     * 播放点击音效
     */
    playClick(): void {
        this.playSound('click');
    }

    /**
     * 播放正面音效
     */
    playHead(): void {
        this.playSound('head');
    }

    /**
     * 播放背面音效
     */
    playTail(): void {
        this.playSound('tail');
    }

    /**
     * 播放暴击音效
     */
    playCrit(): void {
        this.playSound('crit');
    }

    /**
     * 播放升级音效
     */
    playUpgrade(): void {
        this.playSound('upgrade');
    }

    /**
     * 设置音效开关
     * @param enabled 是否开启
     */
    setSoundEnabled(enabled: boolean): void {
        this._soundEnabled = enabled;
        
        if (!enabled && this._soundSource) {
            // 关闭音效时停止所有正在播放的音效
            this._soundSource.stop();
        }
        
        this.saveSettings();
    }

    /**
     * 设置 BGM 开关
     * @param enabled 是否开启
     */
    setBgmEnabled(enabled: boolean): void {
        this._bgmEnabled = enabled;
        
        if (!enabled) {
            this.stopBGM();
        } else if (this._bgmCache.loaded) {
            this.playBGM();
        }
        
        this.saveSettings();
    }

    /**
     * 设置音效音量
     * @param volume 音量（0~1）
     */
    setSoundVolume(volume: number): void {
        this._soundVolume = Math.max(0, Math.min(1, volume));
        
        if (this._soundSource) {
            this._soundSource.volume = this._soundVolume;
        }
        
        this.saveSettings();
    }

    /**
     * 设置 BGM 音量
     * @param volume 音量（0~1）
     */
    setBgmVolume(volume: number): void {
        this._bgmVolume = Math.max(0, Math.min(1, volume));
        
        if (this._bgmSource) {
            this._bgmSource.volume = this._bgmVolume;
        }
        
        this.saveSettings();
    }

    /**
     * 获取音效是否开启
     * @returns 是否开启
     */
    isSoundEnabled(): boolean {
        return this._soundEnabled;
    }

    /**
     * 获取 BGM 是否开启
     * @returns 是否开启
     */
    isBgmEnabled(): boolean {
        return this._bgmEnabled;
    }

    /**
     * 静音所有音频
     */
    muteAll(): void {
        if (this._bgmSource) {
            this._bgmSource.volume = 0;
        }
        if (this._soundSource) {
            this._soundSource.volume = 0;
        }
    }

    /**
     * 恢复所有音频
     */
    unmuteAll(): void {
        if (this._bgmSource) {
            this._bgmSource.volume = this._bgmVolume;
        }
        if (this._soundSource) {
            this._soundSource.volume = this._soundVolume;
        }
    }

    /**
     * 释放所有音频资源
     */
    destroy(): void {
        game.off(Game.EVENT_SHOW, this.onGameShow, this);
        if (this._bgmRecoveryTimer !== null) {
            clearTimeout(this._bgmRecoveryTimer);
            this._bgmRecoveryTimer = null;
        }

        this.stopBGM();
        
        if (this._soundSource) {
            this._soundSource.stop();
        }
        
        // 清空缓存
        this._bgmCache = { clip: null, loaded: false };
        (Object.keys(this._soundClips) as SoundType[]).forEach(type => {
            this._soundClips[type] = { clip: null, loaded: false };
        });
        
        // 销毁节点
        if (this._bgmNode) {
            this._bgmNode.destroy();
            this._bgmNode = null;
            this._bgmSource = null;
        }
        if (this._soundNode) {
            this._soundNode.destroy();
            this._soundNode = null;
            this._soundSource = null;
        }
        
        console.log('[AudioManager] 音频资源已释放');
    }

    /**
     * 保存设置到本地存储
     */
    private saveSettings(): void {
        try {
            const settings = {
                soundEnabled: this._soundEnabled,
                bgmEnabled: this._bgmEnabled,
                soundVolume: this._soundVolume,
                bgmVolume: this._bgmVolume
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
        } catch (e) {
            console.error('[AudioManager] 保存设置失败:', e);
        }
    }

    /**
     * 从本地存储加载设置
     */
    private loadSettings(): void {
        try {
            const saveStr = localStorage.getItem(this.STORAGE_KEY);
            if (!saveStr) {
                console.log('[AudioManager] 未找到音频设置，使用默认设置');
                return;
            }
            
            const settings = JSON.parse(saveStr);
            this._soundEnabled = settings.soundEnabled ?? true;
            this._bgmEnabled = settings.bgmEnabled ?? true;
            this._soundVolume = settings.soundVolume ?? 1.0;
            this._bgmVolume = settings.bgmVolume ?? 0.5;
            
            console.log('[AudioManager] 音频设置加载成功');
        } catch (e) {
            console.error('[AudioManager] 加载音频设置失败:', e);
        }
    }
}

// 导出音效类型供外部使用
export type { SoundType };
