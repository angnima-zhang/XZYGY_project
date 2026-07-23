const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript');

const sourcePath = path.resolve(__dirname, '../assets/resources/scripts/ui/CoinController.ts');
const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        experimentalDecorators: true
    }
}).outputText;

const ccMock = {
    _decorator: {
        ccclass() { return target => target; },
        property() { return () => {}; }
    },
    Component: class {},
    Node: class {},
    Label: class {},
    Sprite: class {},
    SpriteFrame: class {},
    Tween: { stopAllByTarget() {} },
    tween() { return { to() { return this; }, call() { return this; }, start() {} }; },
    Vec3: class {},
    UIOpacity: class {},
    Color: class {},
    Button: class {},
    Animation: class {},
    resources: { load() {} }
};
ccMock.Animation.EventType = { FINISHED: 'finished' };

const sandbox = {
    exports: {},
    module: { exports: {} },
    require(request) {
        if (request === 'cc') return ccMock;
        if (request.endsWith('/GameManager')) return { GameManager: {} };
        if (request.endsWith('/VfxManager')) return { VfxManager: class {} };
        if (request.endsWith('/DebugConfig')) return { DebugConfig: class {} };
        return require(request);
    },
    console: { log() {}, warn() {}, error() {} },
    window: {},
    setInterval() { return 1; },
    clearInterval() {},
    clearTimeout() {},
    globalThis: null
};
sandbox.globalThis = sandbox;
sandbox.module.exports = sandbox.exports;
vm.runInNewContext(compiled, sandbox, { filename: sourcePath });

const { CoinController } = sandbox.module.exports;
const controller = new CoinController();
controller.node = { active: true };
const events = [];
let active = false;
const frontNode = {
    name: 'Coin_front',
    activeInHierarchy: true,
    get active() { return active; },
    set active(value) {
        active = value;
        events.push(`active:${value}`);
    }
};
const state = {
    duration: 1.38,
    speed: 1,
    setTime(value) { events.push(`setTime:${value}`); },
    sample() { events.push('sample'); }
};
controller.coinFrontAnimation = {
    node: frontNode,
    stop() { events.push('stop'); },
    play() { events.push('play'); },
    getState() { return state; }
};
controller._coinSprite = { enabled: true };
controller._gameManager = { getAnimDuration() { return 1; } };
controller.disableAllButtons = () => {};

controller.playFlipAnimation({ isHead: true });

const firstVisible = events.indexOf('active:true');
const firstSample = events.indexOf('sample');
assert.ok(firstSample >= 0, '显示正面节点前必须把动画采样到第一帧');
assert.ok(firstSample < firstVisible, `采样必须早于显示节点，实际顺序：${events.join(', ')}`);

console.log('coin-animation-first-frame: ok');
