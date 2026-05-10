# StatusPage 运行时 vs 编辑时 节点对比

> 记录时间：2026-05-10
> 场景路径：assets/resources/scenes/main.scene
> 运行时记录：运行中通过 MCP 捕获

---

## 关键差异总结

| 节点 | 属性 | 编辑时 | 运行时 | 差异 |
|------|------|--------|--------|------|
| upgrades | position.y | -567.1 | -567.59 | -0.49 |
| value/desc | position.y | -24 | -24.2 | -0.2 |
| value/desc | contentSize.width | 330 | 358 | +28 |
| speed/desc | position.y | -24 | -24.2 | -0.2 |
| speed/desc | contentSize.width | 210 | 228 | +18 |
| lucky/desc | position.y | -24 | -24.2 | -0.2 |
| lucky/desc | contentSize.width | 330 | 358 | +28 |
| critical/desc | position.y | -24 | -24.2 | -0.2 |
| critical/desc | contentSize.width | 150 | 163 | +13 |
| criticalBonus/desc | position.y | -24 | -24.2 | -0.2 |
| criticalBonus/desc | contentSize.width | 300 | 325 | +25 |
| pity/desc | position.y | -24 | -24.2 | -0.2 |
| pity/desc | contentSize.width | 390 | 423 | +33 |
| streakBonus/desc | position.y | -24 | -24.2 | -0.2 |
| streakBonus/desc | contentSize.width | 250 | 273 | +23 |
| time/desc | position.y | -24 | -24.2 | -0.2 |
| time/desc | contentSize.width | 250 | 228 | -22 |

---

## 运行时完整状态

### upgrades (ScrollView)

| 属性 | 值 |
|------|------|
| position | (0, -567.59) |
| 尺寸 | 720 x 930 |

### content (Layout)

| 属性 | 值 |
|------|------|
| position | (0, 0) |
| 尺寸 | 720 x 905 |

---

### 1. value/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-95, -24.2) |
| contentSize | 358 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 翻到正面获得的基础金额 |

**对比编辑时**:
- position.x: -95 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 330 → 358 (**增加 28**)

---

### 2. speed/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-155, -24.2) |
| contentSize | 228 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 抛硬币动画速度 |

**对比编辑时**:
- position.x: -155 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 210 → 228 (**增加 18**)

---

### 3. lucky/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-95, -24.2) |
| contentSize | 358 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 抛硬币结果是正面的概率 |

**对比编辑时**:
- position.x: -95 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 330 → 358 (**增加 28**)

---

### 4. critical/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-185, -24.2) |
| contentSize | 163 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 暴击的概率 |

**对比编辑时**:
- position.x: -185 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 150 → 163 (**增加 13**)

---

### 5. criticalBonus/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-110, -24.2) |
| contentSize | 325 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 每次暴击额外获得金额 |

**对比编辑时**:
- position.x: -110 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 300 → 325 (**增加 25**)

---

### 6. pity/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-65, -24.2) |
| contentSize | 423 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 连续多少次背面必有一次正面 |

**对比编辑时**:
- position.x: -65 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 390 → 423 (**增加 33**)

---

### 7. streakBonus/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-125, -24.2) |
| contentSize | 273 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 连击加成基础金额 |

**对比编辑时**:
- position.x: -125 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 250 → 273 (**增加 23**)

---

### 8. time/desc（运行时）

| 属性 | 值 |
|------|------|
| position | (-155, -24.2) |
| contentSize | 228 x 50 |
| Widget.top | 49 |
| Widget.left | 100 |
| 文本 | 自动翻转持续时间 |

**对比编辑时**:
- position.x: -155 (相同)
- position.y: -24 → -24.2 (**偏移 -0.2**)
- width: 250 → 228 (**减少 22**)

---

## 偏移原因分析

### position.y 偏移 -0.2

所有 desc 节点的 position.y 在运行时都变成了 `-24.2`，比编辑时的 `-24` 偏移了 **-0.2**。

这是由 **Widget.top=49** 导致的。Widget 组件在运行时会根据以下公式重新计算 position.y：

```
position.y = -top - (height / 2) + (parentHeight / 2)
           = -49 - (50 / 2) + (100 / 2)
           = -49 - 25 + 50
           = -24
```

但实际运行时是 -24.2，说明 Widget 的 top 值在编辑器中可能存储为 `48.8`（浮点数精度问题），导致：

```
position.y = -48.8 - 25 + 50
           = -23.8
```

但运行时显示 -24.2，可能是编辑器中 top 值在保存/加载时发生了精度丢失。

### contentSize.width 变化

desc 节点的 width 在运行时发生了变化，这是因为 **cc.Label 使用了 enableWrapText=true 且 overflow=NONE**。Label 会根据文本内容自动计算实际尺寸，编辑器中显示的是编辑时的尺寸，而运行时会重新计算。

---

## 结论

1. **position.y 偏移**：Widget 组件在运行时重新计算位置导致
2. **width 变化**：Label 自动计算文本尺寸导致，不影响显示位置
3. **根本原因**：desc 节点的 position.y 和 Widget.top 之间存在冲突
