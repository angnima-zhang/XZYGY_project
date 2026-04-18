import { _decorator, Component, Node, Label, Font, find, director, view } from 'cc';
import { ZpixFontManager } from './ZpixFontManager';
const { ccclass, property } = _decorator;

/**
 * 挂载到 Canvas 节点上
 * 场景加载后自动将所有 Label 组件的字体替换为 zpix
 */
@ccclass('ZpixFontSetter')
export class ZpixFontSetter extends Component {

    start() {
        ZpixFontManager.instance.loadFont().then(() => {
            this.applyFontToScene(this.node);
        });
    }

    /** 递归遍历当前节点及所有子节点，替换 Label 字体 */
    private applyFontToScene(root: Node) {
        const font = ZpixFontManager.instance.font;
        if (!font) return;

        const labels = root.getComponentsInChildren(Label);
        for (const label of labels) {
            // 仅替换使用系统字体的 Label，避免覆盖已单独指定字体的组件
            if (!label.font || label.font === Font) {
                label.font = font;
            }
        }
    }
}
