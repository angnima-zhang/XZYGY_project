Error.stackTraceLimit = Infinity;

// Some TapPlay Android runtimes do not expose fetch before the adapter starts.
// Missing fetch is valid here: the mini-game adapter will use the wx request APIs.
if (typeof GameGlobal !== 'undefined' && typeof GameGlobal.fetch === 'function') {
    GameGlobal.oldFetch = GameGlobal.fetch;
    GameGlobal.fetch = undefined; // remove fetch to follow wx
}
