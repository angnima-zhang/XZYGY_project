# main.scene 节点层级树

```
Canvas
├── Camera
├── MainPage
│   ├── bg
│   ├── CoinSection
│   │   ├── Coin
│   │   ├── criticalHit
│   │   │   ├── Node
│   │   │   │   ├── 暴击
│   │   │   │   ├── jiangjin
│   │   │   │   ├── X
│   │   │   │   └── bonus
│   │   │   └── critical_vfx
│   │   │       └── frame0000
│   │   ├── addScore
│   │   ├── streak
│   │   │   ├── 连击
│   │   │   ├── lianji
│   │   │   ├── X
│   │   │   └── bonus
│   │   ├── autoing
│   │   │   ├── zidongzhong
│   │   │   ├── time
│   │   │   └── 自动_vfx
│   │   └── pity
│   │       └── vfx
│   │           ├── frame0000
│   │           └── Label
│   ├── UI
│   │   ├── TopSection
│   │   │   ├── bg
│   │   │   ├── vfx
│   │   │   │   └── streak_fire
│   │   │   ├── button_setting
│   │   │   ├── socre
│   │   │   ├── need
│   │   │   │   ├── text
│   │   │   │   └── text-001
│   │   │   ├── ProgressBar
│   │   │   │   └── Bar
│   │   │   └── hitCount
│   │   │       ├── text
│   │   │       ├── text-001
│   │   │       └── text-002
│   │   ├── BottomSection
│   │   │   └── buttons
│   │   │       ├── button_shop
│   │   │       │   ├── Sprite
│   │   │       │   └── Label
│   │   │       └── button_status
│   │   │           ├── Sprite
│   │   │           └── Label
│   │   └── UpgradeSection
│   │       ├── value
│   │       │   ├── bg
│   │       │   ├── 极窄金框
│   │       │   ├── icon
│   │       │   ├── name
│   │       │   ├── currentValue
│   │       │   ├── to
│   │       │   ├── nextValue
│   │       │   ├── buy
│   │       │   │   └── price
│   │       │   ├── ad
│   │       │   │   └── Label
│   │       │   └── vfx
│   │       │       └── frame0000
│   │       ├── speed
│   │       │   ├── bg
│   │       │   ├── icon
│   │       │   ├── name
│   │       │   ├── currentValue
│   │       │   ├── to
│   │       │   ├── nextValue
│   │       │   ├── buy
│   │       │   │   └── Label
│   │       │   ├── ad
│   │       │   │   └── Label
│   │       │   ├── 极窄金框
│   │       │   └── vfx
│   │       │       └── frame0000
│   │       └── auto
│   │           ├── bg
│   │           ├── icon
│   │           ├── name
│   │           ├── currentValue
│   │           ├── buy
│   │           │   └── Label
│   │           ├── ad
│   │           │   └── Label
│   │           ├── 极窄金框
│   │           └── vfx
│   │               └── frame0000
│   └── SettingPopup
│       ├── mask
│       ├── bg
│       ├── title
│       │   ├── Label
│       │   └── icon
│       ├── music
│       │   ├── on
│       │   ├── off
│       │   ├── Label
│       │   └── icon
│       ├── sfx
│       │   ├── Label
│       │   ├── icon
│       │   ├── on-001
│       │   └── off-001
│       ├── vib
│       │   ├── Label
│       │   ├── 像素-声音开
│       │   ├── on
│       │   └── off
│       └── close
│           └── Label
├── UpgradePage
│   ├── bg
│   ├── title
│   │   ├── bg
│   │   ├── 返回
│   │   ├── 升级
│   │   └── Label
│   ├── money
│   │   ├── bg
│   │   ├── Label
│   │   ├── desc
│   │   └── 极窄金框
│   └── upgrades
│       ├── value
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── price
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       └── frame0000
│       ├── speed
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── Label
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       └── frame0000
│       ├── lucky
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── Label
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       ├── 幸运
│       │       └── frame0000
│       ├── critical
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── Label
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       └── frame0000
│       ├── criticalBonus
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── Label
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       └── frame0000
│       ├── pity
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── Label
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       └── frame0000
│       ├── streakBonus
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── to
│       │   ├── nextValue
│       │   ├── buy
│       │   │   └── Label
│       │   ├── ad
│       │   │   └── Label
│       │   ├── 极窄金框
│       │   └── vfx
│       │       └── frame0000
│       └── time
│           ├── bg
│           ├── icon
│           ├── name
│           ├── currentValue
│           ├── to
│           ├── nextValue
│           ├── buy
│           │   └── Label
│           ├── ad
│           │   └── Label
│           ├── 极窄金框
│           └── vfx
│               ├── 时间
│               └── Effect_EldenRing_1_000
├── StatusPage
│   ├── bg
│   ├── title
│   │   ├── bg
│   │   ├── 返回
│   │   ├── 排行榜
│   │   └── Label
│   ├── prediction
│   │   ├── bg
│   │   ├── 边框 (1)
│   │   ├── Label
│   │   └── Label-001
│   ├── record_section
│   │   ├── bg
│   │   └── record
│   │       ├── total_flip_count
│   │       │   ├── bg
│   │       │   ├── 边框2
│   │       │   ├── desc
│   │       │   └── Label-001
│   │       ├── highest_streak
│   │       │   ├── bg
│   │       │   ├── 边框2
│   │       │   ├── desc
│   │       │   └── Label-001
│   │       ├── total_critical_count
│   │       │   ├── bg
│   │       │   ├── 边框2
│   │       │   ├── desc
│   │       │   └── Label-001
│   │       └── total_auto_time
│   │           ├── bg
│   │           ├── 边框2
│   │           ├── desc
│   │           └── Label-001
│   └── upgrades
│       ├── value
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       ├── speed
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       ├── lucky
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       ├── critical
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       ├── criticalBonus
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       ├── pity
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       ├── streakBonus
│       │   ├── bg
│       │   ├── icon
│       │   ├── name
│       │   ├── currentValue
│       │   ├── desc
│       │   └── 极窄金框
│       └── time
│           ├── bg
│           ├── icon
│           ├── name
│           ├── currentValue
│           ├── desc
│           └── 极窄金框
└── Toast
    ├── bg
    └── Label
```

## 节点结构概览

| 顶层节点 | 功能 | 子节点数 |
|---------|------|---------|
| **MainPage** | 主界面 | CoinSection、UI、SettingPopup |
| **UpgradePage** | 升级面板 | title、money、upgrades（含8个升级项） |
| **StatusPage** | 属性/记录面板 | title、prediction、record_section、upgrades |
| **Toast** | 临时提示 | bg、Label |

## 8种升级项（UpgradePage + StatusPage）

1. **value** - 面值
2. **speed** - 动画速度
3. **lucky** - 正面概率
4. **critical** - 暴击率
5. **criticalBonus** - 暴击加成
6. **pity** - 保底
7. **streakBonus** - 连击加成
8. **time** - 自动持续时间
