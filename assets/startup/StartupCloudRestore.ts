interface CloudArchiveItem {
    uuid: string;
    fileId: string;
    name: string;
    modifiedTime?: number | string;
    createdTime?: number | string;
}

/**
 * 启动主包使用的最小云存档恢复器。
 *
 * 完整的上传和延迟同步仍由 resources 分包内的 TapCloudSave 管理；这里不引用
 * 分包脚本，确保 TapTap 可以先显示加载页，再下载 resources 分包。
 */
export class StartupCloudRestore {
    private static readonly PLAYER_DATA_KEY = 'xianzheng_player_data_v3';
    private static readonly ARCHIVE_NAME = 'xianzheng_main_v1';
    private static readonly ARCHIVE_FILE_NAME = 'xianzheng_cloud_v1.json';
    private static readonly TIMEOUT_MS = 8 * 1000;

    static async restoreBeforeGame(): Promise<void> {
        const tap = (globalThis as any).tap;
        if (!tap?.getCloudSaveManager || !tap?.getFileSystemManager || !tap?.getStorageSync) {
            return;
        }

        try {
            const localSave = tap.getStorageSync(this.PLAYER_DATA_KEY);
            if (localSave !== undefined && localSave !== null && localSave !== '') {
                return;
            }

            const manager = tap.getCloudSaveManager();
            const fs = tap.getFileSystemManager();
            const listResult = await this.callApi<{ saves?: CloudArchiveItem[] }>((success, fail) => {
                manager.getArchiveList({ success, fail });
            });

            const archives = (listResult.saves ?? [])
                .filter(item => item.name === this.ARCHIVE_NAME)
                .sort((a, b) => this.archiveTime(b) - this.archiveTime(a));
            const archive = archives[0];
            if (!archive) return;

            const targetFilePath = `${tap.env.USER_DATA_PATH}/${this.ARCHIVE_FILE_NAME}`;
            const downloadResult = await this.callApi<{ filePath: string }>((success, fail) => {
                manager.getArchiveData({
                    archiveUUID: archive.uuid,
                    archiveFileId: archive.fileId,
                    targetFilePath,
                    success,
                    fail
                });
            });

            const content = fs.readFileSync(downloadResult.filePath, 'utf8');
            tap.setStorageSync(this.PLAYER_DATA_KEY, this.extractPlayerData(content));
            console.log('[StartupCloudRestore] 已从云端恢复玩家进度');
        } catch (error) {
            // 云端异常不能阻塞启动，游戏仍可使用本地存档或新档继续。
            console.warn('[StartupCloudRestore] 云存档恢复失败，已继续启动:', this.errorMessage(error));
        }
    }

    private static extractPlayerData(content: string): string {
        const parsed = JSON.parse(content);
        const playerData = parsed?.schemaVersion === 1 ? parsed.playerData : parsed;
        if (!playerData || typeof playerData.balance !== 'number' || !playerData.upgrades || !playerData.stats) {
            throw new Error('云存档内容格式无效');
        }
        return JSON.stringify(playerData);
    }

    private static archiveTime(archive: CloudArchiveItem): number {
        return Number(archive.modifiedTime ?? archive.createdTime ?? 0) || 0;
    }

    private static callApi<T>(
        start: (success: (result: T) => void, fail: (error: unknown) => void) => void
    ): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                reject(new Error('TapTap 云存档请求超时'));
            }, this.TIMEOUT_MS);

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
