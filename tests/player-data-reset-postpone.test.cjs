const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('C:/ProgramData/cocos/editors/Creator/3.8.7/resources/app.asar.unpacked/node_modules/typescript');

function loadPlayerData() {
    const sourcePath = path.resolve(__dirname, '../assets/resources/scripts/core/PlayerData.ts');
    const source = fs.readFileSync(sourcePath, 'utf8');
    const compiled = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020
        }
    }).outputText;

    const storage = new Map();
    const sandbox = {
        exports: {},
        module: { exports: {} },
        require(request) {
            if (request === './TapCloudSave') {
                return { TapCloudSave: { markDirty() {} } };
            }
            return require(request);
        },
        console: { log() {}, warn() {}, error() {} },
        localStorage: {
            getItem(key) { return storage.get(key) ?? null; },
            setItem(key, value) { storage.set(key, value); }
        },
        Date,
        Math,
        JSON,
        globalThis: null
    };
    sandbox.globalThis = sandbox;
    sandbox.module.exports = sandbox.exports;
    vm.runInNewContext(compiled, sandbox, { filename: sourcePath });
    return { PlayerData: sandbox.module.exports.PlayerData, storage };
}

const { PlayerData, storage } = loadPlayerData();
const data = PlayerData.getInstance();
const now = new Date(2026, 6, 23, 3, 0, 0, 0).getTime();
const firstNormalReset = new Date(2026, 6, 23, 4, 0, 0, 0).getTime();

assert.equal(data.getSecondsUntilDailyReset(now), 60 * 60);

const firstPostponedReset = data.postponeNextDailyReset(now);
assert.equal(firstPostponedReset, firstNormalReset + 24 * 60 * 60 * 1000);
assert.equal(data.getSecondsUntilDailyReset(now), 25 * 60 * 60);
assert.equal(data.checkDailyReset(firstNormalReset), false);

const secondPostponedReset = data.postponeNextDailyReset(now);
assert.equal(secondPostponedReset, firstNormalReset + 2 * 24 * 60 * 60 * 1000);
assert.equal(data.getSecondsUntilDailyReset(now), 49 * 60 * 60);
assert.equal(data.checkDailyReset(firstPostponedReset), false);

const saved = JSON.parse(storage.get('xianzheng_player_data_v3'));
assert.equal(saved.dailyResetPostponeUntil, secondPostponedReset);

data._balance = 100;
data._lastResetTime = new Date(2026, 6, 22, 4, 0, 0, 0).getTime();
assert.equal(data.checkDailyReset(secondPostponedReset), true);
assert.equal(data.getBalance(), 0);

console.log('player-data-reset-postpone: ok');
