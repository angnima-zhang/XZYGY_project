/**
 * NumberFormatter - 数值格式化工具类
 * 
 * 功能说明：
 * - 将大数值格式化为中文单位（万、亿）
 * - 永远保留2位小数，四舍五入
 * - 将秒数格式化为时分秒格式
 * - 概率格式化（百分比）
 * 
 * 使用方式：
 * NumberFormatter.formatMoney(12345678)  // 返回 "1234.57万"
 * NumberFormatter.formatTime(3665)       // 返回 "1时1分5秒"
 */

export class NumberFormatter {

    /**
     * 格式化金额数值（使用中文单位：万、亿）
     * 永远保留2位小数，四舍五入
     * 
     * @param num 数值
     * @returns 格式化后的字符串
     * 
     * 示例：
     * 5 -> "5"
     * 12345 -> "1.23万"
     * 12345678 -> "1234.57万"
     * 123456789 -> "1.23亿"
     */
    static formatMoney(num: number): string {
        if (num < 10000) {
            return Math.floor(num).toString();
        } else if (num < 100000000) {
            // 万位：保留2位小数
            return (num / 10000).toFixed(2) + '万';
        } else {
            // 亿位：保留2位小数
            return (num / 100000000).toFixed(2) + '亿';
        }
    }

    /**
     * 格式化时间（秒数转换为时分秒格式）
     * 永远保留2位小数（仅对秒部分）
     * 
     * @param seconds 秒数
     * @returns 格式化后的字符串
     * 
     * 示例：
     * 5 -> "5.00秒"
     * 90 -> "1分30.00秒"
     * 3665 -> "1时1分5.00秒"
     */
    static formatTime(seconds: number): string {
        if (seconds < 60) {
            return seconds.toFixed(2) + '秒';
        } else if (seconds < 3600) {
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = (seconds % 60).toFixed(2);
            return `${minutes}分${remainingSeconds}秒`;
        } else {
            const hours = Math.floor(seconds / 3600);
            const remainingAfterHours = seconds % 3600;
            const minutes = Math.floor(remainingAfterHours / 60);
            const remainingSeconds = (remainingAfterHours % 60).toFixed(2);
            return `${hours}时${minutes}分${remainingSeconds}秒`;
        }
    }

    /**
     * 格式化概率（百分比）
     * 保留2位小数
     * 
     * @param percent 百分比数值（如 50 表示 50%）
     * @returns 格式化后的字符串
     * 
     * 示例：
     * 50 -> "50.00%"
     * 33.333 -> "33.33%"
     */
    static formatPercent(percent: number): string {
        return percent.toFixed(2) + '%';
    }

    /**
     * 格式化保底次数
     * 
     * @param count 次数
     * @returns 格式化后的字符串
     * 
     * 示例：
     * 20 -> "20次"
     */
    static formatCount(count: number): string {
        return Math.floor(count) + '次';
    }

    /**
     * 格式化通用数值（不区分类型，仅格式化大数字）
     * 
     * @param num 数值
     * @returns 格式化后的字符串
     */
    static formatNumber(num: number): string {
        return this.formatMoney(num);
    }
}