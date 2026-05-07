# main.scene 节点结构

```
Scene
└── Canvas
    ├── Camera
    ├── MainPage
    │   ├── bg
    │   ├── CoinSection
    │   │   ├── Coin
    │   │   ├── criticalHit [非激活]
    │   │   │   ├── Node
    │   │   │   │   ├── 暴击
    │   │   │   │   ├── jiangjin
    │   │   │   │   ├── X
    │   │   │   │   └── bonus
    │   │   │   └── critical_vfx
    │   │   │       └── frame0000
    │   │   ├── addScore [非激活]
    │   │   ├── streak [非激活]
    │   │   │   ├── 连击
    │   │   │   ├── lianji
    │   │   │   ├── X
    │   │   │   └── bonus
    │   │   ├── autoing [非激活]
    │   │   │   ├── zidongzhong
    │   │   │   ├── time
    │   │   │   └── 自动_vfx
    │   │   └── pity [非激活]
    │   │       └── vfx
    │   │           ├── frame0000
    │   │           └── Label
    │   ├── UI
    │   │   ├── TopSection
    │   │   │   ├── bg
    │   │   │   ├── vfx [非激活]
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
    │   │       │   └── vfx [非激活]
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
    │   │       │   └── vfx [非激活]
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
    │   │           └── vfx [非激活]
    │   │               └── frame0000
    │   └── SettingPopup [非激活]
    │       ├── mask
    │       ├── bg
    │       ├── title
    │       │   ├── Label
    │       │   └── icon
    │       ├── music
    │       │   ├── on
    │       │   ├── off [非激活]
    │       │   ├── Label
    │       │   └── icon
    │       ├── sfx
    │       │   ├── Label
    │       │   ├── icon
    │       │   ├── on-001
    │       │   └── off-001 [非激活]
    │       ├── vib
    │       │   ├── Label
    │       │   ├── 像素-声音开
    │       │   ├── on
    │       │   └── off [非激活]
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
    │       │   └── vfx [非激活]
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
    │       │   └── vfx [非激活]
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
    │       │   └── vfx [非激活]
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
    │       │   └── vfx [非激活]
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
    │       │   └── vfx [非激活]
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
    │       │   └── vfx [非激活]
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
    │       │   └── vfx [非激活]
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
    │           └── vfx [非激活]
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
    └── Toast [非激活]
        ├── bg
        └── Label
```
