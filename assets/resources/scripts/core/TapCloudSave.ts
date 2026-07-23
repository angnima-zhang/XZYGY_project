interface CloudArchiveItem {
    uuid: string;
    fileId: string;
    name: string;
    modifiedTime?: number | string;
    createdTime?: number | string;
}

interface CloudSaveEnvelope {
    schemaVersion: 1;
    savedAt: number;
    playerData: unknown;
}

/**
 * TapTap 云存档。
 * 本地存档始终优先；仅在本地无档时从云端恢复。
 */
export class TapCloudSave {
    private static readonly PLAYER_DATA_KEY = 'xianzheng_player_data_v3';
    private static readonly LAST_UPLOAD_KEY = 'xianzheng_cloud_last_upload_v1';
    private static readonly ARCHIVE_NAME = 'xianzheng_main_v1';
    private static readonly ARCHIVE_FILE_NAME = 'xianzheng_cloud_v1.json';
    private static readonly SYNC_DELAY_MS = 3 * 60 * 1000;
    private static readonly MIN_UPLOAD_INTERVAL_MS = 60 * 1000;
    private static readonly STARTUP_TIMEOUT_MS = 8 * 1000;
    private static readonly UPLOAD_TIMEOUT_MS = 30 * 1000;

    private static _tap: any = null;
    private static _manager: any = null;
    private static _fs: any = null;
    private static _archiveUUID: string = '';
    private static _archiveFileId: string = '';
    private static _archiveLookupComplete: boolean = false;
    private static _initialized: boolean = false;
    private static _dirty: boolean = false;
    private static _syncing: boolean = false;
    private static _lastUploadAt: number = 0;
    private static _syncTimer: ReturnType<typeof setTimeout> | null = null;
    private static _syncDueAt: number = 0;

    /** 在 PlayerData 初始化前调用，必要时把云档恢复到 TapTap 本地缓存。 */
    static async restoreBeforeGame(): Promise<void> {
        if (this._initialized) return;

        const tap = (globalThis as any).tap;
        if (!tap?.getCloudSaveManager || !tap?.getFileSystemManager || !tap?.getStorageSync) {
            this._initialized = true;
            return;
        }

        try {
            this._tap = tap;
            this._manager = tap.getCloudSaveManager();
            this._fs = tap.getFileSystemManager();
            this._lastUploadAt = Number(tap.getStorageSync(this.LAST_UPLOAD_KEY)) || 0;
            this.registerHideSync();

            const localSave = this.readLocalPlayerData();
            const archive = await this.findCloudArchive(this.STARTUP_TIMEOUT_MS);
            this._archiveLookupComplete = true;
            this.setArchive(archive);

            if (!localSave && archive) {
                await this.downloadAndRestore(archive);
            } else if (localSave && !archive) {
                // 已有本地进度但尚无云档，安排首次备份。
                this._dirty = true;
                this.scheduleSync(this.SYNC_DELAY_MS);
            }
        } catch (error) {
            // 云端失败不能阻塞启动；保持本地存档继续游戏。
            console.warn('[TapCloudSave] 启动同步失败，已降级为本地存档:', this.errorMessage(error));
        } finally {
            this._initialized = true;
        }
    }

    /** PlayerData 每次成功保存后调用。 */
    static markDirty(): void {
        if (!this._manager) return;
        this._dirty = true;
        this.scheduleSync(this.SYNC_DELAY_MS);
    }

    /** 立即尝试同步；仍会遵守一分钟上传频控。 */
    static async syncNow(): Promise<void> {
        if (!this._manager || !this._fs || !this._dirty || this._syncing) return;

        if (!this._archiveLookupComplete) {
            try {
                const archive = await this.findCloudArchive(this.STARTUP_TIMEOUT_MS);
                this._archiveLookupComplete = true;
                this.setArchive(archive);
            } catch (error) {
                console.warn('[TapCloudSave] 暂时无法确认云档状态:', this.errorMessage(error));
                this.scheduleSync(this.MIN_UPLOAD_INTERVAL_MS);
                return;
            }
        }

        const waitMs = this.MIN_UPLOAD_INTERVAL_MS - (Date.now() - this._lastUploadAt);
        if (waitMs > 0) {
            this.scheduleSync(waitMs);
            return;
        }

        const playerDataJson = this.readLocalPlayerData();
        if (!playerDataJson) {
            this._dirty = false;
            return;
        }

        this._syncing = true;
        this._dirty = false;

        try {
            const savedAt = Date.now();
            const envelope: CloudSaveEnvelope = {
                schemaVersion: 1,
                savedAt,
                playerData: JSON.parse(playerDataJson)
            };
            const filePath = `${this._tap.env.USER_DATA_PATH}/${this.ARCHIVE_FILE_NAME}`;
            this._fs.writeFileSync(filePath, JSON.stringify(envelope), 'utf8');
            await this.uploadArchive(filePath, savedAt);

            this._lastUploadAt = Date.now();
            this._tap.setStorageSync(this.LAST_UPLOAD_KEY, this._lastUploadAt);
            console.log('[TapCloudSave] 云存档同步成功');
        } catch (error) {
            this._dirty = true;
            this._archiveLookupComplete = false;
            console.warn('[TapCloudSave] 云存档同步失败，将稍后重试:', this.errorMessage(error));
        } finally {
            this._syncing = false;
            if (this._dirty) {
                this.scheduleSync(this.MIN_UPLOAD_INTERVAL_MS);
            }
        }
    }

