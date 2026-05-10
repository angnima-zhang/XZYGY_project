# StatusPage 节点状态记录

> 记录时间：2026-05-10
> 场景路径：assets/resources/scenes/main.scene

---

## 一、StatusPage 根节点

| 属性 | 值 |
|------|------|
| 节点名称 | StatusPage |
| 位置 | (0, 0, 0) |
| 尺寸 | 720 x 1280 |
| 锚点 | (0.5, 0.5) |

---

## 二、upgrades 节点（ScrollView）

### 节点基础信息

| 属性 | 值 |
|------|------|
| 节点名称 | upgrades |
| 路径 | StatusPage/upgrades |
| UUID | acrH9j1GxHrLTAO59Rirjb |
| 位置 | (0, -567.1) |
| 尺寸 | 720 x 930 |
| 锚点 | (0.5, 0.5) |

### 组件配置

#### cc.UITransform
- contentSize: { width: 720, height: 930 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Widget
- top: 742.105
- left: 0
- right: 0
- alignFlags: ["top", "left", "right"]

#### cc.ScrollView
- view 节点：upgrades/view
- content 节点：upgrades/view/content
- horizontal: false
- vertical: true
- inertia: true
- brake: 0.5
- verticalScrollBar: 无

---

## 三、view 节点（Mask）

### 节点基础信息

| 属性 | 值 |
|------|------|
| 节点名称 | view |
| 路径 | upgrades/view |
| UUID | c63ZOcOXVOaq2/qd7/RS1E |
| 位置 | (0, 465) |
| 尺寸 | 720 x 533 |
| 锚点 | (0.5, 1) |

### 组件配置

#### cc.UITransform
- contentSize: { width: 720, height: 533 }
- anchorPoint: { x: 0.5, y: 1 }

#### cc.Widget
- top: 0
- bottom: 397
- left: 0
- right: 0
- alignFlags: ["top", "bottom", "left", "right"]

#### cc.Mask
- type: RECT

---

## 四、content 节点（Layout）

### 节点基础信息

| 属性 | 值 |
|------|------|
| 节点名称 | content |
| 路径 | upgrades/view/content |
| UUID | 3d33eKqTNLy5IKKihSrVkc |
| 位置 | (0, 0) |
| 尺寸 | 720 x 905 |
| 锚点 | (0.5, 1) |

### 组件配置

#### cc.UITransform
- contentSize: { width: 720, height: 905 }
- anchorPoint: { x: 0.5, y: 1 }

#### cc.Layout
- type: VERTICAL
- resizeMode: CONTAINER
- cellSize: { width: 40, height: 40 }
- startAxis: HORIZONTAL
- paddingLeft: 0
- paddingRight: 0
- paddingTop: 0
- paddingBottom: 0
- spacingX: 0
- spacingY: -15
- horizontalDirection: LEFT_TO_RIGHT
- verticalDirection: TOP_TO_BOTTOM

---

## 五、各升级项 desc 节点详细信息

### 1. value/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/value/desc |
| UUID | 3bHr14Cp1DeozjbX8NW+05 |
| 父节点 | upgrades/view/content/value |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -95, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 330, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "翻到正面获得的基础金额"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 2. speed/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/speed/desc |
| UUID | 24gCcyVsJIdYyGrCD4kzY8 |
| 父节点 | upgrades/view/content/speed |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -155, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 210, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "抛硬币动画速度"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 3. lucky/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/lucky/desc |
| UUID | 52UmGUhudBw4warXkPetj5 |
| 父节点 | upgrades/view/content/lucky |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -95, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 330, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "抛硬币结果是正面的概率"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 4. critical/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/critical/desc |
| UUID | 28kmfCIfZGuLkHGPkXV89s |
| 父节点 | upgrades/view/content/critical |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -185, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 150, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "暴击的概率"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 5. criticalBonus/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/criticalBonus/desc |
| UUID | 86GT/qO4hCDKvvT3icFeX2 |
| 父节点 | upgrades/view/content/criticalBonus |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -110, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 300, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "每次暴击额外获得金额"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 6. pity/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/pity/desc |
| UUID | eb6ZFoW7hGw4FJJ7JSuxKT |
| 父节点 | upgrades/view/content/pity |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -65, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 390, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "连续多少次背面必有一次正面"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 7. streakBonus/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/streakBonus/desc |
| UUID | 81OVkxvxhH8IkRoM9EWyUz |
| 父节点 | upgrades/view/content/streakBonus |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -125, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 250, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "连击加成基础金额"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

### 8. time/desc

| 属性 | 值 |
|------|------|
| 节点名称 | desc |
| 路径 | upgrades/view/content/time/desc |
| UUID | e3lpuMTYpKoKu7yyF6tQWz |
| 父节点 | upgrades/view/content/time |
| 父节点尺寸 | 720 x 100 |

#### 节点 Transform
- position: { x: -155, y: -24, z: 0 }
- rotation: { x: 0, y: 0, z: 0 }
- scale: { x: 1, y: 1, z: 1 }

#### cc.UITransform
- contentSize: { width: 250, height: 50 }
- anchorPoint: { x: 0.5, y: 0.5 }

#### cc.Label
- string: "自动翻转持续时间"
- fontSize: 30
- lineHeight: 0 (auto)
- overflow: 0 (NONE)
- enableWrapText: true
- horizontalAlign: LEFT
- verticalAlign: CENTER
- color: { r: 180, g: 180, b: 180, a: 255 }

#### cc.Widget
- top: 49
- left: 100
- alignFlags: ["top", "left"]
- isAbsTop: true
- isAbsLeft: true

---

## 六、desc 节点位置计算逻辑

### 公式

对于同时设置了 top 和 left 的 Widget 节点，其世界坐标计算公式为：

```
实际位置.x = 父节点.x + left + (节点宽度 / 2) - (父节点宽度 / 2)
实际位置.y = 父节点.y - top - (节点高度 / 2) + (父节点高度 / 2)
```

### 以 value/desc 为例

```
父节点 (value) 尺寸: 720 x 100
节点 (desc) 尺寸: 330 x 50

position.x = -95
position.y = -24

Widget.left = 100
Widget.top = 49

验证:
实际位置.x = 0 + 100 + (330 / 2) - (720 / 2) = 0 + 100 + 165 - 360 = -95 ✓
实际位置.y = 0 - 49 - (50 / 2) + (100 / 2) = 0 - 49 - 25 + 50 = -24 ✓
```

---

## 七、各父节点完整结构

### value 节点

```
value (720x100, y=-50)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (98x63, position: -211.25,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── desc (330x50, position: -95,-24, Widget: top=49, left=100)
└── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
```

### speed 节点

```
speed (720x100, y=-165)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (195x63, position: -162.5,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── desc (210x50, position: -155,-24, Widget: top=49, left=100)
└── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
```

### lucky 节点

```
lucky (720x100, y=-280)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (195x63, position: -162.5,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
└── desc (330x50, position: -95,-24, Widget: top=49, left=100)
```

### critical 节点

```
critical (720x100, y=-395)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (146x63, position: -186.87,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
└── desc (150x50, position: -185,-24, Widget: top=49, left=100)
```

### criticalBonus 节点

```
criticalBonus (720x100, y=-510)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (195x63, position: -162.5,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
└── desc (300x50, position: -110,-24, Widget: top=49, left=100)
```

### pity 节点

```
pity (720x100, y=-625)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (98x63, position: -211.25,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
└── desc (390x50, position: -65,-24, Widget: top=49, left=100)
```

### streakBonus 节点

```
streakBonus (720x100, y=-740)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (195x63, position: -162.5,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
└── desc (250x50, position: -125,-24, Widget: top=49, left=100)
```

### time 节点

```
time (720x100, y=-855)
├── bg (720x100, position: 0,0)
├── icon (80x80, position: -310,0, Widget: left=10, vCenter=0)
├── name (195x63, position: -162.5,23.34, Widget: left=100)
├── 极窄金框 (720x100, position: 0,0)
├── currentValue (236x63, position: 236.88,5.78, Widget: right=5)
└── desc (250x50, position: -155,-24, Widget: top=49, left=100)
```

---

## 八、关键发现

### Widget 同时使用 top 和 left 的问题

当 Widget 同时设置 top 和 left 约束时，Cocos Creator 会在运行时根据这两个约束重新计算节点位置。这可能导致：

1. **浮点数精度问题**：如果 top 或 left 值有小数（如 48.8、99.99999999999997），运行时会使用这些小数重新计算位置
2. **位置冲突**：节点的 position 值是手动设置的，而 Widget 的 top/left 约束是另一套计算逻辑。如果两者不一致，Widget 会覆盖 position 值

### 解决方案

**方案1（推荐）：只使用 position，禁用 Widget 约束**
- 移除 desc 节点的 cc.Widget 组件
- 让节点完全使用 position.x 和 position.y 定位

**方案2：保持 Widget 约束，确保值为整数**
- Widget.top = 49
- Widget.left = 100
- position.x 和 position.y 由 Widget 自动计算

---

## 九、建议操作

如果要彻底解决 desc 节点运行时偏移问题，建议：

1. 删除所有 desc 节点的 cc.Widget 组件
2. 仅保留 position.x 和 position.y 来定位

原因：desc 节点的 position 值已经是正确的，但 Widget 组件会在运行时根据 top/left 重新计算位置，可能产生微小偏移。
