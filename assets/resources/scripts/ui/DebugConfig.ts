import { _decorator, Component } from 'cc';
import { PlayerData } from '../core/PlayerData';

const { ccclass, property } = _decorator;

@ccclass('DebugConfig')
export class DebugConfig extends Component {

    @property({ group: '面值', displayName: '初始值', step: 1, min: 0 })
    value_initialValue: number = 1;

    @property({ group: '面值', displayName: '初始价格', step: 1, min: 1 })
    value_initialPrice: number = 5;

    @property({ group: '面值', displayName: '价格增长系数', step: 0.1, min: 1 })
    value_priceGrowthFactor: number = 1.2;

    @property({ group: '速度', displayName: '初始值', step: 0.5, min: 0.5 })
    speed_initialValue: number = 5;

    @property({ group: '速度', displayName: '初始价格', step: 1, min: 1 })
    speed_initialPrice: number = 5;

    @property({ group: '速度', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    speed_priceGrowthFactor: number = 1.2;

    @property({ group: '幸运', displayName: '初始值(%)', step: 1, min: 0, max: 100 })
    lucky_initialValue: number = 50;

    @property({ group: '幸运', displayName: '初始价格', step: 1, min: 1 })
    lucky_initialPrice: number = 5;

    @property({ group: '幸运', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    lucky_priceGrowthFactor: number = 1.2;

    @property({ group: '暴击率', displayName: '初始值(%)', step: 1, min: 0, max: 100 })
    critical_initialValue: number = 0;

    @property({ group: '暴击率', displayName: '初始价格', step: 1, min: 1 })
    critical_initialPrice: number = 5;

    @property({ group: '暴击率', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    critical_priceGrowthFactor: number = 1.2;
    
    @property({ group: '暴击加成', displayName: '初始值', step: 1, min: 0 })
    criticalBonus_initialValue: number = 0;

    @property({ group: '暴击加成', displayName: '初始价格', step: 1, min: 1 })
    criticalBonus_initialPrice: number = 5;

    @property({ group: '暴击加成', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    criticalBonus_priceGrowthFactor: number = 1.2;

    @property({ group: '保底', displayName: '初始值(次)', step: 1, min: 1 })
    pity_initialValue: number = 20;

    @property({ group: '保底', displayName: '初始价格', step: 1, min: 1 })
    pity_initialPrice: number = 5;

    @property({ group: '保底', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    pity_priceGrowthFactor: number = 1.2;
    
    @property({ group: '连击加成', displayName: '初始值', step: 1, min: 0 })
    streakBonus_initialValue: number = 0;

    @property({ group: '连击加成', displayName: '初始价格', step: 1, min: 1 })
    streakBonus_initialPrice: number = 5;

    @property({ group: '连击加成', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    streakBonus_priceGrowthFactor: number = 1.2;

    @property({ group: '自动时间', displayName: '初始值(秒)', step: 1, min: 1 })
    time_initialValue: number = 10;

    @property({ group: '自动时间', displayName: '初始价格', step: 1, min: 1 })
    time_initialPrice: number = 5;

    @property({ group: '自动时间', displayName: '价格增长系数', step: 0.1, min: 0.1 })
    time_priceGrowthFactor: number = 1.2;

    // @property({ group: '全局', displayName: '价格增长系数', step: 0.05, min: 1.0 })
    // global_growthFactor: number = 1.2;

    // @property({ group: '全局', displayName: '翻转动画时长(秒)', step: 0.1, min: 0.1 })
    // flipDuration: number = 1.5;

    @property({ group: '全局', displayName: '强制重置数据', tooltip: '勾选后清除 localStorage 并重新初始化所有数据' })
    forceReset: boolean = false;

    onLoad() {
        this.applyToPlayerData();
    }

    private applyToPlayerData(): void {
        const pd = PlayerData.getInstance();

        pd.setUpgradeConfig('value', this.value_initialValue, this.value_initialPrice, this.value_priceGrowthFactor);
        pd.setUpgradeConfig('speed', this.speed_initialValue, this.speed_initialPrice, this.speed_priceGrowthFactor);
        pd.setUpgradeConfig('lucky', this.lucky_initialValue, this.lucky_initialPrice, this.lucky_priceGrowthFactor);
        pd.setUpgradeConfig('critical', this.critical_initialValue, this.critical_initialPrice, this.critical_priceGrowthFactor);
        pd.setUpgradeConfig('criticalBonus', this.criticalBonus_initialValue, this.criticalBonus_initialPrice, this.criticalBonus_priceGrowthFactor);
        pd.setUpgradeConfig('pity', this.pity_initialValue, this.pity_initialPrice, this.pity_priceGrowthFactor);
        pd.setUpgradeConfig('streakBonus', this.streakBonus_initialValue, this.streakBonus_initialPrice, this.streakBonus_priceGrowthFactor);
        pd.setUpgradeConfig('time', this.time_initialValue, this.time_initialPrice, this.time_priceGrowthFactor);

        // pd.setGlobalGrowthFactor(this.global_growthFactor);

        // 强制重置：清除 localStorage 后重新初始化
        if (this.forceReset) {
            try {
                localStorage.removeItem('xianzheng_player_data_v3');
                console.log('[DebugConfig] 已清除 localStorage');
            } catch (e) {
                console.warn('[DebugConfig] 清除 localStorage 失败:', e);
            }
            pd.applyDebugConfig();
            console.log('[DebugConfig] 已强制重置所有数据');
        } else {
            pd.applyDebugConfig();
        }

        console.log('[DebugConfig] 调试配置已应用到 PlayerData');
    }
}
