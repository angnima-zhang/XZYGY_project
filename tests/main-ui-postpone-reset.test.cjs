const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.join(projectRoot, 'assets/resources/scripts/ui/MainUI.ts');
const scenePath = path.join(projectRoot, 'assets/resources/scenes/main.scene');
const source = fs.readFileSync(sourcePath, 'utf8');
const scene = JSON.parse(fs.readFileSync(scenePath, 'utf8'));
const mainUI = scene.find(item => item && Object.prototype.hasOwnProperty.call(item, 'resetCountdownLabel'));

assert.ok(mainUI, 'MainUI 组件必须存在');
assert.deepEqual(mainUI.resetCountdownLabel, { __id__: 424 });
assert.deepEqual(mainUI.postponeResetButtonNode, { __id__: 416 });
assert.deepEqual(mainUI.noResetToastNode, { __id__: 1231 });
assert.equal(scene[1231]._active, false, 'Toast 初始必须隐藏，避免进场闪现');
assert.equal(scene[424]._string, 'HH:MM:SS后重置，再来挣一个亿吧');

assert.match(source, /postponeNextDailyReset\(\)/);
assert.match(source, /replace\('HH:MM:SS'/);
assert.match(source, /delay\(2\)/);

const result = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        experimentalDecorators: true
    },
    reportDiagnostics: true
});
const errors = (result.diagnostics ?? []).filter(diagnostic =>
    diagnostic.category === ts.DiagnosticCategory.Error
);
assert.equal(errors.length, 0, errors.map(error => error.messageText).join('\n'));

console.log('main-ui-postpone-reset: ok');