    private static registerHideSync(): void {
        if (!this._tap?.onHide) return;
        this._tap.onHide(() => {
            void this.syncNow();
        });
    }

    private static readLocalPlayerData(): string | null {
        const value = this._tap?.getStorageSync?.(this.PLAYER_DATA_KEY);
        if (value === undefined || value === null || value === '') return null;
        return typeof value === 'string' ? value : JSON.stringify(value);
    }

    private static async findCloudArchive(timeoutMs: number): Promise<CloudArchiveItem | null> {
        const result = await this.callApi<{ saves?: CloudArchiveItem[] }>((success, fail) => {
            this._manager.getArchiveList({ success, fail });
        }, timeoutMs);

        const matches = (result.saves ?? []).filter(item => item.name === this.ARCHIVE_NAME);
        matches.sort((a, b) => this.archiveTime(b) - this.archiveTime(a));
        return matches[0] ?? null;
    }

    private static async downloadAndRestore(archive: CloudArchiveItem): Promise<void> {
        const targetFilePath = `${this._tap.env.USER_DATA_PATH}/${this.ARCHIVE_FILE_NAME}`;
        const result = await this.callApi<{ filePath: string }>((success, fail) => {
            this._manager.getArchiveData({
                archiveUUID: archive.uuid,
                archiveFileId: archive.fileId,
                targetFilePath,
                success,
                fail
            });
        }, this.STARTUP_TIMEOUT_MS);

        const content = this._fs.readFileSync(result.filePath, 'utf8');
        const playerDataJson = this.extractPlayerData(content);
        this._tap.setStorageSync(this.PLAYER_DATA_KEY, playerDataJson);
        console.log('[TapCloudSave] 已从云端恢复玩家进度');
    }

    private static extractPlayerData(content: string): string {
        const parsed = JSON.parse(content);
        const playerData = parsed?.schemaVersion === 1 ? parsed.playerData : parsed;
        if (!playerData || typeof playerData.balance !== 'number' || !playerData.upgrades || !playerData.stats) {
            throw new Error('云存档内容格式无效');
        }
        return JSON.stringify(playerData);
    }

    private static async uploadArchive(filePath: string, savedAt: number): Promise<void> {
        const archiveMetaData = {
            name: this.ARCHIVE_NAME,
            summary: `Auto save ${new Date(savedAt).toISOString()}`,
            extra: 'schemaVersion=1'
        };

        if (this._archiveUUID) {
            const result = await this.callApi<{ fileId: string }>((success, fail) => {
                this._manager.updateArchive({
                    archiveUUID: this._archiveUUID,
                    archiveMetaData,
                    archiveFilePath: filePath,
                    success,
                    fail
                });
            }, this.UPLOAD_TIMEOUT_MS);
            this._archiveFileId = result.fileId;
            return;
        }

        const result = await this.callApi<{ uuid: string; fileId: string }>((success, fail) => {
            this._manager.createArchive({
                archiveMetaData,
                archiveFilePath: filePath,
                success,
                fail
            });
        }, this.UPLOAD_TIMEOUT_MS);
        this._archiveUUID = result.uuid;
        this._archiveFileId = result.fileId;
    }

    private static setArchive(archive: CloudArchiveItem | null): void {
        this._archiveUUID = archive?.uuid ?? '';
        this._archiveFileId = archive?.fileId ?? '';
    }

    private static archiveTime(archive: CloudArchiveItem): number {
        return Number(archive.modifiedTime ?? archive.createdTime ?? 0) || 0;
    }

    private static scheduleSync(delayMs: number): void {
        const dueAt = Date.now() + Math.max(0, delayMs);
        if (this._syncTimer && this._syncDueAt <= dueAt) return;

        if (this._syncTimer) clearTimeout(this._syncTimer);
        this._syncDueAt = dueAt;
        this._syncTimer = setTimeout(() => {
            this._syncTimer = null;
            this._syncDueAt = 0;
            void this.syncNow();
        }, Math.max(0, delayMs));
    }

    private static callApi<T>(
        start: (success: (result: T) => void, fail: (error: unknown) => void) => void,
        timeoutMs: number
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                reject(new Error('TapTap 云存档请求超时'));
            }, timeoutMs);

            const finish = (callback: (value: any) => void, value: any) => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                callback(value);
            };

            try {
                start(
                    result => finish(resolve, result),
                    error => finish(reject, error)
                );
            } catch (error) {
                finish(reject, error);
            }
        });
    }

    private static errorMessage(error: unknown): string {
        if (error instanceof Error) return error.message;
        try {
            return JSON.stringify(error);
        } catch {
            return String(error);
        }
    }
}
