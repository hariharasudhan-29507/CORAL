import { join, posix, sep as sep$1 } from "node:path";
import * as electron from "electron";
import { app, screen, powerMonitor, autoUpdater, net, dialog, BrowserWindow, crashReporter, protocol, ipcMain, webContents, session, Menu, shell } from "electron";
import { execFile, exec } from "node:child_process";
import * as path$2 from "path";
import path__default, { join as join$1, dirname as dirname$1, isAbsolute, resolve, basename } from "path";
import { readFileSync, promises, existsSync } from "fs";
import require$$2, { URL as URL$1, format as format$1, fileURLToPath as fileURLToPath$1 } from "url";
import { EventEmitter } from "node:events";
import { Readable } from "stream";
import { createGzip } from "zlib";
import * as diagnosticsChannel from "node:diagnostics_channel";
import { promisify, format } from "node:util";
import { AsyncLocalStorage } from "node:async_hooks";
import * as os from "node:os";
import require$$3, { threadId, isMainThread } from "worker_threads";
import require$$0, { types, inspect } from "util";
import * as diagch from "diagnostics_channel";
import require$$4 from "module";
import require$$0$1 from "tty";
import { readFile, readdir, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { Worker } from "node:worker_threads";
import __cjs_mod__ from "node:module";
const __filename = import.meta.filename;
const __dirname = import.meta.dirname;
const require2 = __cjs_mod__.createRequire(import.meta.url);
const VERSION$2 = "1.9.1";
const re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
function _makeCompatibilityCheck(ownVersion) {
  const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
  const rejectedVersions = /* @__PURE__ */ new Set();
  const myVersionMatch = ownVersion.match(re);
  if (!myVersionMatch) {
    return () => false;
  }
  const ownVersionParsed = {
    major: +myVersionMatch[1],
    minor: +myVersionMatch[2],
    patch: +myVersionMatch[3],
    prerelease: myVersionMatch[4]
  };
  if (ownVersionParsed.prerelease != null) {
    return function isExactmatch(globalVersion) {
      return globalVersion === ownVersion;
    };
  }
  function _reject(v) {
    rejectedVersions.add(v);
    return false;
  }
  function _accept(v) {
    acceptedVersions.add(v);
    return true;
  }
  return function isCompatible2(globalVersion) {
    if (acceptedVersions.has(globalVersion)) {
      return true;
    }
    if (rejectedVersions.has(globalVersion)) {
      return false;
    }
    const globalVersionMatch = globalVersion.match(re);
    if (!globalVersionMatch) {
      return _reject(globalVersion);
    }
    const globalVersionParsed = {
      major: +globalVersionMatch[1],
      minor: +globalVersionMatch[2],
      patch: +globalVersionMatch[3],
      prerelease: globalVersionMatch[4]
    };
    if (globalVersionParsed.prerelease != null) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major !== globalVersionParsed.major) {
      return _reject(globalVersion);
    }
    if (ownVersionParsed.major === 0) {
      if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
        return _accept(globalVersion);
      }
      return _reject(globalVersion);
    }
    if (ownVersionParsed.minor <= globalVersionParsed.minor) {
      return _accept(globalVersion);
    }
    return _reject(globalVersion);
  };
}
const isCompatible = _makeCompatibilityCheck(VERSION$2);
const major = VERSION$2.split(".")[0];
const GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
const _global$1 = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
function registerGlobal(type, instance, diag2, allowOverride = false) {
  var _a;
  const api = _global$1[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global$1[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
    version: VERSION$2
  };
  if (!allowOverride && api[type]) {
    const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
    diag2.error(err.stack || err.message);
    return false;
  }
  if (api.version !== VERSION$2) {
    const err = new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${VERSION$2}`);
    diag2.error(err.stack || err.message);
    return false;
  }
  api[type] = instance;
  diag2.debug(`@opentelemetry/api: Registered a global for ${type} v${VERSION$2}.`);
  return true;
}
function getGlobal(type) {
  var _a, _b;
  const globalVersion = (_a = _global$1[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
  if (!globalVersion || !isCompatible(globalVersion)) {
    return;
  }
  return (_b = _global$1[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag2) {
  diag2.debug(`@opentelemetry/api: Unregistering a global for ${type} v${VERSION$2}.`);
  const api = _global$1[GLOBAL_OPENTELEMETRY_API_KEY];
  if (api) {
    delete api[type];
  }
}
class DiagComponentLogger {
  constructor(props) {
    this._namespace = props.namespace || "DiagComponentLogger";
  }
  debug(...args) {
    return logProxy("debug", this._namespace, args);
  }
  error(...args) {
    return logProxy("error", this._namespace, args);
  }
  info(...args) {
    return logProxy("info", this._namespace, args);
  }
  warn(...args) {
    return logProxy("warn", this._namespace, args);
  }
  verbose(...args) {
    return logProxy("verbose", this._namespace, args);
  }
}
function logProxy(funcName, namespace, args) {
  const logger2 = getGlobal("diag");
  if (!logger2) {
    return;
  }
  return logger2[funcName](namespace, ...args);
}
var DiagLogLevel;
(function(DiagLogLevel2) {
  DiagLogLevel2[DiagLogLevel2["NONE"] = 0] = "NONE";
  DiagLogLevel2[DiagLogLevel2["ERROR"] = 30] = "ERROR";
  DiagLogLevel2[DiagLogLevel2["WARN"] = 50] = "WARN";
  DiagLogLevel2[DiagLogLevel2["INFO"] = 60] = "INFO";
  DiagLogLevel2[DiagLogLevel2["DEBUG"] = 70] = "DEBUG";
  DiagLogLevel2[DiagLogLevel2["VERBOSE"] = 80] = "VERBOSE";
  DiagLogLevel2[DiagLogLevel2["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));
function createLogLevelDiagLogger(maxLevel, logger2) {
  if (maxLevel < DiagLogLevel.NONE) {
    maxLevel = DiagLogLevel.NONE;
  } else if (maxLevel > DiagLogLevel.ALL) {
    maxLevel = DiagLogLevel.ALL;
  }
  logger2 = logger2 || {};
  function _filterFunc(funcName, theLevel) {
    const theFunc = logger2[funcName];
    if (typeof theFunc === "function" && maxLevel >= theLevel) {
      return theFunc.bind(logger2);
    }
    return function() {
    };
  }
  return {
    error: _filterFunc("error", DiagLogLevel.ERROR),
    warn: _filterFunc("warn", DiagLogLevel.WARN),
    info: _filterFunc("info", DiagLogLevel.INFO),
    debug: _filterFunc("debug", DiagLogLevel.DEBUG),
    verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
  };
}
const API_NAME$4 = "diag";
class DiagAPI {
  /** Get the singleton instance of the DiagAPI API */
  static instance() {
    if (!this._instance) {
      this._instance = new DiagAPI();
    }
    return this._instance;
  }
  /**
   * Private internal constructor
   * @private
   */
  constructor() {
    function _logProxy(funcName) {
      return function(...args) {
        const logger2 = getGlobal("diag");
        if (!logger2)
          return;
        return logger2[funcName](...args);
      };
    }
    const self2 = this;
    const setLogger = (logger2, optionsOrLogLevel = { logLevel: DiagLogLevel.INFO }) => {
      var _a, _b, _c;
      if (logger2 === self2) {
        const err = new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
        self2.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
        return false;
      }
      if (typeof optionsOrLogLevel === "number") {
        optionsOrLogLevel = {
          logLevel: optionsOrLogLevel
        };
      }
      const oldLogger = getGlobal("diag");
      const newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger2);
      if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
        const stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
        oldLogger.warn(`Current logger will be overwritten from ${stack}`);
        newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
      }
      return registerGlobal("diag", newLogger, self2, true);
    };
    self2.setLogger = setLogger;
    self2.disable = () => {
      unregisterGlobal(API_NAME$4, self2);
    };
    self2.createComponentLogger = (options) => {
      return new DiagComponentLogger(options);
    };
    self2.verbose = _logProxy("verbose");
    self2.debug = _logProxy("debug");
    self2.info = _logProxy("info");
    self2.warn = _logProxy("warn");
    self2.error = _logProxy("error");
  }
}
class BaggageImpl {
  constructor(entries) {
    this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
  }
  getEntry(key) {
    const entry = this._entries.get(key);
    if (!entry) {
      return void 0;
    }
    return Object.assign({}, entry);
  }
  getAllEntries() {
    return Array.from(this._entries.entries());
  }
  setEntry(key, entry) {
    const newBaggage = new BaggageImpl(this._entries);
    newBaggage._entries.set(key, entry);
    return newBaggage;
  }
  removeEntry(key) {
    const newBaggage = new BaggageImpl(this._entries);
    newBaggage._entries.delete(key);
    return newBaggage;
  }
  removeEntries(...keys) {
    const newBaggage = new BaggageImpl(this._entries);
    for (const key of keys) {
      newBaggage._entries.delete(key);
    }
    return newBaggage;
  }
  clear() {
    return new BaggageImpl();
  }
}
const baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
const diag$1 = DiagAPI.instance();
function createBaggage(entries = {}) {
  return new BaggageImpl(new Map(Object.entries(entries)));
}
function baggageEntryMetadataFromString(str) {
  if (typeof str !== "string") {
    diag$1.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
    str = "";
  }
  return {
    __TYPE__: baggageEntryMetadataSymbol,
    toString() {
      return str;
    }
  };
}
function createContextKey(description) {
  return Symbol.for(description);
}
class BaseContext {
  /**
   * Construct a new context which inherits values from an optional parent context.
   *
   * @param parentContext a context from which to inherit values
   */
  constructor(parentContext) {
    const self2 = this;
    self2._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
    self2.getValue = (key) => self2._currentContext.get(key);
    self2.setValue = (key, value) => {
      const context2 = new BaseContext(self2._currentContext);
      context2._currentContext.set(key, value);
      return context2;
    };
    self2.deleteValue = (key) => {
      const context2 = new BaseContext(self2._currentContext);
      context2._currentContext.delete(key);
      return context2;
    };
  }
}
const ROOT_CONTEXT = new BaseContext();
class NoopMeter {
  constructor() {
  }
  /**
   * @see {@link Meter.createGauge}
   */
  createGauge(_name, _options) {
    return NOOP_GAUGE_METRIC;
  }
  /**
   * @see {@link Meter.createHistogram}
   */
  createHistogram(_name, _options) {
    return NOOP_HISTOGRAM_METRIC;
  }
  /**
   * @see {@link Meter.createCounter}
   */
  createCounter(_name, _options) {
    return NOOP_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.createUpDownCounter}
   */
  createUpDownCounter(_name, _options) {
    return NOOP_UP_DOWN_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.createObservableGauge}
   */
  createObservableGauge(_name, _options) {
    return NOOP_OBSERVABLE_GAUGE_METRIC;
  }
  /**
   * @see {@link Meter.createObservableCounter}
   */
  createObservableCounter(_name, _options) {
    return NOOP_OBSERVABLE_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.createObservableUpDownCounter}
   */
  createObservableUpDownCounter(_name, _options) {
    return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
  }
  /**
   * @see {@link Meter.addBatchObservableCallback}
   */
  addBatchObservableCallback(_callback, _observables) {
  }
  /**
   * @see {@link Meter.removeBatchObservableCallback}
   */
  removeBatchObservableCallback(_callback) {
  }
}
class NoopMetric {
}
class NoopCounterMetric extends NoopMetric {
  add(_value, _attributes) {
  }
}
class NoopUpDownCounterMetric extends NoopMetric {
  add(_value, _attributes) {
  }
}
class NoopGaugeMetric extends NoopMetric {
  record(_value, _attributes) {
  }
}
class NoopHistogramMetric extends NoopMetric {
  record(_value, _attributes) {
  }
}
class NoopObservableMetric {
  addCallback(_callback) {
  }
  removeCallback(_callback) {
  }
}
class NoopObservableCounterMetric extends NoopObservableMetric {
}
class NoopObservableGaugeMetric extends NoopObservableMetric {
}
class NoopObservableUpDownCounterMetric extends NoopObservableMetric {
}
const NOOP_METER = new NoopMeter();
const NOOP_COUNTER_METRIC = new NoopCounterMetric();
const NOOP_GAUGE_METRIC = new NoopGaugeMetric();
const NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
const NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
const NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
const NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
const NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
function createNoopMeter() {
  return NOOP_METER;
}
var ValueType;
(function(ValueType2) {
  ValueType2[ValueType2["INT"] = 0] = "INT";
  ValueType2[ValueType2["DOUBLE"] = 1] = "DOUBLE";
})(ValueType || (ValueType = {}));
const defaultTextMapGetter = {
  get(carrier, key) {
    if (carrier == null) {
      return void 0;
    }
    return carrier[key];
  },
  keys(carrier) {
    if (carrier == null) {
      return [];
    }
    return Object.keys(carrier);
  }
};
const defaultTextMapSetter = {
  set(carrier, key, value) {
    if (carrier == null) {
      return;
    }
    carrier[key] = value;
  }
};
class NoopContextManager {
  active() {
    return ROOT_CONTEXT;
  }
  with(_context, fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  bind(_context, target) {
    return target;
  }
  enable() {
    return this;
  }
  disable() {
    return this;
  }
}
const API_NAME$3 = "context";
const NOOP_CONTEXT_MANAGER = new NoopContextManager();
class ContextAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
  }
  /** Get the singleton instance of the Context API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new ContextAPI();
    }
    return this._instance;
  }
  /**
   * Set the current context manager.
   *
   * @returns true if the context manager was successfully registered, else false
   */
  setGlobalContextManager(contextManager) {
    return registerGlobal(API_NAME$3, contextManager, DiagAPI.instance());
  }
  /**
   * Get the currently active context
   */
  active() {
    return this._getContextManager().active();
  }
  /**
   * Execute a function with an active context
   *
   * @param context context to be active during function execution
   * @param fn function to execute in a context
   * @param thisArg optional receiver to be used for calling fn
   * @param args optional arguments forwarded to fn
   */
  with(context2, fn, thisArg, ...args) {
    return this._getContextManager().with(context2, fn, thisArg, ...args);
  }
  /**
   * Bind a context to a target function or event emitter
   *
   * @param context context to bind to the event emitter or function. Defaults to the currently active context
   * @param target function or event emitter to bind
   */
  bind(context2, target) {
    return this._getContextManager().bind(context2, target);
  }
  _getContextManager() {
    return getGlobal(API_NAME$3) || NOOP_CONTEXT_MANAGER;
  }
  /** Disable and remove the global context manager */
  disable() {
    this._getContextManager().disable();
    unregisterGlobal(API_NAME$3, DiagAPI.instance());
  }
}
var TraceFlags;
(function(TraceFlags2) {
  TraceFlags2[TraceFlags2["NONE"] = 0] = "NONE";
  TraceFlags2[TraceFlags2["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));
const INVALID_SPANID = "0000000000000000";
const INVALID_TRACEID = "00000000000000000000000000000000";
const INVALID_SPAN_CONTEXT = {
  traceId: INVALID_TRACEID,
  spanId: INVALID_SPANID,
  traceFlags: TraceFlags.NONE
};
class NonRecordingSpan {
  constructor(spanContext = INVALID_SPAN_CONTEXT) {
    this._spanContext = spanContext;
  }
  // Returns a SpanContext.
  spanContext() {
    return this._spanContext;
  }
  // By default does nothing
  setAttribute(_key, _value) {
    return this;
  }
  // By default does nothing
  setAttributes(_attributes) {
    return this;
  }
  // By default does nothing
  addEvent(_name, _attributes) {
    return this;
  }
  addLink(_link) {
    return this;
  }
  addLinks(_links) {
    return this;
  }
  // By default does nothing
  setStatus(_status) {
    return this;
  }
  // By default does nothing
  updateName(_name) {
    return this;
  }
  // By default does nothing
  end(_endTime) {
  }
  // isRecording always returns false for NonRecordingSpan.
  isRecording() {
    return false;
  }
  // By default does nothing
  recordException(_exception, _time) {
  }
}
const SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
function getSpan(context2) {
  return context2.getValue(SPAN_KEY) || void 0;
}
function getActiveSpan$2() {
  return getSpan(ContextAPI.getInstance().active());
}
function setSpan(context2, span) {
  return context2.setValue(SPAN_KEY, span);
}
function deleteSpan(context2) {
  return context2.deleteValue(SPAN_KEY);
}
function setSpanContext(context2, spanContext) {
  return setSpan(context2, new NonRecordingSpan(spanContext));
}
function getSpanContext(context2) {
  var _a;
  return (_a = getSpan(context2)) === null || _a === void 0 ? void 0 : _a.spanContext();
}
const isHex = new Uint8Array([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  1,
  1
]);
function isValidHex(id, length) {
  if (typeof id !== "string" || id.length !== length)
    return false;
  let r = 0;
  for (let i = 0; i < id.length; i += 4) {
    r += (isHex[id.charCodeAt(i)] | 0) + (isHex[id.charCodeAt(i + 1)] | 0) + (isHex[id.charCodeAt(i + 2)] | 0) + (isHex[id.charCodeAt(i + 3)] | 0);
  }
  return r === length;
}
function isValidTraceId(traceId) {
  return isValidHex(traceId, 32) && traceId !== INVALID_TRACEID;
}
function isValidSpanId(spanId) {
  return isValidHex(spanId, 16) && spanId !== INVALID_SPANID;
}
function isSpanContextValid(spanContext) {
  return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
  return new NonRecordingSpan(spanContext);
}
const contextApi = ContextAPI.getInstance();
class NoopTracer {
  // startSpan starts a noop span.
  startSpan(name, options, context2 = contextApi.active()) {
    const root = Boolean(options === null || options === void 0 ? void 0 : options.root);
    if (root) {
      return new NonRecordingSpan();
    }
    const parentFromContext = context2 && getSpanContext(context2);
    if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) {
      return new NonRecordingSpan(parentFromContext);
    } else {
      return new NonRecordingSpan();
    }
  }
  startActiveSpan(name, arg2, arg3, arg4) {
    let opts;
    let ctx;
    let fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
    const span = this.startSpan(name, opts, parentContext);
    const contextWithSpanSet = setSpan(parentContext, span);
    return contextApi.with(contextWithSpanSet, fn, void 0, span);
  }
}
function isSpanContext(spanContext) {
  return spanContext !== null && typeof spanContext === "object" && "spanId" in spanContext && typeof spanContext["spanId"] === "string" && "traceId" in spanContext && typeof spanContext["traceId"] === "string" && "traceFlags" in spanContext && typeof spanContext["traceFlags"] === "number";
}
const NOOP_TRACER = new NoopTracer();
class ProxyTracer {
  constructor(provider, name, version2, options) {
    this._provider = provider;
    this.name = name;
    this.version = version2;
    this.options = options;
  }
  startSpan(name, options, context2) {
    return this._getTracer().startSpan(name, options, context2);
  }
  startActiveSpan(_name, _options, _context, _fn) {
    const tracer = this._getTracer();
    return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
  }
  /**
   * Try to get a tracer from the proxy tracer provider.
   * If the proxy tracer provider has no delegate, return a noop tracer.
   */
  _getTracer() {
    if (this._delegate) {
      return this._delegate;
    }
    const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
    if (!tracer) {
      return NOOP_TRACER;
    }
    this._delegate = tracer;
    return this._delegate;
  }
}
class NoopTracerProvider {
  getTracer(_name, _version, _options) {
    return new NoopTracer();
  }
}
const NOOP_TRACER_PROVIDER = new NoopTracerProvider();
class ProxyTracerProvider {
  /**
   * Get a {@link ProxyTracer}
   */
  getTracer(name, version2, options) {
    var _a;
    return (_a = this.getDelegateTracer(name, version2, options)) !== null && _a !== void 0 ? _a : new ProxyTracer(this, name, version2, options);
  }
  getDelegate() {
    var _a;
    return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
  }
  /**
   * Set the delegate tracer provider
   */
  setDelegate(delegate) {
    this._delegate = delegate;
  }
  getDelegateTracer(name, version2, options) {
    var _a;
    return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version2, options);
  }
}
var SamplingDecision$1;
(function(SamplingDecision2) {
  SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
  SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision$1 || (SamplingDecision$1 = {}));
var SpanKind;
(function(SpanKind2) {
  SpanKind2[SpanKind2["INTERNAL"] = 0] = "INTERNAL";
  SpanKind2[SpanKind2["SERVER"] = 1] = "SERVER";
  SpanKind2[SpanKind2["CLIENT"] = 2] = "CLIENT";
  SpanKind2[SpanKind2["PRODUCER"] = 3] = "PRODUCER";
  SpanKind2[SpanKind2["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));
var SpanStatusCode;
(function(SpanStatusCode2) {
  SpanStatusCode2[SpanStatusCode2["UNSET"] = 0] = "UNSET";
  SpanStatusCode2[SpanStatusCode2["OK"] = 1] = "OK";
  SpanStatusCode2[SpanStatusCode2["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));
const context = ContextAPI.getInstance();
const diag = DiagAPI.instance();
class NoopMeterProvider {
  getMeter(_name, _version, _options) {
    return NOOP_METER;
  }
}
const NOOP_METER_PROVIDER = new NoopMeterProvider();
const API_NAME$2 = "metrics";
class MetricsAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
  }
  /** Get the singleton instance of the Metrics API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new MetricsAPI();
    }
    return this._instance;
  }
  /**
   * Set the current global meter provider.
   * Returns true if the meter provider was successfully registered, else false.
   */
  setGlobalMeterProvider(provider) {
    return registerGlobal(API_NAME$2, provider, DiagAPI.instance());
  }
  /**
   * Returns the global meter provider.
   */
  getMeterProvider() {
    return getGlobal(API_NAME$2) || NOOP_METER_PROVIDER;
  }
  /**
   * Returns a meter from the global meter provider.
   */
  getMeter(name, version2, options) {
    return this.getMeterProvider().getMeter(name, version2, options);
  }
  /** Remove the global meter provider */
  disable() {
    unregisterGlobal(API_NAME$2, DiagAPI.instance());
  }
}
const metrics = MetricsAPI.getInstance();
class NoopTextMapPropagator {
  /** Noop inject function does nothing */
  inject(_context, _carrier) {
  }
  /** Noop extract function does nothing and returns the input context */
  extract(context2, _carrier) {
    return context2;
  }
  fields() {
    return [];
  }
}
const BAGGAGE_KEY = createContextKey("OpenTelemetry Baggage Key");
function getBaggage(context2) {
  return context2.getValue(BAGGAGE_KEY) || void 0;
}
function getActiveBaggage() {
  return getBaggage(ContextAPI.getInstance().active());
}
function setBaggage(context2, baggage) {
  return context2.setValue(BAGGAGE_KEY, baggage);
}
function deleteBaggage(context2) {
  return context2.deleteValue(BAGGAGE_KEY);
}
const API_NAME$1 = "propagation";
const NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
class PropagationAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
    this.createBaggage = createBaggage;
    this.getBaggage = getBaggage;
    this.getActiveBaggage = getActiveBaggage;
    this.setBaggage = setBaggage;
    this.deleteBaggage = deleteBaggage;
  }
  /** Get the singleton instance of the Propagator API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new PropagationAPI();
    }
    return this._instance;
  }
  /**
   * Set the current propagator.
   *
   * @returns true if the propagator was successfully registered, else false
   */
  setGlobalPropagator(propagator) {
    return registerGlobal(API_NAME$1, propagator, DiagAPI.instance());
  }
  /**
   * Inject context into a carrier to be propagated inter-process
   *
   * @param context Context carrying tracing data to inject
   * @param carrier carrier to inject context into
   * @param setter Function used to set values on the carrier
   */
  inject(context2, carrier, setter = defaultTextMapSetter) {
    return this._getGlobalPropagator().inject(context2, carrier, setter);
  }
  /**
   * Extract context from a carrier
   *
   * @param context Context which the newly created context will inherit from
   * @param carrier Carrier to extract context from
   * @param getter Function used to extract keys from a carrier
   */
  extract(context2, carrier, getter = defaultTextMapGetter) {
    return this._getGlobalPropagator().extract(context2, carrier, getter);
  }
  /**
   * Return a list of all fields which may be used by the propagator.
   */
  fields() {
    return this._getGlobalPropagator().fields();
  }
  /** Remove the global propagator */
  disable() {
    unregisterGlobal(API_NAME$1, DiagAPI.instance());
  }
  _getGlobalPropagator() {
    return getGlobal(API_NAME$1) || NOOP_TEXT_MAP_PROPAGATOR;
  }
}
const propagation = PropagationAPI.getInstance();
const API_NAME = "trace";
class TraceAPI {
  /** Empty private constructor prevents end users from constructing a new instance of the API */
  constructor() {
    this._proxyTracerProvider = new ProxyTracerProvider();
    this.wrapSpanContext = wrapSpanContext;
    this.isSpanContextValid = isSpanContextValid;
    this.deleteSpan = deleteSpan;
    this.getSpan = getSpan;
    this.getActiveSpan = getActiveSpan$2;
    this.getSpanContext = getSpanContext;
    this.setSpan = setSpan;
    this.setSpanContext = setSpanContext;
  }
  /** Get the singleton instance of the Trace API */
  static getInstance() {
    if (!this._instance) {
      this._instance = new TraceAPI();
    }
    return this._instance;
  }
  /**
   * Set the current global tracer.
   *
   * @returns true if the tracer provider was successfully registered, else false
   */
  setGlobalTracerProvider(provider) {
    const success = registerGlobal(API_NAME, this._proxyTracerProvider, DiagAPI.instance());
    if (success) {
      this._proxyTracerProvider.setDelegate(provider);
    }
    return success;
  }
  /**
   * Returns the global tracer provider.
   */
  getTracerProvider() {
    return getGlobal(API_NAME) || this._proxyTracerProvider;
  }
  /**
   * Returns a tracer from the global tracer provider.
   */
  getTracer(name, version2) {
    return this.getTracerProvider().getTracer(name, version2);
  }
  /** Remove the global tracer provider */
  disable() {
    unregisterGlobal(API_NAME, DiagAPI.instance());
    this._proxyTracerProvider = new ProxyTracerProvider();
  }
}
const trace = TraceAPI.getInstance();
const TMP_DB_SYSTEM = "db.system";
const TMP_DB_STATEMENT = "db.statement";
const TMP_FAAS_TRIGGER = "faas.trigger";
const TMP_HTTP_METHOD = "http.method";
const TMP_HTTP_URL = "http.url";
const TMP_HTTP_TARGET = "http.target";
const TMP_HTTP_STATUS_CODE = "http.status_code";
const TMP_MESSAGING_SYSTEM = "messaging.system";
const TMP_RPC_SERVICE = "rpc.service";
const TMP_RPC_GRPC_STATUS_CODE = "rpc.grpc.status_code";
const SEMATTRS_DB_SYSTEM = TMP_DB_SYSTEM;
const SEMATTRS_DB_STATEMENT = TMP_DB_STATEMENT;
const SEMATTRS_FAAS_TRIGGER = TMP_FAAS_TRIGGER;
const SEMATTRS_HTTP_METHOD = TMP_HTTP_METHOD;
const SEMATTRS_HTTP_URL = TMP_HTTP_URL;
const SEMATTRS_HTTP_TARGET = TMP_HTTP_TARGET;
const SEMATTRS_HTTP_STATUS_CODE = TMP_HTTP_STATUS_CODE;
const SEMATTRS_MESSAGING_SYSTEM = TMP_MESSAGING_SYSTEM;
const SEMATTRS_RPC_SERVICE = TMP_RPC_SERVICE;
const SEMATTRS_RPC_GRPC_STATUS_CODE = TMP_RPC_GRPC_STATUS_CODE;
const TMP_SERVICE_NAMESPACE = "service.namespace";
const SEMRESATTRS_SERVICE_NAMESPACE = TMP_SERVICE_NAMESPACE;
const ATTR_DB_SYSTEM_NAME = "db.system.name";
const ATTR_ERROR_TYPE = "error.type";
const ATTR_EXCEPTION_MESSAGE = "exception.message";
const ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
const ATTR_EXCEPTION_TYPE = "exception.type";
const ATTR_HTTP_REQUEST_METHOD = "http.request.method";
const ATTR_HTTP_REQUEST_METHOD_ORIGINAL = "http.request.method_original";
const ATTR_HTTP_RESPONSE_STATUS_CODE = "http.response.status_code";
const ATTR_HTTP_ROUTE = "http.route";
const ATTR_NETWORK_PEER_ADDRESS = "network.peer.address";
const ATTR_NETWORK_PEER_PORT = "network.peer.port";
const ATTR_SERVER_ADDRESS = "server.address";
const ATTR_SERVER_PORT = "server.port";
const ATTR_SERVICE_NAME = "service.name";
const ATTR_SERVICE_VERSION = "service.version";
const ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
const TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS = "nodejs";
const ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
const ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
const ATTR_URL_FULL = "url.full";
const ATTR_URL_PATH = "url.path";
const ATTR_URL_QUERY = "url.query";
const ATTR_URL_SCHEME = "url.scheme";
const ATTR_USER_AGENT_ORIGINAL = "user_agent.original";
const METRIC_HTTP_CLIENT_REQUEST_DURATION = "http.client.request.duration";
class NoopLogger {
  emit(_logRecord) {
  }
}
const NOOP_LOGGER = new NoopLogger();
const GLOBAL_LOGS_API_KEY = Symbol.for("io.opentelemetry.js.api.logs");
const _global = globalThis;
function makeGetter(requiredVersion, instance, fallback) {
  return (version2) => version2 === requiredVersion ? instance : fallback;
}
const API_BACKWARDS_COMPATIBILITY_VERSION = 1;
class NoopLoggerProvider {
  getLogger(_name, _version, _options) {
    return new NoopLogger();
  }
}
const NOOP_LOGGER_PROVIDER = new NoopLoggerProvider();
class ProxyLogger {
  constructor(provider, name, version2, options) {
    this._provider = provider;
    this.name = name;
    this.version = version2;
    this.options = options;
  }
  /**
   * Emit a log record. This method should only be used by log appenders.
   *
   * @param logRecord
   */
  emit(logRecord) {
    this._getLogger().emit(logRecord);
  }
  /**
   * Try to get a logger from the proxy logger provider.
   * If the proxy logger provider has no delegate, return a noop logger.
   */
  _getLogger() {
    if (this._delegate) {
      return this._delegate;
    }
    const logger2 = this._provider._getDelegateLogger(this.name, this.version, this.options);
    if (!logger2) {
      return NOOP_LOGGER;
    }
    this._delegate = logger2;
    return this._delegate;
  }
}
class ProxyLoggerProvider {
  getLogger(name, version2, options) {
    var _a;
    return (_a = this._getDelegateLogger(name, version2, options)) !== null && _a !== void 0 ? _a : new ProxyLogger(this, name, version2, options);
  }
  /**
   * Get the delegate logger provider.
   * Used by tests only.
   * @internal
   */
  _getDelegate() {
    var _a;
    return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_LOGGER_PROVIDER;
  }
  /**
   * Set the delegate logger provider
   * @internal
   */
  _setDelegate(delegate) {
    this._delegate = delegate;
  }
  /**
   * @internal
   */
  _getDelegateLogger(name, version2, options) {
    var _a;
    return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getLogger(name, version2, options);
  }
}
class LogsAPI {
  constructor() {
    this._proxyLoggerProvider = new ProxyLoggerProvider();
  }
  static getInstance() {
    if (!this._instance) {
      this._instance = new LogsAPI();
    }
    return this._instance;
  }
  setGlobalLoggerProvider(provider) {
    if (_global[GLOBAL_LOGS_API_KEY]) {
      return this.getLoggerProvider();
    }
    _global[GLOBAL_LOGS_API_KEY] = makeGetter(API_BACKWARDS_COMPATIBILITY_VERSION, provider, NOOP_LOGGER_PROVIDER);
    this._proxyLoggerProvider._setDelegate(provider);
    return provider;
  }
  /**
   * Returns the global logger provider.
   *
   * @returns LoggerProvider
   */
  getLoggerProvider() {
    var _a, _b;
    return (_b = (_a = _global[GLOBAL_LOGS_API_KEY]) === null || _a === void 0 ? void 0 : _a.call(_global, API_BACKWARDS_COMPATIBILITY_VERSION)) !== null && _b !== void 0 ? _b : this._proxyLoggerProvider;
  }
  /**
   * Returns a logger from the global logger provider.
   *
   * @returns Logger
   */
  getLogger(name, version2, options) {
    return this.getLoggerProvider().getLogger(name, version2, options);
  }
  /** Remove the global logger provider */
  disable() {
    delete _global[GLOBAL_LOGS_API_KEY];
    this._proxyLoggerProvider = new ProxyLoggerProvider();
  }
}
const logs = LogsAPI.getInstance();
function enableInstrumentations(instrumentations, tracerProvider, meterProvider, loggerProvider) {
  for (let i = 0, j = instrumentations.length; i < j; i++) {
    const instrumentation = instrumentations[i];
    if (tracerProvider) {
      instrumentation.setTracerProvider(tracerProvider);
    }
    if (meterProvider) {
      instrumentation.setMeterProvider(meterProvider);
    }
    if (loggerProvider && instrumentation.setLoggerProvider) {
      instrumentation.setLoggerProvider(loggerProvider);
    }
    if (!instrumentation.getConfig().enabled) {
      instrumentation.enable();
    }
  }
}
function disableInstrumentations(instrumentations) {
  instrumentations.forEach((instrumentation) => instrumentation.disable());
}
function registerInstrumentations(options) {
  const tracerProvider = options.tracerProvider || trace.getTracerProvider();
  const meterProvider = options.meterProvider || metrics.getMeterProvider();
  const loggerProvider = options.loggerProvider || logs.getLoggerProvider();
  const instrumentations = options.instrumentations?.flat() ?? [];
  enableInstrumentations(instrumentations, tracerProvider, meterProvider, loggerProvider);
  return () => {
    disableInstrumentations(instrumentations);
  };
}
const VERSION_REGEXP = /^(?:v)?(?<version>(?<major>0|[1-9]\d*)\.(?<minor>0|[1-9]\d*)\.(?<patch>0|[1-9]\d*))(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<build>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const RANGE_REGEXP = /^(?<op><|>|=|==|<=|>=|~|\^|~>)?\s*(?:v)?(?<version>(?<major>x|X|\*|0|[1-9]\d*)(?:\.(?<minor>x|X|\*|0|[1-9]\d*))?(?:\.(?<patch>x|X|\*|0|[1-9]\d*))?)(?:-(?<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?<build>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
const operatorResMap = {
  ">": [1],
  ">=": [0, 1],
  "=": [0],
  "<=": [-1, 0],
  "<": [-1],
  "!=": [-1, 1]
};
function satisfies(version2, range, options) {
  if (!_validateVersion(version2)) {
    diag.error(`Invalid version: ${version2}`);
    return false;
  }
  if (!range) {
    return true;
  }
  range = range.replace(/([<>=~^]+)\s+/g, "$1");
  const parsedVersion = _parseVersion(version2);
  if (!parsedVersion) {
    return false;
  }
  const allParsedRanges = [];
  const checkResult = _doSatisfies(parsedVersion, range, allParsedRanges, options);
  if (checkResult && !options?.includePrerelease) {
    return _doPreleaseCheck(parsedVersion, allParsedRanges);
  }
  return checkResult;
}
function _validateVersion(version2) {
  return typeof version2 === "string" && VERSION_REGEXP.test(version2);
}
function _doSatisfies(parsedVersion, range, allParsedRanges, options) {
  if (range.includes("||")) {
    const ranges = range.trim().split("||");
    for (const r of ranges) {
      if (_checkRange(parsedVersion, r, allParsedRanges, options)) {
        return true;
      }
    }
    return false;
  } else if (range.includes(" - ")) {
    range = replaceHyphen(range, options);
  } else if (range.includes(" ")) {
    const ranges = range.trim().replace(/\s{2,}/g, " ").split(" ");
    for (const r of ranges) {
      if (!_checkRange(parsedVersion, r, allParsedRanges, options)) {
        return false;
      }
    }
    return true;
  }
  return _checkRange(parsedVersion, range, allParsedRanges, options);
}
function _checkRange(parsedVersion, range, allParsedRanges, options) {
  range = _normalizeRange(range, options);
  if (range.includes(" ")) {
    return _doSatisfies(parsedVersion, range, allParsedRanges, options);
  } else {
    const parsedRange = _parseRange(range);
    allParsedRanges.push(parsedRange);
    return _satisfies(parsedVersion, parsedRange);
  }
}
function _satisfies(parsedVersion, parsedRange) {
  if (parsedRange.invalid) {
    return false;
  }
  if (!parsedRange.version || _isWildcard(parsedRange.version)) {
    return true;
  }
  let comparisonResult = _compareVersionSegments(parsedVersion.versionSegments || [], parsedRange.versionSegments || []);
  if (comparisonResult === 0) {
    const versionPrereleaseSegments = parsedVersion.prereleaseSegments || [];
    const rangePrereleaseSegments = parsedRange.prereleaseSegments || [];
    if (!versionPrereleaseSegments.length && !rangePrereleaseSegments.length) {
      comparisonResult = 0;
    } else if (!versionPrereleaseSegments.length && rangePrereleaseSegments.length) {
      comparisonResult = 1;
    } else if (versionPrereleaseSegments.length && !rangePrereleaseSegments.length) {
      comparisonResult = -1;
    } else {
      comparisonResult = _compareVersionSegments(versionPrereleaseSegments, rangePrereleaseSegments);
    }
  }
  return operatorResMap[parsedRange.op]?.includes(comparisonResult);
}
function _doPreleaseCheck(parsedVersion, allParsedRanges) {
  if (parsedVersion.prerelease) {
    return allParsedRanges.some((r) => r.prerelease && r.version === parsedVersion.version);
  }
  return true;
}
function _normalizeRange(range, options) {
  range = range.trim();
  range = replaceCaret(range, options);
  range = replaceTilde(range);
  range = replaceXRange(range, options);
  range = range.trim();
  return range;
}
function isX(id) {
  return !id || id.toLowerCase() === "x" || id === "*";
}
function _parseVersion(versionString) {
  const match = versionString.match(VERSION_REGEXP);
  if (!match) {
    diag.error(`Invalid version: ${versionString}`);
    return void 0;
  }
  const version2 = match.groups.version;
  const prerelease = match.groups.prerelease;
  const build = match.groups.build;
  const versionSegments = version2.split(".");
  const prereleaseSegments = prerelease?.split(".");
  return {
    op: void 0,
    version: version2,
    versionSegments,
    versionSegmentCount: versionSegments.length,
    prerelease,
    prereleaseSegments,
    prereleaseSegmentCount: prereleaseSegments ? prereleaseSegments.length : 0,
    build
  };
}
function _parseRange(rangeString) {
  if (!rangeString) {
    return {};
  }
  const match = rangeString.match(RANGE_REGEXP);
  if (!match) {
    diag.error(`Invalid range: ${rangeString}`);
    return {
      invalid: true
    };
  }
  let op = match.groups.op;
  const version2 = match.groups.version;
  const prerelease = match.groups.prerelease;
  const build = match.groups.build;
  const versionSegments = version2.split(".");
  const prereleaseSegments = prerelease?.split(".");
  if (op === "==") {
    op = "=";
  }
  return {
    op: op || "=",
    version: version2,
    versionSegments,
    versionSegmentCount: versionSegments.length,
    prerelease,
    prereleaseSegments,
    prereleaseSegmentCount: prereleaseSegments ? prereleaseSegments.length : 0,
    build
  };
}
function _isWildcard(s) {
  return s === "*" || s === "x" || s === "X";
}
function _parseVersionString(v) {
  const n = parseInt(v, 10);
  return isNaN(n) ? v : n;
}
function _normalizeVersionType(a, b) {
  if (typeof a === typeof b) {
    if (typeof a === "number") {
      return [a, b];
    } else if (typeof a === "string") {
      return [a, b];
    } else {
      throw new Error("Version segments can only be strings or numbers");
    }
  } else {
    return [String(a), String(b)];
  }
}
function _compareVersionStrings(v1, v2) {
  if (_isWildcard(v1) || _isWildcard(v2)) {
    return 0;
  }
  const [parsedV1, parsedV2] = _normalizeVersionType(_parseVersionString(v1), _parseVersionString(v2));
  if (parsedV1 > parsedV2) {
    return 1;
  } else if (parsedV1 < parsedV2) {
    return -1;
  }
  return 0;
}
function _compareVersionSegments(v1, v2) {
  for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
    const res = _compareVersionStrings(v1[i] || "0", v2[i] || "0");
    if (res !== 0) {
      return res;
    }
  }
  return 0;
}
const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
const NUMERICIDENTIFIER = "0|[1-9]\\d*";
const NONNUMERICIDENTIFIER = `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`;
const GTLT = "((?:<|>)?=?)";
const PRERELEASEIDENTIFIER = `(?:${NUMERICIDENTIFIER}|${NONNUMERICIDENTIFIER})`;
const PRERELEASE = `(?:-(${PRERELEASEIDENTIFIER}(?:\\.${PRERELEASEIDENTIFIER})*))`;
const BUILDIDENTIFIER = `${LETTERDASHNUMBER}+`;
const BUILD = `(?:\\+(${BUILDIDENTIFIER}(?:\\.${BUILDIDENTIFIER})*))`;
const XRANGEIDENTIFIER = `${NUMERICIDENTIFIER}|x|X|\\*`;
const XRANGEPLAIN = `[v=\\s]*(${XRANGEIDENTIFIER})(?:\\.(${XRANGEIDENTIFIER})(?:\\.(${XRANGEIDENTIFIER})(?:${PRERELEASE})?${BUILD}?)?)?`;
const XRANGE = `^${GTLT}\\s*${XRANGEPLAIN}$`;
const XRANGE_REGEXP = new RegExp(XRANGE);
const HYPHENRANGE = `^\\s*(${XRANGEPLAIN})\\s+-\\s+(${XRANGEPLAIN})\\s*$`;
const HYPHENRANGE_REGEXP = new RegExp(HYPHENRANGE);
const LONETILDE = "(?:~>?)";
const TILDE = `^${LONETILDE}${XRANGEPLAIN}$`;
const TILDE_REGEXP = new RegExp(TILDE);
const LONECARET = "(?:\\^)";
const CARET = `^${LONECARET}${XRANGEPLAIN}$`;
const CARET_REGEXP = new RegExp(CARET);
function replaceTilde(comp) {
  const r = TILDE_REGEXP;
  return comp.replace(r, (_, M, m, p, pr) => {
    let ret;
    if (isX(M)) {
      ret = "";
    } else if (isX(m)) {
      ret = `>=${M}.0.0 <${+M + 1}.0.0-0`;
    } else if (isX(p)) {
      ret = `>=${M}.${m}.0 <${M}.${+m + 1}.0-0`;
    } else if (pr) {
      ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
    } else {
      ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
    }
    return ret;
  });
}
function replaceCaret(comp, options) {
  const r = CARET_REGEXP;
  const z = options?.includePrerelease ? "-0" : "";
  return comp.replace(r, (_, M, m, p, pr) => {
    let ret;
    if (isX(M)) {
      ret = "";
    } else if (isX(m)) {
      ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
    } else if (isX(p)) {
      if (M === "0") {
        ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
      } else {
        ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
      }
    } else if (pr) {
      if (M === "0") {
        if (m === "0") {
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
        } else {
          ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
        }
      } else {
        ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
      }
    } else {
      if (M === "0") {
        if (m === "0") {
          ret = `>=${M}.${m}.${p}${z} <${M}.${m}.${+p + 1}-0`;
        } else {
          ret = `>=${M}.${m}.${p}${z} <${M}.${+m + 1}.0-0`;
        }
      } else {
        ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
      }
    }
    return ret;
  });
}
function replaceXRange(comp, options) {
  const r = XRANGE_REGEXP;
  return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
    const xM = isX(M);
    const xm = xM || isX(m);
    const xp = xm || isX(p);
    const anyX = xp;
    if (gtlt === "=" && anyX) {
      gtlt = "";
    }
    pr = options?.includePrerelease ? "-0" : "";
    if (xM) {
      if (gtlt === ">" || gtlt === "<") {
        ret = "<0.0.0-0";
      } else {
        ret = "*";
      }
    } else if (gtlt && anyX) {
      if (xm) {
        m = 0;
      }
      p = 0;
      if (gtlt === ">") {
        gtlt = ">=";
        if (xm) {
          M = +M + 1;
          m = 0;
          p = 0;
        } else {
          m = +m + 1;
          p = 0;
        }
      } else if (gtlt === "<=") {
        gtlt = "<";
        if (xm) {
          M = +M + 1;
        } else {
          m = +m + 1;
        }
      }
      if (gtlt === "<") {
        pr = "-0";
      }
      ret = `${gtlt + M}.${m}.${p}${pr}`;
    } else if (xm) {
      ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
    } else if (xp) {
      ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
    }
    return ret;
  });
}
function replaceHyphen(comp, options) {
  const r = HYPHENRANGE_REGEXP;
  return comp.replace(r, (_, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
    if (isX(fM)) {
      from = "";
    } else if (isX(fm)) {
      from = `>=${fM}.0.0${options?.includePrerelease ? "-0" : ""}`;
    } else if (isX(fp)) {
      from = `>=${fM}.${fm}.0${options?.includePrerelease ? "-0" : ""}`;
    } else if (fpr) {
      from = `>=${from}`;
    } else {
      from = `>=${from}${options?.includePrerelease ? "-0" : ""}`;
    }
    if (isX(tM)) {
      to = "";
    } else if (isX(tm)) {
      to = `<${+tM + 1}.0.0-0`;
    } else if (isX(tp)) {
      to = `<${tM}.${+tm + 1}.0-0`;
    } else if (tpr) {
      to = `<=${tM}.${tm}.${tp}-${tpr}`;
    } else if (options?.includePrerelease) {
      to = `<${tM}.${tm}.${+tp + 1}-0`;
    } else {
      to = `<=${to}`;
    }
    return `${from} ${to}`.trim();
  });
}
let logger = console.error.bind(console);
function defineProperty(obj, name, value) {
  const enumerable = !!obj[name] && Object.prototype.propertyIsEnumerable.call(obj, name);
  Object.defineProperty(obj, name, {
    configurable: true,
    enumerable,
    writable: true,
    value
  });
}
const wrap = (nodule, name, wrapper) => {
  if (!nodule || !nodule[name]) {
    logger("no original function " + String(name) + " to wrap");
    return;
  }
  if (!wrapper) {
    logger("no wrapper function");
    logger(new Error().stack);
    return;
  }
  const original = nodule[name];
  if (typeof original !== "function" || typeof wrapper !== "function") {
    logger("original object and wrapper must be functions");
    return;
  }
  const wrapped = wrapper(original, name);
  defineProperty(wrapped, "__original", original);
  defineProperty(wrapped, "__unwrap", () => {
    if (nodule[name] === wrapped) {
      defineProperty(nodule, name, original);
    }
  });
  defineProperty(wrapped, "__wrapped", true);
  defineProperty(nodule, name, wrapped);
  return wrapped;
};
const massWrap = (nodules, names, wrapper) => {
  if (!nodules) {
    logger("must provide one or more modules to patch");
    logger(new Error().stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }
  if (!(names && Array.isArray(names))) {
    logger("must provide one or more functions to wrap on modules");
    return;
  }
  nodules.forEach((nodule) => {
    names.forEach((name) => {
      wrap(nodule, name, wrapper);
    });
  });
};
const unwrap = (nodule, name) => {
  if (!nodule || !nodule[name]) {
    logger("no function to unwrap.");
    logger(new Error().stack);
    return;
  }
  const wrapped = nodule[name];
  if (!wrapped.__unwrap) {
    logger("no original to unwrap to -- has " + String(name) + " already been unwrapped?");
  } else {
    wrapped.__unwrap();
    return;
  }
};
const massUnwrap = (nodules, names) => {
  if (!nodules) {
    logger("must provide one or more modules to patch");
    logger(new Error().stack);
    return;
  } else if (!Array.isArray(nodules)) {
    nodules = [nodules];
  }
  if (!(names && Array.isArray(names))) {
    logger("must provide one or more functions to unwrap on modules");
    return;
  }
  nodules.forEach((nodule) => {
    names.forEach((name) => {
      unwrap(nodule, name);
    });
  });
};
class InstrumentationAbstract {
  _config = {};
  _tracer;
  _meter;
  _logger;
  _diag;
  instrumentationName;
  instrumentationVersion;
  constructor(instrumentationName, instrumentationVersion, config) {
    this.instrumentationName = instrumentationName;
    this.instrumentationVersion = instrumentationVersion;
    this.setConfig(config);
    this._diag = diag.createComponentLogger({
      namespace: instrumentationName
    });
    this._tracer = trace.getTracer(instrumentationName, instrumentationVersion);
    this._meter = metrics.getMeter(instrumentationName, instrumentationVersion);
    this._logger = logs.getLogger(instrumentationName, instrumentationVersion);
    this._updateMetricInstruments();
  }
  /* Api to wrap instrumented method */
  _wrap = wrap;
  /* Api to unwrap instrumented methods */
  _unwrap = unwrap;
  /* Api to mass wrap instrumented method */
  _massWrap = massWrap;
  /* Api to mass unwrap instrumented methods */
  _massUnwrap = massUnwrap;
  /* Returns meter */
  get meter() {
    return this._meter;
  }
  /**
   * Sets MeterProvider to this plugin
   * @param meterProvider
   */
  setMeterProvider(meterProvider) {
    this._meter = meterProvider.getMeter(this.instrumentationName, this.instrumentationVersion);
    this._updateMetricInstruments();
  }
  /* Returns logger */
  get logger() {
    return this._logger;
  }
  /**
   * Sets LoggerProvider to this plugin
   * @param loggerProvider
   */
  setLoggerProvider(loggerProvider) {
    this._logger = loggerProvider.getLogger(this.instrumentationName, this.instrumentationVersion);
  }
  /**
   * @experimental
   *
   * Get module definitions defined by {@link init}.
   * This can be used for experimental compile-time instrumentation.
   *
   * @returns an array of {@link InstrumentationModuleDefinition}
   */
  getModuleDefinitions() {
    const initResult = this.init() ?? [];
    if (!Array.isArray(initResult)) {
      return [initResult];
    }
    return initResult;
  }
  /**
   * Sets the new metric instruments with the current Meter.
   */
  _updateMetricInstruments() {
    return;
  }
  /* Returns InstrumentationConfig */
  getConfig() {
    return this._config;
  }
  /**
   * Sets InstrumentationConfig to this plugin
   * @param config
   */
  setConfig(config) {
    this._config = {
      enabled: true,
      ...config
    };
  }
  /**
   * Sets TraceProvider to this plugin
   * @param tracerProvider
   */
  setTracerProvider(tracerProvider) {
    this._tracer = tracerProvider.getTracer(this.instrumentationName, this.instrumentationVersion);
  }
  /* Returns tracer */
  get tracer() {
    return this._tracer;
  }
  /**
   * Execute span customization hook, if configured, and log any errors.
   * Any semantics of the trigger and info are defined by the specific instrumentation.
   * @param hookHandler The optional hook handler which the user has configured via instrumentation config
   * @param triggerName The name of the trigger for executing the hook for logging purposes
   * @param span The span to which the hook should be applied
   * @param info The info object to be passed to the hook, with useful data the hook may use
   */
  _runSpanCustomizationHook(hookHandler, triggerName, span, info2) {
    if (!hookHandler) {
      return;
    }
    try {
      hookHandler(span, info2);
    } catch (e) {
      this._diag.error(`Error running span customization hook due to exception in handler`, { triggerName }, e);
    }
  }
}
var requireInTheMiddle = { exports: {} };
var src = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var common;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable2;
    createDebug.enable = enable2;
    createDebug.enabled = enabled;
    createDebug.humanize = requireMs();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug2(...args) {
        if (!debug2.enabled) {
          return;
        }
        const self2 = debug2;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format2) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format2];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug.log;
        logFn.apply(self2, args);
      }
      debug2.namespace = namespace;
      debug2.useColors = createDebug.useColors();
      debug2.color = createDebug.selectColor(namespace);
      debug2.extend = extend;
      debug2.destroy = createDebug.destroy;
      Object.defineProperty(debug2, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug2);
      }
      return debug2;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable2(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable2() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  common = setup;
  return common;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module, exports) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error2) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error2) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error2) {
      }
    }
    module.exports = requireCommon()(exports);
    const { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error2) {
        return "[UnexpectedJSONParseError]: " + error2.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var node$2 = { exports: {} };
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node$2.exports;
  hasRequiredNode = 1;
  (function(module, exports) {
    const tty = require$$0$1;
    const util = require$$0;
    exports.init = init2;
    exports.log = log2;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require2("supports-color");
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error2) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log2(...args) {
      return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init2(debug2) {
      debug2.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug2.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = requireCommon()(exports);
    const { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  })(node$2, node$2.exports);
  return node$2.exports;
}
if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
  src.exports = requireBrowser();
} else {
  src.exports = requireNode();
}
var srcExports = src.exports;
var sep = path__default.sep;
var moduleDetailsFromPath$2 = function(file) {
  var segments = file.split(sep);
  var index = segments.lastIndexOf("node_modules");
  if (index === -1) return;
  if (!segments[index + 1]) return;
  var scoped = segments[index + 1][0] === "@";
  var name = scoped ? segments[index + 1] + "/" + segments[index + 2] : segments[index + 1];
  var offset = scoped ? 3 : 2;
  var basedir = "";
  var lastBaseDirSegmentIndex = index + offset - 1;
  for (var i = 0; i <= lastBaseDirSegmentIndex; i++) {
    if (i === lastBaseDirSegmentIndex) {
      basedir += segments[i];
    } else {
      basedir += segments[i] + sep;
    }
  }
  var path2 = "";
  var lastSegmentIndex = segments.length - 1;
  for (var i2 = index + offset; i2 <= lastSegmentIndex; i2++) {
    if (i2 === lastSegmentIndex) {
      path2 += segments[i2];
    } else {
      path2 += segments[i2] + sep;
    }
  }
  return {
    name,
    basedir,
    path: path2
  };
};
const path$1 = path__default;
const Module = require$$4;
const debug$1 = srcExports("require-in-the-middle");
const moduleDetailsFromPath$1 = moduleDetailsFromPath$2;
requireInTheMiddle.exports = Hook$1;
var Hook_1$1 = requireInTheMiddle.exports.Hook = Hook$1;
let builtinModules;
let isCore;
if (Module.isBuiltin) {
  isCore = Module.isBuiltin;
} else if (Module.builtinModules) {
  isCore = (moduleName) => {
    if (moduleName.startsWith("node:")) {
      return true;
    }
    if (builtinModules === void 0) {
      builtinModules = new Set(Module.builtinModules);
    }
    return builtinModules.has(moduleName);
  };
} else {
  throw new Error("'require-in-the-middle' requires Node.js >=v9.3.0 or >=v8.10.0");
}
const normalize$1 = /([/\\]index)?(\.js)?$/;
class ExportsCache {
  constructor() {
    this._localCache = /* @__PURE__ */ new Map();
    this._kRitmExports = Symbol("RitmExports");
  }
  has(filename, isBuiltin2) {
    if (this._localCache.has(filename)) {
      return true;
    } else if (!isBuiltin2) {
      const mod = require2.cache[filename];
      return !!(mod && this._kRitmExports in mod);
    } else {
      return false;
    }
  }
  get(filename, isBuiltin2) {
    const cachedExports = this._localCache.get(filename);
    if (cachedExports !== void 0) {
      return cachedExports;
    } else if (!isBuiltin2) {
      const mod = require2.cache[filename];
      return mod && mod[this._kRitmExports];
    }
  }
  set(filename, exports, isBuiltin2) {
    if (isBuiltin2) {
      this._localCache.set(filename, exports);
    } else if (filename in require2.cache) {
      require2.cache[filename][this._kRitmExports] = exports;
    } else {
      debug$1('non-core module is unexpectedly not in require.cache: "%s"', filename);
      this._localCache.set(filename, exports);
    }
  }
}
function Hook$1(modules, options, onrequire) {
  if (this instanceof Hook$1 === false) return new Hook$1(modules, options, onrequire);
  if (typeof modules === "function") {
    onrequire = modules;
    modules = null;
    options = null;
  } else if (typeof options === "function") {
    onrequire = options;
    options = null;
  }
  if (typeof Module._resolveFilename !== "function") {
    console.error("Error: Expected Module._resolveFilename to be a function (was: %s) - aborting!", typeof Module._resolveFilename);
    console.error("Please report this error as an issue related to Node.js %s at https://github.com/nodejs/require-in-the-middle/issues", process.version);
    return;
  }
  this._cache = new ExportsCache();
  this._unhooked = false;
  this._origRequire = Module.prototype.require;
  const self2 = this;
  const patching = /* @__PURE__ */ new Set();
  const internals = options ? options.internals === true : false;
  const hasWhitelist = Array.isArray(modules);
  debug$1("registering require hook");
  this._require = Module.prototype.require = function(id) {
    if (self2._unhooked === true) {
      debug$1("ignoring require call - module is soft-unhooked");
      return self2._origRequire.apply(this, arguments);
    }
    return patchedRequire.call(this, arguments, false);
  };
  if (typeof process.getBuiltinModule === "function") {
    this._origGetBuiltinModule = process.getBuiltinModule;
    this._getBuiltinModule = process.getBuiltinModule = function(id) {
      if (self2._unhooked === true) {
        debug$1("ignoring process.getBuiltinModule call - module is soft-unhooked");
        return self2._origGetBuiltinModule.apply(this, arguments);
      }
      return patchedRequire.call(this, arguments, true);
    };
  }
  function patchedRequire(args, coreOnly) {
    const id = args[0];
    const core = isCore(id);
    let filename;
    if (core) {
      filename = id;
      if (id.startsWith("node:")) {
        const idWithoutPrefix = id.slice(5);
        if (isCore(idWithoutPrefix)) {
          filename = idWithoutPrefix;
        }
      }
    } else if (coreOnly) {
      debug$1("call to process.getBuiltinModule with unknown built-in id");
      return self2._origGetBuiltinModule.apply(this, args);
    } else {
      try {
        filename = Module._resolveFilename(id, this);
      } catch (resolveErr) {
        debug$1('Module._resolveFilename("%s") threw %j, calling original Module.require', id, resolveErr.message);
        return self2._origRequire.apply(this, args);
      }
    }
    let moduleName, basedir;
    debug$1("processing %s module require('%s'): %s", core === true ? "core" : "non-core", id, filename);
    if (self2._cache.has(filename, core) === true) {
      debug$1("returning already patched cached module: %s", filename);
      return self2._cache.get(filename, core);
    }
    const isPatching = patching.has(filename);
    if (isPatching === false) {
      patching.add(filename);
    }
    const exports = coreOnly ? self2._origGetBuiltinModule.apply(this, args) : self2._origRequire.apply(this, args);
    if (isPatching === true) {
      debug$1("module is in the process of being patched already - ignoring: %s", filename);
      return exports;
    }
    patching.delete(filename);
    if (core === true) {
      if (hasWhitelist === true && modules.includes(filename) === false) {
        debug$1("ignoring core module not on whitelist: %s", filename);
        return exports;
      }
      moduleName = filename;
    } else if (hasWhitelist === true && modules.includes(filename)) {
      const parsedPath = path$1.parse(filename);
      moduleName = parsedPath.name;
      basedir = parsedPath.dir;
    } else {
      const stat = moduleDetailsFromPath$1(filename);
      if (stat === void 0) {
        debug$1("could not parse filename: %s", filename);
        return exports;
      }
      moduleName = stat.name;
      basedir = stat.basedir;
      const fullModuleName = resolveModuleName(stat);
      debug$1("resolved filename to module: %s (id: %s, resolved: %s, basedir: %s)", moduleName, id, fullModuleName, basedir);
      let matchFound = false;
      if (hasWhitelist) {
        if (!id.startsWith(".") && modules.includes(id)) {
          moduleName = id;
          matchFound = true;
        }
        if (!modules.includes(moduleName) && !modules.includes(fullModuleName)) {
          return exports;
        }
        if (modules.includes(fullModuleName) && fullModuleName !== moduleName) {
          moduleName = fullModuleName;
          matchFound = true;
        }
      }
      if (!matchFound) {
        let res;
        try {
          res = require2.resolve(moduleName, { paths: [basedir] });
        } catch (e) {
          debug$1("could not resolve module: %s", moduleName);
          self2._cache.set(filename, exports, core);
          return exports;
        }
        if (res !== filename) {
          if (internals === true) {
            moduleName = moduleName + path$1.sep + path$1.relative(basedir, filename);
            debug$1("preparing to process require of internal file: %s", moduleName);
          } else {
            debug$1("ignoring require of non-main module file: %s", res);
            self2._cache.set(filename, exports, core);
            return exports;
          }
        }
      }
    }
    self2._cache.set(filename, exports, core);
    debug$1("calling require hook: %s", moduleName);
    const patchedExports = onrequire(exports, moduleName, basedir);
    self2._cache.set(filename, patchedExports, core);
    debug$1("returning module: %s", moduleName);
    return patchedExports;
  }
}
Hook$1.prototype.unhook = function() {
  this._unhooked = true;
  if (this._require === Module.prototype.require) {
    Module.prototype.require = this._origRequire;
    debug$1("require unhook successful");
  } else {
    debug$1("require unhook unsuccessful");
  }
  if (process.getBuiltinModule !== void 0) {
    if (this._getBuiltinModule === process.getBuiltinModule) {
      process.getBuiltinModule = this._origGetBuiltinModule;
      debug$1("process.getBuiltinModule unhook successful");
    } else {
      debug$1("process.getBuiltinModule unhook unsuccessful");
    }
  }
};
function resolveModuleName(stat) {
  const normalizedPath = path$1.sep !== "/" ? stat.path.split(path$1.sep).join("/") : stat.path;
  return path$1.posix.join(stat.name, normalizedPath).replace(normalize$1, "");
}
const ModuleNameSeparator = "/";
class ModuleNameTrieNode {
  hooks = [];
  children = /* @__PURE__ */ new Map();
}
class ModuleNameTrie {
  _trie = new ModuleNameTrieNode();
  _counter = 0;
  /**
   * Insert a module hook into the trie
   *
   * @param {Hooked} hook Hook
   */
  insert(hook) {
    let trieNode = this._trie;
    for (const moduleNamePart of hook.moduleName.split(ModuleNameSeparator)) {
      let nextNode = trieNode.children.get(moduleNamePart);
      if (!nextNode) {
        nextNode = new ModuleNameTrieNode();
        trieNode.children.set(moduleNamePart, nextNode);
      }
      trieNode = nextNode;
    }
    trieNode.hooks.push({ hook, insertedId: this._counter++ });
  }
  /**
   * Search for matching hooks in the trie
   *
   * @param {string} moduleName Module name
   * @param {boolean} maintainInsertionOrder Whether to return the results in insertion order
   * @param {boolean} fullOnly Whether to return only full matches
   * @returns {Hooked[]} Matching hooks
   */
  search(moduleName, { maintainInsertionOrder, fullOnly } = {}) {
    let trieNode = this._trie;
    const results = [];
    let foundFull = true;
    for (const moduleNamePart of moduleName.split(ModuleNameSeparator)) {
      const nextNode = trieNode.children.get(moduleNamePart);
      if (!nextNode) {
        foundFull = false;
        break;
      }
      if (!fullOnly) {
        results.push(...nextNode.hooks);
      }
      trieNode = nextNode;
    }
    if (fullOnly && foundFull) {
      results.push(...trieNode.hooks);
    }
    if (results.length === 0) {
      return [];
    }
    if (results.length === 1) {
      return [results[0].hook];
    }
    if (maintainInsertionOrder) {
      results.sort((a, b) => a.insertedId - b.insertedId);
    }
    return results.map(({ hook }) => hook);
  }
}
const isMocha = [
  "afterEach",
  "after",
  "beforeEach",
  "before",
  "describe",
  "it"
].every((fn) => {
  return typeof global[fn] === "function";
});
class RequireInTheMiddleSingleton {
  _moduleNameTrie = new ModuleNameTrie();
  static _instance;
  constructor() {
    this._initialize();
  }
  _initialize() {
    new Hook_1$1(
      // Intercept all `require` calls; we will filter the matching ones below
      null,
      { internals: true },
      (exports, name, basedir) => {
        const normalizedModuleName = normalizePathSeparators(name);
        const matches = this._moduleNameTrie.search(normalizedModuleName, {
          maintainInsertionOrder: true,
          // For core modules (e.g. `fs`), do not match on sub-paths (e.g. `fs/promises').
          // This matches the behavior of `require-in-the-middle`.
          // `basedir` is always `undefined` for core modules.
          fullOnly: basedir === void 0
        });
        for (const { onRequire } of matches) {
          exports = onRequire(exports, name, basedir);
        }
        return exports;
      }
    );
  }
  /**
   * Register a hook with `require-in-the-middle`
   *
   * @param {string} moduleName Module name
   * @param {OnRequireFn} onRequire Hook function
   * @returns {Hooked} Registered hook
   */
  register(moduleName, onRequire) {
    const hooked = { moduleName, onRequire };
    this._moduleNameTrie.insert(hooked);
    return hooked;
  }
  /**
   * Get the `RequireInTheMiddleSingleton` singleton
   *
   * @returns {RequireInTheMiddleSingleton} Singleton of `RequireInTheMiddleSingleton`
   */
  static getInstance() {
    if (isMocha)
      return new RequireInTheMiddleSingleton();
    return this._instance = this._instance ?? new RequireInTheMiddleSingleton();
  }
}
function normalizePathSeparators(moduleNameOrPath) {
  return path$2.sep !== ModuleNameSeparator ? moduleNameOrPath.split(path$2.sep).join(ModuleNameSeparator) : moduleNameOrPath;
}
var importInTheMiddle = { exports: {} };
var register$1 = {};
const importHooks$1 = [];
const setters = /* @__PURE__ */ new WeakMap();
const getters = /* @__PURE__ */ new WeakMap();
const specifiers$1 = /* @__PURE__ */ new Map();
const toHook$1 = [];
const proxyHandler = {
  set(target, name, value) {
    const set = setters.get(target);
    const setter = set && set[name];
    if (typeof setter === "function") {
      return setter(value);
    }
    return true;
  },
  get(target, name) {
    if (name === Symbol.toStringTag) {
      return "Module";
    }
    const getter = getters.get(target)[name];
    if (typeof getter === "function") {
      return getter();
    }
  },
  defineProperty(target, property, descriptor) {
    if (!("value" in descriptor)) {
      throw new Error("Getters/setters are not supported for exports property descriptors.");
    }
    const set = setters.get(target);
    const setter = set && set[property];
    if (typeof setter === "function") {
      return setter(descriptor.value);
    }
    return true;
  }
};
function register(name, namespace, set, get, specifier) {
  specifiers$1.set(name, specifier);
  setters.set(namespace, set);
  getters.set(namespace, get);
  const proxy = new Proxy(namespace, proxyHandler);
  importHooks$1.forEach((hook) => hook(name, proxy, specifier));
  toHook$1.push([name, proxy, specifier]);
}
register$1.register = register;
register$1.importHooks = importHooks$1;
register$1.specifiers = specifiers$1;
register$1.toHook = toHook$1;
const path = path__default;
const moduleDetailsFromPath = moduleDetailsFromPath$2;
const { fileURLToPath } = require$$2;
const { MessageChannel } = require$$3;
let { isBuiltin: isBuiltin$1 } = require$$4;
if (!isBuiltin$1) {
  isBuiltin$1 = () => true;
}
const {
  importHooks,
  specifiers,
  toHook
} = register$1;
function isTurbopackSpecifier(specifier, baseDir) {
  const usingTurbopack = process.env.TURBOPACK ?? process.argv.includes("--turbo");
  if (!usingTurbopack) return false;
  const specifierWithoutTurbopackHash = specifier.slice(0, specifier.lastIndexOf("-"));
  return baseDir.endsWith(specifierWithoutTurbopackHash);
}
function addHook(hook) {
  importHooks.push(hook);
  toHook.forEach(([name, namespace, specifier]) => hook(name, namespace, specifier));
}
function removeHook(hook) {
  const index = importHooks.indexOf(hook);
  if (index > -1) {
    importHooks.splice(index, 1);
  }
}
function callHookFn(hookFn, namespace, name, baseDir) {
  const newDefault = hookFn(namespace, name, baseDir);
  if (newDefault && newDefault !== namespace) {
    if ("default" in namespace) {
      namespace.default = newDefault;
    }
  }
}
let sendModulesToLoader;
function createAddHookMessageChannel() {
  const { port1, port2 } = new MessageChannel();
  let pendingAckCount = 0;
  let resolveFn;
  sendModulesToLoader = (modules) => {
    pendingAckCount++;
    port1.postMessage(modules);
  };
  port1.on("message", () => {
    pendingAckCount--;
    if (resolveFn && pendingAckCount <= 0) {
      resolveFn();
    }
  }).unref();
  function waitForAllMessagesAcknowledged() {
    const timer = setInterval(() => {
    }, 1e3);
    const promise = new Promise((resolve2) => {
      resolveFn = resolve2;
    }).then(() => {
      clearInterval(timer);
    });
    if (pendingAckCount === 0) {
      resolveFn();
    }
    return promise;
  }
  const addHookMessagePort = port2;
  const registerOptions = { data: { addHookMessagePort, include: [] }, transferList: [addHookMessagePort] };
  return { registerOptions, addHookMessagePort, waitForAllMessagesAcknowledged };
}
function Hook(modules, options, hookFn) {
  if (this instanceof Hook === false) return new Hook(modules, options, hookFn);
  if (typeof modules === "function") {
    hookFn = modules;
    modules = null;
    options = null;
  } else if (typeof options === "function") {
    hookFn = options;
    options = null;
  }
  const internals = options ? options.internals === true : false;
  if (sendModulesToLoader && Array.isArray(modules)) {
    sendModulesToLoader(modules);
  }
  this._iitmHook = (name, namespace, specifier) => {
    const loadUrl = name;
    const isNodeUrl = loadUrl.startsWith("node:");
    let filePath, baseDir;
    if (isNodeUrl) {
      const unprefixed = name.slice(5);
      if (isBuiltin$1(unprefixed)) {
        name = unprefixed;
      }
    } else if (loadUrl.startsWith("file://")) {
      const stackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      try {
        filePath = fileURLToPath(name);
        name = filePath;
      } catch (e) {
      }
      Error.stackTraceLimit = stackTraceLimit;
      if (filePath) {
        const details = moduleDetailsFromPath(filePath);
        if (details) {
          name = details.name;
          baseDir = details.basedir;
        }
      }
    }
    if (modules) {
      for (const matchArg of modules) {
        if (filePath && matchArg === filePath) {
          callHookFn(hookFn, namespace, filePath, void 0);
        } else if (matchArg === name) {
          if (!baseDir) {
            callHookFn(hookFn, namespace, name, baseDir);
          } else if (baseDir.endsWith(specifiers.get(loadUrl)) || isTurbopackSpecifier(specifiers.get(loadUrl), baseDir)) {
            callHookFn(hookFn, namespace, name, baseDir);
          } else if (internals) {
            const internalPath = name + path.sep + path.relative(baseDir, filePath);
            callHookFn(hookFn, namespace, internalPath, baseDir);
          }
        } else if (matchArg === specifier) {
          callHookFn(hookFn, namespace, specifier, baseDir);
        }
      }
    } else {
      callHookFn(hookFn, namespace, name, baseDir);
    }
  };
  addHook(this._iitmHook);
}
Hook.prototype.unhook = function() {
  removeHook(this._iitmHook);
};
importInTheMiddle.exports = Hook;
var Hook_1 = importInTheMiddle.exports.Hook = Hook;
importInTheMiddle.exports.addHook = addHook;
importInTheMiddle.exports.removeHook = removeHook;
importInTheMiddle.exports.createAddHookMessageChannel = createAddHookMessageChannel;
function safeExecuteInTheMiddle(execute, onFinish, preventThrowingError) {
  let error2;
  let result;
  try {
    result = execute();
  } catch (e) {
    error2 = e;
  } finally {
    onFinish(error2, result);
    return result;
  }
}
function isWrapped(func) {
  return typeof func === "function" && typeof func.__original === "function" && typeof func.__unwrap === "function" && func.__wrapped === true;
}
class InstrumentationBase extends InstrumentationAbstract {
  _modules;
  _hooks = [];
  _requireInTheMiddleSingleton = RequireInTheMiddleSingleton.getInstance();
  _enabled = false;
  constructor(instrumentationName, instrumentationVersion, config) {
    super(instrumentationName, instrumentationVersion, config);
    let modules = this.init();
    if (modules && !Array.isArray(modules)) {
      modules = [modules];
    }
    this._modules = modules || [];
    if (this._config.enabled) {
      this.enable();
    }
  }
  _wrap = (moduleExports, name, wrapper) => {
    if (isWrapped(moduleExports[name])) {
      this._unwrap(moduleExports, name);
    }
    if (!types.isProxy(moduleExports)) {
      return wrap(moduleExports, name, wrapper);
    } else {
      const wrapped = wrap(Object.assign({}, moduleExports), name, wrapper);
      Object.defineProperty(moduleExports, name, {
        value: wrapped
      });
      return wrapped;
    }
  };
  _unwrap = (moduleExports, name) => {
    if (!types.isProxy(moduleExports)) {
      return unwrap(moduleExports, name);
    } else {
      return Object.defineProperty(moduleExports, name, {
        value: moduleExports[name]
      });
    }
  };
  _massWrap = (moduleExportsArray, names, wrapper) => {
    if (!moduleExportsArray) {
      diag.error("must provide one or more modules to patch");
      return;
    } else if (!Array.isArray(moduleExportsArray)) {
      moduleExportsArray = [moduleExportsArray];
    }
    if (!(names && Array.isArray(names))) {
      diag.error("must provide one or more functions to wrap on modules");
      return;
    }
    moduleExportsArray.forEach((moduleExports) => {
      names.forEach((name) => {
        this._wrap(moduleExports, name, wrapper);
      });
    });
  };
  _massUnwrap = (moduleExportsArray, names) => {
    if (!moduleExportsArray) {
      diag.error("must provide one or more modules to patch");
      return;
    } else if (!Array.isArray(moduleExportsArray)) {
      moduleExportsArray = [moduleExportsArray];
    }
    if (!(names && Array.isArray(names))) {
      diag.error("must provide one or more functions to wrap on modules");
      return;
    }
    moduleExportsArray.forEach((moduleExports) => {
      names.forEach((name) => {
        this._unwrap(moduleExports, name);
      });
    });
  };
  _warnOnPreloadedModules() {
    const nodeRequire = globalThis.require;
    if (!nodeRequire?.resolve || !nodeRequire?.cache)
      return;
    this._modules.forEach((module) => {
      const { name } = module;
      try {
        const resolvedModule = nodeRequire.resolve(name);
        if (nodeRequire.cache[resolvedModule]?.loaded) {
          this._diag.warn(`Module ${name} has been loaded before ${this.instrumentationName} so it might not work, please initialize it before requiring ${name}`);
        }
      } catch {
      }
    });
  }
  _extractPackageVersion(baseDir) {
    try {
      const json = readFileSync(path$2.join(baseDir, "package.json"), {
        encoding: "utf8"
      });
      const version2 = JSON.parse(json).version;
      return typeof version2 === "string" ? version2 : void 0;
    } catch {
      diag.warn("Failed extracting version", baseDir);
    }
    return void 0;
  }
  _onRequire(module, exports, name, baseDir) {
    if (!baseDir) {
      if (typeof module.patch === "function") {
        module.moduleExports = exports;
        if (this._enabled) {
          this._diag.debug("Applying instrumentation patch for nodejs core module on require hook", {
            module: module.name
          });
          return module.patch(exports);
        }
      }
      return exports;
    }
    const version2 = this._extractPackageVersion(baseDir);
    module.moduleVersion = version2;
    if (module.name === name) {
      if (isSupported(module.supportedVersions, version2, module.includePrerelease)) {
        if (typeof module.patch === "function") {
          module.moduleExports = exports;
          if (this._enabled) {
            this._diag.debug("Applying instrumentation patch for module on require hook", {
              module: module.name,
              version: module.moduleVersion,
              baseDir
            });
            return module.patch(exports, module.moduleVersion);
          }
        }
      }
      return exports;
    }
    const files = module.files ?? [];
    const normalizedName = path$2.normalize(name);
    const supportedFileInstrumentations = files.filter((f) => f.name === normalizedName && isSupported(f.supportedVersions, version2, module.includePrerelease));
    return supportedFileInstrumentations.reduce((patchedExports, file) => {
      file.moduleExports = patchedExports;
      if (this._enabled) {
        this._diag.debug("Applying instrumentation patch for nodejs module file on require hook", {
          module: module.name,
          version: module.moduleVersion,
          fileName: file.name,
          baseDir
        });
        return file.patch(patchedExports, module.moduleVersion);
      }
      return patchedExports;
    }, exports);
  }
  enable() {
    if (this._enabled) {
      return;
    }
    this._enabled = true;
    if (this._hooks.length > 0) {
      for (const module of this._modules) {
        if (typeof module.patch === "function" && module.moduleExports) {
          this._diag.debug("Applying instrumentation patch for nodejs module on instrumentation enabled", {
            module: module.name,
            version: module.moduleVersion
          });
          module.patch(module.moduleExports, module.moduleVersion);
        }
        for (const file of module.files) {
          if (file.moduleExports) {
            this._diag.debug("Applying instrumentation patch for nodejs module file on instrumentation enabled", {
              module: module.name,
              version: module.moduleVersion,
              fileName: file.name
            });
            file.patch(file.moduleExports, module.moduleVersion);
          }
        }
      }
      return;
    }
    this._warnOnPreloadedModules();
    for (const module of this._modules) {
      const hookFn = (exports, name, baseDir) => {
        if (!baseDir && path$2.isAbsolute(name)) {
          const parsedPath = path$2.parse(name);
          name = parsedPath.name;
          baseDir = parsedPath.dir;
        }
        return this._onRequire(module, exports, name, baseDir);
      };
      const onRequire = (exports, name, baseDir) => {
        return this._onRequire(module, exports, name, baseDir);
      };
      const hook = path$2.isAbsolute(module.name) ? new Hook_1$1([module.name], { internals: true }, onRequire) : this._requireInTheMiddleSingleton.register(module.name, onRequire);
      this._hooks.push(hook);
      const esmHook = new Hook_1([module.name], { internals: true }, hookFn);
      this._hooks.push(esmHook);
    }
  }
  disable() {
    if (!this._enabled) {
      return;
    }
    this._enabled = false;
    for (const module of this._modules) {
      if (typeof module.unpatch === "function" && module.moduleExports) {
        this._diag.debug("Removing instrumentation patch for nodejs module on instrumentation disabled", {
          module: module.name,
          version: module.moduleVersion
        });
        module.unpatch(module.moduleExports, module.moduleVersion);
      }
      for (const file of module.files) {
        if (file.moduleExports) {
          this._diag.debug("Removing instrumentation patch for nodejs module file on instrumentation disabled", {
            module: module.name,
            version: module.moduleVersion,
            fileName: file.name
          });
          file.unpatch(file.moduleExports, module.moduleVersion);
        }
      }
    }
  }
  isEnabled() {
    return this._enabled;
  }
}
function isSupported(supportedVersions, version2, includePrerelease) {
  if (typeof version2 === "undefined") {
    return supportedVersions.includes("*");
  }
  return supportedVersions.some((supportedVersion) => {
    return satisfies(version2, supportedVersion, { includePrerelease });
  });
}
const DEBUG_BUILD$3 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const GLOBAL_OBJ = globalThis;
const SDK_VERSION$1 = "10.50.0";
function getMainCarrier() {
  getSentryCarrier(GLOBAL_OBJ);
  return GLOBAL_OBJ;
}
function getSentryCarrier(carrier) {
  const __SENTRY__ = carrier.__SENTRY__ = carrier.__SENTRY__ || {};
  __SENTRY__.version = __SENTRY__.version || SDK_VERSION$1;
  return __SENTRY__[SDK_VERSION$1] = __SENTRY__[SDK_VERSION$1] || {};
}
function getGlobalSingleton(name, creator, obj = GLOBAL_OBJ) {
  const __SENTRY__ = obj.__SENTRY__ = obj.__SENTRY__ || {};
  const carrier = __SENTRY__[SDK_VERSION$1] = __SENTRY__[SDK_VERSION$1] || {};
  return carrier[name] || (carrier[name] = creator());
}
const CONSOLE_LEVELS = [
  "debug",
  "info",
  "warn",
  "error",
  "log",
  "assert",
  "trace"
];
const PREFIX = "Sentry Logger ";
const originalConsoleMethods = {};
function consoleSandbox(callback) {
  if (!("console" in GLOBAL_OBJ)) {
    return callback();
  }
  const console2 = GLOBAL_OBJ.console;
  const wrappedFuncs = {};
  const wrappedLevels = Object.keys(originalConsoleMethods);
  wrappedLevels.forEach((level) => {
    const originalConsoleMethod = originalConsoleMethods[level];
    wrappedFuncs[level] = console2[level];
    console2[level] = originalConsoleMethod;
  });
  try {
    return callback();
  } finally {
    wrappedLevels.forEach((level) => {
      console2[level] = wrappedFuncs[level];
    });
  }
}
function enable() {
  _getLoggerSettings().enabled = true;
}
function disable() {
  _getLoggerSettings().enabled = false;
}
function isEnabled$1() {
  return _getLoggerSettings().enabled;
}
function log$3(...args) {
  _maybeLog("log", ...args);
}
function warn$1(...args) {
  _maybeLog("warn", ...args);
}
function error$1(...args) {
  _maybeLog("error", ...args);
}
function _maybeLog(level, ...args) {
  if (!DEBUG_BUILD$3) {
    return;
  }
  if (isEnabled$1()) {
    consoleSandbox(() => {
      GLOBAL_OBJ.console[level](`${PREFIX}[${level}]:`, ...args);
    });
  }
}
function _getLoggerSettings() {
  if (!DEBUG_BUILD$3) {
    return { enabled: false };
  }
  return getGlobalSingleton("loggerSettings", () => ({ enabled: false }));
}
const debug = {
  /** Enable logging. */
  enable,
  /** Disable logging. */
  disable,
  /** Check if logging is enabled. */
  isEnabled: isEnabled$1,
  /** Log a message. */
  log: log$3,
  /** Log a warning. */
  warn: warn$1,
  /** Log an error. */
  error: error$1
};
const STACKTRACE_FRAME_LIMIT$1 = 50;
const UNKNOWN_FUNCTION = "?";
const WEBPACK_ERROR_REGEXP = /\(error: (.*)\)/;
const STRIP_FRAME_REGEXP = /captureMessage|captureException/;
function createStackParser(...parsers) {
  const sortedParsers = parsers.sort((a, b) => a[0] - b[0]).map((p) => p[1]);
  return (stack, skipFirstLines = 0, framesToPop = 0) => {
    const frames = [];
    const lines = stack.split("\n");
    for (let i = skipFirstLines; i < lines.length; i++) {
      let line = lines[i];
      if (line.length > 1024) {
        line = line.slice(0, 1024);
      }
      const cleanedLine = WEBPACK_ERROR_REGEXP.test(line) ? line.replace(WEBPACK_ERROR_REGEXP, "$1") : line;
      if (cleanedLine.includes("Error: ")) {
        continue;
      }
      for (const parser of sortedParsers) {
        const frame = parser(cleanedLine);
        if (frame) {
          frames.push(frame);
          break;
        }
      }
      if (frames.length >= STACKTRACE_FRAME_LIMIT$1 + framesToPop) {
        break;
      }
    }
    return stripSentryFramesAndReverse(frames.slice(framesToPop));
  };
}
function stackParserFromStackParserOptions(stackParser) {
  if (Array.isArray(stackParser)) {
    return createStackParser(...stackParser);
  }
  return stackParser;
}
function stripSentryFramesAndReverse(stack) {
  if (!stack.length) {
    return [];
  }
  const localStack = Array.from(stack);
  if (/sentryWrapped/.test(getLastStackFrame(localStack).function || "")) {
    localStack.pop();
  }
  localStack.reverse();
  if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
    localStack.pop();
    if (STRIP_FRAME_REGEXP.test(getLastStackFrame(localStack).function || "")) {
      localStack.pop();
    }
  }
  return localStack.slice(0, STACKTRACE_FRAME_LIMIT$1).map((frame) => ({
    ...frame,
    filename: frame.filename || getLastStackFrame(localStack).filename,
    function: frame.function || UNKNOWN_FUNCTION
  }));
}
function getLastStackFrame(arr) {
  return arr[arr.length - 1] || {};
}
const defaultFunctionName = "<anonymous>";
function getFunctionName(fn) {
  try {
    if (!fn || typeof fn !== "function") {
      return defaultFunctionName;
    }
    return fn.name || defaultFunctionName;
  } catch {
    return defaultFunctionName;
  }
}
function getVueInternalName(value) {
  const isVNode = "__v_isVNode" in value && value.__v_isVNode;
  return isVNode ? "[VueVNode]" : "[VueViewModel]";
}
function normalizeStackTracePath(path2) {
  let filename = path2?.startsWith("file://") ? path2.slice(7) : path2;
  if (filename?.match(/\/[A-Z]:/)) {
    filename = filename.slice(1);
  }
  return filename;
}
const handlers = {};
const instrumented = {};
function addHandler(type, handler) {
  handlers[type] = handlers[type] || [];
  handlers[type].push(handler);
}
function maybeInstrument(type, instrumentFn) {
  if (!instrumented[type]) {
    instrumented[type] = true;
    try {
      instrumentFn();
    } catch (e) {
      DEBUG_BUILD$3 && debug.error(`Error while instrumenting ${type}`, e);
    }
  }
}
function triggerHandlers(type, data) {
  const typeHandlers = type && handlers[type];
  if (!typeHandlers) {
    return;
  }
  for (const handler of typeHandlers) {
    try {
      handler(data);
    } catch (e) {
      DEBUG_BUILD$3 && debug.error(
        `Error while triggering instrumentation handler.
Type: ${type}
Name: ${getFunctionName(handler)}
Error:`,
        e
      );
    }
  }
}
let _oldOnErrorHandler = null;
function addGlobalErrorInstrumentationHandler(handler) {
  const type = "error";
  addHandler(type, handler);
  maybeInstrument(type, instrumentError);
}
function instrumentError() {
  _oldOnErrorHandler = GLOBAL_OBJ.onerror;
  GLOBAL_OBJ.onerror = function(msg, url, line, column, error2) {
    const handlerData = {
      column,
      error: error2,
      line,
      msg,
      url
    };
    triggerHandlers("error", handlerData);
    if (_oldOnErrorHandler) {
      return _oldOnErrorHandler.apply(this, arguments);
    }
    return false;
  };
  GLOBAL_OBJ.onerror.__SENTRY_INSTRUMENTED__ = true;
}
let _oldOnUnhandledRejectionHandler = null;
function addGlobalUnhandledRejectionInstrumentationHandler(handler) {
  const type = "unhandledrejection";
  addHandler(type, handler);
  maybeInstrument(type, instrumentUnhandledRejection);
}
function instrumentUnhandledRejection() {
  _oldOnUnhandledRejectionHandler = GLOBAL_OBJ.onunhandledrejection;
  GLOBAL_OBJ.onunhandledrejection = function(e) {
    const handlerData = e;
    triggerHandlers("unhandledrejection", handlerData);
    if (_oldOnUnhandledRejectionHandler) {
      return _oldOnUnhandledRejectionHandler.apply(this, arguments);
    }
    return true;
  };
  GLOBAL_OBJ.onunhandledrejection.__SENTRY_INSTRUMENTED__ = true;
}
const objectToString$1 = Object.prototype.toString;
function isError(wat) {
  switch (objectToString$1.call(wat)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
    case "[object WebAssembly.Exception]":
      return true;
    default:
      return isInstanceOf(wat, Error);
  }
}
function isBuiltin(wat, className) {
  return objectToString$1.call(wat) === `[object ${className}]`;
}
function isErrorEvent$1(wat) {
  return isBuiltin(wat, "ErrorEvent");
}
function isString(wat) {
  return isBuiltin(wat, "String");
}
function isParameterizedString(wat) {
  return typeof wat === "object" && wat !== null && "__sentry_template_string__" in wat && "__sentry_template_values__" in wat;
}
function isPrimitive$1(wat) {
  return wat === null || isParameterizedString(wat) || typeof wat !== "object" && typeof wat !== "function";
}
function isPlainObject$1(wat) {
  return isBuiltin(wat, "Object");
}
function isEvent(wat) {
  return typeof Event !== "undefined" && isInstanceOf(wat, Event);
}
function isElement(wat) {
  return typeof Element !== "undefined" && isInstanceOf(wat, Element);
}
function isRegExp(wat) {
  return isBuiltin(wat, "RegExp");
}
function isThenable(wat) {
  return Boolean(wat?.then && typeof wat.then === "function");
}
function isSyntheticEvent(wat) {
  return isPlainObject$1(wat) && "nativeEvent" in wat && "preventDefault" in wat && "stopPropagation" in wat;
}
function isInstanceOf(wat, base) {
  try {
    return wat instanceof base;
  } catch {
    return false;
  }
}
function isVueViewModel(wat) {
  return !!(typeof wat === "object" && wat !== null && (wat.__isVue || wat._isVue || wat.__v_isVNode));
}
const WINDOW = GLOBAL_OBJ;
const DEFAULT_MAX_STRING_LENGTH = 80;
function htmlTreeAsString(elem, options = {}) {
  if (!elem) {
    return "<unknown>";
  }
  try {
    let currentElem = elem;
    const MAX_TRAVERSE_HEIGHT = 5;
    const out = [];
    let height = 0;
    let len = 0;
    const separator = " > ";
    const sepLength = separator.length;
    let nextStr;
    const keyAttrs = Array.isArray(options) ? options : options.keyAttrs;
    const maxStringLength = !Array.isArray(options) && options.maxStringLength || DEFAULT_MAX_STRING_LENGTH;
    while (currentElem && height++ < MAX_TRAVERSE_HEIGHT) {
      nextStr = _htmlElementAsString(currentElem, keyAttrs);
      if (nextStr === "html" || height > 1 && len + out.length * sepLength + nextStr.length >= maxStringLength) {
        break;
      }
      out.push(nextStr);
      len += nextStr.length;
      currentElem = currentElem.parentNode;
    }
    return out.reverse().join(separator);
  } catch {
    return "<unknown>";
  }
}
function _htmlElementAsString(el, keyAttrs) {
  const elem = el;
  const out = [];
  if (!elem?.tagName) {
    return "";
  }
  if (WINDOW.HTMLElement) {
    if (elem instanceof HTMLElement && elem.dataset) {
      if (elem.dataset["sentryComponent"]) {
        return elem.dataset["sentryComponent"];
      }
      if (elem.dataset["sentryElement"]) {
        return elem.dataset["sentryElement"];
      }
    }
  }
  out.push(elem.tagName.toLowerCase());
  const keyAttrPairs = keyAttrs?.length ? keyAttrs.filter((keyAttr) => elem.getAttribute(keyAttr)).map((keyAttr) => [keyAttr, elem.getAttribute(keyAttr)]) : null;
  if (keyAttrPairs?.length) {
    keyAttrPairs.forEach((keyAttrPair) => {
      out.push(`[${keyAttrPair[0]}="${keyAttrPair[1]}"]`);
    });
  } else {
    if (elem.id) {
      out.push(`#${elem.id}`);
    }
    const className = elem.className;
    if (className && isString(className)) {
      const classes = className.split(/\s+/);
      for (const c of classes) {
        out.push(`.${c}`);
      }
    }
  }
  for (const k of ["aria-label", "type", "name", "title", "alt"]) {
    const attr = elem.getAttribute(k);
    if (attr) {
      out.push(`[${k}="${attr}"]`);
    }
  }
  return out.join("");
}
function fill(source, name, replacementFactory) {
  if (!(name in source)) {
    return;
  }
  const original = source[name];
  if (typeof original !== "function") {
    return;
  }
  const wrapped = replacementFactory(original);
  if (typeof wrapped === "function") {
    markFunctionWrapped(wrapped, original);
  }
  try {
    source[name] = wrapped;
  } catch {
    DEBUG_BUILD$3 && debug.log(`Failed to replace method "${name}" in object`, source);
  }
}
function addNonEnumerableProperty(obj, name, value) {
  try {
    Object.defineProperty(obj, name, {
      // enumerable: false, // the default, so we can save on bundle size by not explicitly setting it
      value,
      writable: true,
      configurable: true
    });
  } catch {
    DEBUG_BUILD$3 && debug.log(`Failed to add non-enumerable property "${name}" to object`, obj);
  }
}
function markFunctionWrapped(wrapped, original) {
  try {
    const proto = original.prototype || {};
    wrapped.prototype = original.prototype = proto;
    addNonEnumerableProperty(wrapped, "__sentry_original__", original);
  } catch {
  }
}
function getOriginalFunction(func) {
  return func.__sentry_original__;
}
function convertToPlainObject(value) {
  if (isError(value)) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
      ...getOwnProperties(value)
    };
  } else if (isEvent(value)) {
    const newObj = {
      type: value.type,
      target: serializeEventTarget(value.target),
      currentTarget: serializeEventTarget(value.currentTarget),
      ...getOwnProperties(value)
    };
    if (typeof CustomEvent !== "undefined" && isInstanceOf(value, CustomEvent)) {
      newObj.detail = value.detail;
    }
    return newObj;
  } else {
    return value;
  }
}
function serializeEventTarget(target) {
  try {
    return isElement(target) ? htmlTreeAsString(target) : Object.prototype.toString.call(target);
  } catch {
    return "<unknown>";
  }
}
function getOwnProperties(obj) {
  if (typeof obj === "object" && obj !== null) {
    return Object.fromEntries(Object.entries(obj));
  }
  return {};
}
function extractExceptionKeysForMessage(exception) {
  const keys = Object.keys(convertToPlainObject(exception));
  keys.sort();
  return !keys[0] ? "[object has no keys]" : keys.join(", ");
}
let RESOLVED_RUNNER;
function withRandomSafeContext(cb) {
  if (RESOLVED_RUNNER !== void 0) {
    return RESOLVED_RUNNER ? RESOLVED_RUNNER(cb) : cb();
  }
  const sym = Symbol.for("__SENTRY_SAFE_RANDOM_ID_WRAPPER__");
  const globalWithSymbol = GLOBAL_OBJ;
  if (sym in globalWithSymbol && typeof globalWithSymbol[sym] === "function") {
    RESOLVED_RUNNER = globalWithSymbol[sym];
    return RESOLVED_RUNNER(cb);
  }
  RESOLVED_RUNNER = null;
  return cb();
}
function safeMathRandom() {
  return withRandomSafeContext(() => Math.random());
}
function safeDateNow() {
  return withRandomSafeContext(() => Date.now());
}
function truncate(str, max = 0) {
  if (typeof str !== "string" || max === 0) {
    return str;
  }
  return str.length <= max ? str : `${str.slice(0, max)}...`;
}
function snipLine(line, colno) {
  let newLine = line;
  const lineLength = newLine.length;
  if (lineLength <= 150) {
    return newLine;
  }
  if (colno > lineLength) {
    colno = lineLength;
  }
  let start = Math.max(colno - 60, 0);
  if (start < 5) {
    start = 0;
  }
  let end = Math.min(start + 140, lineLength);
  if (end > lineLength - 5) {
    end = lineLength;
  }
  if (end === lineLength) {
    start = Math.max(end - 140, 0);
  }
  newLine = newLine.slice(start, end);
  if (start > 0) {
    newLine = `'{snip} ${newLine}`;
  }
  if (end < lineLength) {
    newLine += " {snip}";
  }
  return newLine;
}
function safeJoin(input, delimiter) {
  if (!Array.isArray(input)) {
    return "";
  }
  const output = [];
  for (let i = 0; i < input.length; i++) {
    const value = input[i];
    try {
      if (isVueViewModel(value)) {
        output.push(getVueInternalName(value));
      } else {
        output.push(String(value));
      }
    } catch {
      output.push("[value cannot be serialized]");
    }
  }
  return output.join(delimiter);
}
function isMatchingPattern(value, pattern, requireExactStringMatch = false) {
  if (!isString(value)) {
    return false;
  }
  if (isRegExp(pattern)) {
    return pattern.test(value);
  }
  if (isString(pattern)) {
    return requireExactStringMatch ? value === pattern : value.includes(pattern);
  }
  if (typeof pattern === "function") {
    return pattern(value);
  }
  return false;
}
function stringMatchesSomePattern(testString, patterns = [], requireExactStringMatch = false) {
  return patterns.some((pattern) => isMatchingPattern(testString, pattern, requireExactStringMatch));
}
function getCrypto() {
  const gbl = GLOBAL_OBJ;
  return gbl.crypto || gbl.msCrypto;
}
let emptyUuid;
function getRandomByte() {
  return safeMathRandom() * 16;
}
function uuid4(crypto = getCrypto()) {
  try {
    if (crypto?.randomUUID) {
      return withRandomSafeContext(() => crypto.randomUUID()).replace(/-/g, "");
    }
  } catch {
  }
  if (!emptyUuid) {
    emptyUuid = "10000000100040008000" + 1e11;
  }
  return emptyUuid.replace(
    /[018]/g,
    (c) => (
      // eslint-disable-next-line no-bitwise
      (c ^ (getRandomByte() & 15) >> c / 4).toString(16)
    )
  );
}
function getFirstException(event) {
  return event.exception?.values?.[0];
}
function getEventDescription(event) {
  const { message, event_id: eventId } = event;
  if (message) {
    return message;
  }
  const firstException = getFirstException(event);
  if (firstException) {
    if (firstException.type && firstException.value) {
      return `${firstException.type}: ${firstException.value}`;
    }
    return firstException.type || firstException.value || eventId || "<unknown>";
  }
  return eventId || "<unknown>";
}
function addExceptionTypeValue(event, value, type) {
  const exception = event.exception = event.exception || {};
  const values = exception.values = exception.values || [];
  const firstException = values[0] = values[0] || {};
  if (!firstException.value) {
    firstException.value = "";
  }
  if (!firstException.type) {
    firstException.type = "Error";
  }
}
function addExceptionMechanism(event, newMechanism) {
  const firstException = getFirstException(event);
  if (!firstException) {
    return;
  }
  const defaultMechanism = { type: "generic", handled: true };
  const currentMechanism = firstException.mechanism;
  firstException.mechanism = { ...defaultMechanism, ...currentMechanism, ...newMechanism };
  if (newMechanism && "data" in newMechanism) {
    const mergedData = { ...currentMechanism?.data, ...newMechanism.data };
    firstException.mechanism.data = mergedData;
  }
}
const SEMVER_REGEXP = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
function _parseInt(input) {
  return parseInt(input || "", 10);
}
function parseSemver(input) {
  const match = input.match(SEMVER_REGEXP) || [];
  const major2 = _parseInt(match[1]);
  const minor = _parseInt(match[2]);
  const patch = _parseInt(match[3]);
  return {
    buildmetadata: match[5],
    major: isNaN(major2) ? void 0 : major2,
    minor: isNaN(minor) ? void 0 : minor,
    patch: isNaN(patch) ? void 0 : patch,
    prerelease: match[4]
  };
}
function checkOrSetAlreadyCaught(exception) {
  if (isAlreadyCaptured(exception)) {
    return true;
  }
  try {
    addNonEnumerableProperty(exception, "__sentry_captured__", true);
  } catch {
  }
  return false;
}
function isAlreadyCaptured(exception) {
  try {
    return exception.__sentry_captured__;
  } catch {
  }
}
const ONE_SECOND_IN_MS = 1e3;
function dateTimestampInSeconds() {
  return safeDateNow() / ONE_SECOND_IN_MS;
}
function createUnixTimestampInSecondsFunc() {
  const { performance: performance2 } = GLOBAL_OBJ;
  if (!performance2?.now || !performance2.timeOrigin) {
    return dateTimestampInSeconds;
  }
  const timeOrigin = performance2.timeOrigin;
  return () => {
    return (timeOrigin + withRandomSafeContext(() => performance2.now())) / ONE_SECOND_IN_MS;
  };
}
let _cachedTimestampInSeconds;
function timestampInSeconds() {
  const func = _cachedTimestampInSeconds ?? (_cachedTimestampInSeconds = createUnixTimestampInSecondsFunc());
  return func();
}
function makeSession(context2) {
  const startingTime = timestampInSeconds();
  const session2 = {
    sid: uuid4(),
    init: true,
    timestamp: startingTime,
    started: startingTime,
    duration: 0,
    status: "ok",
    errors: 0,
    ignoreDuration: false,
    toJSON: () => sessionToJSON(session2)
  };
  if (context2) {
    updateSession(session2, context2);
  }
  return session2;
}
function updateSession(session2, context2 = {}) {
  if (context2.user) {
    if (!session2.ipAddress && context2.user.ip_address) {
      session2.ipAddress = context2.user.ip_address;
    }
    if (!session2.did && !context2.did) {
      session2.did = context2.user.id || context2.user.email || context2.user.username;
    }
  }
  session2.timestamp = context2.timestamp || timestampInSeconds();
  if (context2.abnormal_mechanism) {
    session2.abnormal_mechanism = context2.abnormal_mechanism;
  }
  if (context2.ignoreDuration) {
    session2.ignoreDuration = context2.ignoreDuration;
  }
  if (context2.sid) {
    session2.sid = context2.sid.length === 32 ? context2.sid : uuid4();
  }
  if (context2.init !== void 0) {
    session2.init = context2.init;
  }
  if (!session2.did && context2.did) {
    session2.did = `${context2.did}`;
  }
  if (typeof context2.started === "number") {
    session2.started = context2.started;
  }
  if (session2.ignoreDuration) {
    session2.duration = void 0;
  } else if (typeof context2.duration === "number") {
    session2.duration = context2.duration;
  } else {
    const duration = session2.timestamp - session2.started;
    session2.duration = duration >= 0 ? duration : 0;
  }
  if (context2.release) {
    session2.release = context2.release;
  }
  if (context2.environment) {
    session2.environment = context2.environment;
  }
  if (!session2.ipAddress && context2.ipAddress) {
    session2.ipAddress = context2.ipAddress;
  }
  if (!session2.userAgent && context2.userAgent) {
    session2.userAgent = context2.userAgent;
  }
  if (typeof context2.errors === "number") {
    session2.errors = context2.errors;
  }
  if (context2.status) {
    session2.status = context2.status;
  }
}
function closeSession(session2, status) {
  let context2 = {};
  if (session2.status === "ok") {
    context2 = { status: "exited" };
  }
  updateSession(session2, context2);
}
function sessionToJSON(session2) {
  return {
    sid: `${session2.sid}`,
    init: session2.init,
    // Make sure that sec is converted to ms for date constructor
    started: new Date(session2.started * 1e3).toISOString(),
    timestamp: new Date(session2.timestamp * 1e3).toISOString(),
    status: session2.status,
    errors: session2.errors,
    did: typeof session2.did === "number" || typeof session2.did === "string" ? `${session2.did}` : void 0,
    duration: session2.duration,
    abnormal_mechanism: session2.abnormal_mechanism,
    attrs: {
      release: session2.release,
      environment: session2.environment,
      ip_address: session2.ipAddress,
      user_agent: session2.userAgent
    }
  };
}
function merge$1(initialObj, mergeObj, levels = 2) {
  if (!mergeObj || typeof mergeObj !== "object" || levels <= 0) {
    return mergeObj;
  }
  if (initialObj && Object.keys(mergeObj).length === 0) {
    return initialObj;
  }
  const output = { ...initialObj };
  for (const key in mergeObj) {
    if (Object.prototype.hasOwnProperty.call(mergeObj, key)) {
      output[key] = merge$1(output[key], mergeObj[key], levels - 1);
    }
  }
  return output;
}
function generateTraceId() {
  return uuid4();
}
function generateSpanId() {
  return uuid4().substring(16);
}
const SCOPE_SPAN_FIELD = "_sentrySpan";
function _setSpanForScope(scope, span) {
  if (span) {
    addNonEnumerableProperty(scope, SCOPE_SPAN_FIELD, span);
  } else {
    delete scope[SCOPE_SPAN_FIELD];
  }
}
function _getSpanForScope(scope) {
  return scope[SCOPE_SPAN_FIELD];
}
const DEFAULT_MAX_BREADCRUMBS = 100;
class Scope {
  /** Flag if notifying is happening. */
  /** Callback for client to receive scope changes. */
  /** Callback list that will be called during event processing. */
  /** Array of breadcrumbs. */
  /** User */
  /** Tags */
  /** Attributes */
  /** Extra */
  /** Contexts */
  /** Attachments */
  /** Propagation Context for distributed tracing */
  /**
   * A place to stash data which is needed at some point in the SDK's event processing pipeline but which shouldn't get
   * sent to Sentry
   */
  /** Fingerprint */
  /** Severity */
  /**
   * Transaction Name
   *
   * IMPORTANT: The transaction name on the scope has nothing to do with root spans/transaction objects.
   * It's purpose is to assign a transaction to the scope that's added to non-transaction events.
   */
  /** Session */
  /** The client on this scope */
  /** Contains the last event id of a captured event.  */
  /** Conversation ID */
  // NOTE: Any field which gets added here should get added not only to the constructor but also to the `clone` method.
  constructor() {
    this._notifyingListeners = false;
    this._scopeListeners = [];
    this._eventProcessors = [];
    this._breadcrumbs = [];
    this._attachments = [];
    this._user = {};
    this._tags = {};
    this._attributes = {};
    this._extra = {};
    this._contexts = {};
    this._sdkProcessingMetadata = {};
    this._propagationContext = {
      traceId: generateTraceId(),
      sampleRand: safeMathRandom()
    };
  }
  /**
   * Clone all data from this scope into a new scope.
   */
  clone() {
    const newScope = new Scope();
    newScope._breadcrumbs = [...this._breadcrumbs];
    newScope._tags = { ...this._tags };
    newScope._attributes = { ...this._attributes };
    newScope._extra = { ...this._extra };
    newScope._contexts = { ...this._contexts };
    if (this._contexts.flags) {
      newScope._contexts.flags = {
        values: [...this._contexts.flags.values]
      };
    }
    newScope._user = this._user;
    newScope._level = this._level;
    newScope._session = this._session;
    newScope._transactionName = this._transactionName;
    newScope._fingerprint = this._fingerprint;
    newScope._eventProcessors = [...this._eventProcessors];
    newScope._attachments = [...this._attachments];
    newScope._sdkProcessingMetadata = { ...this._sdkProcessingMetadata };
    newScope._propagationContext = { ...this._propagationContext };
    newScope._client = this._client;
    newScope._lastEventId = this._lastEventId;
    newScope._conversationId = this._conversationId;
    _setSpanForScope(newScope, _getSpanForScope(this));
    return newScope;
  }
  /**
   * Update the client assigned to this scope.
   * Note that not every scope will have a client assigned - isolation scopes & the global scope will generally not have a client,
   * as well as manually created scopes.
   */
  setClient(client) {
    this._client = client;
  }
  /**
   * Set the ID of the last captured error event.
   * This is generally only captured on the isolation scope.
   */
  setLastEventId(lastEventId) {
    this._lastEventId = lastEventId;
  }
  /**
   * Get the client assigned to this scope.
   */
  getClient() {
    return this._client;
  }
  /**
   * Get the ID of the last captured error event.
   * This is generally only available on the isolation scope.
   */
  lastEventId() {
    return this._lastEventId;
  }
  /**
   * @inheritDoc
   */
  addScopeListener(callback) {
    this._scopeListeners.push(callback);
  }
  /**
   * Add an event processor that will be called before an event is sent.
   */
  addEventProcessor(callback) {
    this._eventProcessors.push(callback);
    return this;
  }
  /**
   * Set the user for this scope.
   * Set to `null` to unset the user.
   */
  setUser(user) {
    this._user = user || {
      email: void 0,
      id: void 0,
      ip_address: void 0,
      username: void 0
    };
    if (this._session) {
      updateSession(this._session, { user });
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Get the user from this scope.
   */
  getUser() {
    return this._user;
  }
  /**
   * Set the conversation ID for this scope.
   * Set to `null` to unset the conversation ID.
   */
  setConversationId(conversationId) {
    this._conversationId = conversationId || void 0;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set an object that will be merged into existing tags on the scope,
   * and will be sent as tags data with the event.
   */
  setTags(tags) {
    this._tags = {
      ...this._tags,
      ...tags
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set a single tag that will be sent as tags data with the event.
   */
  setTag(key, value) {
    return this.setTags({ [key]: value });
  }
  /**
   * Sets attributes onto the scope.
   *
   * These attributes are currently applied to logs and metrics.
   * In the future, they will also be applied to spans.
   *
   * Important: For now, only strings, numbers and boolean attributes are supported, despite types allowing for
   * more complex attribute types. We'll add this support in the future but already specify the wider type to
   * avoid a breaking change in the future.
   *
   * @param newAttributes - The attributes to set on the scope. You can either pass in key-value pairs, or
   * an object with a `value` and an optional `unit` (if applicable to your attribute).
   *
   * @example
   * ```typescript
   * scope.setAttributes({
   *   is_admin: true,
   *   payment_selection: 'credit_card',
   *   render_duration: { value: 'render_duration', unit: 'ms' },
   * });
   * ```
   */
  setAttributes(newAttributes) {
    this._attributes = {
      ...this._attributes,
      ...newAttributes
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets an attribute onto the scope.
   *
   * These attributes are currently applied to logs and metrics.
   * In the future, they will also be applied to spans.
   *
   * Important: For now, only strings, numbers and boolean attributes are supported, despite types allowing for
   * more complex attribute types. We'll add this support in the future but already specify the wider type to
   * avoid a breaking change in the future.
   *
   * @param key - The attribute key.
   * @param value - the attribute value. You can either pass in a raw value, or an attribute
   * object with a `value` and an optional `unit` (if applicable to your attribute).
   *
   * @example
   * ```typescript
   * scope.setAttribute('is_admin', true);
   * scope.setAttribute('render_duration', { value: 'render_duration', unit: 'ms' });
   * ```
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAttribute(key, value) {
    return this.setAttributes({ [key]: value });
  }
  /**
   * Removes the attribute with the given key from the scope.
   *
   * @param key - The attribute key.
   *
   * @example
   * ```typescript
   * scope.removeAttribute('is_admin');
   * ```
   */
  removeAttribute(key) {
    if (key in this._attributes) {
      delete this._attributes[key];
      this._notifyScopeListeners();
    }
    return this;
  }
  /**
   * Set an object that will be merged into existing extra on the scope,
   * and will be sent as extra data with the event.
   */
  setExtras(extras) {
    this._extra = {
      ...this._extra,
      ...extras
    };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set a single key:value extra entry that will be sent as extra data with the event.
   */
  setExtra(key, extra) {
    this._extra = { ...this._extra, [key]: extra };
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets the fingerprint on the scope to send with the events.
   * @param {string[]} fingerprint Fingerprint to group events in Sentry.
   */
  setFingerprint(fingerprint) {
    this._fingerprint = fingerprint;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets the level on the scope for future events.
   */
  setLevel(level) {
    this._level = level;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets the transaction name on the scope so that the name of e.g. taken server route or
   * the page location is attached to future events.
   *
   * IMPORTANT: Calling this function does NOT change the name of the currently active
   * root span. If you want to change the name of the active root span, use
   * `Sentry.updateSpanName(rootSpan, 'new name')` instead.
   *
   * By default, the SDK updates the scope's transaction name automatically on sensible
   * occasions, such as a page navigation or when handling a new request on the server.
   */
  setTransactionName(name) {
    this._transactionName = name;
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Sets context data with the given name.
   * Data passed as context will be normalized. You can also pass `null` to unset the context.
   * Note that context data will not be merged - calling `setContext` will overwrite an existing context with the same key.
   */
  setContext(key, context2) {
    if (context2 === null) {
      delete this._contexts[key];
    } else {
      this._contexts[key] = context2;
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Set the session for the scope.
   */
  setSession(session2) {
    if (!session2) {
      delete this._session;
    } else {
      this._session = session2;
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Get the session from the scope.
   */
  getSession() {
    return this._session;
  }
  /**
   * Updates the scope with provided data. Can work in three variations:
   * - plain object containing updatable attributes
   * - Scope instance that'll extract the attributes from
   * - callback function that'll receive the current scope as an argument and allow for modifications
   */
  update(captureContext) {
    if (!captureContext) {
      return this;
    }
    const scopeToMerge = typeof captureContext === "function" ? captureContext(this) : captureContext;
    const scopeInstance = scopeToMerge instanceof Scope ? scopeToMerge.getScopeData() : isPlainObject$1(scopeToMerge) ? captureContext : void 0;
    const {
      tags,
      attributes: attributes2,
      extra,
      user,
      contexts,
      level,
      fingerprint = [],
      propagationContext,
      conversationId
    } = scopeInstance || {};
    this._tags = { ...this._tags, ...tags };
    this._attributes = { ...this._attributes, ...attributes2 };
    this._extra = { ...this._extra, ...extra };
    this._contexts = { ...this._contexts, ...contexts };
    if (user && Object.keys(user).length) {
      this._user = user;
    }
    if (level) {
      this._level = level;
    }
    if (fingerprint.length) {
      this._fingerprint = fingerprint;
    }
    if (propagationContext) {
      this._propagationContext = propagationContext;
    }
    if (conversationId) {
      this._conversationId = conversationId;
    }
    return this;
  }
  /**
   * Clears the current scope and resets its properties.
   * Note: The client will not be cleared.
   */
  clear() {
    this._breadcrumbs = [];
    this._tags = {};
    this._attributes = {};
    this._extra = {};
    this._user = {};
    this._contexts = {};
    this._level = void 0;
    this._transactionName = void 0;
    this._fingerprint = void 0;
    this._session = void 0;
    this._conversationId = void 0;
    _setSpanForScope(this, void 0);
    this._attachments = [];
    this.setPropagationContext({
      traceId: generateTraceId(),
      sampleRand: safeMathRandom()
    });
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Adds a breadcrumb to the scope.
   * By default, the last 100 breadcrumbs are kept.
   */
  addBreadcrumb(breadcrumb, maxBreadcrumbs) {
    const maxCrumbs = typeof maxBreadcrumbs === "number" ? maxBreadcrumbs : DEFAULT_MAX_BREADCRUMBS;
    if (maxCrumbs <= 0) {
      return this;
    }
    const mergedBreadcrumb = {
      timestamp: dateTimestampInSeconds(),
      ...breadcrumb,
      // Breadcrumb messages can theoretically be infinitely large and they're held in memory so we truncate them not to leak (too much) memory
      message: breadcrumb.message ? truncate(breadcrumb.message, 2048) : breadcrumb.message
    };
    this._breadcrumbs.push(mergedBreadcrumb);
    if (this._breadcrumbs.length > maxCrumbs) {
      this._breadcrumbs = this._breadcrumbs.slice(-maxCrumbs);
      this._client?.recordDroppedEvent("buffer_overflow", "log_item");
    }
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Get the last breadcrumb of the scope.
   */
  getLastBreadcrumb() {
    return this._breadcrumbs[this._breadcrumbs.length - 1];
  }
  /**
   * Clear all breadcrumbs from the scope.
   */
  clearBreadcrumbs() {
    this._breadcrumbs = [];
    this._notifyScopeListeners();
    return this;
  }
  /**
   * Add an attachment to the scope.
   */
  addAttachment(attachment) {
    this._attachments.push(attachment);
    return this;
  }
  /**
   * Clear all attachments from the scope.
   */
  clearAttachments() {
    this._attachments = [];
    return this;
  }
  /**
   * Get the data of this scope, which should be applied to an event during processing.
   */
  getScopeData() {
    return {
      breadcrumbs: this._breadcrumbs,
      attachments: this._attachments,
      contexts: this._contexts,
      tags: this._tags,
      attributes: this._attributes,
      extra: this._extra,
      user: this._user,
      level: this._level,
      fingerprint: this._fingerprint || [],
      eventProcessors: this._eventProcessors,
      propagationContext: this._propagationContext,
      sdkProcessingMetadata: this._sdkProcessingMetadata,
      transactionName: this._transactionName,
      span: _getSpanForScope(this),
      conversationId: this._conversationId
    };
  }
  /**
   * Add data which will be accessible during event processing but won't get sent to Sentry.
   */
  setSDKProcessingMetadata(newData) {
    this._sdkProcessingMetadata = merge$1(this._sdkProcessingMetadata, newData, 2);
    return this;
  }
  /**
   * Add propagation context to the scope, used for distributed tracing
   */
  setPropagationContext(context2) {
    this._propagationContext = context2;
    return this;
  }
  /**
   * Get propagation context from the scope, used for distributed tracing
   */
  getPropagationContext() {
    return this._propagationContext;
  }
  /**
   * Capture an exception for this scope.
   *
   * @returns {string} The id of the captured Sentry event.
   */
  captureException(exception, hint) {
    const eventId = hint?.event_id || uuid4();
    if (!this._client) {
      DEBUG_BUILD$3 && debug.warn("No client configured on scope - will not capture exception!");
      return eventId;
    }
    const syntheticException = new Error("Sentry syntheticException");
    this._client.captureException(
      exception,
      {
        originalException: exception,
        syntheticException,
        ...hint,
        event_id: eventId
      },
      this
    );
    return eventId;
  }
  /**
   * Capture a message for this scope.
   *
   * @returns {string} The id of the captured message.
   */
  captureMessage(message, level, hint) {
    const eventId = hint?.event_id || uuid4();
    if (!this._client) {
      DEBUG_BUILD$3 && debug.warn("No client configured on scope - will not capture message!");
      return eventId;
    }
    const syntheticException = hint?.syntheticException ?? new Error(message);
    this._client.captureMessage(
      message,
      level,
      {
        originalException: message,
        syntheticException,
        ...hint,
        event_id: eventId
      },
      this
    );
    return eventId;
  }
  /**
   * Capture a Sentry event for this scope.
   *
   * @returns {string} The id of the captured event.
   */
  captureEvent(event, hint) {
    const eventId = event.event_id || hint?.event_id || uuid4();
    if (!this._client) {
      DEBUG_BUILD$3 && debug.warn("No client configured on scope - will not capture event!");
      return eventId;
    }
    this._client.captureEvent(event, { ...hint, event_id: eventId }, this);
    return eventId;
  }
  /**
   * This will be called on every set call.
   */
  _notifyScopeListeners() {
    if (!this._notifyingListeners) {
      this._notifyingListeners = true;
      this._scopeListeners.forEach((callback) => {
        callback(this);
      });
      this._notifyingListeners = false;
    }
  }
}
function getDefaultCurrentScope() {
  return getGlobalSingleton("defaultCurrentScope", () => new Scope());
}
function getDefaultIsolationScope() {
  return getGlobalSingleton("defaultIsolationScope", () => new Scope());
}
const isActualPromise = (p) => p instanceof Promise && !p[kChainedCopy];
const kChainedCopy = Symbol("chained PromiseLike");
const chainAndCopyPromiseLike = (original, onSuccess, onError) => {
  const chained = original.then(
    (value) => {
      onSuccess(value);
      return value;
    },
    (err) => {
      onError(err);
      throw err;
    }
  );
  return isActualPromise(chained) && isActualPromise(original) ? chained : copyProps(original, chained);
};
const copyProps = (original, chained) => {
  let mutated = false;
  for (const key in original) {
    if (key in chained) continue;
    mutated = true;
    const value = original[key];
    if (typeof value === "function") {
      Object.defineProperty(chained, key, {
        value: (...args) => value.apply(original, args),
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      chained[key] = value;
    }
  }
  if (mutated) Object.assign(chained, { [kChainedCopy]: true });
  return chained;
};
class AsyncContextStack {
  constructor(scope, isolationScope) {
    let assignedScope;
    if (!scope) {
      assignedScope = new Scope();
    } else {
      assignedScope = scope;
    }
    let assignedIsolationScope;
    if (!isolationScope) {
      assignedIsolationScope = new Scope();
    } else {
      assignedIsolationScope = isolationScope;
    }
    this._stack = [{ scope: assignedScope }];
    this._isolationScope = assignedIsolationScope;
  }
  /**
   * Fork a scope for the stack.
   */
  withScope(callback) {
    const scope = this._pushScope();
    let maybePromiseResult;
    try {
      maybePromiseResult = callback(scope);
    } catch (e) {
      this._popScope();
      throw e;
    }
    if (isThenable(maybePromiseResult)) {
      return chainAndCopyPromiseLike(
        maybePromiseResult,
        () => this._popScope(),
        () => this._popScope()
      );
    }
    this._popScope();
    return maybePromiseResult;
  }
  /**
   * Get the client of the stack.
   */
  getClient() {
    return this.getStackTop().client;
  }
  /**
   * Returns the scope of the top stack.
   */
  getScope() {
    return this.getStackTop().scope;
  }
  /**
   * Get the isolation scope for the stack.
   */
  getIsolationScope() {
    return this._isolationScope;
  }
  /**
   * Returns the topmost scope layer in the order domain > local > process.
   */
  getStackTop() {
    return this._stack[this._stack.length - 1];
  }
  /**
   * Push a scope to the stack.
   */
  _pushScope() {
    const scope = this.getScope().clone();
    this._stack.push({
      client: this.getClient(),
      scope
    });
    return scope;
  }
  /**
   * Pop a scope from the stack.
   */
  _popScope() {
    if (this._stack.length <= 1) return false;
    return !!this._stack.pop();
  }
}
function getAsyncContextStack() {
  const registry = getMainCarrier();
  const sentry = getSentryCarrier(registry);
  return sentry.stack = sentry.stack || new AsyncContextStack(getDefaultCurrentScope(), getDefaultIsolationScope());
}
function withScope$1(callback) {
  return getAsyncContextStack().withScope(callback);
}
function withSetScope(scope, callback) {
  const stack = getAsyncContextStack();
  return stack.withScope(() => {
    stack.getStackTop().scope = scope;
    return callback(scope);
  });
}
function withIsolationScope(callback) {
  return getAsyncContextStack().withScope(() => {
    return callback(getAsyncContextStack().getIsolationScope());
  });
}
function getStackAsyncContextStrategy() {
  return {
    withIsolationScope,
    withScope: withScope$1,
    withSetScope,
    withSetIsolationScope: (_isolationScope, callback) => {
      return withIsolationScope(callback);
    },
    getCurrentScope: () => getAsyncContextStack().getScope(),
    getIsolationScope: () => getAsyncContextStack().getIsolationScope()
  };
}
function setAsyncContextStrategy(strategy) {
  const registry = getMainCarrier();
  const sentry = getSentryCarrier(registry);
  sentry.acs = strategy;
}
function getAsyncContextStrategy(carrier) {
  const sentry = getSentryCarrier(carrier);
  if (sentry.acs) {
    return sentry.acs;
  }
  return getStackAsyncContextStrategy();
}
function isAttributeObject(maybeObj) {
  return typeof maybeObj === "object" && maybeObj != null && !Array.isArray(maybeObj) && Object.keys(maybeObj).includes("value");
}
function attributeValueToTypedAttributeValue(rawValue, useFallback) {
  const { value, unit } = isAttributeObject(rawValue) ? rawValue : { value: rawValue, unit: void 0 };
  const attributeValue = getTypedAttributeValue(value);
  const checkedUnit = unit && typeof unit === "string" ? { unit } : {};
  if (attributeValue) {
    return { ...attributeValue, ...checkedUnit };
  }
  if (!useFallback || useFallback === "skip-undefined" && value === void 0) {
    return;
  }
  let stringValue = "";
  try {
    stringValue = JSON.stringify(value) ?? "";
  } catch {
  }
  return {
    value: stringValue,
    type: "string",
    ...checkedUnit
  };
}
function serializeAttributes(attributes2, fallback = false) {
  const serializedAttributes = {};
  for (const [key, value] of Object.entries(attributes2 ?? {})) {
    const typedValue = attributeValueToTypedAttributeValue(value, fallback);
    if (typedValue) {
      serializedAttributes[key] = typedValue;
    }
  }
  return serializedAttributes;
}
function getTypedAttributeValue(value) {
  const primitiveType = typeof value === "string" ? "string" : typeof value === "boolean" ? "boolean" : typeof value === "number" && !Number.isNaN(value) ? Number.isInteger(value) ? "integer" : "double" : null;
  if (primitiveType) {
    return { value, type: primitiveType };
  }
}
function getCurrentScope() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  return acs.getCurrentScope();
}
function getIsolationScope() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  return acs.getIsolationScope();
}
function getGlobalScope() {
  return getGlobalSingleton("globalScope", () => new Scope());
}
function withScope(...rest) {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  if (rest.length === 2) {
    const [scope, callback] = rest;
    if (!scope) {
      return acs.withScope(callback);
    }
    return acs.withSetScope(scope, callback);
  }
  return acs.withScope(rest[0]);
}
function getClient() {
  return getCurrentScope().getClient();
}
function getTraceContextFromScope(scope) {
  const propagationContext = scope.getPropagationContext();
  const { traceId, parentSpanId, propagationSpanId } = propagationContext;
  const traceContext = {
    trace_id: traceId,
    span_id: propagationSpanId || generateSpanId()
  };
  if (parentSpanId) {
    traceContext.parent_span_id = parentSpanId;
  }
  return traceContext;
}
const SEMANTIC_ATTRIBUTE_SENTRY_SOURCE = "sentry.source";
const SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE = "sentry.sample_rate";
const SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE = "sentry.previous_trace_sample_rate";
const SEMANTIC_ATTRIBUTE_SENTRY_OP = "sentry.op";
const SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN = "sentry.origin";
const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT = "sentry.measurement_unit";
const SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE = "sentry.measurement_value";
const SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME = "sentry.custom_span_name";
const SEMANTIC_ATTRIBUTE_PROFILE_ID = "sentry.profile_id";
const SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME = "sentry.exclusive_time";
const SEMANTIC_ATTRIBUTE_URL_FULL = "url.full";
const SPAN_STATUS_UNSET = 0;
const SPAN_STATUS_OK = 1;
const SPAN_STATUS_ERROR = 2;
function getSpanStatusFromHttpCode(httpStatus) {
  if (httpStatus < 400 && httpStatus >= 100) {
    return { code: SPAN_STATUS_OK };
  }
  if (httpStatus >= 400 && httpStatus < 500) {
    switch (httpStatus) {
      case 401:
        return { code: SPAN_STATUS_ERROR, message: "unauthenticated" };
      case 403:
        return { code: SPAN_STATUS_ERROR, message: "permission_denied" };
      case 404:
        return { code: SPAN_STATUS_ERROR, message: "not_found" };
      case 409:
        return { code: SPAN_STATUS_ERROR, message: "already_exists" };
      case 413:
        return { code: SPAN_STATUS_ERROR, message: "failed_precondition" };
      case 429:
        return { code: SPAN_STATUS_ERROR, message: "resource_exhausted" };
      case 499:
        return { code: SPAN_STATUS_ERROR, message: "cancelled" };
      default:
        return { code: SPAN_STATUS_ERROR, message: "invalid_argument" };
    }
  }
  if (httpStatus >= 500 && httpStatus < 600) {
    switch (httpStatus) {
      case 501:
        return { code: SPAN_STATUS_ERROR, message: "unimplemented" };
      case 503:
        return { code: SPAN_STATUS_ERROR, message: "unavailable" };
      case 504:
        return { code: SPAN_STATUS_ERROR, message: "deadline_exceeded" };
      default:
        return { code: SPAN_STATUS_ERROR, message: "internal_error" };
    }
  }
  return { code: SPAN_STATUS_ERROR, message: "internal_error" };
}
function setHttpStatus(span, httpStatus) {
  span.setAttribute("http.response.status_code", httpStatus);
  const spanStatus = getSpanStatusFromHttpCode(httpStatus);
  if (spanStatus.message !== "unknown_error") {
    span.setStatus(spanStatus);
  }
}
function makeWeakRef(value) {
  try {
    const WeakRefImpl = GLOBAL_OBJ.WeakRef;
    if (typeof WeakRefImpl === "function") {
      return new WeakRefImpl(value);
    }
  } catch {
  }
  return value;
}
function derefWeakRef(ref) {
  if (!ref) {
    return void 0;
  }
  if (typeof ref === "object" && "deref" in ref && typeof ref.deref === "function") {
    try {
      return ref.deref();
    } catch {
      return void 0;
    }
  }
  return ref;
}
const SCOPE_ON_START_SPAN_FIELD = "_sentryScope";
const ISOLATION_SCOPE_ON_START_SPAN_FIELD = "_sentryIsolationScope";
function setCapturedScopesOnSpan(span, scope, isolationScope) {
  if (span) {
    addNonEnumerableProperty(span, ISOLATION_SCOPE_ON_START_SPAN_FIELD, makeWeakRef(isolationScope));
    addNonEnumerableProperty(span, SCOPE_ON_START_SPAN_FIELD, scope);
  }
}
function getCapturedScopesOnSpan(span) {
  const spanWithScopes = span;
  return {
    scope: spanWithScopes[SCOPE_ON_START_SPAN_FIELD],
    isolationScope: derefWeakRef(spanWithScopes[ISOLATION_SCOPE_ON_START_SPAN_FIELD])
  };
}
const SENTRY_BAGGAGE_KEY_PREFIX = "sentry-";
const MAX_BAGGAGE_STRING_LENGTH = 8192;
function baggageHeaderToDynamicSamplingContext(baggageHeader) {
  const baggageObject = parseBaggageHeader(baggageHeader);
  if (!baggageObject) {
    return void 0;
  }
  const dynamicSamplingContext = Object.entries(baggageObject).reduce((acc, [key, value]) => {
    if (key.startsWith(SENTRY_BAGGAGE_KEY_PREFIX)) {
      const nonPrefixedKey = key.slice(SENTRY_BAGGAGE_KEY_PREFIX.length);
      acc[nonPrefixedKey] = value;
    }
    return acc;
  }, {});
  if (Object.keys(dynamicSamplingContext).length > 0) {
    return dynamicSamplingContext;
  } else {
    return void 0;
  }
}
function dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext) {
  if (!dynamicSamplingContext) {
    return void 0;
  }
  const sentryPrefixedDSC = Object.entries(dynamicSamplingContext).reduce(
    (acc, [dscKey, dscValue]) => {
      if (dscValue) {
        acc[`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`] = dscValue;
      }
      return acc;
    },
    {}
  );
  return objectToBaggageHeader(sentryPrefixedDSC);
}
function parseBaggageHeader(baggageHeader) {
  if (!baggageHeader || !isString(baggageHeader) && !Array.isArray(baggageHeader)) {
    return void 0;
  }
  if (Array.isArray(baggageHeader)) {
    return baggageHeader.reduce((acc, curr) => {
      const currBaggageObject = baggageHeaderToObject(curr);
      Object.entries(currBaggageObject).forEach(([key, value]) => {
        acc[key] = value;
      });
      return acc;
    }, {});
  }
  return baggageHeaderToObject(baggageHeader);
}
function baggageHeaderToObject(baggageHeader) {
  return baggageHeader.split(",").map((baggageEntry) => {
    const eqIdx = baggageEntry.indexOf("=");
    if (eqIdx === -1) {
      return [];
    }
    const key = baggageEntry.slice(0, eqIdx);
    const value = baggageEntry.slice(eqIdx + 1);
    return [key, value].map((keyOrValue) => {
      try {
        return decodeURIComponent(keyOrValue.trim());
      } catch {
        return;
      }
    });
  }).reduce((acc, [key, value]) => {
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});
}
function objectToBaggageHeader(object) {
  if (Object.keys(object).length === 0) {
    return void 0;
  }
  return Object.entries(object).reduce((baggageHeader, [objectKey, objectValue], currentIndex) => {
    const baggageEntry = `${encodeURIComponent(objectKey)}=${encodeURIComponent(objectValue)}`;
    const newBaggageHeader = currentIndex === 0 ? baggageEntry : `${baggageHeader},${baggageEntry}`;
    if (newBaggageHeader.length > MAX_BAGGAGE_STRING_LENGTH) {
      DEBUG_BUILD$3 && debug.warn(
        `Not adding key: ${objectKey} with val: ${objectValue} to baggage header due to exceeding baggage size limits.`
      );
      return baggageHeader;
    } else {
      return newBaggageHeader;
    }
  }, "");
}
const ORG_ID_REGEX = /^o(\d+)\./;
const DSN_REGEX = /^(?:(\w+):)\/\/(?:(\w+)(?::(\w+)?)?@)((?:\[[:.%\w]+\]|[\w.-]+))(?::(\d+))?\/(.+)/;
function isValidProtocol(protocol2) {
  return protocol2 === "http" || protocol2 === "https";
}
function dsnToString(dsn, withPassword = false) {
  const { host, path: path2, pass, port, projectId, protocol: protocol2, publicKey } = dsn;
  return `${protocol2}://${publicKey}${withPassword && pass ? `:${pass}` : ""}@${host}${port ? `:${port}` : ""}/${path2 ? `${path2}/` : path2}${projectId}`;
}
function dsnFromString(str) {
  const match = DSN_REGEX.exec(str);
  if (!match) {
    consoleSandbox(() => {
      console.error(`Invalid Sentry Dsn: ${str}`);
    });
    return void 0;
  }
  const [protocol2, publicKey, pass = "", host = "", port = "", lastPath = ""] = match.slice(1);
  let path2 = "";
  let projectId = lastPath;
  const split = projectId.split("/");
  if (split.length > 1) {
    path2 = split.slice(0, -1).join("/");
    projectId = split.pop();
  }
  if (projectId) {
    const projectMatch = projectId.match(/^\d+/);
    if (projectMatch) {
      projectId = projectMatch[0];
    }
  }
  return dsnFromComponents({ host, pass, path: path2, projectId, port, protocol: protocol2, publicKey });
}
function dsnFromComponents(components) {
  return {
    protocol: components.protocol,
    publicKey: components.publicKey || "",
    pass: components.pass || "",
    host: components.host,
    port: components.port || "",
    path: components.path || "",
    projectId: components.projectId
  };
}
function validateDsn(dsn) {
  if (!DEBUG_BUILD$3) {
    return true;
  }
  const { port, projectId, protocol: protocol2 } = dsn;
  const requiredComponents = ["protocol", "publicKey", "host", "projectId"];
  const hasMissingRequiredComponent = requiredComponents.find((component) => {
    if (!dsn[component]) {
      debug.error(`Invalid Sentry Dsn: ${component} missing`);
      return true;
    }
    return false;
  });
  if (hasMissingRequiredComponent) {
    return false;
  }
  if (!projectId.match(/^\d+$/)) {
    debug.error(`Invalid Sentry Dsn: Invalid projectId ${projectId}`);
    return false;
  }
  if (!isValidProtocol(protocol2)) {
    debug.error(`Invalid Sentry Dsn: Invalid protocol ${protocol2}`);
    return false;
  }
  if (port && isNaN(parseInt(port, 10))) {
    debug.error(`Invalid Sentry Dsn: Invalid port ${port}`);
    return false;
  }
  return true;
}
function extractOrgIdFromDsnHost(host) {
  const match = host.match(ORG_ID_REGEX);
  return match?.[1];
}
function extractOrgIdFromClient(client) {
  const options = client.getOptions();
  const { host } = client.getDsn() || {};
  let org_id;
  if (options.orgId) {
    org_id = String(options.orgId);
  } else if (host) {
    org_id = extractOrgIdFromDsnHost(host);
  }
  return org_id;
}
function makeDsn(from) {
  const components = typeof from === "string" ? dsnFromString(from) : dsnFromComponents(from);
  if (!components || !validateDsn(components)) {
    return void 0;
  }
  return components;
}
function parseSampleRate(sampleRate) {
  if (typeof sampleRate === "boolean") {
    return Number(sampleRate);
  }
  const rate = typeof sampleRate === "string" ? parseFloat(sampleRate) : sampleRate;
  if (typeof rate !== "number" || isNaN(rate) || rate < 0 || rate > 1) {
    return void 0;
  }
  return rate;
}
const TRACEPARENT_REGEXP = new RegExp(
  "^[ \\t]*([0-9a-f]{32})?-?([0-9a-f]{16})?-?([01])?[ \\t]*$"
  // whitespace
);
function extractTraceparentData(traceparent) {
  if (!traceparent) {
    return void 0;
  }
  const matches = traceparent.match(TRACEPARENT_REGEXP);
  if (!matches) {
    return void 0;
  }
  let parentSampled;
  if (matches[3] === "1") {
    parentSampled = true;
  } else if (matches[3] === "0") {
    parentSampled = false;
  }
  return {
    traceId: matches[1],
    parentSampled,
    parentSpanId: matches[2]
  };
}
function propagationContextFromHeaders(sentryTrace, baggage) {
  const traceparentData = extractTraceparentData(sentryTrace);
  const dynamicSamplingContext = baggageHeaderToDynamicSamplingContext(baggage);
  if (!traceparentData?.traceId) {
    return {
      traceId: generateTraceId(),
      sampleRand: safeMathRandom()
    };
  }
  const sampleRand = getSampleRandFromTraceparentAndDsc(traceparentData, dynamicSamplingContext);
  if (dynamicSamplingContext) {
    dynamicSamplingContext.sample_rand = sampleRand.toString();
  }
  const { traceId, parentSpanId, parentSampled } = traceparentData;
  return {
    traceId,
    parentSpanId,
    sampled: parentSampled,
    dsc: dynamicSamplingContext || {},
    // If we have traceparent data but no DSC it means we are not head of trace and we must freeze it
    sampleRand
  };
}
function generateSentryTraceHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
  let sampledString = "";
  if (sampled !== void 0) {
    sampledString = sampled ? "-1" : "-0";
  }
  return `${traceId}-${spanId}${sampledString}`;
}
function generateTraceparentHeader(traceId = generateTraceId(), spanId = generateSpanId(), sampled) {
  return `00-${traceId}-${spanId}-${sampled ? "01" : "00"}`;
}
function getSampleRandFromTraceparentAndDsc(traceparentData, dsc) {
  const parsedSampleRand = parseSampleRate(dsc?.sample_rand);
  if (parsedSampleRand !== void 0) {
    return parsedSampleRand;
  }
  const parsedSampleRate = parseSampleRate(dsc?.sample_rate);
  if (parsedSampleRate && traceparentData?.parentSampled !== void 0) {
    return traceparentData.parentSampled ? (
      // Returns a sample rand with positive sampling decision [0, sampleRate)
      safeMathRandom() * parsedSampleRate
    ) : (
      // Returns a sample rand with negative sampling decision [sampleRate, 1)
      parsedSampleRate + safeMathRandom() * (1 - parsedSampleRate)
    );
  } else {
    return safeMathRandom();
  }
}
function shouldContinueTrace(client, baggageOrgId) {
  const clientOrgId = extractOrgIdFromClient(client);
  if (baggageOrgId && clientOrgId && baggageOrgId !== clientOrgId) {
    debug.log(
      `Won't continue trace because org IDs don't match (incoming baggage: ${baggageOrgId}, SDK options: ${clientOrgId})`
    );
    return false;
  }
  const strictTraceContinuation = client.getOptions().strictTraceContinuation || false;
  if (strictTraceContinuation) {
    if (baggageOrgId && !clientOrgId || !baggageOrgId && clientOrgId) {
      debug.log(
        `Starting a new trace because strict trace continuation is enabled but one org ID is missing (incoming baggage: ${baggageOrgId}, Sentry client: ${clientOrgId})`
      );
      return false;
    }
  }
  return true;
}
const TRACE_FLAG_NONE = 0;
const TRACE_FLAG_SAMPLED = 1;
let hasShownSpanDropWarning = false;
function spanToTransactionTraceContext(span) {
  const { spanId: span_id, traceId: trace_id } = span.spanContext();
  const { data, op, parent_span_id, status, origin, links } = spanToJSON(span);
  return {
    parent_span_id,
    span_id,
    trace_id,
    data,
    op,
    status,
    origin,
    links
  };
}
function spanToTraceContext(span) {
  const { spanId, traceId: trace_id, isRemote } = span.spanContext();
  const parent_span_id = isRemote ? spanId : spanToJSON(span).parent_span_id;
  const scope = getCapturedScopesOnSpan(span).scope;
  const span_id = isRemote ? scope?.getPropagationContext().propagationSpanId || generateSpanId() : spanId;
  return {
    parent_span_id,
    span_id,
    trace_id
  };
}
function spanToTraceHeader(span) {
  const { traceId, spanId } = span.spanContext();
  const sampled = spanIsSampled(span);
  return generateSentryTraceHeader(traceId, spanId, sampled);
}
function spanToTraceparentHeader(span) {
  const { traceId, spanId } = span.spanContext();
  const sampled = spanIsSampled(span);
  return generateTraceparentHeader(traceId, spanId, sampled);
}
function convertSpanLinksForEnvelope(links) {
  if (links && links.length > 0) {
    return links.map(({ context: { spanId, traceId, traceFlags, ...restContext }, attributes: attributes2 }) => ({
      span_id: spanId,
      trace_id: traceId,
      sampled: traceFlags === TRACE_FLAG_SAMPLED,
      attributes: attributes2,
      ...restContext
    }));
  } else {
    return void 0;
  }
}
function getStreamedSpanLinks(links) {
  if (links?.length) {
    return links.map(({ context: { spanId, traceId, traceFlags }, attributes: attributes2 }) => ({
      span_id: spanId,
      trace_id: traceId,
      sampled: traceFlags === TRACE_FLAG_SAMPLED,
      attributes: attributes2
    }));
  } else {
    return void 0;
  }
}
function spanTimeInputToSeconds(input) {
  if (typeof input === "number") {
    return ensureTimestampInSeconds(input);
  }
  if (Array.isArray(input)) {
    return input[0] + input[1] / 1e9;
  }
  if (input instanceof Date) {
    return ensureTimestampInSeconds(input.getTime());
  }
  return timestampInSeconds();
}
function ensureTimestampInSeconds(timestamp) {
  const isMs = timestamp > 9999999999;
  return isMs ? timestamp / 1e3 : timestamp;
}
function spanToJSON(span) {
  if (spanIsSentrySpan(span)) {
    return span.getSpanJSON();
  }
  const { spanId: span_id, traceId: trace_id } = span.spanContext();
  if (spanIsOpenTelemetrySdkTraceBaseSpan(span)) {
    const { attributes: attributes2, startTime, name, endTime, status, links } = span;
    return {
      span_id,
      trace_id,
      data: attributes2,
      description: name,
      parent_span_id: getOtelParentSpanId(span),
      start_timestamp: spanTimeInputToSeconds(startTime),
      // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
      timestamp: spanTimeInputToSeconds(endTime) || void 0,
      status: getStatusMessage(status),
      op: attributes2[SEMANTIC_ATTRIBUTE_SENTRY_OP],
      origin: attributes2[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
      links: convertSpanLinksForEnvelope(links)
    };
  }
  return {
    span_id,
    trace_id,
    start_timestamp: 0,
    data: {}
  };
}
function getOtelParentSpanId(span) {
  return "parentSpanId" in span ? span.parentSpanId : "parentSpanContext" in span ? span.parentSpanContext?.spanId : void 0;
}
function spanIsOpenTelemetrySdkTraceBaseSpan(span) {
  const castSpan = span;
  return !!castSpan.attributes && !!castSpan.startTime && !!castSpan.name && !!castSpan.endTime && !!castSpan.status;
}
function spanIsSentrySpan(span) {
  return typeof span.getSpanJSON === "function";
}
function spanIsSampled(span) {
  const { traceFlags } = span.spanContext();
  return traceFlags === TRACE_FLAG_SAMPLED;
}
function getStatusMessage(status) {
  if (!status || status.code === SPAN_STATUS_UNSET) {
    return void 0;
  }
  if (status.code === SPAN_STATUS_OK) {
    return "ok";
  }
  return status.message || "internal_error";
}
function getSimpleStatusMessage(status) {
  return !status || status.code === SPAN_STATUS_OK || status.code === SPAN_STATUS_UNSET || status.message === "cancelled" ? "ok" : "error";
}
const CHILD_SPANS_FIELD = "_sentryChildSpans";
const ROOT_SPAN_FIELD = "_sentryRootSpan";
function addChildSpanToSpan(span, childSpan) {
  const rootSpan = span[ROOT_SPAN_FIELD] || span;
  addNonEnumerableProperty(childSpan, ROOT_SPAN_FIELD, rootSpan);
  if (span[CHILD_SPANS_FIELD]) {
    span[CHILD_SPANS_FIELD].add(childSpan);
  } else {
    addNonEnumerableProperty(span, CHILD_SPANS_FIELD, /* @__PURE__ */ new Set([childSpan]));
  }
}
function getSpanDescendants(span) {
  const resultSet = /* @__PURE__ */ new Set();
  function addSpanChildren(span2) {
    if (resultSet.has(span2)) {
      return;
    } else if (spanIsSampled(span2)) {
      resultSet.add(span2);
      const childSpans = span2[CHILD_SPANS_FIELD] ? Array.from(span2[CHILD_SPANS_FIELD]) : [];
      for (const childSpan of childSpans) {
        addSpanChildren(childSpan);
      }
    }
  }
  addSpanChildren(span);
  return Array.from(resultSet);
}
const getRootSpan = INTERNAL_getSegmentSpan;
function INTERNAL_getSegmentSpan(span) {
  return span[ROOT_SPAN_FIELD] || span;
}
function getActiveSpan$1() {
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  if (acs.getActiveSpan) {
    return acs.getActiveSpan();
  }
  return _getSpanForScope(getCurrentScope());
}
function showSpanDropWarning() {
  if (!hasShownSpanDropWarning) {
    consoleSandbox(() => {
      console.warn(
        "[Sentry] Returning null from `beforeSendSpan` is disallowed. To drop certain spans, configure the respective integrations directly or use `ignoreSpans`."
      );
    });
    hasShownSpanDropWarning = true;
  }
}
let errorsInstrumented = false;
function registerSpanErrorInstrumentation() {
  if (errorsInstrumented) {
    return;
  }
  function errorCallback() {
    const activeSpan = getActiveSpan$1();
    const rootSpan = activeSpan && getRootSpan(activeSpan);
    if (rootSpan) {
      const message = "internal_error";
      DEBUG_BUILD$3 && debug.log(`[Tracing] Root span: ${message} -> Global error occurred`);
      rootSpan.setStatus({ code: SPAN_STATUS_ERROR, message });
    }
  }
  errorCallback.tag = "sentry_tracingErrorCallback";
  errorsInstrumented = true;
  addGlobalErrorInstrumentationHandler(errorCallback);
  addGlobalUnhandledRejectionInstrumentationHandler(errorCallback);
}
function hasSpansEnabled(maybeOptions) {
  if (typeof __SENTRY_TRACING__ === "boolean" && !__SENTRY_TRACING__) {
    return false;
  }
  const options = maybeOptions || getClient()?.getOptions();
  return !!options && // Note: This check is `!= null`, meaning "nullish". `0` is not "nullish", `undefined` and `null` are. (This comment was brought to you by 15 minutes of questioning life)
  (options.tracesSampleRate != null || !!options.tracesSampler);
}
function logIgnoredSpan(droppedSpan) {
  debug.log(`Ignoring span ${droppedSpan.op} - ${droppedSpan.description} because it matches \`ignoreSpans\`.`);
}
function shouldIgnoreSpan(span, ignoreSpans) {
  if (!ignoreSpans?.length || !span.description) {
    return false;
  }
  for (const pattern of ignoreSpans) {
    if (isStringOrRegExp(pattern)) {
      if (isMatchingPattern(span.description, pattern)) {
        DEBUG_BUILD$3 && logIgnoredSpan(span);
        return true;
      }
      continue;
    }
    if (!pattern.name && !pattern.op) {
      continue;
    }
    const nameMatches = pattern.name ? isMatchingPattern(span.description, pattern.name) : true;
    const opMatches = pattern.op ? span.op && isMatchingPattern(span.op, pattern.op) : true;
    if (nameMatches && opMatches) {
      DEBUG_BUILD$3 && logIgnoredSpan(span);
      return true;
    }
  }
  return false;
}
function reparentChildSpans(spans, dropSpan) {
  const droppedSpanParentId = dropSpan.parent_span_id;
  const droppedSpanId = dropSpan.span_id;
  if (!droppedSpanParentId) {
    return;
  }
  for (const span of spans) {
    if (span.parent_span_id === droppedSpanId) {
      span.parent_span_id = droppedSpanParentId;
    }
  }
}
function isStringOrRegExp(value) {
  return typeof value === "string" || value instanceof RegExp;
}
const DEFAULT_ENVIRONMENT = "production";
const FROZEN_DSC_FIELD = "_frozenDsc";
function freezeDscOnSpan(span, dsc) {
  const spanWithMaybeDsc = span;
  addNonEnumerableProperty(spanWithMaybeDsc, FROZEN_DSC_FIELD, dsc);
}
function getDynamicSamplingContextFromClient(trace_id, client) {
  const options = client.getOptions();
  const { publicKey: public_key } = client.getDsn() || {};
  const dsc = {
    environment: options.environment || DEFAULT_ENVIRONMENT,
    release: options.release,
    public_key,
    trace_id,
    org_id: extractOrgIdFromClient(client)
  };
  client.emit("createDsc", dsc);
  return dsc;
}
function getDynamicSamplingContextFromScope(client, scope) {
  const propagationContext = scope.getPropagationContext();
  return propagationContext.dsc || getDynamicSamplingContextFromClient(propagationContext.traceId, client);
}
function getDynamicSamplingContextFromSpan(span) {
  const client = getClient();
  if (!client) {
    return {};
  }
  const rootSpan = getRootSpan(span);
  const rootSpanJson = spanToJSON(rootSpan);
  const rootSpanAttributes = rootSpanJson.data;
  const traceState = rootSpan.spanContext().traceState;
  const rootSpanSampleRate = traceState?.get("sentry.sample_rate") ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE] ?? rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_PREVIOUS_TRACE_SAMPLE_RATE];
  function applyLocalSampleRateToDsc(dsc2) {
    if (typeof rootSpanSampleRate === "number" || typeof rootSpanSampleRate === "string") {
      dsc2.sample_rate = `${rootSpanSampleRate}`;
    }
    return dsc2;
  }
  const frozenDsc = rootSpan[FROZEN_DSC_FIELD];
  if (frozenDsc) {
    return applyLocalSampleRateToDsc(frozenDsc);
  }
  const traceStateDsc = traceState?.get("sentry.dsc");
  const dscOnTraceState = traceStateDsc && baggageHeaderToDynamicSamplingContext(traceStateDsc);
  if (dscOnTraceState) {
    return applyLocalSampleRateToDsc(dscOnTraceState);
  }
  const dsc = getDynamicSamplingContextFromClient(span.spanContext().traceId, client);
  const source = rootSpanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] ?? rootSpanAttributes["sentry.span.source"];
  const name = rootSpanJson.description;
  if (source !== "url" && name) {
    dsc.transaction = name;
  }
  if (hasSpansEnabled()) {
    dsc.sampled = String(spanIsSampled(rootSpan));
    dsc.sample_rand = // In OTEL we store the sample rand on the trace state because we cannot access scopes for NonRecordingSpans
    // The Sentry OTEL SpanSampler takes care of writing the sample rand on the root span
    traceState?.get("sentry.sample_rand") ?? // On all other platforms we can actually get the scopes from a root span (we use this as a fallback)
    getCapturedScopesOnSpan(rootSpan).scope?.getPropagationContext().sampleRand.toString();
  }
  applyLocalSampleRateToDsc(dsc);
  client.emit("createDsc", dsc, rootSpan);
  return dsc;
}
class SentryNonRecordingSpan {
  /**
   * Reason why this span was dropped, if applicable ('ignored' or 'sample_rate').
   * Used to propagate the correct client report outcome to descendant spans
   * when span streaming is enabled.
   */
  constructor(spanContext = {}) {
    this._traceId = spanContext.traceId || generateTraceId();
    this._spanId = spanContext.spanId || generateSpanId();
    this.dropReason = spanContext.dropReason;
  }
  /** @inheritdoc */
  spanContext() {
    return {
      spanId: this._spanId,
      traceId: this._traceId,
      traceFlags: TRACE_FLAG_NONE
    };
  }
  /** @inheritdoc */
  end(_timestamp) {
  }
  /** @inheritdoc */
  setAttribute(_key, _value) {
    return this;
  }
  /** @inheritdoc */
  setAttributes(_values) {
    return this;
  }
  /** @inheritdoc */
  setStatus(_status) {
    return this;
  }
  /** @inheritdoc */
  updateName(_name) {
    return this;
  }
  /** @inheritdoc */
  isRecording() {
    return false;
  }
  /** @inheritdoc */
  addEvent(_name, _attributesOrStartTime, _startTime) {
    return this;
  }
  /** @inheritDoc */
  addLink(_link) {
    return this;
  }
  /** @inheritDoc */
  addLinks(_links) {
    return this;
  }
  /**
   * This should generally not be used,
   * but we need it for being compliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  recordException(_exception, _time) {
  }
}
function isStreamedBeforeSendSpanCallback(callback) {
  return !!callback && typeof callback === "function" && "_streamed" in callback && !!callback._streamed;
}
function normalize(input, depth = 100, maxProperties = Infinity) {
  try {
    return visit("", input, depth, maxProperties);
  } catch (err) {
    return { ERROR: `**non-serializable** (${err})` };
  }
}
function normalizeToSize(object, depth = 3, maxSize = 100 * 1024) {
  const normalized = normalize(object, depth);
  if (jsonSize(normalized) > maxSize) {
    return normalizeToSize(object, depth - 1, maxSize);
  }
  return normalized;
}
function visit(key, value, depth = Infinity, maxProperties = Infinity, memo = memoBuilder()) {
  const [memoize, unmemoize] = memo;
  if (value == null || // this matches null and undefined -> eqeq not eqeqeq
  ["boolean", "string"].includes(typeof value) || typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const stringified = stringifyValue(key, value);
  if (!stringified.startsWith("[object ")) {
    return stringified;
  }
  if (value["__sentry_skip_normalization__"]) {
    return value;
  }
  const remainingDepth = typeof value["__sentry_override_normalization_depth__"] === "number" ? value["__sentry_override_normalization_depth__"] : depth;
  if (remainingDepth === 0) {
    return stringified.replace("object ", "");
  }
  if (memoize(value)) {
    return "[Circular ~]";
  }
  const valueWithToJSON = value;
  if (valueWithToJSON && typeof valueWithToJSON.toJSON === "function") {
    try {
      const jsonValue = valueWithToJSON.toJSON();
      return visit("", jsonValue, remainingDepth - 1, maxProperties, memo);
    } catch {
    }
  }
  const normalized = Array.isArray(value) ? [] : {};
  let numAdded = 0;
  const visitable = convertToPlainObject(value);
  for (const visitKey in visitable) {
    if (!Object.prototype.hasOwnProperty.call(visitable, visitKey)) {
      continue;
    }
    if (numAdded >= maxProperties) {
      normalized[visitKey] = "[MaxProperties ~]";
      break;
    }
    const visitValue = visitable[visitKey];
    normalized[visitKey] = visit(visitKey, visitValue, remainingDepth - 1, maxProperties, memo);
    numAdded++;
  }
  unmemoize(value);
  return normalized;
}
function stringifyValue(key, value) {
  try {
    if (key === "domain" && value && typeof value === "object" && value._events) {
      return "[Domain]";
    }
    if (key === "domainEmitter") {
      return "[DomainEmitter]";
    }
    if (typeof global !== "undefined" && value === global) {
      return "[Global]";
    }
    if (typeof window !== "undefined" && value === window) {
      return "[Window]";
    }
    if (typeof document !== "undefined" && value === document) {
      return "[Document]";
    }
    if (isVueViewModel(value)) {
      return getVueInternalName(value);
    }
    if (isSyntheticEvent(value)) {
      return "[SyntheticEvent]";
    }
    if (typeof value === "number" && !Number.isFinite(value)) {
      return `[${value}]`;
    }
    if (typeof value === "function") {
      return `[Function: ${getFunctionName(value)}]`;
    }
    if (typeof value === "symbol") {
      return `[${String(value)}]`;
    }
    if (typeof value === "bigint") {
      return `[BigInt: ${String(value)}]`;
    }
    const objName = getConstructorName(value);
    if (/^HTML(\w*)Element$/.test(objName)) {
      return `[HTMLElement: ${objName}]`;
    }
    return `[object ${objName}]`;
  } catch (err) {
    return `**non-serializable** (${err})`;
  }
}
function getConstructorName(value) {
  const prototype = Object.getPrototypeOf(value);
  return prototype?.constructor ? prototype.constructor.name : "null prototype";
}
function utf8Length(value) {
  return ~-encodeURI(value).split(/%..|./).length;
}
function jsonSize(value) {
  return utf8Length(JSON.stringify(value));
}
function normalizeUrlToBase(url, basePath) {
  const escapedBase = basePath.replace(/\\/g, "/").replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
  let newUrl = url;
  try {
    newUrl = decodeURI(url);
  } catch {
  }
  return newUrl.replace(/\\/g, "/").replace(/webpack:\/?/g, "").replace(new RegExp(`(file://)?/*${escapedBase}/*`, "ig"), "app:///");
}
function memoBuilder() {
  const inner = /* @__PURE__ */ new WeakSet();
  function memoize(obj) {
    if (inner.has(obj)) {
      return true;
    }
    inner.add(obj);
    return false;
  }
  function unmemoize(obj) {
    inner.delete(obj);
  }
  return [memoize, unmemoize];
}
function createEnvelope(headers, items = []) {
  return [headers, items];
}
function addItemToEnvelope(envelope, newItem) {
  const [headers, items] = envelope;
  return [headers, [...items, newItem]];
}
function forEachEnvelopeItem(envelope, callback) {
  const envelopeItems = envelope[1];
  for (const envelopeItem of envelopeItems) {
    const envelopeItemType = envelopeItem[0].type;
    const result = callback(envelopeItem, envelopeItemType);
    if (result) {
      return true;
    }
  }
  return false;
}
function envelopeContainsItemType(envelope, types2) {
  return forEachEnvelopeItem(envelope, (_, type) => types2.includes(type));
}
function encodeUTF8(input) {
  const carrier = getSentryCarrier(GLOBAL_OBJ);
  return carrier.encodePolyfill ? carrier.encodePolyfill(input) : new TextEncoder().encode(input);
}
function decodeUTF8(input) {
  const carrier = getSentryCarrier(GLOBAL_OBJ);
  return carrier.decodePolyfill ? carrier.decodePolyfill(input) : new TextDecoder().decode(input);
}
function serializeEnvelope(envelope) {
  const [envHeaders, items] = envelope;
  let parts = JSON.stringify(envHeaders);
  function append(next) {
    if (typeof parts === "string") {
      parts = typeof next === "string" ? parts + next : [encodeUTF8(parts), next];
    } else {
      parts.push(typeof next === "string" ? encodeUTF8(next) : next);
    }
  }
  for (const item of items) {
    const [itemHeaders, payload] = item;
    append(`
${JSON.stringify(itemHeaders)}
`);
    if (typeof payload === "string" || payload instanceof Uint8Array) {
      append(payload);
    } else {
      let stringifiedPayload;
      try {
        stringifiedPayload = JSON.stringify(payload);
      } catch {
        stringifiedPayload = JSON.stringify(normalize(payload));
      }
      append(stringifiedPayload);
    }
  }
  return typeof parts === "string" ? parts : concatBuffers(parts);
}
function concatBuffers(buffers) {
  const totalLength = buffers.reduce((acc, buf) => acc + buf.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    merged.set(buffer, offset);
    offset += buffer.length;
  }
  return merged;
}
function parseEnvelope(env) {
  let buffer = typeof env === "string" ? encodeUTF8(env) : env;
  function readBinary(length) {
    const bin = buffer.subarray(0, length);
    buffer = buffer.subarray(length + 1);
    return bin;
  }
  function readJson() {
    let i = buffer.indexOf(10);
    if (i < 0) {
      i = buffer.length;
    }
    return JSON.parse(decodeUTF8(readBinary(i)));
  }
  const envelopeHeader = readJson();
  const items = [];
  while (buffer.length) {
    const itemHeader = readJson();
    const binaryLength = typeof itemHeader.length === "number" ? itemHeader.length : void 0;
    items.push([itemHeader, binaryLength ? readBinary(binaryLength) : readJson()]);
  }
  return [envelopeHeader, items];
}
function createSpanEnvelopeItem(spanJson) {
  const spanHeaders = {
    type: "span"
  };
  return [spanHeaders, spanJson];
}
function createAttachmentEnvelopeItem(attachment) {
  const buffer = typeof attachment.data === "string" ? encodeUTF8(attachment.data) : attachment.data;
  return [
    {
      type: "attachment",
      length: buffer.length,
      filename: attachment.filename,
      content_type: attachment.contentType,
      attachment_type: attachment.attachmentType
    },
    buffer
  ];
}
const DATA_CATEGORY_OVERRIDES = {
  sessions: "session",
  event: "error",
  client_report: "internal",
  user_report: "default",
  profile_chunk: "profile",
  replay_event: "replay",
  replay_recording: "replay",
  check_in: "monitor",
  raw_security: "security",
  log: "log_item",
  trace_metric: "metric"
};
function _isOverriddenType(type) {
  return type in DATA_CATEGORY_OVERRIDES;
}
function envelopeItemTypeToDataCategory(type) {
  return _isOverriddenType(type) ? DATA_CATEGORY_OVERRIDES[type] : type;
}
function getSdkMetadataForEnvelopeHeader(metadataOrEvent) {
  if (!metadataOrEvent?.sdk) {
    return;
  }
  const { name, version: version2 } = metadataOrEvent.sdk;
  return { name, version: version2 };
}
function createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn) {
  const dynamicSamplingContext = event.sdkProcessingMetadata?.dynamicSamplingContext;
  return {
    event_id: event.event_id,
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...sdkInfo && { sdk: sdkInfo },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) },
    ...dynamicSamplingContext && {
      trace: dynamicSamplingContext
    }
  };
}
function _enhanceEventWithSdkInfo(event, newSdkInfo) {
  if (!newSdkInfo) {
    return event;
  }
  const eventSdkInfo = event.sdk || {};
  event.sdk = {
    ...eventSdkInfo,
    name: eventSdkInfo.name || newSdkInfo.name,
    version: eventSdkInfo.version || newSdkInfo.version,
    integrations: [...event.sdk?.integrations || [], ...newSdkInfo.integrations || []],
    packages: [...event.sdk?.packages || [], ...newSdkInfo.packages || []],
    settings: event.sdk?.settings || newSdkInfo.settings ? {
      ...event.sdk?.settings,
      ...newSdkInfo.settings
    } : void 0
  };
  return event;
}
function createSessionEnvelope(session2, dsn, metadata, tunnel) {
  const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
  const envelopeHeaders = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...sdkInfo && { sdk: sdkInfo },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
  };
  const envelopeItem = "aggregates" in session2 ? [{ type: "sessions" }, session2] : [{ type: "session" }, session2.toJSON()];
  return createEnvelope(envelopeHeaders, [envelopeItem]);
}
function createEventEnvelope(event, dsn, metadata, tunnel) {
  const sdkInfo = getSdkMetadataForEnvelopeHeader(metadata);
  const eventType = event.type && event.type !== "replay_event" ? event.type : "event";
  _enhanceEventWithSdkInfo(event, metadata?.sdk);
  const envelopeHeaders = createEventEnvelopeHeaders(event, sdkInfo, tunnel, dsn);
  delete event.sdkProcessingMetadata;
  const eventItem = [{ type: eventType }, event];
  return createEnvelope(envelopeHeaders, [eventItem]);
}
function createSpanEnvelope(spans, client) {
  function dscHasRequiredProps(dsc2) {
    return !!dsc2.trace_id && !!dsc2.public_key;
  }
  const dsc = getDynamicSamplingContextFromSpan(spans[0]);
  const dsn = client?.getDsn();
  const tunnel = client?.getOptions().tunnel;
  const headers = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString(),
    ...dscHasRequiredProps(dsc) && { trace: dsc },
    ...!!tunnel && dsn && { dsn: dsnToString(dsn) }
  };
  const { beforeSendSpan, ignoreSpans } = client?.getOptions() || {};
  const filteredSpans = ignoreSpans?.length ? spans.filter((span) => !shouldIgnoreSpan(spanToJSON(span), ignoreSpans)) : spans;
  const droppedSpans = spans.length - filteredSpans.length;
  if (droppedSpans) {
    client?.recordDroppedEvent("before_send", "span", droppedSpans);
  }
  const convertToSpanJSON = beforeSendSpan ? (span) => {
    const spanJson = spanToJSON(span);
    const processedSpan = !isStreamedBeforeSendSpanCallback(beforeSendSpan) ? beforeSendSpan(spanJson) : spanJson;
    if (!processedSpan) {
      showSpanDropWarning();
      return spanJson;
    }
    return processedSpan;
  } : spanToJSON;
  const items = [];
  for (const span of filteredSpans) {
    const spanJson = convertToSpanJSON(span);
    if (spanJson) {
      items.push(createSpanEnvelopeItem(spanJson));
    }
  }
  return createEnvelope(headers, items);
}
function logSpanStart(span) {
  if (!DEBUG_BUILD$3) return;
  const { description = "< unknown name >", op = "< unknown op >", parent_span_id: parentSpanId } = spanToJSON(span);
  const { spanId } = span.spanContext();
  const sampled = spanIsSampled(span);
  const rootSpan = getRootSpan(span);
  const isRootSpan = rootSpan === span;
  const header = `[Tracing] Starting ${sampled ? "sampled" : "unsampled"} ${isRootSpan ? "root " : ""}span`;
  const infoParts = [`op: ${op}`, `name: ${description}`, `ID: ${spanId}`];
  if (parentSpanId) {
    infoParts.push(`parent ID: ${parentSpanId}`);
  }
  if (!isRootSpan) {
    const { op: op2, description: description2 } = spanToJSON(rootSpan);
    infoParts.push(`root ID: ${rootSpan.spanContext().spanId}`);
    if (op2) {
      infoParts.push(`root op: ${op2}`);
    }
    if (description2) {
      infoParts.push(`root description: ${description2}`);
    }
  }
  debug.log(`${header}
  ${infoParts.join("\n  ")}`);
}
function logSpanEnd(span) {
  if (!DEBUG_BUILD$3) return;
  const { description = "< unknown name >", op = "< unknown op >" } = spanToJSON(span);
  const { spanId } = span.spanContext();
  const rootSpan = getRootSpan(span);
  const isRootSpan = rootSpan === span;
  const msg = `[Tracing] Finishing "${op}" ${isRootSpan ? "root " : ""}span "${description}" with ID ${spanId}`;
  debug.log(msg);
}
function timedEventsToMeasurements(events) {
  if (!events || events.length === 0) {
    return void 0;
  }
  const measurements = {};
  events.forEach((event) => {
    const attributes2 = event.attributes || {};
    const unit = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_UNIT];
    const value = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_MEASUREMENT_VALUE];
    if (typeof unit === "string" && typeof value === "number") {
      measurements[event.name] = { value, unit };
    }
  });
  return measurements;
}
function hasSpanStreamingEnabled(client) {
  return client.getOptions().traceLifecycle === "stream";
}
const MAX_SPAN_COUNT$1 = 1e3;
class SentrySpan {
  /** Epoch timestamp in seconds when the span started. */
  /** Epoch timestamp in seconds when the span ended. */
  /** Internal keeper of the status */
  /** The timed events added to this span. */
  /** if true, treat span as a standalone span (not part of a transaction) */
  /**
   * You should never call the constructor manually, always use `Sentry.startSpan()`
   * or other span methods.
   * @internal
   * @hideconstructor
   * @hidden
   */
  constructor(spanContext = {}) {
    this._traceId = spanContext.traceId || generateTraceId();
    this._spanId = spanContext.spanId || generateSpanId();
    this._startTime = spanContext.startTimestamp || timestampInSeconds();
    this._links = spanContext.links;
    this._attributes = {};
    this.setAttributes({
      [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "manual",
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: spanContext.op,
      ...spanContext.attributes
    });
    this._name = spanContext.name;
    if (spanContext.parentSpanId) {
      this._parentSpanId = spanContext.parentSpanId;
    }
    if ("sampled" in spanContext) {
      this._sampled = spanContext.sampled;
    }
    if (spanContext.endTimestamp) {
      this._endTime = spanContext.endTimestamp;
    }
    this._events = [];
    this._isStandaloneSpan = spanContext.isStandalone;
    if (this._endTime) {
      this._onSpanEnded();
    }
  }
  /** @inheritDoc */
  addLink(link) {
    if (this._links) {
      this._links.push(link);
    } else {
      this._links = [link];
    }
    return this;
  }
  /** @inheritDoc */
  addLinks(links) {
    if (this._links) {
      this._links.push(...links);
    } else {
      this._links = links;
    }
    return this;
  }
  /**
   * This should generally not be used,
   * but it is needed for being compliant with the OTEL Span interface.
   *
   * @hidden
   * @internal
   */
  recordException(_exception, _time) {
  }
  /** @inheritdoc */
  spanContext() {
    const { _spanId: spanId, _traceId: traceId, _sampled: sampled } = this;
    return {
      spanId,
      traceId,
      traceFlags: sampled ? TRACE_FLAG_SAMPLED : TRACE_FLAG_NONE
    };
  }
  /** @inheritdoc */
  setAttribute(key, value) {
    if (value === void 0) {
      delete this._attributes[key];
    } else {
      this._attributes[key] = value;
    }
    return this;
  }
  /** @inheritdoc */
  setAttributes(attributes2) {
    Object.keys(attributes2).forEach((key) => this.setAttribute(key, attributes2[key]));
    return this;
  }
  /**
   * This should generally not be used,
   * but we need it for browser tracing where we want to adjust the start time afterwards.
   * USE THIS WITH CAUTION!
   *
   * @hidden
   * @internal
   */
  updateStartTime(timeInput) {
    this._startTime = spanTimeInputToSeconds(timeInput);
  }
  /**
   * @inheritDoc
   */
  setStatus(value) {
    this._status = value;
    return this;
  }
  /**
   * @inheritDoc
   */
  updateName(name) {
    this._name = name;
    this.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_SOURCE, "custom");
    return this;
  }
  /** @inheritdoc */
  end(endTimestamp) {
    if (this._endTime) {
      return;
    }
    this._endTime = spanTimeInputToSeconds(endTimestamp);
    logSpanEnd(this);
    this._onSpanEnded();
  }
  /**
   * Get JSON representation of this span.
   *
   * @hidden
   * @internal This method is purely for internal purposes and should not be used outside
   * of SDK code. If you need to get a JSON representation of a span,
   * use `spanToJSON(span)` instead.
   */
  getSpanJSON() {
    return {
      data: this._attributes,
      description: this._name,
      op: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_OP],
      parent_span_id: this._parentSpanId,
      span_id: this._spanId,
      start_timestamp: this._startTime,
      status: getStatusMessage(this._status),
      timestamp: this._endTime,
      trace_id: this._traceId,
      origin: this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN],
      profile_id: this._attributes[SEMANTIC_ATTRIBUTE_PROFILE_ID],
      exclusive_time: this._attributes[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
      measurements: timedEventsToMeasurements(this._events),
      is_segment: this._isStandaloneSpan && getRootSpan(this) === this || void 0,
      segment_id: this._isStandaloneSpan ? getRootSpan(this).spanContext().spanId : void 0,
      links: convertSpanLinksForEnvelope(this._links)
    };
  }
  /**
   * Get {@link StreamedSpanJSON} representation of this span.
   *
   * @hidden
   * @internal This method is purely for internal purposes and should not be used outside
   * of SDK code. If you need to get a JSON representation of a span,
   * use `spanToStreamedSpanJSON(span)` instead.
   */
  getStreamedSpanJSON() {
    return {
      name: this._name ?? "",
      span_id: this._spanId,
      trace_id: this._traceId,
      parent_span_id: this._parentSpanId,
      start_timestamp: this._startTime,
      // just in case _endTime is not set, we use the start time (i.e. duration 0)
      end_timestamp: this._endTime ?? this._startTime,
      is_segment: this._isStandaloneSpan || this === getRootSpan(this),
      status: getSimpleStatusMessage(this._status),
      attributes: this._attributes,
      links: getStreamedSpanLinks(this._links)
    };
  }
  /** @inheritdoc */
  isRecording() {
    return !this._endTime && !!this._sampled;
  }
  /**
   * @inheritdoc
   */
  addEvent(name, attributesOrStartTime, startTime) {
    DEBUG_BUILD$3 && debug.log("[Tracing] Adding an event to span:", name);
    const time = isSpanTimeInput(attributesOrStartTime) ? attributesOrStartTime : startTime || timestampInSeconds();
    const attributes2 = isSpanTimeInput(attributesOrStartTime) ? {} : attributesOrStartTime || {};
    const event = {
      name,
      time: spanTimeInputToSeconds(time),
      attributes: attributes2
    };
    this._events.push(event);
    return this;
  }
  /**
   * This method should generally not be used,
   * but for now we need a way to publicly check if the `_isStandaloneSpan` flag is set.
   * USE THIS WITH CAUTION!
   * @internal
   * @hidden
   * @experimental
   */
  isStandaloneSpan() {
    return !!this._isStandaloneSpan;
  }
  /** Emit `spanEnd` when the span is ended. */
  _onSpanEnded() {
    const client = getClient();
    if (client) {
      client.emit("spanEnd", this);
      if (!this._isStandaloneSpan) {
        client.emit("afterSpanEnd", this);
      }
    }
    const isSegmentSpan = this._isStandaloneSpan || this === getRootSpan(this);
    if (!isSegmentSpan) {
      return;
    }
    if (this._isStandaloneSpan) {
      if (this._sampled) {
        sendSpanEnvelope(createSpanEnvelope([this], client));
      } else {
        DEBUG_BUILD$3 && debug.log("[Tracing] Discarding standalone span because its trace was not chosen to be sampled.");
        if (client) {
          client.recordDroppedEvent("sample_rate", "span");
        }
      }
      return;
    } else if (client && hasSpanStreamingEnabled(client)) {
      client.emit("afterSegmentSpanEnd", this);
      return;
    }
    const transactionEvent = this._convertSpanToTransaction();
    if (transactionEvent) {
      const scope = getCapturedScopesOnSpan(this).scope || getCurrentScope();
      scope.captureEvent(transactionEvent);
    }
  }
  /**
   * Finish the transaction & prepare the event to send to Sentry.
   */
  _convertSpanToTransaction() {
    if (!isFullFinishedSpan(spanToJSON(this))) {
      return void 0;
    }
    if (!this._name) {
      DEBUG_BUILD$3 && debug.warn("Transaction has no name, falling back to `<unlabeled transaction>`.");
      this._name = "<unlabeled transaction>";
    }
    const { scope: capturedSpanScope, isolationScope: capturedSpanIsolationScope } = getCapturedScopesOnSpan(this);
    const normalizedRequest = capturedSpanScope?.getScopeData().sdkProcessingMetadata?.normalizedRequest;
    if (this._sampled !== true) {
      return void 0;
    }
    const finishedSpans = getSpanDescendants(this).filter((span) => span !== this && !isStandaloneSpan(span));
    const spans = finishedSpans.map((span) => spanToJSON(span)).filter(isFullFinishedSpan);
    const source = this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
    delete this._attributes[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
    spans.forEach((span) => {
      delete span.data[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
    });
    const transaction = {
      contexts: {
        trace: spanToTransactionTraceContext(this)
      },
      spans: (
        // spans.sort() mutates the array, but `spans` is already a copy so we can safely do this here
        // we do not use spans anymore after this point
        spans.length > MAX_SPAN_COUNT$1 ? spans.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT$1) : spans
      ),
      start_timestamp: this._startTime,
      timestamp: this._endTime,
      transaction: this._name,
      type: "transaction",
      sdkProcessingMetadata: {
        capturedSpanScope,
        capturedSpanIsolationScope,
        dynamicSamplingContext: getDynamicSamplingContextFromSpan(this)
      },
      request: normalizedRequest,
      ...source && {
        transaction_info: {
          source
        }
      }
    };
    const measurements = timedEventsToMeasurements(this._events);
    const hasMeasurements = measurements && Object.keys(measurements).length;
    if (hasMeasurements) {
      DEBUG_BUILD$3 && debug.log(
        "[Measurements] Adding measurements to transaction event",
        JSON.stringify(measurements, void 0, 2)
      );
      transaction.measurements = measurements;
    }
    return transaction;
  }
}
function isSpanTimeInput(value) {
  return value && typeof value === "number" || value instanceof Date || Array.isArray(value);
}
function isFullFinishedSpan(input) {
  return !!input.start_timestamp && !!input.timestamp && !!input.span_id && !!input.trace_id;
}
function isStandaloneSpan(span) {
  return span instanceof SentrySpan && span.isStandaloneSpan();
}
function sendSpanEnvelope(envelope) {
  const client = getClient();
  if (!client) {
    return;
  }
  const spanItems = envelope[1];
  if (!spanItems || spanItems.length === 0) {
    client.recordDroppedEvent("before_send", "span");
    return;
  }
  client.sendEnvelope(envelope);
}
function handleCallbackErrors(fn, onError, onFinally = () => {
}, onSuccess = () => {
}) {
  let maybePromiseResult;
  try {
    maybePromiseResult = fn();
  } catch (e) {
    onError(e);
    onFinally();
    throw e;
  }
  return maybeHandlePromiseRejection(maybePromiseResult, onError, onFinally, onSuccess);
}
function maybeHandlePromiseRejection(value, onError, onFinally, onSuccess) {
  if (isThenable(value)) {
    return chainAndCopyPromiseLike(
      value,
      (result) => {
        onFinally();
        onSuccess(result);
      },
      (err) => {
        onError(err);
        onFinally();
      }
    );
  }
  onFinally();
  onSuccess(value);
  return value;
}
function sampleSpan(options, samplingContext, sampleRand) {
  if (!hasSpansEnabled(options)) {
    return [false];
  }
  let localSampleRateWasApplied = void 0;
  let sampleRate;
  if (typeof options.tracesSampler === "function") {
    sampleRate = options.tracesSampler({
      ...samplingContext,
      inheritOrSampleWith: (fallbackSampleRate) => {
        if (typeof samplingContext.parentSampleRate === "number") {
          return samplingContext.parentSampleRate;
        }
        if (typeof samplingContext.parentSampled === "boolean") {
          return Number(samplingContext.parentSampled);
        }
        return fallbackSampleRate;
      }
    });
    localSampleRateWasApplied = true;
  } else if (samplingContext.parentSampled !== void 0) {
    sampleRate = samplingContext.parentSampled;
  } else if (typeof options.tracesSampleRate !== "undefined") {
    sampleRate = options.tracesSampleRate;
    localSampleRateWasApplied = true;
  }
  const parsedSampleRate = parseSampleRate(sampleRate);
  if (parsedSampleRate === void 0) {
    DEBUG_BUILD$3 && debug.warn(
      `[Tracing] Discarding root span because of invalid sample rate. Sample rate must be a boolean or a number between 0 and 1. Got ${JSON.stringify(
        sampleRate
      )} of type ${JSON.stringify(typeof sampleRate)}.`
    );
    return [false];
  }
  if (!parsedSampleRate) {
    DEBUG_BUILD$3 && debug.log(
      `[Tracing] Discarding transaction because ${typeof options.tracesSampler === "function" ? "tracesSampler returned 0 or false" : "a negative sampling decision was inherited or tracesSampleRate is set to 0"}`
    );
    return [false, parsedSampleRate, localSampleRateWasApplied];
  }
  const shouldSample = sampleRand < parsedSampleRate;
  if (!shouldSample) {
    DEBUG_BUILD$3 && debug.log(
      `[Tracing] Discarding transaction because it's not included in the random sample (sampling rate = ${Number(
        sampleRate
      )})`
    );
  }
  return [shouldSample, parsedSampleRate, localSampleRateWasApplied];
}
const SUPPRESS_TRACING_KEY$1 = "__SENTRY_SUPPRESS_TRACING__";
function startInactiveSpan$1(options) {
  const acs = getAcs();
  if (acs.startInactiveSpan) {
    return acs.startInactiveSpan(options);
  }
  const spanArguments = parseSentrySpanArguments(options);
  const { forceTransaction, parentSpan: customParentSpan } = options;
  const wrapper = options.scope ? (callback) => withScope(options.scope, callback) : customParentSpan !== void 0 ? (callback) => withActiveSpan$1(customParentSpan, callback) : (callback) => callback();
  return wrapper(() => {
    const scope = getCurrentScope();
    const parentSpan = getParentSpan(scope, customParentSpan);
    const client = getClient();
    const missingRequiredParent = options.onlyIfParent && !parentSpan;
    if (missingRequiredParent) {
      client?.recordDroppedEvent("no_parent_span", "span");
      return new SentryNonRecordingSpan();
    }
    return createChildOrRootSpan({
      parentSpan,
      spanArguments,
      forceTransaction,
      scope
    });
  });
}
function withActiveSpan$1(span, callback) {
  const acs = getAcs();
  if (acs.withActiveSpan) {
    return acs.withActiveSpan(span, callback);
  }
  return withScope((scope) => {
    _setSpanForScope(scope, span || void 0);
    return callback(scope);
  });
}
function createChildOrRootSpan({
  parentSpan,
  spanArguments,
  forceTransaction,
  scope
}) {
  if (!hasSpansEnabled()) {
    const span2 = new SentryNonRecordingSpan();
    if (forceTransaction || !parentSpan) {
      const dsc = {
        sampled: "false",
        sample_rate: "0",
        transaction: spanArguments.name,
        ...getDynamicSamplingContextFromSpan(span2)
      };
      freezeDscOnSpan(span2, dsc);
    }
    return span2;
  }
  const client = getClient();
  if (_shouldIgnoreStreamedSpan(client, spanArguments)) {
    if (!_isTracingSuppressed(scope)) {
      client?.recordDroppedEvent("ignored", "span");
    }
    return new SentryNonRecordingSpan({
      dropReason: "ignored",
      traceId: parentSpan?.spanContext().traceId ?? scope.getPropagationContext().traceId
    });
  }
  const isolationScope = getIsolationScope();
  let span;
  if (parentSpan && !forceTransaction) {
    span = _startChildSpan(parentSpan, scope, spanArguments);
    addChildSpanToSpan(parentSpan, span);
  } else if (parentSpan) {
    const dsc = getDynamicSamplingContextFromSpan(parentSpan);
    const { traceId, spanId: parentSpanId } = parentSpan.spanContext();
    const parentSampled = spanIsSampled(parentSpan);
    span = _startRootSpan(
      {
        traceId,
        parentSpanId,
        ...spanArguments
      },
      scope,
      parentSampled
    );
    freezeDscOnSpan(span, dsc);
  } else {
    const {
      traceId,
      dsc,
      parentSpanId,
      sampled: parentSampled
    } = {
      ...isolationScope.getPropagationContext(),
      ...scope.getPropagationContext()
    };
    span = _startRootSpan(
      {
        traceId,
        parentSpanId,
        ...spanArguments
      },
      scope,
      parentSampled
    );
    if (dsc) {
      freezeDscOnSpan(span, dsc);
    }
  }
  logSpanStart(span);
  setCapturedScopesOnSpan(span, scope, isolationScope);
  return span;
}
function parseSentrySpanArguments(options) {
  const exp = options.experimental || {};
  const initialCtx = {
    isStandalone: exp.standalone,
    ...options
  };
  if (options.startTime) {
    const ctx = { ...initialCtx };
    ctx.startTimestamp = spanTimeInputToSeconds(options.startTime);
    delete ctx.startTime;
    return ctx;
  }
  return initialCtx;
}
function getAcs() {
  const carrier = getMainCarrier();
  return getAsyncContextStrategy(carrier);
}
function _startRootSpan(spanArguments, scope, parentSampled) {
  const client = getClient();
  const options = client?.getOptions() || {};
  const { name = "" } = spanArguments;
  const mutableSpanSamplingData = { spanAttributes: { ...spanArguments.attributes }, spanName: name, parentSampled };
  client?.emit("beforeSampling", mutableSpanSamplingData, { decision: false });
  const finalParentSampled = mutableSpanSamplingData.parentSampled ?? parentSampled;
  const finalAttributes = mutableSpanSamplingData.spanAttributes;
  const currentPropagationContext = scope.getPropagationContext();
  const isTracingSuppressed2 = _isTracingSuppressed(scope);
  const [sampled, sampleRate, localSampleRateWasApplied] = isTracingSuppressed2 ? [false] : sampleSpan(
    options,
    {
      name,
      parentSampled: finalParentSampled,
      attributes: finalAttributes,
      parentSampleRate: parseSampleRate(currentPropagationContext.dsc?.sample_rate)
    },
    currentPropagationContext.sampleRand
  );
  const rootSpan = new SentrySpan({
    ...spanArguments,
    attributes: {
      [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: "custom",
      [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate !== void 0 && localSampleRateWasApplied ? sampleRate : void 0,
      ...finalAttributes
    },
    sampled
  });
  if (!sampled && client && !isTracingSuppressed2) {
    DEBUG_BUILD$3 && debug.log("[Tracing] Discarding root span because its trace was not chosen to be sampled.");
    client.recordDroppedEvent("sample_rate", hasSpanStreamingEnabled(client) ? "span" : "transaction");
  }
  if (client) {
    client.emit("spanStart", rootSpan);
  }
  return rootSpan;
}
function _startChildSpan(parentSpan, scope, spanArguments) {
  const { spanId, traceId } = parentSpan.spanContext();
  const isTracingSuppressed2 = _isTracingSuppressed(scope);
  const sampled = isTracingSuppressed2 ? false : spanIsSampled(parentSpan);
  const childSpan = sampled ? new SentrySpan({
    ...spanArguments,
    parentSpanId: spanId,
    traceId,
    sampled
  }) : new SentryNonRecordingSpan({ traceId });
  addChildSpanToSpan(parentSpan, childSpan);
  const client = getClient();
  if (!client) {
    return childSpan;
  }
  if (hasSpanStreamingEnabled(client) && childSpan instanceof SentryNonRecordingSpan) {
    if (parentSpan instanceof SentryNonRecordingSpan && parentSpan.dropReason) {
      childSpan.dropReason = parentSpan.dropReason;
      client.recordDroppedEvent(parentSpan.dropReason, "span");
    } else if (!isTracingSuppressed2) {
      childSpan.dropReason = "sample_rate";
      client.recordDroppedEvent("sample_rate", "span");
    }
  }
  client.emit("spanStart", childSpan);
  if (spanArguments.endTimestamp) {
    client.emit("spanEnd", childSpan);
    client.emit("afterSpanEnd", childSpan);
  }
  return childSpan;
}
function getParentSpan(scope, customParentSpan) {
  if (customParentSpan) {
    return customParentSpan;
  }
  if (customParentSpan === null) {
    return void 0;
  }
  const span = _getSpanForScope(scope);
  if (!span) {
    return void 0;
  }
  const client = getClient();
  const options = client ? client.getOptions() : {};
  if (options.parentSpanIsAlwaysRootSpan) {
    return getRootSpan(span);
  }
  return span;
}
function _shouldIgnoreStreamedSpan(client, spanArguments) {
  const ignoreSpans = client?.getOptions().ignoreSpans;
  if (!client || !hasSpanStreamingEnabled(client) || !ignoreSpans?.length) {
    return false;
  }
  return shouldIgnoreSpan(
    {
      description: spanArguments.name || "",
      op: spanArguments.attributes?.[SEMANTIC_ATTRIBUTE_SENTRY_OP] || spanArguments.op
    },
    ignoreSpans
  );
}
function _isTracingSuppressed(scope) {
  return scope.getScopeData().sdkProcessingMetadata[SUPPRESS_TRACING_KEY$1] === true;
}
function applyScopeDataToEvent(event, data) {
  const { fingerprint, span, breadcrumbs, sdkProcessingMetadata } = data;
  applyDataToEvent(event, data);
  if (span) {
    applySpanToEvent(event, span);
  }
  applyFingerprintToEvent(event, fingerprint);
  applyBreadcrumbsToEvent(event, breadcrumbs);
  applySdkMetadataToEvent(event, sdkProcessingMetadata);
}
function mergeScopeData(data, mergeData) {
  const {
    extra,
    tags,
    attributes: attributes2,
    user,
    contexts,
    level,
    sdkProcessingMetadata,
    breadcrumbs,
    fingerprint,
    eventProcessors,
    attachments,
    propagationContext,
    transactionName,
    span
  } = mergeData;
  mergeAndOverwriteScopeData(data, "extra", extra);
  mergeAndOverwriteScopeData(data, "tags", tags);
  mergeAndOverwriteScopeData(data, "attributes", attributes2);
  mergeAndOverwriteScopeData(data, "user", user);
  mergeAndOverwriteScopeData(data, "contexts", contexts);
  data.sdkProcessingMetadata = merge$1(data.sdkProcessingMetadata, sdkProcessingMetadata, 2);
  if (level) {
    data.level = level;
  }
  if (transactionName) {
    data.transactionName = transactionName;
  }
  if (span) {
    data.span = span;
  }
  if (breadcrumbs.length) {
    data.breadcrumbs = [...data.breadcrumbs, ...breadcrumbs];
  }
  if (fingerprint.length) {
    data.fingerprint = [...data.fingerprint, ...fingerprint];
  }
  if (eventProcessors.length) {
    data.eventProcessors = [...data.eventProcessors, ...eventProcessors];
  }
  if (attachments.length) {
    data.attachments = [...data.attachments, ...attachments];
  }
  data.propagationContext = { ...data.propagationContext, ...propagationContext };
}
function mergeAndOverwriteScopeData(data, prop, mergeVal) {
  data[prop] = merge$1(data[prop], mergeVal, 1);
}
function getCombinedScopeData(isolationScope, currentScope) {
  const scopeData = getGlobalScope().getScopeData();
  isolationScope && mergeScopeData(scopeData, isolationScope.getScopeData());
  currentScope && mergeScopeData(scopeData, currentScope.getScopeData());
  return scopeData;
}
function applyDataToEvent(event, data) {
  const { extra, tags, user, contexts, level, transactionName } = data;
  if (Object.keys(extra).length) {
    event.extra = { ...extra, ...event.extra };
  }
  if (Object.keys(tags).length) {
    event.tags = { ...tags, ...event.tags };
  }
  if (Object.keys(user).length) {
    event.user = { ...user, ...event.user };
  }
  if (Object.keys(contexts).length) {
    event.contexts = { ...contexts, ...event.contexts };
  }
  if (level) {
    event.level = level;
  }
  if (transactionName && event.type !== "transaction") {
    event.transaction = transactionName;
  }
}
function applyBreadcrumbsToEvent(event, breadcrumbs) {
  const mergedBreadcrumbs = [...event.breadcrumbs || [], ...breadcrumbs];
  event.breadcrumbs = mergedBreadcrumbs.length ? mergedBreadcrumbs : void 0;
}
function applySdkMetadataToEvent(event, sdkProcessingMetadata) {
  event.sdkProcessingMetadata = {
    ...event.sdkProcessingMetadata,
    ...sdkProcessingMetadata
  };
}
function applySpanToEvent(event, span) {
  event.contexts = {
    trace: spanToTraceContext(span),
    ...event.contexts
  };
  event.sdkProcessingMetadata = {
    dynamicSamplingContext: getDynamicSamplingContextFromSpan(span),
    ...event.sdkProcessingMetadata
  };
  const rootSpan = getRootSpan(span);
  const transactionName = spanToJSON(rootSpan).description;
  if (transactionName && !event.transaction && event.type === "transaction") {
    event.transaction = transactionName;
  }
}
function applyFingerprintToEvent(event, fingerprint) {
  event.fingerprint = event.fingerprint ? Array.isArray(event.fingerprint) ? event.fingerprint : [event.fingerprint] : [];
  if (fingerprint) {
    event.fingerprint = event.fingerprint.concat(fingerprint);
  }
  if (!event.fingerprint.length) {
    delete event.fingerprint;
  }
}
const STATE_PENDING = 0;
const STATE_RESOLVED = 1;
const STATE_REJECTED = 2;
function resolvedSyncPromise(value) {
  return new SyncPromise((resolve2) => {
    resolve2(value);
  });
}
function rejectedSyncPromise(reason) {
  return new SyncPromise((_, reject) => {
    reject(reason);
  });
}
class SyncPromise {
  constructor(executor) {
    this._state = STATE_PENDING;
    this._handlers = [];
    this._runExecutor(executor);
  }
  /** @inheritdoc */
  then(onfulfilled, onrejected) {
    return new SyncPromise((resolve2, reject) => {
      this._handlers.push([
        false,
        (result) => {
          if (!onfulfilled) {
            resolve2(result);
          } else {
            try {
              resolve2(onfulfilled(result));
            } catch (e) {
              reject(e);
            }
          }
        },
        (reason) => {
          if (!onrejected) {
            reject(reason);
          } else {
            try {
              resolve2(onrejected(reason));
            } catch (e) {
              reject(e);
            }
          }
        }
      ]);
      this._executeHandlers();
    });
  }
  /** @inheritdoc */
  catch(onrejected) {
    return this.then((val) => val, onrejected);
  }
  /** @inheritdoc */
  finally(onfinally) {
    return new SyncPromise((resolve2, reject) => {
      let val;
      let isRejected;
      return this.then(
        (value) => {
          isRejected = false;
          val = value;
          if (onfinally) {
            onfinally();
          }
        },
        (reason) => {
          isRejected = true;
          val = reason;
          if (onfinally) {
            onfinally();
          }
        }
      ).then(() => {
        if (isRejected) {
          reject(val);
          return;
        }
        resolve2(val);
      });
    });
  }
  /** Excute the resolve/reject handlers. */
  _executeHandlers() {
    if (this._state === STATE_PENDING) {
      return;
    }
    const cachedHandlers = this._handlers.slice();
    this._handlers = [];
    cachedHandlers.forEach((handler) => {
      if (handler[0]) {
        return;
      }
      if (this._state === STATE_RESOLVED) {
        handler[1](this._value);
      }
      if (this._state === STATE_REJECTED) {
        handler[2](this._value);
      }
      handler[0] = true;
    });
  }
  /** Run the executor for the SyncPromise. */
  _runExecutor(executor) {
    const setResult = (state, value) => {
      if (this._state !== STATE_PENDING) {
        return;
      }
      if (isThenable(value)) {
        void value.then(resolve2, reject);
        return;
      }
      this._state = state;
      this._value = value;
      this._executeHandlers();
    };
    const resolve2 = (value) => {
      setResult(STATE_RESOLVED, value);
    };
    const reject = (reason) => {
      setResult(STATE_REJECTED, reason);
    };
    try {
      executor(resolve2, reject);
    } catch (e) {
      reject(e);
    }
  }
}
function notifyEventProcessors(processors, event, hint, index = 0) {
  try {
    const result = _notifyEventProcessors(event, hint, processors, index);
    return isThenable(result) ? result : resolvedSyncPromise(result);
  } catch (error2) {
    return rejectedSyncPromise(error2);
  }
}
function _notifyEventProcessors(event, hint, processors, index) {
  const processor = processors[index];
  if (!event || !processor) {
    return event;
  }
  const result = processor({ ...event }, hint);
  DEBUG_BUILD$3 && result === null && debug.log(`Event processor "${processor.id || "?"}" dropped event`);
  if (isThenable(result)) {
    return result.then((final) => _notifyEventProcessors(final, hint, processors, index + 1));
  }
  return _notifyEventProcessors(result, hint, processors, index + 1);
}
let parsedStackResults;
let lastSentryKeysCount;
let lastNativeKeysCount;
let cachedFilenameDebugIds;
function getFilenameToDebugIdMap(stackParser) {
  const sentryDebugIdMap = GLOBAL_OBJ._sentryDebugIds;
  const nativeDebugIdMap = GLOBAL_OBJ._debugIds;
  if (!sentryDebugIdMap && !nativeDebugIdMap) {
    return {};
  }
  const sentryDebugIdKeys = sentryDebugIdMap ? Object.keys(sentryDebugIdMap) : [];
  const nativeDebugIdKeys = nativeDebugIdMap ? Object.keys(nativeDebugIdMap) : [];
  if (cachedFilenameDebugIds && sentryDebugIdKeys.length === lastSentryKeysCount && nativeDebugIdKeys.length === lastNativeKeysCount) {
    return cachedFilenameDebugIds;
  }
  lastSentryKeysCount = sentryDebugIdKeys.length;
  lastNativeKeysCount = nativeDebugIdKeys.length;
  cachedFilenameDebugIds = {};
  if (!parsedStackResults) {
    parsedStackResults = {};
  }
  const processDebugIds = (debugIdKeys, debugIdMap) => {
    for (const key of debugIdKeys) {
      const debugId = debugIdMap[key];
      const result = parsedStackResults?.[key];
      if (result && cachedFilenameDebugIds && debugId) {
        cachedFilenameDebugIds[result[0]] = debugId;
        if (parsedStackResults) {
          parsedStackResults[key] = [result[0], debugId];
        }
      } else if (debugId) {
        const parsedStack = stackParser(key);
        for (let i = parsedStack.length - 1; i >= 0; i--) {
          const stackFrame = parsedStack[i];
          const filename = stackFrame?.filename;
          if (filename && cachedFilenameDebugIds && parsedStackResults) {
            cachedFilenameDebugIds[filename] = debugId;
            parsedStackResults[key] = [filename, debugId];
            break;
          }
        }
      }
    }
  };
  if (sentryDebugIdMap) {
    processDebugIds(sentryDebugIdKeys, sentryDebugIdMap);
  }
  if (nativeDebugIdMap) {
    processDebugIds(nativeDebugIdKeys, nativeDebugIdMap);
  }
  return cachedFilenameDebugIds;
}
function prepareEvent(options, event, hint, scope, client, isolationScope) {
  const { normalizeDepth = 3, normalizeMaxBreadth = 1e3 } = options;
  const prepared = {
    ...event,
    event_id: event.event_id || hint.event_id || uuid4(),
    timestamp: event.timestamp || dateTimestampInSeconds()
  };
  const integrations = hint.integrations || options.integrations.map((i) => i.name);
  applyClientOptions(prepared, options);
  applyIntegrationsMetadata(prepared, integrations);
  if (client) {
    client.emit("applyFrameMetadata", event);
  }
  if (event.type === void 0) {
    applyDebugIds(prepared, options.stackParser);
  }
  const finalScope = getFinalScope(scope, hint.captureContext);
  if (hint.mechanism) {
    addExceptionMechanism(prepared, hint.mechanism);
  }
  const clientEventProcessors = client ? client.getEventProcessors() : [];
  const data = getCombinedScopeData(isolationScope, finalScope);
  const attachments = [...hint.attachments || [], ...data.attachments];
  if (attachments.length) {
    hint.attachments = attachments;
  }
  applyScopeDataToEvent(prepared, data);
  const eventProcessors = [
    ...clientEventProcessors,
    // Run scope event processors _after_ all other processors
    ...data.eventProcessors
  ];
  const isInternalException = hint.data && hint.data.__sentry__ === true;
  const result = isInternalException ? resolvedSyncPromise(prepared) : notifyEventProcessors(eventProcessors, prepared, hint);
  return result.then((evt) => {
    if (evt) {
      applyDebugMeta(evt);
    }
    if (typeof normalizeDepth === "number" && normalizeDepth > 0) {
      return normalizeEvent(evt, normalizeDepth, normalizeMaxBreadth);
    }
    return evt;
  });
}
function applyClientOptions(event, options) {
  const { environment, release, dist, maxValueLength } = options;
  event.environment = event.environment || environment || DEFAULT_ENVIRONMENT;
  if (!event.release && release) {
    event.release = release;
  }
  if (!event.dist && dist) {
    event.dist = dist;
  }
  const request = event.request;
  if (request?.url && maxValueLength) {
    request.url = truncate(request.url, maxValueLength);
  }
  if (maxValueLength) {
    event.exception?.values?.forEach((exception) => {
      if (exception.value) {
        exception.value = truncate(exception.value, maxValueLength);
      }
    });
  }
}
function applyDebugIds(event, stackParser) {
  const filenameDebugIdMap = getFilenameToDebugIdMap(stackParser);
  event.exception?.values?.forEach((exception) => {
    exception.stacktrace?.frames?.forEach((frame) => {
      if (frame.filename) {
        frame.debug_id = filenameDebugIdMap[frame.filename];
      }
    });
  });
}
function applyDebugMeta(event) {
  const filenameDebugIdMap = {};
  event.exception?.values?.forEach((exception) => {
    exception.stacktrace?.frames?.forEach((frame) => {
      if (frame.debug_id) {
        if (frame.abs_path) {
          filenameDebugIdMap[frame.abs_path] = frame.debug_id;
        } else if (frame.filename) {
          filenameDebugIdMap[frame.filename] = frame.debug_id;
        }
        delete frame.debug_id;
      }
    });
  });
  if (Object.keys(filenameDebugIdMap).length === 0) {
    return;
  }
  event.debug_meta = event.debug_meta || {};
  event.debug_meta.images = event.debug_meta.images || [];
  const images = event.debug_meta.images;
  Object.entries(filenameDebugIdMap).forEach(([filename, debug_id]) => {
    images.push({
      type: "sourcemap",
      code_file: filename,
      debug_id
    });
  });
}
function applyIntegrationsMetadata(event, integrationNames) {
  if (integrationNames.length > 0) {
    event.sdk = event.sdk || {};
    event.sdk.integrations = [...event.sdk.integrations || [], ...integrationNames];
  }
}
function normalizeEvent(event, depth, maxBreadth) {
  if (!event) {
    return null;
  }
  const normalized = {
    ...event,
    ...event.breadcrumbs && {
      breadcrumbs: event.breadcrumbs.map((b) => ({
        ...b,
        ...b.data && {
          data: normalize(b.data, depth, maxBreadth)
        }
      }))
    },
    ...event.user && {
      user: normalize(event.user, depth, maxBreadth)
    },
    ...event.contexts && {
      contexts: normalize(event.contexts, depth, maxBreadth)
    },
    ...event.extra && {
      extra: normalize(event.extra, depth, maxBreadth)
    }
  };
  if (event.contexts?.trace && normalized.contexts) {
    normalized.contexts.trace = event.contexts.trace;
    if (event.contexts.trace.data) {
      normalized.contexts.trace.data = normalize(event.contexts.trace.data, depth, maxBreadth);
    }
  }
  if (event.spans) {
    normalized.spans = event.spans.map((span) => {
      return {
        ...span,
        ...span.data && {
          data: normalize(span.data, depth, maxBreadth)
        }
      };
    });
  }
  if (event.contexts?.flags && normalized.contexts) {
    normalized.contexts.flags = normalize(event.contexts.flags, 3, maxBreadth);
  }
  return normalized;
}
function getFinalScope(scope, captureContext) {
  if (!captureContext) {
    return scope;
  }
  const finalScope = scope ? scope.clone() : new Scope();
  finalScope.update(captureContext);
  return finalScope;
}
function parseEventHintOrCaptureContext(hint) {
  if (!hint) {
    return void 0;
  }
  if (hintIsScopeOrFunction(hint)) {
    return { captureContext: hint };
  }
  if (hintIsScopeContext(hint)) {
    return {
      captureContext: hint
    };
  }
  return hint;
}
function hintIsScopeOrFunction(hint) {
  return hint instanceof Scope || typeof hint === "function";
}
const captureContextKeys = [
  "user",
  "level",
  "extra",
  "contexts",
  "tags",
  "fingerprint",
  "propagationContext"
];
function hintIsScopeContext(hint) {
  return Object.keys(hint).some((key) => captureContextKeys.includes(key));
}
function captureException(exception, hint) {
  return getCurrentScope().captureException(exception, parseEventHintOrCaptureContext(hint));
}
function captureMessage(message, captureContext) {
  const level = typeof captureContext === "string" ? captureContext : void 0;
  const hint = typeof captureContext !== "string" ? { captureContext } : void 0;
  return getCurrentScope().captureMessage(message, level, hint);
}
function captureEvent(event, hint) {
  return getCurrentScope().captureEvent(event, hint);
}
async function flush(timeout) {
  const client = getClient();
  if (client) {
    return client.flush(timeout);
  }
  DEBUG_BUILD$3 && debug.warn("Cannot flush events. No client defined.");
  return Promise.resolve(false);
}
function isEnabled() {
  const client = getClient();
  return client?.getOptions().enabled !== false && !!client?.getTransport();
}
function startSession$1(context2) {
  const isolationScope = getIsolationScope();
  const { user } = getCombinedScopeData(isolationScope, getCurrentScope());
  const { userAgent } = GLOBAL_OBJ.navigator || {};
  const session2 = makeSession({
    user,
    ...userAgent && { userAgent },
    ...context2
  });
  const currentSession = isolationScope.getSession();
  if (currentSession?.status === "ok") {
    updateSession(currentSession, { status: "exited" });
  }
  endSession$1();
  isolationScope.setSession(session2);
  return session2;
}
function endSession$1() {
  const isolationScope = getIsolationScope();
  const currentScope = getCurrentScope();
  const session2 = currentScope.getSession() || isolationScope.getSession();
  if (session2) {
    closeSession(session2);
  }
  _sendSessionUpdate();
  isolationScope.setSession();
}
function _sendSessionUpdate() {
  const isolationScope = getIsolationScope();
  const client = getClient();
  const session2 = isolationScope.getSession();
  if (session2 && client) {
    client.captureSession(session2);
  }
}
function captureSession(end = false) {
  if (end) {
    endSession$1();
    return;
  }
  _sendSessionUpdate();
}
const SENTRY_API_VERSION = "7";
function getBaseApiEndpoint(dsn) {
  const protocol2 = dsn.protocol ? `${dsn.protocol}:` : "";
  const port = dsn.port ? `:${dsn.port}` : "";
  return `${protocol2}//${dsn.host}${port}${dsn.path ? `/${dsn.path}` : ""}/api/`;
}
function _getIngestEndpoint(dsn) {
  return `${getBaseApiEndpoint(dsn)}${dsn.projectId}/envelope/`;
}
function _encodedAuth(dsn, sdkInfo) {
  const params = {
    sentry_version: SENTRY_API_VERSION
  };
  if (dsn.publicKey) {
    params.sentry_key = dsn.publicKey;
  }
  if (sdkInfo) {
    params.sentry_client = `${sdkInfo.name}/${sdkInfo.version}`;
  }
  return new URLSearchParams(params).toString();
}
function getEnvelopeEndpointWithUrlEncodedAuth(dsn, tunnel, sdkInfo) {
  return tunnel ? tunnel : `${_getIngestEndpoint(dsn)}?${_encodedAuth(dsn, sdkInfo)}`;
}
const installedIntegrations = [];
function filterDuplicates(integrations) {
  const integrationsByName = {};
  integrations.forEach((currentInstance) => {
    const { name } = currentInstance;
    const existingInstance = integrationsByName[name];
    if (existingInstance && !existingInstance.isDefaultInstance && currentInstance.isDefaultInstance) {
      return;
    }
    integrationsByName[name] = currentInstance;
  });
  return Object.values(integrationsByName);
}
function getIntegrationsToSetup(options) {
  const defaultIntegrations = options.defaultIntegrations || [];
  const userIntegrations = options.integrations;
  defaultIntegrations.forEach((integration) => {
    integration.isDefaultInstance = true;
  });
  let integrations;
  if (Array.isArray(userIntegrations)) {
    integrations = [...defaultIntegrations, ...userIntegrations];
  } else if (typeof userIntegrations === "function") {
    const resolvedUserIntegrations = userIntegrations(defaultIntegrations);
    integrations = Array.isArray(resolvedUserIntegrations) ? resolvedUserIntegrations : [resolvedUserIntegrations];
  } else {
    integrations = defaultIntegrations;
  }
  return filterDuplicates(integrations);
}
function setupIntegrations(client, integrations) {
  const integrationIndex = {};
  integrations.forEach((integration) => {
    if (integration?.beforeSetup) {
      integration.beforeSetup(client);
    }
  });
  integrations.forEach((integration) => {
    if (integration) {
      setupIntegration(client, integration, integrationIndex);
    }
  });
  return integrationIndex;
}
function afterSetupIntegrations(client, integrations) {
  for (const integration of integrations) {
    if (integration?.afterAllSetup) {
      integration.afterAllSetup(client);
    }
  }
}
function setupIntegration(client, integration, integrationIndex) {
  if (integrationIndex[integration.name]) {
    DEBUG_BUILD$3 && debug.log(`Integration skipped because it was already installed: ${integration.name}`);
    return;
  }
  integrationIndex[integration.name] = integration;
  if (!installedIntegrations.includes(integration.name) && typeof integration.setupOnce === "function") {
    integration.setupOnce();
    installedIntegrations.push(integration.name);
  }
  if (integration.setup && typeof integration.setup === "function") {
    integration.setup(client);
  }
  if (typeof integration.preprocessEvent === "function") {
    const callback = integration.preprocessEvent.bind(integration);
    client.on("preprocessEvent", (event, hint) => callback(event, hint, client));
  }
  if (typeof integration.processEvent === "function") {
    const callback = integration.processEvent.bind(integration);
    const processor = Object.assign((event, hint) => callback(event, hint, client), {
      id: integration.name
    });
    client.addEventProcessor(processor);
  }
  ["processSpan", "processSegmentSpan"].forEach((hook) => {
    const callback = integration[hook];
    if (typeof callback === "function") {
      client.on(hook, (span) => callback.call(integration, span, client));
    }
  });
  DEBUG_BUILD$3 && debug.log(`Integration installed: ${integration.name}`);
}
function defineIntegration(fn) {
  return fn;
}
const SEQUENCE_ATTR_KEY = "sentry.timestamp.sequence";
let _sequenceNumber = 0;
let _previousTimestampMs;
function getSequenceAttribute(timestampInSeconds2) {
  const nowMs = Math.floor(timestampInSeconds2 * 1e3);
  if (_previousTimestampMs !== void 0 && nowMs !== _previousTimestampMs) {
    _sequenceNumber = 0;
  }
  const value = _sequenceNumber;
  _sequenceNumber++;
  _previousTimestampMs = nowMs;
  return {
    key: SEQUENCE_ATTR_KEY,
    value: { value, type: "integer" }
  };
}
function _getTraceInfoFromScope(client, scope) {
  if (!scope) {
    return [void 0, void 0];
  }
  return withScope(scope, () => {
    const span = getActiveSpan$1();
    const traceContext = span ? spanToTraceContext(span) : getTraceContextFromScope(scope);
    const dynamicSamplingContext = span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope);
    return [dynamicSamplingContext, traceContext];
  });
}
const SEVERITY_TEXT_TO_SEVERITY_NUMBER = {
  trace: 1,
  debug: 5,
  info: 9,
  warn: 13,
  error: 17,
  fatal: 21
};
function createLogContainerEnvelopeItem(items) {
  return [
    {
      type: "log",
      item_count: items.length,
      content_type: "application/vnd.sentry.items.log+json"
    },
    {
      items
    }
  ];
}
function createLogEnvelope(logs2, metadata, tunnel, dsn) {
  const headers = {};
  if (metadata?.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }
  return createEnvelope(headers, [createLogContainerEnvelopeItem(logs2)]);
}
const MAX_LOG_BUFFER_SIZE = 100;
function setLogAttribute(logAttributes, key, value, setEvenIfPresent = true) {
  if (value && (!logAttributes[key] || setEvenIfPresent)) {
    logAttributes[key] = value;
  }
}
function _INTERNAL_captureSerializedLog(client, serializedLog) {
  const bufferMap = _getBufferMap$1();
  const logBuffer = _INTERNAL_getLogBuffer(client);
  if (logBuffer === void 0) {
    bufferMap.set(client, [serializedLog]);
  } else {
    if (logBuffer.length >= MAX_LOG_BUFFER_SIZE) {
      _INTERNAL_flushLogsBuffer(client, logBuffer);
      bufferMap.set(client, [serializedLog]);
    } else {
      bufferMap.set(client, [...logBuffer, serializedLog]);
    }
  }
}
function _INTERNAL_captureLog(beforeLog, currentScope = getCurrentScope(), captureSerializedLog = _INTERNAL_captureSerializedLog) {
  const client = currentScope?.getClient() ?? getClient();
  if (!client) {
    DEBUG_BUILD$3 && debug.warn("No client available to capture log.");
    return;
  }
  const { release, environment, enableLogs = false, beforeSendLog } = client.getOptions();
  if (!enableLogs) {
    DEBUG_BUILD$3 && debug.warn("logging option not enabled, log will not be captured.");
    return;
  }
  const [, traceContext] = _getTraceInfoFromScope(client, currentScope);
  const processedLogAttributes = {
    ...beforeLog.attributes
  };
  const {
    user: { id, email, username },
    attributes: scopeAttributes = {}
  } = getCombinedScopeData(getIsolationScope(), currentScope);
  setLogAttribute(processedLogAttributes, "user.id", id, false);
  setLogAttribute(processedLogAttributes, "user.email", email, false);
  setLogAttribute(processedLogAttributes, "user.name", username, false);
  setLogAttribute(processedLogAttributes, "sentry.release", release);
  setLogAttribute(processedLogAttributes, "sentry.environment", environment);
  const { name, version: version2 } = client.getSdkMetadata()?.sdk ?? {};
  setLogAttribute(processedLogAttributes, "sentry.sdk.name", name);
  setLogAttribute(processedLogAttributes, "sentry.sdk.version", version2);
  const replay = client.getIntegrationByName("Replay");
  const replayId = replay?.getReplayId(true);
  setLogAttribute(processedLogAttributes, "sentry.replay_id", replayId);
  if (replayId && replay?.getRecordingMode() === "buffer") {
    setLogAttribute(processedLogAttributes, "sentry._internal.replay_is_buffering", true);
  }
  const beforeLogMessage = beforeLog.message;
  if (isParameterizedString(beforeLogMessage)) {
    const { __sentry_template_string__, __sentry_template_values__ = [] } = beforeLogMessage;
    if (__sentry_template_values__?.length) {
      processedLogAttributes["sentry.message.template"] = __sentry_template_string__;
    }
    __sentry_template_values__.forEach((param, index) => {
      processedLogAttributes[`sentry.message.parameter.${index}`] = param;
    });
  }
  const span = _getSpanForScope(currentScope);
  setLogAttribute(processedLogAttributes, "sentry.trace.parent_span_id", span?.spanContext().spanId);
  const processedLog = { ...beforeLog, attributes: processedLogAttributes };
  client.emit("beforeCaptureLog", processedLog);
  const log2 = beforeSendLog ? consoleSandbox(() => beforeSendLog(processedLog)) : processedLog;
  if (!log2) {
    client.recordDroppedEvent("before_send", "log_item", 1);
    DEBUG_BUILD$3 && debug.warn("beforeSendLog returned null, log will not be captured.");
    return;
  }
  const { level, message, attributes: logAttributes = {}, severityNumber } = log2;
  const timestamp = timestampInSeconds();
  const sequenceAttr = getSequenceAttribute(timestamp);
  const serializedLog = {
    timestamp,
    level,
    body: message,
    trace_id: traceContext?.trace_id,
    severity_number: severityNumber ?? SEVERITY_TEXT_TO_SEVERITY_NUMBER[level],
    attributes: {
      ...serializeAttributes(scopeAttributes),
      ...serializeAttributes(logAttributes, true),
      [sequenceAttr.key]: sequenceAttr.value
    }
  };
  captureSerializedLog(client, serializedLog);
  client.emit("afterCaptureLog", log2);
}
function _INTERNAL_flushLogsBuffer(client, maybeLogBuffer) {
  const logBuffer = maybeLogBuffer ?? _INTERNAL_getLogBuffer(client) ?? [];
  if (logBuffer.length === 0) {
    return;
  }
  const clientOptions = client.getOptions();
  const envelope = createLogEnvelope(logBuffer, clientOptions._metadata, clientOptions.tunnel, client.getDsn());
  _getBufferMap$1().set(client, []);
  client.emit("flushLogs");
  client.sendEnvelope(envelope);
}
function _INTERNAL_getLogBuffer(client) {
  return _getBufferMap$1().get(client);
}
function _getBufferMap$1() {
  return getGlobalSingleton("clientToLogBufferMap", () => /* @__PURE__ */ new WeakMap());
}
function createMetricContainerEnvelopeItem(items) {
  return [
    {
      type: "trace_metric",
      item_count: items.length,
      content_type: "application/vnd.sentry.items.trace-metric+json"
    },
    {
      items
    }
  ];
}
function createMetricEnvelope(metrics2, metadata, tunnel, dsn) {
  const headers = {};
  if (metadata?.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }
  return createEnvelope(headers, [createMetricContainerEnvelopeItem(metrics2)]);
}
const MAX_METRIC_BUFFER_SIZE = 1e3;
function _INTERNAL_captureSerializedMetric(client, serializedMetric) {
  const bufferMap = _getBufferMap();
  const metricBuffer = _INTERNAL_getMetricBuffer(client);
  if (metricBuffer === void 0) {
    bufferMap.set(client, [serializedMetric]);
  } else {
    if (metricBuffer.length >= MAX_METRIC_BUFFER_SIZE) {
      _INTERNAL_flushMetricsBuffer(client, metricBuffer);
      bufferMap.set(client, [serializedMetric]);
    } else {
      bufferMap.set(client, [...metricBuffer, serializedMetric]);
    }
  }
}
function _INTERNAL_flushMetricsBuffer(client, maybeMetricBuffer) {
  const metricBuffer = maybeMetricBuffer ?? _INTERNAL_getMetricBuffer(client) ?? [];
  if (metricBuffer.length === 0) {
    return;
  }
  const clientOptions = client.getOptions();
  const envelope = createMetricEnvelope(metricBuffer, clientOptions._metadata, clientOptions.tunnel, client.getDsn());
  _getBufferMap().set(client, []);
  client.emit("flushMetrics");
  client.sendEnvelope(envelope);
}
function _INTERNAL_getMetricBuffer(client) {
  return _getBufferMap().get(client);
}
function _getBufferMap() {
  return getGlobalSingleton("clientToMetricBufferMap", () => /* @__PURE__ */ new WeakMap());
}
function safeUnref(timer) {
  if (typeof timer === "object" && typeof timer.unref === "function") {
    timer.unref();
  }
  return timer;
}
const SENTRY_BUFFER_FULL_ERROR = Symbol.for("SentryBufferFullError");
function makePromiseBuffer(limit = 100) {
  const buffer = /* @__PURE__ */ new Set();
  function isReady() {
    return buffer.size < limit;
  }
  function remove(task) {
    buffer.delete(task);
  }
  function add(taskProducer) {
    if (!isReady()) {
      return rejectedSyncPromise(SENTRY_BUFFER_FULL_ERROR);
    }
    const task = taskProducer();
    buffer.add(task);
    void task.then(
      () => remove(task),
      () => remove(task)
    );
    return task;
  }
  function drain(timeout) {
    if (!buffer.size) {
      return resolvedSyncPromise(true);
    }
    const drainPromise = Promise.allSettled(Array.from(buffer)).then(() => true);
    if (!timeout) {
      return drainPromise;
    }
    const promises2 = [
      drainPromise,
      new Promise((resolve2) => safeUnref(setTimeout(() => resolve2(false), timeout)))
    ];
    return Promise.race(promises2);
  }
  return {
    get $() {
      return Array.from(buffer);
    },
    add,
    drain
  };
}
const DEFAULT_RETRY_AFTER = 60 * 1e3;
function parseRetryAfterHeader(header, now = safeDateNow()) {
  const headerDelay = parseInt(`${header}`, 10);
  if (!isNaN(headerDelay)) {
    return headerDelay * 1e3;
  }
  const headerDate = Date.parse(`${header}`);
  if (!isNaN(headerDate)) {
    return headerDate - now;
  }
  return DEFAULT_RETRY_AFTER;
}
function disabledUntil(limits, dataCategory) {
  return limits[dataCategory] || limits.all || 0;
}
function isRateLimited(limits, dataCategory, now = safeDateNow()) {
  return disabledUntil(limits, dataCategory) > now;
}
function updateRateLimits(limits, { statusCode, headers }, now = safeDateNow()) {
  const updatedRateLimits = {
    ...limits
  };
  const rateLimitHeader = headers?.["x-sentry-rate-limits"];
  const retryAfterHeader = headers?.["retry-after"];
  if (rateLimitHeader) {
    for (const limit of rateLimitHeader.trim().split(",")) {
      const [retryAfter, categories, , , namespaces] = limit.split(":", 5);
      const headerDelay = parseInt(retryAfter, 10);
      const delay2 = (!isNaN(headerDelay) ? headerDelay : 60) * 1e3;
      if (!categories) {
        updatedRateLimits.all = now + delay2;
      } else {
        for (const category of categories.split(";")) {
          if (category === "metric_bucket") {
            if (!namespaces || namespaces.split(";").includes("custom")) {
              updatedRateLimits[category] = now + delay2;
            }
          } else {
            updatedRateLimits[category] = now + delay2;
          }
        }
      }
    }
  } else if (retryAfterHeader) {
    updatedRateLimits.all = now + parseRetryAfterHeader(retryAfterHeader, now);
  } else if (statusCode === 429) {
    updatedRateLimits.all = now + 60 * 1e3;
  }
  return updatedRateLimits;
}
const DEFAULT_TRANSPORT_BUFFER_SIZE = 64;
function createTransport(options, makeRequest, buffer = makePromiseBuffer(
  options.bufferSize || DEFAULT_TRANSPORT_BUFFER_SIZE
)) {
  let rateLimits = {};
  const flush2 = (timeout) => buffer.drain(timeout);
  function send(envelope) {
    const filteredEnvelopeItems = [];
    forEachEnvelopeItem(envelope, (item, type) => {
      const dataCategory = envelopeItemTypeToDataCategory(type);
      if (isRateLimited(rateLimits, dataCategory)) {
        options.recordDroppedEvent("ratelimit_backoff", dataCategory);
      } else {
        filteredEnvelopeItems.push(item);
      }
    });
    if (filteredEnvelopeItems.length === 0) {
      return Promise.resolve({});
    }
    const filteredEnvelope = createEnvelope(envelope[0], filteredEnvelopeItems);
    const recordEnvelopeLoss = (reason) => {
      if (envelopeContainsItemType(filteredEnvelope, ["client_report"])) {
        DEBUG_BUILD$3 && debug.warn(`Dropping client report. Will not send outcomes (reason: ${reason}).`);
        return;
      }
      forEachEnvelopeItem(filteredEnvelope, (item, type) => {
        options.recordDroppedEvent(reason, envelopeItemTypeToDataCategory(type));
      });
    };
    const requestTask = () => makeRequest({ body: serializeEnvelope(filteredEnvelope) }).then(
      (response) => {
        if (response.statusCode === 413) {
          DEBUG_BUILD$3 && debug.error(
            "Sentry responded with status code 413. Envelope was discarded due to exceeding size limits."
          );
          recordEnvelopeLoss("send_error");
          return response;
        }
        if (DEBUG_BUILD$3 && response.statusCode !== void 0 && (response.statusCode < 200 || response.statusCode >= 300)) {
          debug.warn(`Sentry responded with status code ${response.statusCode} to sent event.`);
        }
        rateLimits = updateRateLimits(rateLimits, response);
        return response;
      },
      (error2) => {
        recordEnvelopeLoss("network_error");
        DEBUG_BUILD$3 && debug.error("Encountered error running transport request:", error2);
        throw error2;
      }
    );
    return buffer.add(requestTask).then(
      (result) => result,
      (error2) => {
        if (error2 === SENTRY_BUFFER_FULL_ERROR) {
          DEBUG_BUILD$3 && debug.error("Skipped sending event because buffer is full.");
          recordEnvelopeLoss("queue_overflow");
          return Promise.resolve({});
        } else {
          throw error2;
        }
      }
    );
  }
  return {
    send,
    flush: flush2
  };
}
function createClientReportEnvelope(discarded_events, dsn, timestamp) {
  const clientReportItem = [
    { type: "client_report" },
    {
      timestamp: dateTimestampInSeconds(),
      discarded_events
    }
  ];
  return createEnvelope(dsn ? { dsn } : {}, [clientReportItem]);
}
function getPossibleEventMessages(event) {
  const possibleMessages = [];
  if (event.message) {
    possibleMessages.push(event.message);
  }
  try {
    const lastException = event.exception.values[event.exception.values.length - 1];
    if (lastException?.value) {
      possibleMessages.push(lastException.value);
      if (lastException.type) {
        possibleMessages.push(`${lastException.type}: ${lastException.value}`);
      }
    }
  } catch {
  }
  return possibleMessages;
}
function convertTransactionEventToSpanJson(event) {
  const { trace_id, parent_span_id, span_id, status, origin, data, op } = event.contexts?.trace ?? {};
  return {
    data: data ?? {},
    description: event.transaction,
    op,
    parent_span_id,
    span_id: span_id ?? "",
    start_timestamp: event.start_timestamp ?? 0,
    status,
    timestamp: event.timestamp,
    trace_id: trace_id ?? "",
    origin,
    profile_id: data?.[SEMANTIC_ATTRIBUTE_PROFILE_ID],
    exclusive_time: data?.[SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME],
    measurements: event.measurements,
    is_segment: true
  };
}
function convertSpanJsonToTransactionEvent(span) {
  return {
    type: "transaction",
    timestamp: span.timestamp,
    start_timestamp: span.start_timestamp,
    transaction: span.description,
    contexts: {
      trace: {
        trace_id: span.trace_id,
        span_id: span.span_id,
        parent_span_id: span.parent_span_id,
        op: span.op,
        status: span.status,
        origin: span.origin,
        data: {
          ...span.data,
          ...span.profile_id && { [SEMANTIC_ATTRIBUTE_PROFILE_ID]: span.profile_id },
          ...span.exclusive_time && { [SEMANTIC_ATTRIBUTE_EXCLUSIVE_TIME]: span.exclusive_time }
        }
      }
    },
    measurements: span.measurements
  };
}
const ALREADY_SEEN_ERROR = "Not capturing exception because it's already been captured.";
const MISSING_RELEASE_FOR_SESSION_ERROR = "Discarded session because of missing or non-string release";
const INTERNAL_ERROR_SYMBOL = Symbol.for("SentryInternalError");
const DO_NOT_SEND_EVENT_SYMBOL = Symbol.for("SentryDoNotSendEventError");
const DEFAULT_FLUSH_INTERVAL = 5e3;
function _makeInternalError(message) {
  return {
    message,
    [INTERNAL_ERROR_SYMBOL]: true
  };
}
function _makeDoNotSendEventError(message) {
  return {
    message,
    [DO_NOT_SEND_EVENT_SYMBOL]: true
  };
}
function _isInternalError(error2) {
  return !!error2 && typeof error2 === "object" && INTERNAL_ERROR_SYMBOL in error2;
}
function _isDoNotSendEventError(error2) {
  return !!error2 && typeof error2 === "object" && DO_NOT_SEND_EVENT_SYMBOL in error2;
}
function setupWeightBasedFlushing(client, afterCaptureHook, flushHook, estimateSizeFn, flushFn) {
  let weight = 0;
  let flushTimeout;
  let isTimerActive = false;
  client.on(flushHook, () => {
    weight = 0;
    clearTimeout(flushTimeout);
    isTimerActive = false;
  });
  client.on(afterCaptureHook, (item) => {
    weight += estimateSizeFn(item);
    if (weight >= 8e5) {
      flushFn(client);
    } else if (!isTimerActive) {
      isTimerActive = true;
      flushTimeout = safeUnref(
        setTimeout(() => {
          flushFn(client);
        }, DEFAULT_FLUSH_INTERVAL)
      );
    }
  });
  client.on("flush", () => {
    flushFn(client);
  });
}
class Client {
  /** Options passed to the SDK. */
  /** The client Dsn, if specified in options. Without this Dsn, the SDK will be disabled. */
  /** Array of set up integrations. */
  /** Number of calls being processed */
  /** Holds flushable  */
  // eslint-disable-next-line @typescript-eslint/ban-types
  /**
   * Initializes this client instance.
   *
   * @param options Options for the client.
   */
  constructor(options) {
    this._options = options;
    this._integrations = {};
    this._numProcessing = 0;
    this._outcomes = {};
    this._hooks = {};
    this._eventProcessors = [];
    this._promiseBuffer = makePromiseBuffer(options.transportOptions?.bufferSize ?? DEFAULT_TRANSPORT_BUFFER_SIZE);
    if (options.dsn) {
      this._dsn = makeDsn(options.dsn);
    } else {
      DEBUG_BUILD$3 && debug.warn("No DSN provided, client will not send events.");
    }
    if (this._dsn) {
      const url = getEnvelopeEndpointWithUrlEncodedAuth(
        this._dsn,
        options.tunnel,
        options._metadata ? options._metadata.sdk : void 0
      );
      this._transport = options.transport({
        tunnel: this._options.tunnel,
        recordDroppedEvent: this.recordDroppedEvent.bind(this),
        ...options.transportOptions,
        url
      });
    }
    this._options.enableLogs = this._options.enableLogs ?? this._options._experiments?.enableLogs;
    if (this._options.enableLogs) {
      setupWeightBasedFlushing(this, "afterCaptureLog", "flushLogs", estimateLogSizeInBytes, _INTERNAL_flushLogsBuffer);
    }
    const enableMetrics = this._options.enableMetrics ?? this._options._experiments?.enableMetrics ?? true;
    if (enableMetrics) {
      setupWeightBasedFlushing(
        this,
        "afterCaptureMetric",
        "flushMetrics",
        estimateMetricSizeInBytes,
        _INTERNAL_flushMetricsBuffer
      );
    }
  }
  /**
   * Captures an exception event and sends it to Sentry.
   *
   * Unlike `captureException` exported from every SDK, this method requires that you pass it the current scope.
   */
  captureException(exception, hint, scope) {
    const eventId = uuid4();
    if (checkOrSetAlreadyCaught(exception)) {
      DEBUG_BUILD$3 && debug.log(ALREADY_SEEN_ERROR);
      return eventId;
    }
    const hintWithEventId = {
      event_id: eventId,
      ...hint
    };
    this._process(
      () => this.eventFromException(exception, hintWithEventId).then((event) => this._captureEvent(event, hintWithEventId, scope)).then((res) => res),
      "error"
    );
    return hintWithEventId.event_id;
  }
  /**
   * Captures a message event and sends it to Sentry.
   *
   * Unlike `captureMessage` exported from every SDK, this method requires that you pass it the current scope.
   */
  captureMessage(message, level, hint, currentScope) {
    const hintWithEventId = {
      event_id: uuid4(),
      ...hint
    };
    const eventMessage = isParameterizedString(message) ? message : String(message);
    const isMessage = isPrimitive$1(message);
    const promisedEvent = isMessage ? this.eventFromMessage(eventMessage, level, hintWithEventId) : this.eventFromException(message, hintWithEventId);
    this._process(
      () => promisedEvent.then((event) => this._captureEvent(event, hintWithEventId, currentScope)),
      isMessage ? "unknown" : "error"
    );
    return hintWithEventId.event_id;
  }
  /**
   * Captures a manually created event and sends it to Sentry.
   *
   * Unlike `captureEvent` exported from every SDK, this method requires that you pass it the current scope.
   */
  captureEvent(event, hint, currentScope) {
    const eventId = uuid4();
    if (hint?.originalException && checkOrSetAlreadyCaught(hint.originalException)) {
      DEBUG_BUILD$3 && debug.log(ALREADY_SEEN_ERROR);
      return eventId;
    }
    const hintWithEventId = {
      event_id: eventId,
      ...hint
    };
    const sdkProcessingMetadata = event.sdkProcessingMetadata || {};
    const capturedSpanScope = sdkProcessingMetadata.capturedSpanScope;
    const capturedSpanIsolationScope = sdkProcessingMetadata.capturedSpanIsolationScope;
    const dataCategory = getDataCategoryByType(event.type);
    this._process(
      () => this._captureEvent(event, hintWithEventId, capturedSpanScope || currentScope, capturedSpanIsolationScope),
      dataCategory
    );
    return hintWithEventId.event_id;
  }
  /**
   * Captures a session.
   */
  captureSession(session2) {
    this.sendSession(session2);
    updateSession(session2, { init: false });
  }
  /**
   * Create a cron monitor check in and send it to Sentry. This method is not available on all clients.
   *
   * @param checkIn An object that describes a check in.
   * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
   * to create a monitor automatically when sending a check in.
   * @param scope An optional scope containing event metadata.
   * @returns A string representing the id of the check in.
   */
  /**
   * Get the current Dsn.
   */
  getDsn() {
    return this._dsn;
  }
  /**
   * Get the current options.
   */
  getOptions() {
    return this._options;
  }
  /**
   * Get the SDK metadata.
   * @see SdkMetadata
   */
  getSdkMetadata() {
    return this._options._metadata;
  }
  /**
   * Returns the transport that is used by the client.
   * Please note that the transport gets lazy initialized so it will only be there once the first event has been sent.
   */
  getTransport() {
    return this._transport;
  }
  /**
   * Wait for all events to be sent or the timeout to expire, whichever comes first.
   *
   * @param timeout Maximum time in ms the client should wait for events to be flushed. Omitting this parameter will
   *   cause the client to wait until all events are sent before resolving the promise.
   * @returns A promise that will resolve with `true` if all events are sent before the timeout, or `false` if there are
   * still events in the queue when the timeout is reached.
   */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async flush(timeout) {
    const transport = this._transport;
    if (!transport) {
      return true;
    }
    this.emit("flush");
    const clientFinished = await this._isClientDoneProcessing(timeout);
    const transportFlushed = await transport.flush(timeout);
    return clientFinished && transportFlushed;
  }
  /**
   * Flush the event queue and set the client to `enabled = false`. See {@link Client.flush}.
   *
   * @param {number} timeout Maximum time in ms the client should wait before shutting down. Omitting this parameter will cause
   *   the client to wait until all events are sent before disabling itself.
   * @returns {Promise<boolean>} A promise which resolves to `true` if the flush completes successfully before the timeout, or `false` if
   * it doesn't.
   */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async close(timeout) {
    _INTERNAL_flushLogsBuffer(this);
    const result = await this.flush(timeout);
    this.getOptions().enabled = false;
    this.emit("close");
    return result;
  }
  /**
   * Get all installed event processors.
   */
  getEventProcessors() {
    return this._eventProcessors;
  }
  /**
   * Adds an event processor that applies to any event processed by this client.
   */
  addEventProcessor(eventProcessor) {
    this._eventProcessors.push(eventProcessor);
  }
  /**
   * Initialize this client.
   * Call this after the client was set on a scope.
   */
  init() {
    if (this._isEnabled() || // Force integrations to be setup even if no DSN was set when we have
    // Spotlight enabled. This is particularly important for browser as we
    // don't support the `spotlight` option there and rely on the users
    // adding the `spotlightBrowserIntegration()` to their integrations which
    // wouldn't get initialized with the check below when there's no DSN set.
    this._options.integrations.some(({ name }) => name.startsWith("Spotlight"))) {
      this._setupIntegrations();
    }
  }
  /**
   * Gets an installed integration by its name.
   *
   * @returns {Integration|undefined} The installed integration or `undefined` if no integration with that `name` was installed.
   */
  getIntegrationByName(integrationName) {
    return this._integrations[integrationName];
  }
  /**
   * Add an integration to the client.
   * This can be used to e.g. lazy load integrations.
   * In most cases, this should not be necessary,
   * and you're better off just passing the integrations via `integrations: []` at initialization time.
   * However, if you find the need to conditionally load & add an integration, you can use `addIntegration` to do so.
   */
  addIntegration(integration) {
    const isAlreadyInstalled = this._integrations[integration.name];
    if (!isAlreadyInstalled && integration.beforeSetup) {
      integration.beforeSetup(this);
    }
    setupIntegration(this, integration, this._integrations);
    if (!isAlreadyInstalled) {
      afterSetupIntegrations(this, [integration]);
    }
  }
  /**
   * Send a fully prepared event to Sentry.
   */
  sendEvent(event, hint = {}) {
    this.emit("beforeSendEvent", event, hint);
    let env = createEventEnvelope(event, this._dsn, this._options._metadata, this._options.tunnel);
    for (const attachment of hint.attachments || []) {
      env = addItemToEnvelope(env, createAttachmentEnvelopeItem(attachment));
    }
    this.sendEnvelope(env).then((sendResponse) => this.emit("afterSendEvent", event, sendResponse));
  }
  /**
   * Send a session or session aggregrates to Sentry.
   */
  sendSession(session2) {
    const { release: clientReleaseOption, environment: clientEnvironmentOption = DEFAULT_ENVIRONMENT } = this._options;
    if ("aggregates" in session2) {
      const sessionAttrs = session2.attrs || {};
      if (!sessionAttrs.release && !clientReleaseOption) {
        DEBUG_BUILD$3 && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
        return;
      }
      sessionAttrs.release = sessionAttrs.release || clientReleaseOption;
      sessionAttrs.environment = sessionAttrs.environment || clientEnvironmentOption;
      session2.attrs = sessionAttrs;
    } else {
      if (!session2.release && !clientReleaseOption) {
        DEBUG_BUILD$3 && debug.warn(MISSING_RELEASE_FOR_SESSION_ERROR);
        return;
      }
      session2.release = session2.release || clientReleaseOption;
      session2.environment = session2.environment || clientEnvironmentOption;
    }
    this.emit("beforeSendSession", session2);
    const env = createSessionEnvelope(session2, this._dsn, this._options._metadata, this._options.tunnel);
    this.sendEnvelope(env);
  }
  /**
   * Record on the client that an event got dropped (ie, an event that will not be sent to Sentry).
   */
  recordDroppedEvent(reason, category, count = 1) {
    if (this._options.sendClientReports) {
      const key = `${reason}:${category}`;
      DEBUG_BUILD$3 && debug.log(`Recording outcome: "${key}"${count > 1 ? ` (${count} times)` : ""}`);
      this._outcomes[key] = (this._outcomes[key] || 0) + count;
    }
  }
  /* eslint-disable @typescript-eslint/unified-signatures */
  /**
   * Register a callback for whenever a span is started.
   * Receives the span as argument.
   * @returns {() => void} A function that, when executed, removes the registered callback.
   */
  /**
   * Register a hook on this client.
   */
  on(hook, callback) {
    const hookCallbacks = this._hooks[hook] = this._hooks[hook] || /* @__PURE__ */ new Set();
    const uniqueCallback = (...args) => callback(...args);
    hookCallbacks.add(uniqueCallback);
    return () => {
      hookCallbacks.delete(uniqueCallback);
    };
  }
  /** Fire a hook whenever a span starts. */
  /**
   * Emit a hook that was previously registered via `on()`.
   */
  emit(hook, ...rest) {
    const callbacks = this._hooks[hook];
    if (callbacks) {
      callbacks.forEach((callback) => callback(...rest));
    }
  }
  /**
   * Send an envelope to Sentry.
   */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async sendEnvelope(envelope) {
    this.emit("beforeEnvelope", envelope);
    if (this._isEnabled() && this._transport) {
      try {
        return await this._transport.send(envelope);
      } catch (reason) {
        DEBUG_BUILD$3 && debug.error("Error while sending envelope:", reason);
        return {};
      }
    }
    DEBUG_BUILD$3 && debug.error("Transport disabled");
    return {};
  }
  /**
   * Disposes of the client and releases all resources.
   *
   * Subclasses should override this method to clean up their own resources.
   * After calling dispose(), the client should not be used anymore.
   */
  dispose() {
  }
  /* eslint-enable @typescript-eslint/unified-signatures */
  /** Setup integrations for this client. */
  _setupIntegrations() {
    const { integrations } = this._options;
    this._integrations = setupIntegrations(this, integrations);
    afterSetupIntegrations(this, integrations);
  }
  /** Updates existing session based on the provided event */
  _updateSessionFromEvent(session2, event) {
    let crashed = event.level === "fatal";
    let errored = false;
    const exceptions = event.exception?.values;
    if (exceptions) {
      errored = true;
      crashed = false;
      for (const ex of exceptions) {
        if (ex.mechanism?.handled === false) {
          crashed = true;
          break;
        }
      }
    }
    const sessionNonTerminal = session2.status === "ok";
    const shouldUpdateAndSend = sessionNonTerminal && session2.errors === 0 || sessionNonTerminal && crashed;
    if (shouldUpdateAndSend) {
      updateSession(session2, {
        ...crashed && { status: "crashed" },
        errors: session2.errors || Number(errored || crashed)
      });
      this.captureSession(session2);
    }
  }
  /**
   * Determine if the client is finished processing. Returns a promise because it will wait `timeout` ms before saying
   * "no" (resolving to `false`) in order to give the client a chance to potentially finish first.
   *
   * @param timeout The time, in ms, after which to resolve to `false` if the client is still busy. Passing `0` (or not
   * passing anything) will make the promise wait as long as it takes for processing to finish before resolving to
   * `true`.
   * @returns A promise which will resolve to `true` if processing is already done or finishes before the timeout, and
   * `false` otherwise
   */
  async _isClientDoneProcessing(timeout) {
    let ticked = 0;
    while (!timeout || ticked < timeout) {
      await new Promise((resolve2) => setTimeout(resolve2, 1));
      if (!this._numProcessing) {
        return true;
      }
      ticked++;
    }
    return false;
  }
  /** Determines whether this SDK is enabled and a transport is present. */
  _isEnabled() {
    return this.getOptions().enabled !== false && this._transport !== void 0;
  }
  /**
   * Adds common information to events.
   *
   * The information includes release and environment from `options`,
   * breadcrumbs and context (extra, tags and user) from the scope.
   *
   * Information that is already present in the event is never overwritten. For
   * nested objects, such as the context, keys are merged.
   *
   * @param event The original event.
   * @param hint May contain additional information about the original exception.
   * @param currentScope A scope containing event metadata.
   * @returns A new event with more information.
   */
  _prepareEvent(event, hint, currentScope, isolationScope) {
    const options = this.getOptions();
    const integrations = Object.keys(this._integrations);
    if (!hint.integrations && integrations?.length) {
      hint.integrations = integrations;
    }
    this.emit("preprocessEvent", event, hint);
    if (!event.type) {
      isolationScope.setLastEventId(event.event_id || hint.event_id);
    }
    return prepareEvent(options, event, hint, currentScope, this, isolationScope).then((evt) => {
      if (evt === null) {
        return evt;
      }
      this.emit("postprocessEvent", evt, hint);
      evt.contexts = {
        trace: { ...evt.contexts?.trace, ...getTraceContextFromScope(currentScope) },
        ...evt.contexts
      };
      const dynamicSamplingContext = getDynamicSamplingContextFromScope(this, currentScope);
      evt.sdkProcessingMetadata = {
        dynamicSamplingContext,
        ...evt.sdkProcessingMetadata
      };
      return evt;
    });
  }
  /**
   * Processes the event and logs an error in case of rejection
   * @param event
   * @param hint
   * @param scope
   */
  _captureEvent(event, hint = {}, currentScope = getCurrentScope(), isolationScope = getIsolationScope()) {
    if (DEBUG_BUILD$3 && isErrorEvent(event)) {
      debug.log(`Captured error event \`${getPossibleEventMessages(event)[0] || "<unknown>"}\``);
    }
    return this._processEvent(event, hint, currentScope, isolationScope).then(
      (finalEvent) => {
        return finalEvent.event_id;
      },
      (reason) => {
        if (DEBUG_BUILD$3) {
          if (_isDoNotSendEventError(reason)) {
            debug.log(reason.message);
          } else if (_isInternalError(reason)) {
            debug.warn(reason.message);
          } else {
            debug.warn(reason);
          }
        }
        return void 0;
      }
    );
  }
  /**
   * Processes an event (either error or message) and sends it to Sentry.
   *
   * This also adds breadcrumbs and context information to the event. However,
   * platform specific meta data (such as the User's IP address) must be added
   * by the SDK implementor.
   *
   *
   * @param event The event to send to Sentry.
   * @param hint May contain additional information about the original exception.
   * @param currentScope A scope containing event metadata.
   * @returns A SyncPromise that resolves with the event or rejects in case event was/will not be send.
   */
  _processEvent(event, hint, currentScope, isolationScope) {
    const options = this.getOptions();
    const { sampleRate } = options;
    const isTransaction = isTransactionEvent(event);
    const isError2 = isErrorEvent(event);
    const eventType = event.type || "error";
    const beforeSendLabel = `before send for type \`${eventType}\``;
    const parsedSampleRate = typeof sampleRate === "undefined" ? void 0 : parseSampleRate(sampleRate);
    if (isError2 && typeof parsedSampleRate === "number" && safeMathRandom() > parsedSampleRate) {
      this.recordDroppedEvent("sample_rate", "error");
      return rejectedSyncPromise(
        _makeDoNotSendEventError(
          `Discarding event because it's not included in the random sample (sampling rate = ${sampleRate})`
        )
      );
    }
    const dataCategory = getDataCategoryByType(event.type);
    return this._prepareEvent(event, hint, currentScope, isolationScope).then((prepared) => {
      if (prepared === null) {
        this.recordDroppedEvent("event_processor", dataCategory);
        throw _makeDoNotSendEventError("An event processor returned `null`, will not send event.");
      }
      const isInternalException = hint.data?.__sentry__ === true;
      if (isInternalException) {
        return prepared;
      }
      const result = processBeforeSend(this, options, prepared, hint);
      return _validateBeforeSendResult(result, beforeSendLabel);
    }).then((processedEvent) => {
      if (processedEvent === null) {
        this.recordDroppedEvent("before_send", dataCategory);
        if (isTransaction) {
          const spans = event.spans || [];
          const spanCount = 1 + spans.length;
          this.recordDroppedEvent("before_send", "span", spanCount);
        }
        throw _makeDoNotSendEventError(`${beforeSendLabel} returned \`null\`, will not send event.`);
      }
      const session2 = currentScope.getSession() || isolationScope.getSession();
      if (isError2 && session2) {
        this._updateSessionFromEvent(session2, processedEvent);
      }
      if (isTransaction) {
        const spanCountBefore = processedEvent.sdkProcessingMetadata?.spanCountBeforeProcessing || 0;
        const spanCountAfter = processedEvent.spans ? processedEvent.spans.length : 0;
        const droppedSpanCount = spanCountBefore - spanCountAfter;
        if (droppedSpanCount > 0) {
          this.recordDroppedEvent("before_send", "span", droppedSpanCount);
        }
      }
      const transactionInfo = processedEvent.transaction_info;
      if (isTransaction && transactionInfo && processedEvent.transaction !== event.transaction) {
        const source = "custom";
        processedEvent.transaction_info = {
          ...transactionInfo,
          source
        };
      }
      this.sendEvent(processedEvent, hint);
      return processedEvent;
    }).then(null, (reason) => {
      if (_isDoNotSendEventError(reason) || _isInternalError(reason)) {
        throw reason;
      }
      this.captureException(reason, {
        mechanism: {
          handled: false,
          type: "internal"
        },
        data: {
          __sentry__: true
        },
        originalException: reason
      });
      throw _makeInternalError(
        `Event processing pipeline threw an error, original event will not be sent. Details have been sent as a new event.
Reason: ${reason}`
      );
    });
  }
  /**
   * Occupies the client with processing and event
   */
  _process(taskProducer, dataCategory) {
    this._numProcessing++;
    void this._promiseBuffer.add(taskProducer).then(
      (value) => {
        this._numProcessing--;
        return value;
      },
      (reason) => {
        this._numProcessing--;
        if (reason === SENTRY_BUFFER_FULL_ERROR) {
          this.recordDroppedEvent("queue_overflow", dataCategory);
        }
        return reason;
      }
    );
  }
  /**
   * Clears outcomes on this client and returns them.
   */
  _clearOutcomes() {
    const outcomes = this._outcomes;
    this._outcomes = {};
    return Object.entries(outcomes).map(([key, quantity]) => {
      const [reason, category] = key.split(":");
      return {
        reason,
        category,
        quantity
      };
    });
  }
  /**
   * Sends client reports as an envelope.
   */
  _flushOutcomes() {
    DEBUG_BUILD$3 && debug.log("Flushing outcomes...");
    const outcomes = this._clearOutcomes();
    if (outcomes.length === 0) {
      DEBUG_BUILD$3 && debug.log("No outcomes to send");
      return;
    }
    if (!this._dsn) {
      DEBUG_BUILD$3 && debug.log("No dsn provided, will not send outcomes");
      return;
    }
    DEBUG_BUILD$3 && debug.log("Sending outcomes:", outcomes);
    const envelope = createClientReportEnvelope(outcomes, this._options.tunnel && dsnToString(this._dsn));
    this.sendEnvelope(envelope);
  }
  /**
   * Creates an {@link Event} from all inputs to `captureException` and non-primitive inputs to `captureMessage`.
   */
}
function getDataCategoryByType(type) {
  return type === "replay_event" ? "replay" : type || "error";
}
function _validateBeforeSendResult(beforeSendResult, beforeSendLabel) {
  const invalidValueError = `${beforeSendLabel} must return \`null\` or a valid event.`;
  if (isThenable(beforeSendResult)) {
    return beforeSendResult.then(
      (event) => {
        if (!isPlainObject$1(event) && event !== null) {
          throw _makeInternalError(invalidValueError);
        }
        return event;
      },
      (e) => {
        throw _makeInternalError(`${beforeSendLabel} rejected with ${e}`);
      }
    );
  } else if (!isPlainObject$1(beforeSendResult) && beforeSendResult !== null) {
    throw _makeInternalError(invalidValueError);
  }
  return beforeSendResult;
}
function processBeforeSend(client, options, event, hint) {
  const { beforeSend, beforeSendTransaction, ignoreSpans } = options;
  const beforeSendSpan = !isStreamedBeforeSendSpanCallback(options.beforeSendSpan) && options.beforeSendSpan;
  let processedEvent = event;
  if (isErrorEvent(processedEvent) && beforeSend) {
    return beforeSend(processedEvent, hint);
  }
  if (isTransactionEvent(processedEvent)) {
    if (beforeSendSpan || ignoreSpans) {
      const rootSpanJson = convertTransactionEventToSpanJson(processedEvent);
      if (ignoreSpans?.length && shouldIgnoreSpan(rootSpanJson, ignoreSpans)) {
        return null;
      }
      if (beforeSendSpan) {
        const processedRootSpanJson = beforeSendSpan(rootSpanJson);
        if (!processedRootSpanJson) {
          showSpanDropWarning();
        } else {
          processedEvent = merge$1(event, convertSpanJsonToTransactionEvent(processedRootSpanJson));
        }
      }
      if (processedEvent.spans) {
        const processedSpans = [];
        const initialSpans = processedEvent.spans;
        for (const span of initialSpans) {
          if (ignoreSpans?.length && shouldIgnoreSpan(span, ignoreSpans)) {
            reparentChildSpans(initialSpans, span);
            continue;
          }
          if (beforeSendSpan) {
            const processedSpan = beforeSendSpan(span);
            if (!processedSpan) {
              showSpanDropWarning();
              processedSpans.push(span);
            } else {
              processedSpans.push(processedSpan);
            }
          } else {
            processedSpans.push(span);
          }
        }
        const droppedSpans = processedEvent.spans.length - processedSpans.length;
        if (droppedSpans) {
          client.recordDroppedEvent("before_send", "span", droppedSpans);
        }
        processedEvent.spans = processedSpans;
      }
    }
    if (beforeSendTransaction) {
      if (processedEvent.spans) {
        const spanCountBefore = processedEvent.spans.length;
        processedEvent.sdkProcessingMetadata = {
          ...event.sdkProcessingMetadata,
          spanCountBeforeProcessing: spanCountBefore
        };
      }
      return beforeSendTransaction(processedEvent, hint);
    }
  }
  return processedEvent;
}
function isErrorEvent(event) {
  return event.type === void 0;
}
function isTransactionEvent(event) {
  return event.type === "transaction";
}
function estimateMetricSizeInBytes(metric) {
  let weight = 0;
  if (metric.name) {
    weight += metric.name.length * 2;
  }
  weight += 8;
  return weight + estimateAttributesSizeInBytes(metric.attributes);
}
function estimateLogSizeInBytes(log2) {
  let weight = 0;
  if (log2.message) {
    weight += log2.message.length * 2;
  }
  return weight + estimateAttributesSizeInBytes(log2.attributes);
}
function estimateAttributesSizeInBytes(attributes2) {
  if (!attributes2) {
    return 0;
  }
  let weight = 0;
  Object.values(attributes2).forEach((value) => {
    if (Array.isArray(value)) {
      weight += value.length * estimatePrimitiveSizeInBytes(value[0]);
    } else if (isPrimitive$1(value)) {
      weight += estimatePrimitiveSizeInBytes(value);
    } else {
      weight += 100;
    }
  });
  return weight;
}
function estimatePrimitiveSizeInBytes(value) {
  if (typeof value === "string") {
    return value.length * 2;
  } else if (typeof value === "number") {
    return 8;
  } else if (typeof value === "boolean") {
    return 4;
  }
  return 0;
}
function createCheckInEnvelope(checkIn, dynamicSamplingContext, metadata, tunnel, dsn) {
  const headers = {
    sent_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (metadata?.sdk) {
    headers.sdk = {
      name: metadata.sdk.name,
      version: metadata.sdk.version
    };
  }
  if (!!tunnel && !!dsn) {
    headers.dsn = dsnToString(dsn);
  }
  if (dynamicSamplingContext) {
    headers.trace = dynamicSamplingContext;
  }
  const item = createCheckInEnvelopeItem(checkIn);
  return createEnvelope(headers, [item]);
}
function createCheckInEnvelopeItem(checkIn) {
  const checkInHeaders = {
    type: "check_in"
  };
  return [checkInHeaders, checkIn];
}
function addUserAgentToTransportHeaders(options) {
  const sdkMetadata = options._metadata?.sdk;
  const sdkUserAgent = sdkMetadata?.name && sdkMetadata?.version ? `${sdkMetadata?.name}/${sdkMetadata?.version}` : void 0;
  options.transportOptions = {
    ...options.transportOptions,
    headers: {
      ...sdkUserAgent && { "user-agent": sdkUserAgent },
      ...options.transportOptions?.headers
    }
  };
}
function parseStackFrames(stackParser, error2) {
  return stackParser(error2.stack || "", 1);
}
function hasSentryFetchUrlHost(error2) {
  return isError(error2) && "__sentry_fetch_url_host__" in error2 && typeof error2.__sentry_fetch_url_host__ === "string";
}
function _enhanceErrorWithSentryInfo(error2) {
  if (hasSentryFetchUrlHost(error2)) {
    return `${error2.message} (${error2.__sentry_fetch_url_host__})`;
  }
  return error2.message;
}
function exceptionFromError(stackParser, error2) {
  const exception = {
    type: error2.name || error2.constructor.name,
    value: _enhanceErrorWithSentryInfo(error2)
  };
  const frames = parseStackFrames(stackParser, error2);
  if (frames.length) {
    exception.stacktrace = { frames };
  }
  return exception;
}
function getErrorPropertyFromObject(obj) {
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      const value = obj[prop];
      if (value instanceof Error) {
        return value;
      }
    }
  }
  return void 0;
}
function getMessageForObject(exception) {
  if ("name" in exception && typeof exception.name === "string") {
    let message = `'${exception.name}' captured as exception`;
    if ("message" in exception && typeof exception.message === "string") {
      message += ` with message '${exception.message}'`;
    }
    return message;
  } else if ("message" in exception && typeof exception.message === "string") {
    return exception.message;
  }
  const keys = extractExceptionKeysForMessage(exception);
  if (isErrorEvent$1(exception)) {
    return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
  }
  const className = getObjectClassName(exception);
  return `${className && className !== "Object" ? `'${className}'` : "Object"} captured as exception with keys: ${keys}`;
}
function getObjectClassName(obj) {
  try {
    const prototype = Object.getPrototypeOf(obj);
    return prototype ? prototype.constructor.name : void 0;
  } catch {
  }
}
function getException(client, mechanism, exception, hint) {
  if (isError(exception)) {
    return [exception, void 0];
  }
  mechanism.synthetic = true;
  if (isPlainObject$1(exception)) {
    const normalizeDepth = client?.getOptions().normalizeDepth;
    const extras = { ["__serialized__"]: normalizeToSize(exception, normalizeDepth) };
    const errorFromProp = getErrorPropertyFromObject(exception);
    if (errorFromProp) {
      return [errorFromProp, extras];
    }
    const message = getMessageForObject(exception);
    const ex2 = hint?.syntheticException || new Error(message);
    ex2.message = message;
    return [ex2, extras];
  }
  const ex = hint?.syntheticException || new Error(exception);
  ex.message = `${exception}`;
  return [ex, void 0];
}
function eventFromUnknownInput(client, stackParser, exception, hint) {
  const providedMechanism = hint?.data && hint.data.mechanism;
  const mechanism = providedMechanism || {
    handled: true,
    type: "generic"
  };
  const [ex, extras] = getException(client, mechanism, exception, hint);
  const event = {
    exception: {
      values: [exceptionFromError(stackParser, ex)]
    }
  };
  if (extras) {
    event.extra = extras;
  }
  addExceptionTypeValue(event);
  addExceptionMechanism(event, mechanism);
  return {
    ...event,
    event_id: hint?.event_id
  };
}
function eventFromMessage(stackParser, message, level = "info", hint, attachStacktrace) {
  const event = {
    event_id: hint?.event_id,
    level
  };
  if (attachStacktrace && hint?.syntheticException) {
    const frames = parseStackFrames(stackParser, hint.syntheticException);
    if (frames.length) {
      event.exception = {
        values: [
          {
            value: message,
            stacktrace: { frames }
          }
        ]
      };
      addExceptionMechanism(event, { synthetic: true });
    }
  }
  if (isParameterizedString(message)) {
    const { __sentry_template_string__, __sentry_template_values__ } = message;
    event.logentry = {
      message: __sentry_template_string__,
      params: __sentry_template_values__
    };
    return event;
  }
  event.message = message;
  return event;
}
class ServerRuntimeClient extends Client {
  /**
   * Creates a new Edge SDK instance.
   * @param options Configuration options for this SDK.
   */
  constructor(options) {
    registerSpanErrorInstrumentation();
    addUserAgentToTransportHeaders(options);
    super(options);
    this._setUpMetricsProcessing();
  }
  /**
   * @inheritDoc
   */
  eventFromException(exception, hint) {
    const event = eventFromUnknownInput(this, this._options.stackParser, exception, hint);
    event.level = "error";
    return resolvedSyncPromise(event);
  }
  /**
   * @inheritDoc
   */
  eventFromMessage(message, level = "info", hint) {
    return resolvedSyncPromise(
      eventFromMessage(this._options.stackParser, message, level, hint, this._options.attachStacktrace)
    );
  }
  /**
   * @inheritDoc
   */
  captureException(exception, hint, scope) {
    setCurrentRequestSessionErroredOrCrashed(hint);
    return super.captureException(exception, hint, scope);
  }
  /**
   * @inheritDoc
   */
  captureEvent(event, hint, scope) {
    const isException = !event.type && event.exception?.values && event.exception.values.length > 0;
    if (isException) {
      setCurrentRequestSessionErroredOrCrashed(hint);
    }
    return super.captureEvent(event, hint, scope);
  }
  /**
   * Create a cron monitor check in and send it to Sentry.
   *
   * @param checkIn An object that describes a check in.
   * @param upsertMonitorConfig An optional object that describes a monitor config. Use this if you want
   * to create a monitor automatically when sending a check in.
   */
  captureCheckIn(checkIn, monitorConfig, scope) {
    const id = "checkInId" in checkIn && checkIn.checkInId ? checkIn.checkInId : uuid4();
    if (!this._isEnabled()) {
      DEBUG_BUILD$3 && debug.warn("SDK not enabled, will not capture check-in.");
      return id;
    }
    const options = this.getOptions();
    const { release, environment, tunnel } = options;
    const serializedCheckIn = {
      check_in_id: id,
      monitor_slug: checkIn.monitorSlug,
      status: checkIn.status,
      release,
      environment
    };
    if ("duration" in checkIn) {
      serializedCheckIn.duration = checkIn.duration;
    }
    if (monitorConfig) {
      serializedCheckIn.monitor_config = {
        schedule: monitorConfig.schedule,
        checkin_margin: monitorConfig.checkinMargin,
        max_runtime: monitorConfig.maxRuntime,
        timezone: monitorConfig.timezone,
        failure_issue_threshold: monitorConfig.failureIssueThreshold,
        recovery_threshold: monitorConfig.recoveryThreshold
      };
    }
    const [dynamicSamplingContext, traceContext] = _getTraceInfoFromScope(this, scope);
    if (traceContext) {
      serializedCheckIn.contexts = {
        trace: traceContext
      };
    }
    const envelope = createCheckInEnvelope(
      serializedCheckIn,
      dynamicSamplingContext,
      this.getSdkMetadata(),
      tunnel,
      this.getDsn()
    );
    DEBUG_BUILD$3 && debug.log("Sending checkin:", checkIn.monitorSlug, checkIn.status);
    this.sendEnvelope(envelope);
    return id;
  }
  /**
   * Disposes of the client and releases all resources.
   *
   * This method clears all internal state to allow the client to be garbage collected.
   * It clears hooks, event processors, integrations, transport, and other internal references.
   *
   * Call this method after flushing to allow the client to be garbage collected.
   * After calling dispose(), the client should not be used anymore.
   *
   * Subclasses should override this method to clean up their own resources and call `super.dispose()`.
   */
  dispose() {
    DEBUG_BUILD$3 && debug.log("Disposing client...");
    for (const hookName of Object.keys(this._hooks)) {
      this._hooks[hookName]?.clear();
    }
    this._hooks = {};
    this._eventProcessors.length = 0;
    this._integrations = {};
    this._outcomes = {};
    this._transport = void 0;
    this._promiseBuffer = makePromiseBuffer(DEFAULT_TRANSPORT_BUFFER_SIZE);
  }
  /**
   * @inheritDoc
   */
  _prepareEvent(event, hint, currentScope, isolationScope) {
    if (this._options.platform) {
      event.platform = event.platform || this._options.platform;
    }
    if (this._options.runtime) {
      event.contexts = {
        ...event.contexts,
        runtime: event.contexts?.runtime || this._options.runtime
      };
    }
    if (this._options.serverName) {
      event.server_name = event.server_name || this._options.serverName;
    }
    return super._prepareEvent(event, hint, currentScope, isolationScope);
  }
  /**
   * Process a server-side metric before it is captured.
   */
  _setUpMetricsProcessing() {
    this.on("processMetric", (metric) => {
      if (this._options.serverName) {
        metric.attributes = {
          "server.address": this._options.serverName,
          ...metric.attributes
        };
      }
    });
  }
}
function setCurrentRequestSessionErroredOrCrashed(eventHint) {
  const requestSession = getIsolationScope().getScopeData().sdkProcessingMetadata.requestSession;
  if (requestSession) {
    const isHandledException = eventHint?.mechanism?.handled ?? true;
    if (isHandledException && requestSession.status !== "crashed") {
      requestSession.status = "errored";
    } else if (!isHandledException) {
      requestSession.status = "crashed";
    }
  }
}
const MIN_DELAY = 100;
const START_DELAY = 5e3;
const MAX_DELAY = 36e5;
function makeOfflineTransport(createTransport2) {
  function log2(...args) {
    DEBUG_BUILD$3 && debug.log("[Offline]:", ...args);
  }
  return (options) => {
    const transport = createTransport2(options);
    if (!options.createStore) {
      throw new Error("No `createStore` function was provided");
    }
    const store = options.createStore(options);
    let retryDelay = START_DELAY;
    let flushTimer;
    function shouldQueue(env, error2, retryDelay2) {
      if (envelopeContainsItemType(env, ["client_report"])) {
        return false;
      }
      if (options.shouldStore) {
        return options.shouldStore(env, error2, retryDelay2);
      }
      return true;
    }
    function flushIn(delay2) {
      if (flushTimer) {
        clearTimeout(flushTimer);
      }
      flushTimer = safeUnref(
        setTimeout(async () => {
          flushTimer = void 0;
          const found = await store.shift();
          if (found) {
            log2("Attempting to send previously queued event");
            found[0].sent_at = (/* @__PURE__ */ new Date()).toISOString();
            void send(found, true).catch((e) => {
              log2("Failed to retry sending", e);
            });
          }
        }, delay2)
      );
    }
    function flushWithBackOff() {
      if (flushTimer) {
        return;
      }
      flushIn(retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_DELAY);
    }
    async function send(envelope, isRetry = false) {
      if (!isRetry && envelopeContainsItemType(envelope, ["replay_event", "replay_recording"])) {
        await store.push(envelope);
        flushIn(MIN_DELAY);
        return {};
      }
      try {
        if (options.shouldSend && await options.shouldSend(envelope) === false) {
          throw new Error("Envelope not sent because `shouldSend` callback returned false");
        }
        const result = await transport.send(envelope);
        let delay2 = MIN_DELAY;
        if (result) {
          if (result.headers?.["retry-after"]) {
            delay2 = parseRetryAfterHeader(result.headers["retry-after"]);
          } else if (result.headers?.["x-sentry-rate-limits"]) {
            delay2 = 6e4;
          } else if ((result.statusCode || 0) >= 400) {
            return result;
          }
        }
        flushIn(delay2);
        retryDelay = START_DELAY;
        return result;
      } catch (e) {
        if (await shouldQueue(envelope, e, retryDelay)) {
          if (isRetry) {
            await store.unshift(envelope);
          } else {
            await store.push(envelope);
          }
          flushWithBackOff();
          log2("Error sending. Event queued.", e);
          return {};
        } else {
          throw e;
        }
      }
    }
    if (options.flushAtStartup) {
      flushWithBackOff();
    }
    return {
      send,
      flush: (timeout) => {
        if (timeout === void 0) {
          retryDelay = START_DELAY;
          flushIn(MIN_DELAY);
        }
        return transport.flush(timeout);
      }
    };
  };
}
const SKIPPED_AI_PROVIDERS = /* @__PURE__ */ new Set();
function _INTERNAL_clearAiProviderSkips() {
  SKIPPED_AI_PROVIDERS.clear();
  DEBUG_BUILD$3 && debug.log("Cleared AI provider skip registrations");
}
const DEFAULT_BASE_URL = "thismessage:/";
function parseStringToURLObject(url, urlBase) {
  const isRelative = url.indexOf("://") <= 0 && url.indexOf("//") !== 0;
  const base = isRelative ? DEFAULT_BASE_URL : void 0;
  try {
    if ("canParse" in URL && !URL.canParse(url, base)) {
      return void 0;
    }
    const fullUrlObject = new URL(url, base);
    if (isRelative) {
      return {
        isRelative,
        pathname: fullUrlObject.pathname,
        search: fullUrlObject.search,
        hash: fullUrlObject.hash
      };
    }
    return fullUrlObject;
  } catch {
  }
  return void 0;
}
function parseUrl(url) {
  if (!url) {
    return {};
  }
  const match = url.match(/^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?$/);
  if (!match) {
    return {};
  }
  const query = match[6] || "";
  const fragment = match[8] || "";
  return {
    host: match[4],
    path: match[5],
    protocol: match[2],
    search: query,
    hash: fragment,
    relative: match[5] + query + fragment
    // everything minus origin
  };
}
function stripUrlQueryAndFragment(urlPath) {
  return urlPath.split(/[?#]/, 1)[0];
}
function getSanitizedUrlString(url) {
  const { protocol: protocol2, host, path: path2 } = url;
  const filteredHost = host?.replace(/^.*@/, "[filtered]:[filtered]@").replace(/(:80)$/, "").replace(/(:443)$/, "") || "";
  return `${protocol2 ? `${protocol2}://` : ""}${filteredHost}${path2}`;
}
function stripDataUrlContent(url, includeDataPrefix = true) {
  if (url.startsWith("data:")) {
    const match = url.match(/^data:([^;,]+)/);
    const mimeType = match ? match[1] : "text/plain";
    const isBase64 = url.includes(";base64,");
    const dataStart = url.indexOf(",");
    let dataPrefix = "";
    if (includeDataPrefix && dataStart !== -1) {
      const data = url.slice(dataStart + 1);
      dataPrefix = data.length > 10 ? `${data.slice(0, 10)}... [truncated]` : data;
    }
    return `data:${mimeType}${isBase64 ? ",base64" : ""}${dataPrefix ? `,${dataPrefix}` : ""}`;
  }
  return url;
}
function parameterize(strings, ...values) {
  const formatted = new String(String.raw(strings, ...values));
  formatted.__sentry_template_string__ = strings.join("\0").replace(/%/g, "%%").replace(/\0/g, "%s");
  formatted.__sentry_template_values__ = values;
  return formatted;
}
const fmt = parameterize;
function addAutoIpAddressToSession(session2) {
  if ("aggregates" in session2) {
    if (session2.attrs?.["ip_address"] === void 0) {
      session2.attrs = {
        ...session2.attrs,
        ip_address: "{{auto}}"
      };
    }
  } else {
    if (session2.ipAddress === void 0) {
      session2.ipAddress = "{{auto}}";
    }
  }
}
function applySdkMetadata(options, name, names = [name], source = "npm") {
  const sdk = (options._metadata = options._metadata || {}).sdk = options._metadata.sdk || {};
  if (!sdk.name) {
    sdk.name = `sentry.javascript.${name}`;
    sdk.packages = names.map((name2) => ({
      name: `${source}:@sentry/${name2}`,
      version: SDK_VERSION$1
    }));
    sdk.version = SDK_VERSION$1;
  }
}
function getTraceData$1(options = {}) {
  const client = options.client || getClient();
  if (!isEnabled() || !client) {
    return {};
  }
  const carrier = getMainCarrier();
  const acs = getAsyncContextStrategy(carrier);
  if (acs.getTraceData) {
    return acs.getTraceData(options);
  }
  const scope = options.scope || getCurrentScope();
  const span = options.span || getActiveSpan$1();
  const sentryTrace = span ? spanToTraceHeader(span) : scopeToTraceHeader(scope);
  const dsc = span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope);
  const baggage = dynamicSamplingContextToSentryBaggageHeader(dsc);
  const isValidSentryTraceHeader = TRACEPARENT_REGEXP.test(sentryTrace);
  if (!isValidSentryTraceHeader) {
    debug.warn("Invalid sentry-trace data. Cannot generate trace data");
    return {};
  }
  const traceData = {
    "sentry-trace": sentryTrace,
    baggage
  };
  if (options.propagateTraceparent) {
    traceData.traceparent = span ? spanToTraceparentHeader(span) : scopeToTraceparentHeader(scope);
  }
  return traceData;
}
function scopeToTraceHeader(scope) {
  const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
  return generateSentryTraceHeader(traceId, propagationSpanId, sampled);
}
function scopeToTraceparentHeader(scope) {
  const { traceId, sampled, propagationSpanId } = scope.getPropagationContext();
  return generateTraceparentHeader(traceId, propagationSpanId, sampled);
}
const NOT_PROPAGATED_MESSAGE = "[Tracing] Not injecting trace data for url because it does not match tracePropagationTargets:";
function shouldPropagateTraceForUrl(url, tracePropagationTargets, decisionMap) {
  if (typeof url !== "string" || !tracePropagationTargets) {
    return true;
  }
  const cachedDecision = decisionMap?.get(url);
  if (cachedDecision !== void 0) {
    DEBUG_BUILD$3 && !cachedDecision && debug.log(NOT_PROPAGATED_MESSAGE, url);
    return cachedDecision;
  }
  const decision = stringMatchesSomePattern(url, tracePropagationTargets);
  decisionMap?.set(url, decision);
  DEBUG_BUILD$3 && !decision && debug.log(NOT_PROPAGATED_MESSAGE, url);
  return decision;
}
function debounce(func, wait, options) {
  let callbackReturnValue;
  let timerId;
  let maxTimerId;
  const maxWait = Math.max(options.maxWait, wait);
  const setTimeoutImpl = options?.setTimeoutImpl || setTimeout;
  function invokeFunc() {
    cancelTimers();
    callbackReturnValue = func();
    return callbackReturnValue;
  }
  function cancelTimers() {
    timerId !== void 0 && clearTimeout(timerId);
    maxTimerId !== void 0 && clearTimeout(maxTimerId);
    timerId = maxTimerId = void 0;
  }
  function flush2() {
    if (timerId !== void 0 || maxTimerId !== void 0) {
      return invokeFunc();
    }
    return callbackReturnValue;
  }
  function debounced() {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeoutImpl(invokeFunc, wait);
    if (maxWait && maxTimerId === void 0) {
      maxTimerId = setTimeoutImpl(invokeFunc, maxWait);
    }
    return callbackReturnValue;
  }
  debounced.cancel = cancelTimers;
  debounced.flush = flush2;
  return debounced;
}
const DEFAULT_BREADCRUMBS = 100;
function addBreadcrumb(breadcrumb, hint) {
  const client = getClient();
  const isolationScope = getIsolationScope();
  if (!client) return;
  const { beforeBreadcrumb = null, maxBreadcrumbs = DEFAULT_BREADCRUMBS } = client.getOptions();
  if (maxBreadcrumbs <= 0) return;
  const timestamp = dateTimestampInSeconds();
  const mergedBreadcrumb = { timestamp, ...breadcrumb };
  const finalBreadcrumb = beforeBreadcrumb ? consoleSandbox(() => beforeBreadcrumb(mergedBreadcrumb, hint)) : mergedBreadcrumb;
  if (finalBreadcrumb === null) return;
  if (client.emit) {
    client.emit("beforeAddBreadcrumb", finalBreadcrumb, hint);
  }
  isolationScope.addBreadcrumb(finalBreadcrumb, maxBreadcrumbs);
}
let originalFunctionToString;
const INTEGRATION_NAME$a = "FunctionToString";
const SETUP_CLIENTS = /* @__PURE__ */ new WeakMap();
const _functionToStringIntegration = () => {
  return {
    name: INTEGRATION_NAME$a,
    setupOnce() {
      originalFunctionToString = Function.prototype.toString;
      try {
        Function.prototype.toString = function(...args) {
          const originalFunction = getOriginalFunction(this);
          const context2 = SETUP_CLIENTS.has(getClient()) && originalFunction !== void 0 ? originalFunction : this;
          return originalFunctionToString.apply(context2, args);
        };
      } catch {
      }
    },
    setup(client) {
      SETUP_CLIENTS.set(client, true);
    }
  };
};
const functionToStringIntegration = defineIntegration(_functionToStringIntegration);
const DEFAULT_IGNORE_ERRORS = [
  /^Script error\.?$/,
  /^Javascript error: Script error\.? on line 0$/,
  /^ResizeObserver loop completed with undelivered notifications.$/,
  // The browser logs this when a ResizeObserver handler takes a bit longer. Usually this is not an actual issue though. It indicates slowness.
  /^Cannot redefine property: googletag$/,
  // This is thrown when google tag manager is used in combination with an ad blocker
  /^Can't find variable: gmo$/,
  // Error from Google Search App https://issuetracker.google.com/issues/396043331
  /^undefined is not an object \(evaluating 'a\.[A-Z]'\)$/,
  // Random error that happens but not actionable or noticeable to end-users.
  /can't redefine non-configurable property "solana"/,
  // Probably a browser extension or custom browser (Brave) throwing this error
  /vv\(\)\.getRestrictions is not a function/,
  // Error thrown by GTM, seemingly not affecting end-users
  /Can't find variable: _AutofillCallbackHandler/,
  // Unactionable error in instagram webview https://developers.facebook.com/community/threads/320013549791141/
  /Object Not Found Matching Id:\d+, MethodName:simulateEvent/,
  // unactionable error from CEFSharp, a .NET library that embeds chromium in .NET apps
  /^Java exception was raised during method invocation$/
  // error from Facebook Mobile browser (https://github.com/getsentry/sentry-javascript/issues/15065)
];
const INTEGRATION_NAME$9 = "EventFilters";
const eventFiltersIntegration = defineIntegration((options = {}) => {
  let mergedOptions;
  return {
    name: INTEGRATION_NAME$9,
    setup(client) {
      const clientOptions = client.getOptions();
      mergedOptions = _mergeOptions(options, clientOptions);
    },
    processEvent(event, _hint, client) {
      if (!mergedOptions) {
        const clientOptions = client.getOptions();
        mergedOptions = _mergeOptions(options, clientOptions);
      }
      return _shouldDropEvent(event, mergedOptions) ? null : event;
    }
  };
});
function _mergeOptions(internalOptions = {}, clientOptions = {}) {
  return {
    allowUrls: [...internalOptions.allowUrls || [], ...clientOptions.allowUrls || []],
    denyUrls: [...internalOptions.denyUrls || [], ...clientOptions.denyUrls || []],
    ignoreErrors: [
      ...internalOptions.ignoreErrors || [],
      ...clientOptions.ignoreErrors || [],
      ...internalOptions.disableErrorDefaults ? [] : DEFAULT_IGNORE_ERRORS
    ],
    ignoreTransactions: [...internalOptions.ignoreTransactions || [], ...clientOptions.ignoreTransactions || []]
  };
}
function _shouldDropEvent(event, options) {
  if (!event.type) {
    if (_isIgnoredError(event, options.ignoreErrors)) {
      DEBUG_BUILD$3 && debug.warn(
        `Event dropped due to being matched by \`ignoreErrors\` option.
Event: ${getEventDescription(event)}`
      );
      return true;
    }
    if (_isUselessError(event)) {
      DEBUG_BUILD$3 && debug.warn(
        `Event dropped due to not having an error message, error type or stacktrace.
Event: ${getEventDescription(
          event
        )}`
      );
      return true;
    }
    if (_isDeniedUrl(event, options.denyUrls)) {
      DEBUG_BUILD$3 && debug.warn(
        `Event dropped due to being matched by \`denyUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
      );
      return true;
    }
    if (!_isAllowedUrl(event, options.allowUrls)) {
      DEBUG_BUILD$3 && debug.warn(
        `Event dropped due to not being matched by \`allowUrls\` option.
Event: ${getEventDescription(
          event
        )}.
Url: ${_getEventFilterUrl(event)}`
      );
      return true;
    }
  } else if (event.type === "transaction") {
    if (_isIgnoredTransaction(event, options.ignoreTransactions)) {
      DEBUG_BUILD$3 && debug.warn(
        `Event dropped due to being matched by \`ignoreTransactions\` option.
Event: ${getEventDescription(event)}`
      );
      return true;
    }
  }
  return false;
}
function _isIgnoredError(event, ignoreErrors) {
  if (!ignoreErrors?.length) {
    return false;
  }
  return getPossibleEventMessages(event).some((message) => stringMatchesSomePattern(message, ignoreErrors));
}
function _isIgnoredTransaction(event, ignoreTransactions) {
  if (!ignoreTransactions?.length) {
    return false;
  }
  const name = event.transaction;
  return name ? stringMatchesSomePattern(name, ignoreTransactions) : false;
}
function _isDeniedUrl(event, denyUrls) {
  if (!denyUrls?.length) {
    return false;
  }
  const url = _getEventFilterUrl(event);
  return !url ? false : stringMatchesSomePattern(url, denyUrls);
}
function _isAllowedUrl(event, allowUrls) {
  if (!allowUrls?.length) {
    return true;
  }
  const url = _getEventFilterUrl(event);
  return !url ? true : stringMatchesSomePattern(url, allowUrls);
}
function _getLastValidUrl(frames = []) {
  for (let i = frames.length - 1; i >= 0; i--) {
    const frame = frames[i];
    if (frame && frame.filename !== "<anonymous>" && frame.filename !== "[native code]") {
      return frame.filename || null;
    }
  }
  return null;
}
function _getEventFilterUrl(event) {
  try {
    const rootException = [...event.exception?.values ?? []].reverse().find((value) => value.mechanism?.parent_id === void 0 && value.stacktrace?.frames?.length);
    const frames = rootException?.stacktrace?.frames;
    return frames ? _getLastValidUrl(frames) : null;
  } catch {
    DEBUG_BUILD$3 && debug.error(`Cannot extract url for event ${getEventDescription(event)}`);
    return null;
  }
}
function _isUselessError(event) {
  if (!event.exception?.values?.length) {
    return false;
  }
  return (
    // No top-level message
    !event.message && // There are no exception values that have a stacktrace, a non-generic-Error type or value
    !event.exception.values.some((value) => value.stacktrace || value.type && value.type !== "Error" || value.value)
  );
}
function applyAggregateErrorsToEvent(exceptionFromErrorImplementation, parser, key, limit, event, hint) {
  if (!event.exception?.values || !hint || !isInstanceOf(hint.originalException, Error)) {
    return;
  }
  const originalException = event.exception.values.length > 0 ? event.exception.values[event.exception.values.length - 1] : void 0;
  if (originalException) {
    event.exception.values = aggregateExceptionsFromError(
      exceptionFromErrorImplementation,
      parser,
      limit,
      hint.originalException,
      key,
      event.exception.values,
      originalException,
      0
    );
  }
}
function aggregateExceptionsFromError(exceptionFromErrorImplementation, parser, limit, error2, key, prevExceptions, exception, exceptionId) {
  if (prevExceptions.length >= limit + 1) {
    return prevExceptions;
  }
  let newExceptions = [...prevExceptions];
  if (isInstanceOf(error2[key], Error)) {
    applyExceptionGroupFieldsForParentException(exception, exceptionId, error2);
    const newException = exceptionFromErrorImplementation(parser, error2[key]);
    const newExceptionId = newExceptions.length;
    applyExceptionGroupFieldsForChildException(newException, key, newExceptionId, exceptionId);
    newExceptions = aggregateExceptionsFromError(
      exceptionFromErrorImplementation,
      parser,
      limit,
      error2[key],
      key,
      [newException, ...newExceptions],
      newException,
      newExceptionId
    );
  }
  if (isExceptionGroup(error2)) {
    error2.errors.forEach((childError, i) => {
      if (isInstanceOf(childError, Error)) {
        applyExceptionGroupFieldsForParentException(exception, exceptionId, error2);
        const newException = exceptionFromErrorImplementation(parser, childError);
        const newExceptionId = newExceptions.length;
        applyExceptionGroupFieldsForChildException(newException, `errors[${i}]`, newExceptionId, exceptionId);
        newExceptions = aggregateExceptionsFromError(
          exceptionFromErrorImplementation,
          parser,
          limit,
          childError,
          key,
          [newException, ...newExceptions],
          newException,
          newExceptionId
        );
      }
    });
  }
  return newExceptions;
}
function isExceptionGroup(error2) {
  return Array.isArray(error2.errors);
}
function applyExceptionGroupFieldsForParentException(exception, exceptionId, error2) {
  exception.mechanism = {
    handled: true,
    type: "auto.core.linked_errors",
    ...isExceptionGroup(error2) && { is_exception_group: true },
    ...exception.mechanism,
    exception_id: exceptionId
  };
}
function applyExceptionGroupFieldsForChildException(exception, source, exceptionId, parentId) {
  exception.mechanism = {
    handled: true,
    ...exception.mechanism,
    type: "chained",
    source,
    exception_id: exceptionId,
    parent_id: parentId
  };
}
const DEFAULT_KEY = "cause";
const DEFAULT_LIMIT = 5;
const INTEGRATION_NAME$8 = "LinkedErrors";
const _linkedErrorsIntegration = (options = {}) => {
  const limit = options.limit || DEFAULT_LIMIT;
  const key = options.key || DEFAULT_KEY;
  return {
    name: INTEGRATION_NAME$8,
    preprocessEvent(event, hint, client) {
      const options2 = client.getOptions();
      applyAggregateErrorsToEvent(exceptionFromError, options2.stackParser, key, limit, event, hint);
    }
  };
};
const linkedErrorsIntegration = defineIntegration(_linkedErrorsIntegration);
function addConsoleInstrumentationHandler(handler) {
  const type = "console";
  addHandler(type, handler);
  maybeInstrument(type, instrumentConsole);
}
function instrumentConsole() {
  if (!("console" in GLOBAL_OBJ)) {
    return;
  }
  CONSOLE_LEVELS.forEach(function(level) {
    if (!(level in GLOBAL_OBJ.console)) {
      return;
    }
    fill(GLOBAL_OBJ.console, level, function(originalConsoleMethod) {
      originalConsoleMethods[level] = originalConsoleMethod;
      return function(...args) {
        triggerHandlers("console", { args, level });
        const log2 = originalConsoleMethods[level];
        log2?.apply(GLOBAL_OBJ.console, args);
      };
    });
  });
}
function severityLevelFromString(level) {
  return level === "warn" ? "warning" : ["fatal", "error", "warning", "log", "info", "debug"].includes(level) ? level : "log";
}
const splitPathRe = /^(\S+:\\|\/?)([\s\S]*?)((?:\.{1,2}|[^/\\]+?|)(\.[^./\\]*|))(?:[/\\]*)$/;
function splitPath(filename) {
  const truncated = filename.length > 1024 ? `<truncated>${filename.slice(-1024)}` : filename;
  const parts = splitPathRe.exec(truncated);
  return parts ? parts.slice(1) : [];
}
function dirname(path2) {
  const result = splitPath(path2);
  const root = result[0] || "";
  let dir = result[1];
  if (!root && !dir) {
    return ".";
  }
  if (dir) {
    dir = dir.slice(0, dir.length - 1);
  }
  return root + dir;
}
const INTEGRATION_NAME$7 = "Console";
const consoleIntegration$1 = defineIntegration((options = {}) => {
  const levels = new Set(options.levels || CONSOLE_LEVELS);
  return {
    name: INTEGRATION_NAME$7,
    setup(client) {
      addConsoleInstrumentationHandler(({ args, level }) => {
        if (getClient() !== client || !levels.has(level)) {
          return;
        }
        addConsoleBreadcrumb(level, args);
      });
    }
  };
});
function addConsoleBreadcrumb(level, args) {
  const breadcrumb = {
    category: "console",
    data: {
      arguments: args,
      logger: "console"
    },
    level: severityLevelFromString(level),
    message: formatConsoleArgs(args)
  };
  if (level === "assert") {
    if (args[0] === false) {
      const assertionArgs = args.slice(1);
      breadcrumb.message = assertionArgs.length > 0 ? `Assertion failed: ${formatConsoleArgs(assertionArgs)}` : "Assertion failed";
      breadcrumb.data.arguments = assertionArgs;
    } else {
      return;
    }
  }
  addBreadcrumb(breadcrumb, {
    input: args,
    level
  });
}
function formatConsoleArgs(values) {
  return "util" in GLOBAL_OBJ && typeof GLOBAL_OBJ.util.format === "function" ? GLOBAL_OBJ.util.format(...values) : safeJoin(values, " ");
}
function getBreadcrumbLogLevelFromHttpStatusCode(statusCode) {
  if (statusCode === void 0) {
    return void 0;
  } else if (statusCode >= 400 && statusCode < 500) {
    return "warning";
  } else if (statusCode >= 500) {
    return "error";
  } else {
    return void 0;
  }
}
function filenameIsInApp(filename, isNative = false) {
  const isInternal = isNative || filename && // It's not internal if it's an absolute linux path
  !filename.startsWith("/") && // It's not internal if it's an absolute windows path
  !filename.match(/^[A-Z]:/) && // It's not internal if the path is starting with a dot
  !filename.startsWith(".") && // It's not internal if the frame has a protocol. In node, this is usually the case if the file got pre-processed with a bundler like webpack
  !filename.match(/^[a-zA-Z]([a-zA-Z0-9.\-+])*:\/\//);
  return !isInternal && filename !== void 0 && !filename.includes("node_modules/");
}
function node$1(getModule) {
  const FILENAME_MATCH = /^\s*[-]{4,}$/;
  const FULL_MATCH = /at (?:async )?(?:(.+?)\s+\()?(?:(.+):(\d+):(\d+)?|([^)]+))\)?/;
  const DATA_URI_MATCH = /at (?:async )?(.+?) \(data:(.*?),/;
  return (line) => {
    const dataUriMatch = line.match(DATA_URI_MATCH);
    if (dataUriMatch) {
      return {
        filename: `<data:${dataUriMatch[2]}>`,
        function: dataUriMatch[1]
      };
    }
    const lineMatch = line.match(FULL_MATCH);
    if (lineMatch) {
      let object;
      let method;
      let functionName;
      let typeName;
      let methodName;
      if (lineMatch[1]) {
        functionName = lineMatch[1];
        let methodStart = functionName.lastIndexOf(".");
        if (functionName[methodStart - 1] === ".") {
          methodStart--;
        }
        if (methodStart > 0) {
          object = functionName.slice(0, methodStart);
          method = functionName.slice(methodStart + 1);
          const objectEnd = object.indexOf(".Module");
          if (objectEnd > 0) {
            functionName = functionName.slice(objectEnd + 1);
            object = object.slice(0, objectEnd);
          }
        }
        typeName = void 0;
      }
      if (method) {
        typeName = object;
        methodName = method;
      }
      if (method === "<anonymous>") {
        methodName = void 0;
        functionName = void 0;
      }
      if (functionName === void 0) {
        methodName = methodName || UNKNOWN_FUNCTION;
        functionName = typeName ? `${typeName}.${methodName}` : methodName;
      }
      let filename = normalizeStackTracePath(lineMatch[2]);
      const isNative = lineMatch[5] === "native";
      if (!filename && lineMatch[5] && !isNative) {
        filename = lineMatch[5];
      }
      const maybeDecodedFilename = filename ? _safeDecodeURI(filename) : void 0;
      return {
        filename: maybeDecodedFilename ?? filename,
        module: maybeDecodedFilename && getModule?.(maybeDecodedFilename),
        function: functionName,
        lineno: _parseIntOrUndefined(lineMatch[3]),
        colno: _parseIntOrUndefined(lineMatch[4]),
        in_app: filenameIsInApp(filename || "", isNative)
      };
    }
    if (line.match(FILENAME_MATCH)) {
      return {
        filename: line
      };
    }
    return void 0;
  };
}
function nodeStackLineParser(getModule) {
  return [90, node$1(getModule)];
}
function _parseIntOrUndefined(input) {
  return parseInt(input || "", 10) || void 0;
}
function _safeDecodeURI(filename) {
  try {
    return decodeURI(filename);
  } catch {
    return void 0;
  }
}
function watchdogTimer(createTimer, pollInterval, anrThreshold, callback) {
  const timer = createTimer();
  let triggered = false;
  let enabled = true;
  setInterval(() => {
    const diffMs = timer.getTimeMs();
    if (triggered === false && diffMs > pollInterval + anrThreshold) {
      triggered = true;
      if (enabled) {
        callback();
      }
    }
    if (diffMs < pollInterval + anrThreshold) {
      triggered = false;
    }
  }, 20);
  return {
    poll: () => {
      timer.reset();
    },
    enabled: (state) => {
      enabled = state;
    }
  };
}
function callFrameToStackFrame(frame, url, getModuleFromFilename2) {
  const filename = url ? url.replace(/^file:\/\//, "") : void 0;
  const colno = frame.location.columnNumber ? frame.location.columnNumber + 1 : void 0;
  const lineno = frame.location.lineNumber ? frame.location.lineNumber + 1 : void 0;
  return {
    filename,
    module: getModuleFromFilename2(filename),
    function: frame.functionName || UNKNOWN_FUNCTION,
    colno,
    lineno,
    in_app: filename ? filenameIsInApp(filename) : void 0
  };
}
class LRUMap {
  constructor(_maxSize) {
    this._maxSize = _maxSize;
    this._cache = /* @__PURE__ */ new Map();
  }
  /** Get the current size of the cache */
  get size() {
    return this._cache.size;
  }
  /** Get an entry or undefined if it was not in the cache. Re-inserts to update the recently used order */
  get(key) {
    const value = this._cache.get(key);
    if (value === void 0) {
      return void 0;
    }
    this._cache.delete(key);
    this._cache.set(key, value);
    return value;
  }
  /** Insert an entry and evict an older entry if we've reached maxSize */
  set(key, value) {
    if (this._cache.size >= this._maxSize) {
      const nextKey = this._cache.keys().next().value;
      this._cache.delete(nextKey);
    }
    this._cache.set(key, value);
  }
  /** Remove an entry and return the entry if it was in the cache */
  remove(key) {
    const value = this._cache.get(key);
    if (value) {
      this._cache.delete(key);
    }
    return value;
  }
  /** Clear all entries */
  clear() {
    this._cache.clear();
  }
  /** Get all the keys */
  keys() {
    return Array.from(this._cache.keys());
  }
  /** Get all the values */
  values() {
    const values = [];
    this._cache.forEach((value) => values.push(value));
    return values;
  }
}
const INSTRUMENTED = {};
function generateInstrumentOnce(name, creatorOrClass, optionsCallback) {
  if (optionsCallback) {
    return _generateInstrumentOnceWithOptions(
      name,
      creatorOrClass,
      optionsCallback
    );
  }
  return _generateInstrumentOnce(name, creatorOrClass);
}
function _generateInstrumentOnce(name, creator) {
  return Object.assign(
    (options) => {
      const instrumented2 = INSTRUMENTED[name];
      if (instrumented2) {
        if (options) {
          instrumented2.setConfig(options);
        }
        return instrumented2;
      }
      const instrumentation = creator(options);
      INSTRUMENTED[name] = instrumentation;
      registerInstrumentations({
        instrumentations: [instrumentation]
      });
      return instrumentation;
    },
    { id: name }
  );
}
function _generateInstrumentOnceWithOptions(name, instrumentationClass, optionsCallback) {
  return Object.assign(
    (_options) => {
      const options = optionsCallback(_options);
      const instrumented2 = INSTRUMENTED[name];
      if (instrumented2) {
        instrumented2.setConfig(options);
        return instrumented2;
      }
      const instrumentation = new instrumentationClass(options);
      INSTRUMENTED[name] = instrumentation;
      registerInstrumentations({
        instrumentations: [instrumentation]
      });
      return instrumentation;
    },
    { id: name }
  );
}
const DEBUG_BUILD$2 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const SUPPRESS_TRACING_KEY = createContextKey("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function suppressTracing$1(context2) {
  return context2.setValue(SUPPRESS_TRACING_KEY, true);
}
function isTracingSuppressed(context2) {
  return context2.getValue(SUPPRESS_TRACING_KEY) === true;
}
const BAGGAGE_KEY_PAIR_SEPARATOR = "=";
const BAGGAGE_PROPERTIES_SEPARATOR = ";";
const BAGGAGE_ITEMS_SEPARATOR = ",";
const BAGGAGE_HEADER = "baggage";
const BAGGAGE_MAX_NAME_VALUE_PAIRS = 180;
const BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
const BAGGAGE_MAX_TOTAL_LENGTH = 8192;
function serializeKeyPairs(keyPairs) {
  return keyPairs.reduce((hValue, current) => {
    const value = `${hValue}${hValue !== "" ? BAGGAGE_ITEMS_SEPARATOR : ""}${current}`;
    return value.length > BAGGAGE_MAX_TOTAL_LENGTH ? hValue : value;
  }, "");
}
function getKeyPairs(baggage) {
  return baggage.getAllEntries().map(([key, value]) => {
    let entry = `${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`;
    if (value.metadata !== void 0) {
      entry += BAGGAGE_PROPERTIES_SEPARATOR + value.metadata.toString();
    }
    return entry;
  });
}
function parsePairKeyValue(entry) {
  if (!entry)
    return;
  const metadataSeparatorIndex = entry.indexOf(BAGGAGE_PROPERTIES_SEPARATOR);
  const keyPairPart = metadataSeparatorIndex === -1 ? entry : entry.substring(0, metadataSeparatorIndex);
  const separatorIndex = keyPairPart.indexOf(BAGGAGE_KEY_PAIR_SEPARATOR);
  if (separatorIndex <= 0)
    return;
  const rawKey = keyPairPart.substring(0, separatorIndex).trim();
  const rawValue = keyPairPart.substring(separatorIndex + 1).trim();
  if (!rawKey || !rawValue)
    return;
  let key;
  let value;
  try {
    key = decodeURIComponent(rawKey);
    value = decodeURIComponent(rawValue);
  } catch {
    return;
  }
  let metadata;
  if (metadataSeparatorIndex !== -1 && metadataSeparatorIndex < entry.length - 1) {
    const metadataString = entry.substring(metadataSeparatorIndex + 1);
    metadata = baggageEntryMetadataFromString(metadataString);
  }
  return { key, value, metadata };
}
class W3CBaggagePropagator {
  inject(context2, carrier, setter) {
    const baggage = propagation.getBaggage(context2);
    if (!baggage || isTracingSuppressed(context2))
      return;
    const keyPairs = getKeyPairs(baggage).filter((pair) => {
      return pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
    }).slice(0, BAGGAGE_MAX_NAME_VALUE_PAIRS);
    const headerValue = serializeKeyPairs(keyPairs);
    if (headerValue.length > 0) {
      setter.set(carrier, BAGGAGE_HEADER, headerValue);
    }
  }
  extract(context2, carrier, getter) {
    const headerValue = getter.get(carrier, BAGGAGE_HEADER);
    const baggageString = Array.isArray(headerValue) ? headerValue.join(BAGGAGE_ITEMS_SEPARATOR) : headerValue;
    if (!baggageString)
      return context2;
    const baggage = {};
    if (baggageString.length === 0) {
      return context2;
    }
    const pairs = baggageString.split(BAGGAGE_ITEMS_SEPARATOR);
    pairs.forEach((entry) => {
      const keyPair = parsePairKeyValue(entry);
      if (keyPair) {
        const baggageEntry = { value: keyPair.value };
        if (keyPair.metadata) {
          baggageEntry.metadata = keyPair.metadata;
        }
        baggage[keyPair.key] = baggageEntry;
      }
    });
    if (Object.entries(baggage).length === 0) {
      return context2;
    }
    return propagation.setBaggage(context2, propagation.createBaggage(baggage));
  }
  fields() {
    return [BAGGAGE_HEADER];
  }
}
function sanitizeAttributes(attributes2) {
  const out = {};
  if (typeof attributes2 !== "object" || attributes2 == null) {
    return out;
  }
  for (const key in attributes2) {
    if (!Object.prototype.hasOwnProperty.call(attributes2, key)) {
      continue;
    }
    if (!isAttributeKey(key)) {
      diag.warn(`Invalid attribute key: ${key}`);
      continue;
    }
    const val = attributes2[key];
    if (!isAttributeValue(val)) {
      diag.warn(`Invalid attribute value set for key: ${key}`);
      continue;
    }
    if (Array.isArray(val)) {
      out[key] = val.slice();
    } else {
      out[key] = val;
    }
  }
  return out;
}
function isAttributeKey(key) {
  return typeof key === "string" && key !== "";
}
function isAttributeValue(val) {
  if (val == null) {
    return true;
  }
  if (Array.isArray(val)) {
    return isHomogeneousAttributeValueArray(val);
  }
  return isValidPrimitiveAttributeValueType(typeof val);
}
function isHomogeneousAttributeValueArray(arr) {
  let type;
  for (const element of arr) {
    if (element == null)
      continue;
    const elementType = typeof element;
    if (elementType === type) {
      continue;
    }
    if (!type) {
      if (isValidPrimitiveAttributeValueType(elementType)) {
        type = elementType;
        continue;
      }
      return false;
    }
    return false;
  }
  return true;
}
function isValidPrimitiveAttributeValueType(valType) {
  switch (valType) {
    case "number":
    case "boolean":
    case "string":
      return true;
  }
  return false;
}
function loggingErrorHandler() {
  return (ex) => {
    diag.error(stringifyException(ex));
  };
}
function stringifyException(ex) {
  if (typeof ex === "string") {
    return ex;
  } else {
    return JSON.stringify(flattenException(ex));
  }
}
function flattenException(ex) {
  const result = {};
  let current = ex;
  while (current !== null) {
    Object.getOwnPropertyNames(current).forEach((propertyName) => {
      if (result[propertyName])
        return;
      const value = current[propertyName];
      if (value) {
        result[propertyName] = String(value);
      }
    });
    current = Object.getPrototypeOf(current);
  }
  return result;
}
let delegateHandler = loggingErrorHandler();
function globalErrorHandler(ex) {
  try {
    delegateHandler(ex);
  } catch {
  }
}
function getNumberFromEnv(key) {
  const raw = process.env[key];
  if (raw == null || raw.trim() === "") {
    return void 0;
  }
  const value = Number(raw);
  if (isNaN(value)) {
    diag.warn(`Unknown value ${inspect(raw)} for ${key}, expected a number, using defaults`);
    return void 0;
  }
  return value;
}
function getStringFromEnv(key) {
  const raw = process.env[key];
  if (raw == null || raw.trim() === "") {
    return void 0;
  }
  return raw;
}
const VERSION$1 = "2.7.1";
const ATTR_PROCESS_RUNTIME_NAME = "process.runtime.name";
const SDK_INFO = {
  [ATTR_TELEMETRY_SDK_NAME]: "opentelemetry",
  [ATTR_PROCESS_RUNTIME_NAME]: "node",
  [ATTR_TELEMETRY_SDK_LANGUAGE]: TELEMETRY_SDK_LANGUAGE_VALUE_NODEJS,
  [ATTR_TELEMETRY_SDK_VERSION]: VERSION$1
};
const otperformance = performance;
const NANOSECOND_DIGITS = 9;
const NANOSECOND_DIGITS_IN_MILLIS = 6;
const MILLISECONDS_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS_IN_MILLIS);
const SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
function millisToHrTime(epochMillis) {
  const epochSeconds = epochMillis / 1e3;
  const seconds = Math.trunc(epochSeconds);
  const nanos = Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS);
  return [seconds, nanos];
}
function hrTime(performanceNow) {
  const timeOrigin = millisToHrTime(otperformance.timeOrigin);
  const now = millisToHrTime(typeof performanceNow === "number" ? performanceNow : otperformance.now());
  return addHrTimes(timeOrigin, now);
}
function hrTimeDuration(startTime, endTime) {
  let seconds = endTime[0] - startTime[0];
  let nanos = endTime[1] - startTime[1];
  if (nanos < 0) {
    seconds -= 1;
    nanos += SECOND_TO_NANOSECONDS;
  }
  return [seconds, nanos];
}
function hrTimeToMilliseconds(time) {
  return time[0] * 1e3 + time[1] / 1e6;
}
function isTimeInputHrTime(value) {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
function isTimeInput(value) {
  return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
}
function addHrTimes(time1, time2) {
  const out = [time1[0] + time2[0], time1[1] + time2[1]];
  if (out[1] >= SECOND_TO_NANOSECONDS) {
    out[1] -= SECOND_TO_NANOSECONDS;
    out[0] += 1;
  }
  return out;
}
const VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
const VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
const VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
const VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
const VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
const INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
function validateKey(key) {
  return VALID_KEY_REGEX.test(key);
}
function validateValue(value) {
  return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}
const MAX_TRACE_STATE_ITEMS = 32;
const MAX_TRACE_STATE_LEN = 512;
const LIST_MEMBERS_SEPARATOR = ",";
const LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
class TraceState {
  _length;
  _rawTraceState;
  _internalState;
  constructor(rawTraceState) {
    this._rawTraceState = typeof rawTraceState === "string" ? rawTraceState : "";
    this._length = this._rawTraceState.length;
  }
  set(key, value) {
    if (!validateKey(key) || !validateValue(value)) {
      return this;
    }
    const currState = this._getState();
    const currValue = currState.get(key);
    let newLength = this._length;
    if (typeof currValue === "string") {
      newLength += value.length - currValue.length;
    } else {
      newLength += key.length + value.length + (currState.size > 0 ? 2 : 1);
    }
    if (newLength > MAX_TRACE_STATE_LEN) {
      return this;
    }
    const newState = new Map(currState);
    newState.delete(key);
    newState.set(key, value);
    return this._fromState(newState, newLength);
  }
  unset(key) {
    const currState = this._getState();
    const currValue = currState.get(key);
    if (typeof currValue !== "string") {
      return this;
    }
    let newLength = this._length - (key.length + currValue.length + 1);
    if (currState.size > 1) {
      newLength = newLength - 1;
    }
    const newState = new Map(currState);
    newState.delete(key);
    return this._fromState(newState, newLength);
  }
  get(key) {
    const currState = this._getState();
    return currState.get(key);
  }
  serialize() {
    let serialized = "";
    let index = 0;
    for (const entry of this._getState()) {
      if (index > 0) {
        serialized = LIST_MEMBERS_SEPARATOR + serialized;
      }
      serialized = `${entry[0]}${LIST_MEMBER_KEY_VALUE_SPLITTER}${entry[1]}` + serialized;
      index++;
    }
    return serialized;
  }
  _getState() {
    if (this._internalState) {
      return this._internalState;
    }
    const vendorMembers = this._rawTraceState.split(LIST_MEMBERS_SEPARATOR);
    const vendorEntries = /* @__PURE__ */ new Map();
    let currentLength = 0;
    for (const member of vendorMembers) {
      const m = member.trim();
      const idx = m.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
      if (idx === -1) {
        continue;
      }
      const key = m.slice(0, idx);
      const value = m.slice(idx + 1);
      if (!validateKey(key) || !validateValue(value)) {
        continue;
      }
      const futureLength = currentLength + m.length + (vendorEntries.size > 0 ? 1 : 0);
      if (futureLength > MAX_TRACE_STATE_LEN) {
        continue;
      }
      vendorEntries.set(key, value);
      currentLength = futureLength;
      if (vendorEntries.size >= MAX_TRACE_STATE_ITEMS) {
        break;
      }
    }
    this._length = currentLength;
    this._internalState = new Map(Array.from(vendorEntries.entries()).reverse());
    return this._internalState;
  }
  _fromState(state, length) {
    const traceState = Object.create(TraceState.prototype);
    traceState._internalState = state;
    traceState._length = length;
    return traceState;
  }
}
const objectTag = "[object Object]";
const nullTag = "[object Null]";
const undefinedTag = "[object Undefined]";
const funcProto = Function.prototype;
const funcToString = funcProto.toString;
const objectCtorString = funcToString.call(Object);
const getPrototypeOf = Object.getPrototypeOf;
const objectProto = Object.prototype;
const hasOwnProperty = objectProto.hasOwnProperty;
const symToStringTag = Symbol ? Symbol.toStringTag : void 0;
const nativeObjectToString = objectProto.toString;
function isPlainObject(value) {
  if (!isObjectLike(value) || baseGetTag(value) !== objectTag) {
    return false;
  }
  const proto = getPrototypeOf(value);
  if (proto === null) {
    return true;
  }
  const Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
  return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function getRawTag(value) {
  const isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
  let unmasked = false;
  try {
    value[symToStringTag] = void 0;
    unmasked = true;
  } catch {
  }
  const result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}
function objectToString(value) {
  return nativeObjectToString.call(value);
}
const MAX_LEVEL = 20;
function merge(...args) {
  let result = args.shift();
  const objects = /* @__PURE__ */ new WeakMap();
  while (args.length > 0) {
    result = mergeTwoObjects(result, args.shift(), 0, objects);
  }
  return result;
}
function takeValue(value) {
  if (isArray(value)) {
    return value.slice();
  }
  return value;
}
function mergeTwoObjects(one, two, level = 0, objects) {
  let result;
  if (level > MAX_LEVEL) {
    return void 0;
  }
  level++;
  if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) {
    result = takeValue(two);
  } else if (isArray(one)) {
    result = one.slice();
    if (isArray(two)) {
      for (let i = 0, j = two.length; i < j; i++) {
        result.push(takeValue(two[i]));
      }
    } else if (isObject(two)) {
      const keys = Object.keys(two);
      for (let i = 0, j = keys.length; i < j; i++) {
        const key = keys[i];
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          continue;
        }
        result[key] = takeValue(two[key]);
      }
    }
  } else if (isObject(one)) {
    if (isObject(two)) {
      if (!shouldMerge(one, two)) {
        return two;
      }
      result = Object.assign({}, one);
      const keys = Object.keys(two);
      for (let i = 0, j = keys.length; i < j; i++) {
        const key = keys[i];
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          continue;
        }
        const twoValue = two[key];
        if (isPrimitive(twoValue)) {
          if (typeof twoValue === "undefined") {
            delete result[key];
          } else {
            result[key] = twoValue;
          }
        } else {
          const obj1 = result[key];
          const obj2 = twoValue;
          if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) {
            delete result[key];
          } else {
            if (isObject(obj1) && isObject(obj2)) {
              const arr1 = objects.get(obj1) || [];
              const arr2 = objects.get(obj2) || [];
              arr1.push({ obj: one, key });
              arr2.push({ obj: two, key });
              objects.set(obj1, arr1);
              objects.set(obj2, arr2);
            }
            result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
          }
        }
      }
    } else {
      result = two;
    }
  }
  return result;
}
function wasObjectReferenced(obj, key, objects) {
  const arr = objects.get(obj[key]) || [];
  for (let i = 0, j = arr.length; i < j; i++) {
    const info2 = arr[i];
    if (info2.key === key && info2.obj === obj) {
      return true;
    }
  }
  return false;
}
function isArray(value) {
  return Array.isArray(value);
}
function isFunction(value) {
  return typeof value === "function";
}
function isObject(value) {
  return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
}
function isPrimitive(value) {
  return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
}
function shouldMerge(one, two) {
  if (!isPlainObject(one) || !isPlainObject(two)) {
    return false;
  }
  return true;
}
function mergeBaggageHeaders(existing, baggage) {
  if (!existing) {
    return baggage;
  }
  const existingBaggageEntries = parseBaggageHeader(existing);
  const newBaggageEntries = parseBaggageHeader(baggage);
  if (!newBaggageEntries) {
    return existing;
  }
  const newSentryEntries = {};
  const newNonSentryEntries = {};
  for (const [key, value] of Object.entries(newBaggageEntries)) {
    if (key.startsWith(SENTRY_BAGGAGE_KEY_PREFIX)) {
      newSentryEntries[key] = value;
    } else {
      newNonSentryEntries[key] = value;
    }
  }
  const hasNewSentryEntries = Object.keys(newSentryEntries).length > 0;
  const mergedBaggageEntries = {};
  if (existingBaggageEntries) {
    for (const [key, value] of Object.entries(existingBaggageEntries)) {
      if (hasNewSentryEntries && key.startsWith(SENTRY_BAGGAGE_KEY_PREFIX)) {
        continue;
      }
      mergedBaggageEntries[key] = value;
    }
  }
  Object.assign(mergedBaggageEntries, newSentryEntries);
  for (const [key, value] of Object.entries(newNonSentryEntries)) {
    if (!mergedBaggageEntries[key]) {
      mergedBaggageEntries[key] = value;
    }
  }
  return objectToBaggageHeader(mergedBaggageEntries);
}
const NODE_VERSION = parseSemver(process.versions.node);
const NODE_MAJOR = NODE_VERSION.major;
const NODE_MINOR = NODE_VERSION.minor;
const SENTRY_TRACE_HEADER$1 = "sentry-trace";
const SENTRY_BAGGAGE_HEADER$1 = "baggage";
const W3C_TRACEPARENT_HEADER = "traceparent";
function addTracePropagationHeadersToFetchRequest(request, propagationDecisionMap) {
  const url = getAbsoluteUrl$1(request.origin, request.path);
  const { tracePropagationTargets, propagateTraceparent } = getClient()?.getOptions() || {};
  const addedHeaders = shouldPropagateTraceForUrl(url, tracePropagationTargets, propagationDecisionMap) ? getTraceData$1({ propagateTraceparent }) : void 0;
  if (!addedHeaders) {
    return;
  }
  const { "sentry-trace": sentryTrace, baggage, traceparent } = addedHeaders;
  const requestHeaders = Array.isArray(request.headers) ? normalizeUndiciHeaderPairs(request.headers) : stringToArrayHeaders(request.headers);
  _deduplicateArrayHeader(requestHeaders, SENTRY_TRACE_HEADER$1);
  _deduplicateArrayHeader(requestHeaders, SENTRY_BAGGAGE_HEADER$1);
  if (propagateTraceparent) {
    _deduplicateArrayHeader(requestHeaders, W3C_TRACEPARENT_HEADER);
  }
  const hasExistingSentryTraceHeader = _findExistingHeaderIndex(requestHeaders, SENTRY_TRACE_HEADER$1) !== -1;
  if (!hasExistingSentryTraceHeader) {
    if (sentryTrace) {
      requestHeaders.push(SENTRY_TRACE_HEADER$1, sentryTrace);
    }
    if (traceparent && _findExistingHeaderIndex(requestHeaders, "traceparent") === -1) {
      requestHeaders.push("traceparent", traceparent);
    }
    const existingBaggageIndex = _findExistingHeaderIndex(requestHeaders, SENTRY_BAGGAGE_HEADER$1);
    if (baggage && existingBaggageIndex === -1) {
      requestHeaders.push(SENTRY_BAGGAGE_HEADER$1, baggage);
    } else if (baggage) {
      const existingBaggageValue = requestHeaders[existingBaggageIndex + 1];
      const merged = mergeBaggageHeaders(existingBaggageValue, baggage);
      if (merged) {
        requestHeaders[existingBaggageIndex + 1] = merged;
      }
    }
  }
  if (Array.isArray(request.headers)) {
    request.headers.splice(0, request.headers.length, ...requestHeaders);
  } else {
    request.headers = arrayToStringHeaders(requestHeaders);
  }
}
function normalizeUndiciHeaderPairs(headers) {
  const out = [];
  for (let i = 0; i < headers.length; i++) {
    const entry = headers[i];
    if (i % 2 === 0) {
      out.push(typeof entry === "string" ? entry : String(entry));
    } else {
      out.push(Array.isArray(entry) ? entry.join(", ") : entry ?? "");
    }
  }
  return out;
}
function stringToArrayHeaders(requestHeaders) {
  const headersArray = requestHeaders.split("\r\n");
  const headers = [];
  for (const header of headersArray) {
    try {
      const colonIndex = header.indexOf(":");
      if (colonIndex === -1) {
        continue;
      }
      const key = header.slice(0, colonIndex).trim();
      const value = header.slice(colonIndex + 1).trim();
      if (key) {
        headers.push(key, value);
      }
    } catch {
      debug.warn(`Failed to convert string request header to array header: ${header}`);
    }
  }
  return headers;
}
function arrayToStringHeaders(headers) {
  const headerPairs = [];
  for (let i = 0; i < headers.length; i += 2) {
    const key = headers[i];
    const value = headers[i + 1];
    if (!key || value == null) {
      continue;
    }
    headerPairs.push(`${key}: ${value}`);
  }
  if (!headerPairs.length) {
    return "";
  }
  return headerPairs.join("\r\n").concat("\r\n");
}
function _deduplicateArrayHeader(headers, headerName) {
  let firstIndex = -1;
  for (let i = 0; i < headers.length; i += 2) {
    if (headers[i] !== headerName) {
      continue;
    }
    if (firstIndex === -1) {
      firstIndex = i;
      continue;
    }
    const firstHeaderValue = headers[firstIndex + 1];
    if (headerName === SENTRY_BAGGAGE_HEADER$1 && firstHeaderValue) {
      const merged = mergeBaggageHeaders(headers[i + 1], firstHeaderValue);
      if (merged) {
        headers[firstIndex + 1] = merged;
      }
    }
    headers.splice(i, 2);
    i -= 2;
  }
}
function _findExistingHeaderIndex(headers, name) {
  return headers.findIndex((header, i) => i % 2 === 0 && header === name);
}
function addFetchRequestBreadcrumb(request, response) {
  const data = getBreadcrumbData(request);
  const statusCode = response.statusCode;
  const level = getBreadcrumbLogLevelFromHttpStatusCode(statusCode);
  addBreadcrumb(
    {
      category: "http",
      data: {
        status_code: statusCode,
        ...data
      },
      type: "http",
      level
    },
    {
      event: "response",
      request,
      response
    }
  );
}
function getBreadcrumbData(request) {
  try {
    const url = getAbsoluteUrl$1(request.origin, request.path);
    const parsedUrl = parseUrl(url);
    const data = {
      url: getSanitizedUrlString(parsedUrl),
      "http.method": request.method || "GET"
    };
    if (parsedUrl.search) {
      data["http.query"] = parsedUrl.search;
    }
    if (parsedUrl.hash) {
      data["http.fragment"] = parsedUrl.hash;
    }
    return data;
  } catch {
    return {};
  }
}
function getAbsoluteUrl$1(origin, path2 = "/") {
  try {
    const url = new URL(path2, origin);
    return url.toString();
  } catch {
    const url = `${origin}`;
    if (url.endsWith("/") && path2.startsWith("/")) {
      return `${url}${path2.slice(1)}`;
    }
    if (!url.endsWith("/") && !path2.startsWith("/")) {
      return `${url}/${path2}`;
    }
    return `${url}${path2}`;
  }
}
class SentryNodeFetchInstrumentation extends InstrumentationBase {
  // Keep ref to avoid https://github.com/nodejs/node/issues/42170 bug and for
  // unsubscribing.
  constructor(config = {}) {
    super("@sentry/instrumentation-node-fetch", SDK_VERSION$1, config);
    this._channelSubs = [];
    this._propagationDecisionMap = new LRUMap(100);
    this._ignoreOutgoingRequestsMap = /* @__PURE__ */ new WeakMap();
  }
  /** No need to instrument files/modules. */
  init() {
    return void 0;
  }
  /** Disable the instrumentation. */
  disable() {
    super.disable();
    this._channelSubs.forEach((sub) => sub.unsubscribe());
    this._channelSubs = [];
  }
  /** Enable the instrumentation. */
  enable() {
    super.enable();
    this._channelSubs = this._channelSubs || [];
    if (this._channelSubs.length > 0) {
      return;
    }
    this._subscribeToChannel("undici:request:create", this._onRequestCreated.bind(this));
    this._subscribeToChannel("undici:request:headers", this._onResponseHeaders.bind(this));
  }
  /**
   * This method is called when a request is created.
   * You can still mutate the request here before it is sent.
   */
  _onRequestCreated({ request }) {
    const config = this.getConfig();
    const enabled = config.enabled !== false;
    if (!enabled) {
      return;
    }
    const shouldIgnore = this._shouldIgnoreOutgoingRequest(request);
    this._ignoreOutgoingRequestsMap.set(request, shouldIgnore);
    if (shouldIgnore) {
      return;
    }
    if (config.tracePropagation !== false) {
      addTracePropagationHeadersToFetchRequest(request, this._propagationDecisionMap);
    }
  }
  /**
   * This method is called when a response is received.
   */
  _onResponseHeaders({ request, response }) {
    const config = this.getConfig();
    const enabled = config.enabled !== false;
    if (!enabled) {
      return;
    }
    const _breadcrumbs = config.breadcrumbs;
    const breadCrumbsEnabled = typeof _breadcrumbs === "undefined" ? true : _breadcrumbs;
    const shouldIgnore = this._ignoreOutgoingRequestsMap.get(request);
    if (breadCrumbsEnabled && !shouldIgnore) {
      addFetchRequestBreadcrumb(request, response);
    }
  }
  /** Subscribe to a diagnostics channel. */
  _subscribeToChannel(diagnosticChannel, onMessage) {
    const useNewSubscribe = NODE_MAJOR > 18 || NODE_MAJOR === 18 && NODE_MINOR >= 19;
    let unsubscribe;
    if (useNewSubscribe) {
      diagch.subscribe?.(diagnosticChannel, onMessage);
      unsubscribe = () => diagch.unsubscribe?.(diagnosticChannel, onMessage);
    } else {
      const channel = diagch.channel(diagnosticChannel);
      channel.subscribe(onMessage);
      unsubscribe = () => channel.unsubscribe(onMessage);
    }
    this._channelSubs.push({
      name: diagnosticChannel,
      unsubscribe
    });
  }
  /**
   * Check if the given outgoing request should be ignored.
   */
  _shouldIgnoreOutgoingRequest(request) {
    if (isTracingSuppressed(context.active())) {
      return true;
    }
    const url = getAbsoluteUrl$1(request.origin, request.path);
    const ignoreOutgoingRequests = this.getConfig().ignoreOutgoingRequests;
    if (typeof ignoreOutgoingRequests !== "function" || !url) {
      return false;
    }
    return ignoreOutgoingRequests(url);
  }
}
const DEBUG_BUILD$1 = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
let serviceName;
function defaultServiceName() {
  if (serviceName === void 0) {
    try {
      const argv0 = globalThis.process.argv0;
      serviceName = argv0 ? `unknown_service:${argv0}` : "unknown_service";
    } catch {
      serviceName = "unknown_service";
    }
  }
  return serviceName;
}
const isPromiseLike = (val) => {
  return val !== null && typeof val === "object" && typeof val.then === "function";
};
class ResourceImpl {
  _rawAttributes;
  _asyncAttributesPending = false;
  _schemaUrl;
  _memoizedAttributes;
  static FromAttributeList(attributes2, options) {
    const res = new ResourceImpl({}, options);
    res._rawAttributes = guardedRawAttributes(attributes2);
    res._asyncAttributesPending = attributes2.filter(([_, val]) => isPromiseLike(val)).length > 0;
    return res;
  }
  constructor(resource, options) {
    const attributes2 = resource.attributes ?? {};
    this._rawAttributes = Object.entries(attributes2).map(([k, v]) => {
      if (isPromiseLike(v)) {
        this._asyncAttributesPending = true;
      }
      return [k, v];
    });
    this._rawAttributes = guardedRawAttributes(this._rawAttributes);
    this._schemaUrl = validateSchemaUrl(options?.schemaUrl);
  }
  get asyncAttributesPending() {
    return this._asyncAttributesPending;
  }
  async waitForAsyncAttributes() {
    if (!this.asyncAttributesPending) {
      return;
    }
    for (let i = 0; i < this._rawAttributes.length; i++) {
      const [k, v] = this._rawAttributes[i];
      this._rawAttributes[i] = [k, isPromiseLike(v) ? await v : v];
    }
    this._asyncAttributesPending = false;
  }
  get attributes() {
    if (this.asyncAttributesPending) {
      diag.error("Accessing resource attributes before async attributes settled");
    }
    if (this._memoizedAttributes) {
      return this._memoizedAttributes;
    }
    const attrs = {};
    for (const [k, v] of this._rawAttributes) {
      if (isPromiseLike(v)) {
        diag.debug(`Unsettled resource attribute ${k} skipped`);
        continue;
      }
      if (v != null) {
        attrs[k] ??= v;
      }
    }
    if (!this._asyncAttributesPending) {
      this._memoizedAttributes = attrs;
    }
    return attrs;
  }
  getRawAttributes() {
    return this._rawAttributes;
  }
  get schemaUrl() {
    return this._schemaUrl;
  }
  merge(resource) {
    if (resource == null)
      return this;
    const mergedSchemaUrl = mergeSchemaUrl(this, resource);
    const mergedOptions = mergedSchemaUrl ? { schemaUrl: mergedSchemaUrl } : void 0;
    return ResourceImpl.FromAttributeList([...resource.getRawAttributes(), ...this.getRawAttributes()], mergedOptions);
  }
}
function resourceFromAttributes(attributes2, options) {
  return ResourceImpl.FromAttributeList(Object.entries(attributes2), options);
}
function defaultResource() {
  return resourceFromAttributes({
    [ATTR_SERVICE_NAME]: defaultServiceName(),
    [ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
    [ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
    [ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION]
  });
}
function guardedRawAttributes(attributes2) {
  return attributes2.map(([k, v]) => {
    if (isPromiseLike(v)) {
      return [
        k,
        v.catch((err) => {
          diag.debug("promise rejection for resource attribute: %s - %s", k, err);
          return void 0;
        })
      ];
    }
    return [k, v];
  });
}
function validateSchemaUrl(schemaUrl) {
  if (typeof schemaUrl === "string" || schemaUrl === void 0) {
    return schemaUrl;
  }
  diag.warn("Schema URL must be string or undefined, got %s. Schema URL will be ignored.", schemaUrl);
  return void 0;
}
function mergeSchemaUrl(old, updating) {
  const oldSchemaUrl = old?.schemaUrl;
  const updatingSchemaUrl = updating?.schemaUrl;
  const isOldEmpty = oldSchemaUrl === void 0 || oldSchemaUrl === "";
  const isUpdatingEmpty = updatingSchemaUrl === void 0 || updatingSchemaUrl === "";
  if (isOldEmpty) {
    return updatingSchemaUrl;
  }
  if (isUpdatingEmpty) {
    return oldSchemaUrl;
  }
  if (oldSchemaUrl === updatingSchemaUrl) {
    return oldSchemaUrl;
  }
  diag.warn('Schema URL merge conflict: old resource has "%s", updating resource has "%s". Resulting resource will have undefined Schema URL.', oldSchemaUrl, updatingSchemaUrl);
  return void 0;
}
const ExceptionEventName = "exception";
class SpanImpl {
  // Below properties are included to implement ReadableSpan for export
  // purposes but are not intended to be written-to directly.
  _spanContext;
  kind;
  parentSpanContext;
  attributes = {};
  links = [];
  events = [];
  startTime;
  resource;
  instrumentationScope;
  _droppedAttributesCount = 0;
  _droppedEventsCount = 0;
  _droppedLinksCount = 0;
  _attributesCount = 0;
  name;
  status = {
    code: SpanStatusCode.UNSET
  };
  endTime = [0, 0];
  _ended = false;
  _duration = [-1, -1];
  _spanProcessor;
  _spanLimits;
  _attributeValueLengthLimit;
  _recordEndMetrics;
  _performanceStartTime;
  _performanceOffset;
  _startTimeProvided;
  /**
   * Constructs a new SpanImpl instance.
   */
  constructor(opts) {
    const now = Date.now();
    this._spanContext = opts.spanContext;
    this._performanceStartTime = otperformance.now();
    this._performanceOffset = now - (this._performanceStartTime + otperformance.timeOrigin);
    this._startTimeProvided = opts.startTime != null;
    this._spanLimits = opts.spanLimits;
    this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit ?? 0;
    this._spanProcessor = opts.spanProcessor;
    this.name = opts.name;
    this.parentSpanContext = opts.parentSpanContext;
    this.kind = opts.kind;
    if (opts.links) {
      for (const link of opts.links) {
        this.addLink(link);
      }
    }
    this.startTime = this._getTime(opts.startTime ?? now);
    this.resource = opts.resource;
    this.instrumentationScope = opts.scope;
    this._recordEndMetrics = opts.recordEndMetrics;
    if (opts.attributes != null) {
      this.setAttributes(opts.attributes);
    }
    this._spanProcessor.onStart(this, opts.context);
  }
  spanContext() {
    return this._spanContext;
  }
  setAttribute(key, value) {
    if (value == null || this._isSpanEnded())
      return this;
    if (key.length === 0) {
      diag.warn(`Invalid attribute key: ${key}`);
      return this;
    }
    if (!isAttributeValue(value)) {
      diag.warn(`Invalid attribute value set for key: ${key}`);
      return this;
    }
    const { attributeCountLimit } = this._spanLimits;
    const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
    if (attributeCountLimit !== void 0 && this._attributesCount >= attributeCountLimit && isNewKey) {
      this._droppedAttributesCount++;
      return this;
    }
    this.attributes[key] = this._truncateToSize(value);
    if (isNewKey) {
      this._attributesCount++;
    }
    return this;
  }
  setAttributes(attributes2) {
    for (const key in attributes2) {
      if (Object.prototype.hasOwnProperty.call(attributes2, key)) {
        this.setAttribute(key, attributes2[key]);
      }
    }
    return this;
  }
  /**
   *
   * @param name Span Name
   * @param [attributesOrStartTime] Span attributes or start time
   *     if type is {@type TimeInput} and 3rd param is undefined
   * @param [timeStamp] Specified time stamp for the event
   */
  addEvent(name, attributesOrStartTime, timeStamp) {
    if (this._isSpanEnded())
      return this;
    const { eventCountLimit } = this._spanLimits;
    if (eventCountLimit === 0) {
      diag.warn("No events allowed.");
      this._droppedEventsCount++;
      return this;
    }
    if (eventCountLimit !== void 0 && this.events.length >= eventCountLimit) {
      if (this._droppedEventsCount === 0) {
        diag.debug("Dropping extra events.");
      }
      this.events.shift();
      this._droppedEventsCount++;
    }
    if (isTimeInput(attributesOrStartTime)) {
      if (!isTimeInput(timeStamp)) {
        timeStamp = attributesOrStartTime;
      }
      attributesOrStartTime = void 0;
    }
    const sanitized = sanitizeAttributes(attributesOrStartTime);
    const { attributePerEventCountLimit } = this._spanLimits;
    const attributes2 = {};
    let droppedAttributesCount = 0;
    let eventAttributesCount = 0;
    for (const attr in sanitized) {
      if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
        continue;
      }
      const attrVal = sanitized[attr];
      if (attributePerEventCountLimit !== void 0 && eventAttributesCount >= attributePerEventCountLimit) {
        droppedAttributesCount++;
        continue;
      }
      attributes2[attr] = this._truncateToSize(attrVal);
      eventAttributesCount++;
    }
    this.events.push({
      name,
      attributes: attributes2,
      time: this._getTime(timeStamp),
      droppedAttributesCount
    });
    return this;
  }
  addLink(link) {
    if (this._isSpanEnded())
      return this;
    const { linkCountLimit } = this._spanLimits;
    if (linkCountLimit === 0) {
      this._droppedLinksCount++;
      return this;
    }
    if (linkCountLimit !== void 0 && this.links.length >= linkCountLimit) {
      if (this._droppedLinksCount === 0) {
        diag.debug("Dropping extra links.");
      }
      this.links.shift();
      this._droppedLinksCount++;
    }
    const { attributePerLinkCountLimit } = this._spanLimits;
    const sanitized = sanitizeAttributes(link.attributes);
    const attributes2 = {};
    let droppedAttributesCount = 0;
    let linkAttributesCount = 0;
    for (const attr in sanitized) {
      if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) {
        continue;
      }
      const attrVal = sanitized[attr];
      if (attributePerLinkCountLimit !== void 0 && linkAttributesCount >= attributePerLinkCountLimit) {
        droppedAttributesCount++;
        continue;
      }
      attributes2[attr] = this._truncateToSize(attrVal);
      linkAttributesCount++;
    }
    const processedLink = { context: link.context };
    if (linkAttributesCount > 0) {
      processedLink.attributes = attributes2;
    }
    if (droppedAttributesCount > 0) {
      processedLink.droppedAttributesCount = droppedAttributesCount;
    }
    this.links.push(processedLink);
    return this;
  }
  addLinks(links) {
    for (const link of links) {
      this.addLink(link);
    }
    return this;
  }
  setStatus(status) {
    if (this._isSpanEnded())
      return this;
    if (status.code === SpanStatusCode.UNSET)
      return this;
    if (this.status.code === SpanStatusCode.OK)
      return this;
    const newStatus = { code: status.code };
    if (status.code === SpanStatusCode.ERROR) {
      if (typeof status.message === "string") {
        newStatus.message = status.message;
      } else if (status.message != null) {
        diag.warn(`Dropping invalid status.message of type '${typeof status.message}', expected 'string'`);
      }
    }
    this.status = newStatus;
    return this;
  }
  updateName(name) {
    if (this._isSpanEnded())
      return this;
    this.name = name;
    return this;
  }
  end(endTime) {
    if (this._isSpanEnded()) {
      diag.error(`${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`);
      return;
    }
    this.endTime = this._getTime(endTime);
    this._duration = hrTimeDuration(this.startTime, this.endTime);
    if (this._duration[0] < 0) {
      diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
      this.endTime = this.startTime.slice();
      this._duration = [0, 0];
    }
    if (this._droppedEventsCount > 0) {
      diag.warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`);
    }
    if (this._droppedLinksCount > 0) {
      diag.warn(`Dropped ${this._droppedLinksCount} links because linkCountLimit reached`);
    }
    if (this._spanProcessor.onEnding) {
      this._spanProcessor.onEnding(this);
    }
    this._recordEndMetrics?.();
    this._ended = true;
    this._spanProcessor.onEnd(this);
  }
  _getTime(inp) {
    if (typeof inp === "number" && inp <= otperformance.now()) {
      return hrTime(inp + this._performanceOffset);
    }
    if (typeof inp === "number") {
      return millisToHrTime(inp);
    }
    if (inp instanceof Date) {
      return millisToHrTime(inp.getTime());
    }
    if (isTimeInputHrTime(inp)) {
      return inp;
    }
    if (this._startTimeProvided) {
      return millisToHrTime(Date.now());
    }
    const msDuration = otperformance.now() - this._performanceStartTime;
    return addHrTimes(this.startTime, millisToHrTime(msDuration));
  }
  isRecording() {
    return this._ended === false;
  }
  recordException(exception, time) {
    const attributes2 = {};
    if (typeof exception === "string") {
      attributes2[ATTR_EXCEPTION_MESSAGE] = exception;
    } else if (exception) {
      if (exception.code) {
        attributes2[ATTR_EXCEPTION_TYPE] = exception.code.toString();
      } else if (exception.name) {
        attributes2[ATTR_EXCEPTION_TYPE] = exception.name;
      }
      if (exception.message) {
        attributes2[ATTR_EXCEPTION_MESSAGE] = exception.message;
      }
      if (exception.stack) {
        attributes2[ATTR_EXCEPTION_STACKTRACE] = exception.stack;
      }
    }
    if (attributes2[ATTR_EXCEPTION_TYPE] || attributes2[ATTR_EXCEPTION_MESSAGE]) {
      this.addEvent(ExceptionEventName, attributes2, time);
    } else {
      diag.warn(`Failed to record an exception ${exception}`);
    }
  }
  get duration() {
    return this._duration;
  }
  get ended() {
    return this._ended;
  }
  get droppedAttributesCount() {
    return this._droppedAttributesCount;
  }
  get droppedEventsCount() {
    return this._droppedEventsCount;
  }
  get droppedLinksCount() {
    return this._droppedLinksCount;
  }
  _isSpanEnded() {
    if (this._ended) {
      const error2 = new Error(`Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`);
      diag.warn(`Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`, error2);
    }
    return this._ended;
  }
  // Utility function to truncate given value within size
  // for value type of string, will truncate to given limit
  // for type of non-string, will return same value
  _truncateToLimitUtil(value, limit) {
    if (value.length <= limit) {
      return value;
    }
    return value.substring(0, limit);
  }
  /**
   * If the given attribute value is of type string and has more characters than given {@code attributeValueLengthLimit} then
   * return string with truncated to {@code attributeValueLengthLimit} characters
   *
   * If the given attribute value is array of strings then
   * return new array of strings with each element truncated to {@code attributeValueLengthLimit} characters
   *
   * Otherwise return same Attribute {@code value}
   *
   * @param value Attribute value
   * @returns truncated attribute value if required, otherwise same value
   */
  _truncateToSize(value) {
    const limit = this._attributeValueLengthLimit;
    if (limit <= 0) {
      diag.warn(`Attribute value limit must be positive, got ${limit}`);
      return value;
    }
    if (typeof value === "string") {
      return this._truncateToLimitUtil(value, limit);
    }
    if (Array.isArray(value)) {
      return value.map((val) => typeof val === "string" ? this._truncateToLimitUtil(val, limit) : val);
    }
    return value;
  }
}
var SamplingDecision;
(function(SamplingDecision2) {
  SamplingDecision2[SamplingDecision2["NOT_RECORD"] = 0] = "NOT_RECORD";
  SamplingDecision2[SamplingDecision2["RECORD"] = 1] = "RECORD";
  SamplingDecision2[SamplingDecision2["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));
class AlwaysOffSampler {
  shouldSample() {
    return {
      decision: SamplingDecision.NOT_RECORD
    };
  }
  toString() {
    return "AlwaysOffSampler";
  }
}
class AlwaysOnSampler {
  shouldSample() {
    return {
      decision: SamplingDecision.RECORD_AND_SAMPLED
    };
  }
  toString() {
    return "AlwaysOnSampler";
  }
}
class ParentBasedSampler {
  _root;
  _remoteParentSampled;
  _remoteParentNotSampled;
  _localParentSampled;
  _localParentNotSampled;
  constructor(config) {
    this._root = config.root;
    if (!this._root) {
      globalErrorHandler(new Error("ParentBasedSampler must have a root sampler configured"));
      this._root = new AlwaysOnSampler();
    }
    this._remoteParentSampled = config.remoteParentSampled ?? new AlwaysOnSampler();
    this._remoteParentNotSampled = config.remoteParentNotSampled ?? new AlwaysOffSampler();
    this._localParentSampled = config.localParentSampled ?? new AlwaysOnSampler();
    this._localParentNotSampled = config.localParentNotSampled ?? new AlwaysOffSampler();
  }
  shouldSample(context2, traceId, spanName, spanKind, attributes2, links) {
    const parentContext = trace.getSpanContext(context2);
    if (!parentContext || !isSpanContextValid(parentContext)) {
      return this._root.shouldSample(context2, traceId, spanName, spanKind, attributes2, links);
    }
    if (parentContext.isRemote) {
      if (parentContext.traceFlags & TraceFlags.SAMPLED) {
        return this._remoteParentSampled.shouldSample(context2, traceId, spanName, spanKind, attributes2, links);
      }
      return this._remoteParentNotSampled.shouldSample(context2, traceId, spanName, spanKind, attributes2, links);
    }
    if (parentContext.traceFlags & TraceFlags.SAMPLED) {
      return this._localParentSampled.shouldSample(context2, traceId, spanName, spanKind, attributes2, links);
    }
    return this._localParentNotSampled.shouldSample(context2, traceId, spanName, spanKind, attributes2, links);
  }
  toString() {
    return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
  }
}
class TraceIdRatioBasedSampler {
  _ratio;
  _upperBound;
  constructor(ratio = 0) {
    this._ratio = this._normalize(ratio);
    this._upperBound = Math.floor(this._ratio * 4294967295);
  }
  shouldSample(context2, traceId) {
    return {
      decision: isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD
    };
  }
  toString() {
    return `TraceIdRatioBased{${this._ratio}}`;
  }
  _normalize(ratio) {
    if (typeof ratio !== "number" || isNaN(ratio))
      return 0;
    return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
  }
  _accumulate(traceId) {
    let accumulation = 0;
    for (let i = 0; i < 32; i += 8) {
      let part = 0;
      for (let j = 0; j < 8; j++) {
        const c = traceId.charCodeAt(i + j);
        const v = c < 58 ? c - 48 : c < 71 ? c - 55 : c - 87;
        part = part << 4 | v;
      }
      accumulation = (accumulation ^ part) >>> 0;
    }
    return accumulation;
  }
}
var TracesSamplerValues;
(function(TracesSamplerValues2) {
  TracesSamplerValues2["AlwaysOff"] = "always_off";
  TracesSamplerValues2["AlwaysOn"] = "always_on";
  TracesSamplerValues2["ParentBasedAlwaysOff"] = "parentbased_always_off";
  TracesSamplerValues2["ParentBasedAlwaysOn"] = "parentbased_always_on";
  TracesSamplerValues2["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
  TracesSamplerValues2["TraceIdRatio"] = "traceidratio";
})(TracesSamplerValues || (TracesSamplerValues = {}));
const DEFAULT_RATIO = 1;
function loadDefaultConfig() {
  return {
    sampler: buildSamplerFromEnv(),
    forceFlushTimeoutMillis: 3e4,
    generalLimits: {
      attributeValueLengthLimit: getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? 128
    },
    spanLimits: {
      attributeValueLengthLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? Infinity,
      attributeCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? 128,
      linkCountLimit: getNumberFromEnv("OTEL_SPAN_LINK_COUNT_LIMIT") ?? 128,
      eventCountLimit: getNumberFromEnv("OTEL_SPAN_EVENT_COUNT_LIMIT") ?? 128,
      attributePerEventCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_EVENT_COUNT_LIMIT") ?? 128,
      attributePerLinkCountLimit: getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_PER_LINK_COUNT_LIMIT") ?? 128
    }
  };
}
function buildSamplerFromEnv() {
  const sampler = getStringFromEnv("OTEL_TRACES_SAMPLER") ?? TracesSamplerValues.ParentBasedAlwaysOn;
  switch (sampler) {
    case TracesSamplerValues.AlwaysOn:
      return new AlwaysOnSampler();
    case TracesSamplerValues.AlwaysOff:
      return new AlwaysOffSampler();
    case TracesSamplerValues.ParentBasedAlwaysOn:
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
    case TracesSamplerValues.ParentBasedAlwaysOff:
      return new ParentBasedSampler({
        root: new AlwaysOffSampler()
      });
    case TracesSamplerValues.TraceIdRatio:
      return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv());
    case TracesSamplerValues.ParentBasedTraceIdRatio:
      return new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv())
      });
    default:
      diag.error(`OTEL_TRACES_SAMPLER value "${sampler}" invalid, defaulting to "${TracesSamplerValues.ParentBasedAlwaysOn}".`);
      return new ParentBasedSampler({
        root: new AlwaysOnSampler()
      });
  }
}
function getSamplerProbabilityFromEnv() {
  const probability = getNumberFromEnv("OTEL_TRACES_SAMPLER_ARG");
  if (probability == null) {
    diag.error(`OTEL_TRACES_SAMPLER_ARG is blank, defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  if (probability < 0 || probability > 1) {
    diag.error(`OTEL_TRACES_SAMPLER_ARG=${probability} was given, but it is out of range ([0..1]), defaulting to ${DEFAULT_RATIO}.`);
    return DEFAULT_RATIO;
  }
  return probability;
}
const DEFAULT_ATTRIBUTE_COUNT_LIMIT = 128;
const DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT = Infinity;
function mergeConfig(userConfig) {
  const perInstanceDefaults = {
    sampler: buildSamplerFromEnv()
  };
  const DEFAULT_CONFIG = loadDefaultConfig();
  const target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
  target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
  target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
  return target;
}
function reconfigureLimits(userConfig) {
  const spanLimits = Object.assign({}, userConfig.spanLimits);
  spanLimits.attributeCountLimit = userConfig.spanLimits?.attributeCountLimit ?? userConfig.generalLimits?.attributeCountLimit ?? getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT") ?? getNumberFromEnv("OTEL_ATTRIBUTE_COUNT_LIMIT") ?? DEFAULT_ATTRIBUTE_COUNT_LIMIT;
  spanLimits.attributeValueLengthLimit = userConfig.spanLimits?.attributeValueLengthLimit ?? userConfig.generalLimits?.attributeValueLengthLimit ?? getNumberFromEnv("OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? getNumberFromEnv("OTEL_ATTRIBUTE_VALUE_LENGTH_LIMIT") ?? DEFAULT_ATTRIBUTE_VALUE_LENGTH_LIMIT;
  return Object.assign({}, userConfig, { spanLimits });
}
const SPAN_ID_BYTES = 8;
const TRACE_ID_BYTES = 16;
class RandomIdGenerator {
  /**
   * Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
   * characters corresponding to 128 bits.
   */
  generateTraceId = getIdGenerator(TRACE_ID_BYTES);
  /**
   * Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
   * characters corresponding to 64 bits.
   */
  generateSpanId = getIdGenerator(SPAN_ID_BYTES);
}
const SHARED_BUFFER = Buffer.allocUnsafe(TRACE_ID_BYTES);
function getIdGenerator(bytes) {
  return function generateId() {
    for (let i = 0; i < bytes / 4; i++) {
      SHARED_BUFFER.writeUInt32BE(Math.random() * 2 ** 32 >>> 0, i * 4);
    }
    for (let i = 0; i < bytes; i++) {
      if (SHARED_BUFFER[i] > 0) {
        break;
      } else if (i === bytes - 1) {
        SHARED_BUFFER[bytes - 1] = 1;
      }
    }
    return SHARED_BUFFER.toString("hex", 0, bytes);
  };
}
const ATTR_OTEL_SPAN_PARENT_ORIGIN = "otel.span.parent.origin";
const ATTR_OTEL_SPAN_SAMPLING_RESULT = "otel.span.sampling_result";
const METRIC_OTEL_SDK_SPAN_LIVE = "otel.sdk.span.live";
const METRIC_OTEL_SDK_SPAN_STARTED = "otel.sdk.span.started";
class TracerMetrics {
  startedSpans;
  liveSpans;
  constructor(meter) {
    this.startedSpans = meter.createCounter(METRIC_OTEL_SDK_SPAN_STARTED, {
      unit: "{span}",
      description: "The number of created spans."
    });
    this.liveSpans = meter.createUpDownCounter(METRIC_OTEL_SDK_SPAN_LIVE, {
      unit: "{span}",
      description: "The number of currently live spans."
    });
  }
  startSpan(parentSpanCtx, samplingDecision) {
    const samplingDecisionStr = samplingDecisionToString(samplingDecision);
    this.startedSpans.add(1, {
      [ATTR_OTEL_SPAN_PARENT_ORIGIN]: parentOrigin(parentSpanCtx),
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    });
    if (samplingDecision === SamplingDecision.NOT_RECORD) {
      return () => {
      };
    }
    const liveSpanAttributes = {
      [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
    };
    this.liveSpans.add(1, liveSpanAttributes);
    return () => {
      this.liveSpans.add(-1, liveSpanAttributes);
    };
  }
}
function parentOrigin(parentSpanContext) {
  if (!parentSpanContext) {
    return "none";
  }
  if (parentSpanContext.isRemote) {
    return "remote";
  }
  return "local";
}
function samplingDecisionToString(decision) {
  switch (decision) {
    case SamplingDecision.RECORD_AND_SAMPLED:
      return "RECORD_AND_SAMPLE";
    case SamplingDecision.RECORD:
      return "RECORD_ONLY";
    case SamplingDecision.NOT_RECORD:
      return "DROP";
  }
}
const VERSION = "2.7.1";
class Tracer {
  _sampler;
  _generalLimits;
  _spanLimits;
  _idGenerator;
  instrumentationScope;
  _resource;
  _spanProcessor;
  _tracerMetrics;
  /**
   * Constructs a new Tracer instance.
   */
  constructor(instrumentationScope, config, resource, spanProcessor) {
    const localConfig = mergeConfig(config);
    this._sampler = localConfig.sampler;
    this._generalLimits = localConfig.generalLimits;
    this._spanLimits = localConfig.spanLimits;
    this._idGenerator = config.idGenerator || new RandomIdGenerator();
    this._resource = resource;
    this._spanProcessor = spanProcessor;
    this.instrumentationScope = instrumentationScope;
    const meter = localConfig.meterProvider ? localConfig.meterProvider.getMeter("@opentelemetry/sdk-trace", VERSION) : createNoopMeter();
    this._tracerMetrics = new TracerMetrics(meter);
  }
  /**
   * Starts a new Span or returns the default NoopSpan based on the sampling
   * decision.
   */
  startSpan(name, options = {}, context$1 = context.active()) {
    if (options.root) {
      context$1 = trace.deleteSpan(context$1);
    }
    const parentSpan = trace.getSpan(context$1);
    if (isTracingSuppressed(context$1)) {
      diag.debug("Instrumentation suppressed, returning Noop Span");
      const nonRecordingSpan = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
      return nonRecordingSpan;
    }
    const parentSpanContext = parentSpan?.spanContext();
    const spanId = this._idGenerator.generateSpanId();
    let validParentSpanContext;
    let traceId;
    let traceState;
    if (!parentSpanContext || !trace.isSpanContextValid(parentSpanContext)) {
      traceId = this._idGenerator.generateTraceId();
    } else {
      traceId = parentSpanContext.traceId;
      traceState = parentSpanContext.traceState;
      validParentSpanContext = parentSpanContext;
    }
    const spanKind = options.kind ?? SpanKind.INTERNAL;
    const links = (options.links ?? []).map((link) => {
      return {
        context: link.context,
        attributes: sanitizeAttributes(link.attributes)
      };
    });
    const attributes2 = sanitizeAttributes(options.attributes);
    const samplingResult = this._sampler.shouldSample(context$1, traceId, name, spanKind, attributes2, links);
    const recordEndMetrics = this._tracerMetrics.startSpan(parentSpanContext, samplingResult.decision);
    traceState = samplingResult.traceState ?? traceState;
    const traceFlags = samplingResult.decision === SamplingDecision$1.RECORD_AND_SAMPLED ? TraceFlags.SAMPLED : TraceFlags.NONE;
    const spanContext = { traceId, spanId, traceFlags, traceState };
    if (samplingResult.decision === SamplingDecision$1.NOT_RECORD) {
      diag.debug("Recording is off, propagating context in a non-recording span");
      const nonRecordingSpan = trace.wrapSpanContext(spanContext);
      return nonRecordingSpan;
    }
    const initAttributes = sanitizeAttributes(Object.assign(attributes2, samplingResult.attributes));
    const span = new SpanImpl({
      resource: this._resource,
      scope: this.instrumentationScope,
      context: context$1,
      spanContext,
      name,
      kind: spanKind,
      links,
      parentSpanContext: validParentSpanContext,
      attributes: initAttributes,
      startTime: options.startTime,
      spanProcessor: this._spanProcessor,
      spanLimits: this._spanLimits,
      recordEndMetrics
    });
    return span;
  }
  startActiveSpan(name, arg2, arg3, arg4) {
    let opts;
    let ctx;
    let fn;
    if (arguments.length < 2) {
      return;
    } else if (arguments.length === 2) {
      fn = arg2;
    } else if (arguments.length === 3) {
      opts = arg2;
      fn = arg3;
    } else {
      opts = arg2;
      ctx = arg3;
      fn = arg4;
    }
    const parentContext = ctx ?? context.active();
    const span = this.startSpan(name, opts, parentContext);
    const contextWithSpanSet = trace.setSpan(parentContext, span);
    return context.with(contextWithSpanSet, fn, void 0, span);
  }
  /** Returns the active {@link GeneralLimits}. */
  getGeneralLimits() {
    return this._generalLimits;
  }
  /** Returns the active {@link SpanLimits}. */
  getSpanLimits() {
    return this._spanLimits;
  }
}
class MultiSpanProcessor {
  _spanProcessors;
  constructor(spanProcessors) {
    this._spanProcessors = spanProcessors;
  }
  forceFlush() {
    const promises2 = [];
    for (const spanProcessor of this._spanProcessors) {
      promises2.push(spanProcessor.forceFlush());
    }
    return new Promise((resolve2) => {
      Promise.all(promises2).then(() => {
        resolve2();
      }).catch((error2) => {
        globalErrorHandler(error2 || new Error("MultiSpanProcessor: forceFlush failed"));
        resolve2();
      });
    });
  }
  onStart(span, context2) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onStart(span, context2);
    }
  }
  onEnding(span) {
    for (const spanProcessor of this._spanProcessors) {
      if (spanProcessor.onEnding) {
        spanProcessor.onEnding(span);
      }
    }
  }
  onEnd(span) {
    for (const spanProcessor of this._spanProcessors) {
      spanProcessor.onEnd(span);
    }
  }
  shutdown() {
    const promises2 = [];
    for (const spanProcessor of this._spanProcessors) {
      promises2.push(spanProcessor.shutdown());
    }
    return new Promise((resolve2, reject) => {
      Promise.all(promises2).then(() => {
        resolve2();
      }, reject);
    });
  }
}
var ForceFlushState;
(function(ForceFlushState2) {
  ForceFlushState2[ForceFlushState2["resolved"] = 0] = "resolved";
  ForceFlushState2[ForceFlushState2["timeout"] = 1] = "timeout";
  ForceFlushState2[ForceFlushState2["error"] = 2] = "error";
  ForceFlushState2[ForceFlushState2["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
class BasicTracerProvider {
  _config;
  _tracers = /* @__PURE__ */ new Map();
  _resource;
  _activeSpanProcessor;
  constructor(config = {}) {
    const mergedConfig = merge({}, loadDefaultConfig(), reconfigureLimits(config));
    this._resource = mergedConfig.resource ?? defaultResource();
    this._config = Object.assign({}, mergedConfig, {
      resource: this._resource
    });
    const spanProcessors = [];
    if (config.spanProcessors?.length) {
      spanProcessors.push(...config.spanProcessors);
    }
    this._activeSpanProcessor = new MultiSpanProcessor(spanProcessors);
  }
  getTracer(name, version2, options) {
    const key = `${name}@${version2 || ""}:${options?.schemaUrl || ""}`;
    if (!this._tracers.has(key)) {
      this._tracers.set(key, new Tracer({ name, version: version2, schemaUrl: options?.schemaUrl }, this._config, this._resource, this._activeSpanProcessor));
    }
    return this._tracers.get(key);
  }
  forceFlush() {
    const timeout = this._config.forceFlushTimeoutMillis;
    const promises2 = this._activeSpanProcessor["_spanProcessors"].map((spanProcessor) => {
      return new Promise((resolve2) => {
        let state;
        const timeoutInterval = setTimeout(() => {
          resolve2(new Error(`Span processor did not completed within timeout period of ${timeout} ms`));
          state = ForceFlushState.timeout;
        }, timeout);
        spanProcessor.forceFlush().then(() => {
          clearTimeout(timeoutInterval);
          if (state !== ForceFlushState.timeout) {
            state = ForceFlushState.resolved;
            resolve2(state);
          }
        }).catch((error2) => {
          clearTimeout(timeoutInterval);
          state = ForceFlushState.error;
          resolve2(error2);
        });
      });
    });
    return new Promise((resolve2, reject) => {
      Promise.all(promises2).then((results) => {
        const errors = results.filter((result) => result !== ForceFlushState.resolved);
        if (errors.length > 0) {
          reject(errors);
        } else {
          resolve2();
        }
      }).catch((error2) => reject([error2]));
    });
  }
  shutdown() {
    return this._activeSpanProcessor.shutdown();
  }
}
const SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE = "sentry.parentIsRemote";
const SEMANTIC_ATTRIBUTE_SENTRY_GRAPHQL_OPERATION = "sentry.graphql.operation";
function getParentSpanId(span) {
  if ("parentSpanId" in span) {
    return span.parentSpanId;
  } else if ("parentSpanContext" in span) {
    return span.parentSpanContext?.spanId;
  }
  return void 0;
}
function spanHasAttributes(span) {
  const castSpan = span;
  return !!castSpan.attributes && typeof castSpan.attributes === "object";
}
function spanHasKind(span) {
  const castSpan = span;
  return typeof castSpan.kind === "number";
}
function spanHasStatus(span) {
  const castSpan = span;
  return !!castSpan.status;
}
function spanHasName(span) {
  const castSpan = span;
  return !!castSpan.name;
}
function getRequestSpanData(span) {
  if (!spanHasAttributes(span)) {
    return {};
  }
  const maybeUrlAttribute = span.attributes[ATTR_URL_FULL] || span.attributes[SEMATTRS_HTTP_URL];
  const data = {
    url: maybeUrlAttribute,
    // eslint-disable-next-line deprecation/deprecation
    "http.method": span.attributes[ATTR_HTTP_REQUEST_METHOD] || span.attributes[SEMATTRS_HTTP_METHOD]
  };
  if (!data["http.method"] && data.url) {
    data["http.method"] = "GET";
  }
  try {
    if (typeof maybeUrlAttribute === "string") {
      const url = parseUrl(maybeUrlAttribute);
      data.url = getSanitizedUrlString(url);
      if (url.search) {
        data["http.query"] = url.search;
      }
      if (url.hash) {
        data["http.fragment"] = url.hash;
      }
    }
  } catch {
  }
  return data;
}
function getSpanKind(span) {
  if (spanHasKind(span)) {
    return span.kind;
  }
  return SpanKind.INTERNAL;
}
const SENTRY_TRACE_HEADER = "sentry-trace";
const SENTRY_BAGGAGE_HEADER = "baggage";
const SENTRY_TRACE_STATE_DSC = "sentry.dsc";
const SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING = "sentry.sampled_not_recording";
const SENTRY_TRACE_STATE_URL = "sentry.url";
const SENTRY_TRACE_STATE_SAMPLE_RAND = "sentry.sample_rand";
const SENTRY_TRACE_STATE_SAMPLE_RATE = "sentry.sample_rate";
const SENTRY_TRACE_STATE_CHILD_IGNORED = "sentry.ignored";
const SENTRY_TRACE_STATE_SEGMENT_IGNORED = "sentry.segment_ignored";
const SENTRY_SCOPES_CONTEXT_KEY = createContextKey("sentry_scopes");
const SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY = createContextKey("sentry_fork_isolation_scope");
const SENTRY_FORK_SET_SCOPE_CONTEXT_KEY = createContextKey("sentry_fork_set_scope");
const SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY = createContextKey("sentry_fork_set_isolation_scope");
const SCOPE_CONTEXT_FIELD = "_scopeContext";
function getScopesFromContext(context2) {
  return context2.getValue(SENTRY_SCOPES_CONTEXT_KEY);
}
function setScopesOnContext(context2, scopes) {
  return context2.setValue(SENTRY_SCOPES_CONTEXT_KEY, scopes);
}
function setContextOnScope(scope, context2) {
  addNonEnumerableProperty(scope, SCOPE_CONTEXT_FIELD, makeWeakRef(context2));
}
function getContextFromScope(scope) {
  return derefWeakRef(scope[SCOPE_CONTEXT_FIELD]);
}
function getSamplingDecision(spanContext) {
  const { traceFlags, traceState } = spanContext;
  const sampledNotRecording = traceState ? traceState.get(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING) === "1" : false;
  if (traceFlags === TraceFlags.SAMPLED) {
    return true;
  }
  if (sampledNotRecording) {
    return false;
  }
  const dscString = traceState ? traceState.get(SENTRY_TRACE_STATE_DSC) : void 0;
  const dsc = dscString ? baggageHeaderToDynamicSamplingContext(dscString) : void 0;
  if (dsc?.sampled === "true") {
    return true;
  }
  if (dsc?.sampled === "false") {
    return false;
  }
  return void 0;
}
function inferSpanData(spanName, attributes2, kind) {
  const httpMethod = attributes2[ATTR_HTTP_REQUEST_METHOD] || attributes2[SEMATTRS_HTTP_METHOD];
  if (httpMethod) {
    return descriptionForHttpMethod({ attributes: attributes2, name: spanName, kind }, httpMethod);
  }
  const dbSystem = attributes2[ATTR_DB_SYSTEM_NAME] || attributes2[SEMATTRS_DB_SYSTEM];
  const opIsCache = typeof attributes2[SEMANTIC_ATTRIBUTE_SENTRY_OP] === "string" && attributes2[SEMANTIC_ATTRIBUTE_SENTRY_OP].startsWith("cache.");
  if (dbSystem && !opIsCache) {
    return descriptionForDbSystem({ attributes: attributes2, name: spanName });
  }
  const customSourceOrRoute = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] === "custom" ? "custom" : "route";
  const rpcService = attributes2[SEMATTRS_RPC_SERVICE];
  if (rpcService) {
    return {
      ...getUserUpdatedNameAndSource(spanName, attributes2, "route"),
      op: "rpc"
    };
  }
  const messagingSystem = attributes2[SEMATTRS_MESSAGING_SYSTEM];
  if (messagingSystem) {
    return {
      ...getUserUpdatedNameAndSource(spanName, attributes2, customSourceOrRoute),
      op: "message"
    };
  }
  const faasTrigger = attributes2[SEMATTRS_FAAS_TRIGGER];
  if (faasTrigger) {
    return {
      ...getUserUpdatedNameAndSource(spanName, attributes2, customSourceOrRoute),
      op: faasTrigger.toString()
    };
  }
  return { op: void 0, description: spanName, source: "custom" };
}
function parseSpanDescription(span) {
  const attributes2 = spanHasAttributes(span) ? span.attributes : {};
  const name = spanHasName(span) ? span.name : "<unknown>";
  const kind = getSpanKind(span);
  return inferSpanData(name, attributes2, kind);
}
function descriptionForDbSystem({ attributes: attributes2, name }) {
  const userDefinedName = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
  if (typeof userDefinedName === "string") {
    return {
      op: "db",
      description: userDefinedName,
      source: attributes2[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] || "custom"
    };
  }
  if (attributes2[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] === "custom") {
    return { op: "db", description: name, source: "custom" };
  }
  const statement = attributes2[SEMATTRS_DB_STATEMENT];
  const description = statement ? statement.toString() : name;
  return { op: "db", description, source: "task" };
}
function descriptionForHttpMethod({ name, kind, attributes: attributes2 }, httpMethod) {
  const opParts = ["http"];
  switch (kind) {
    case SpanKind.CLIENT:
      opParts.push("client");
      break;
    case SpanKind.SERVER:
      opParts.push("server");
      break;
  }
  if (attributes2["sentry.http.prefetch"]) {
    opParts.push("prefetch");
  }
  const { urlPath, url, query, fragment, hasRoute } = getSanitizedUrl(attributes2, kind);
  if (!urlPath) {
    return { ...getUserUpdatedNameAndSource(name, attributes2), op: opParts.join(".") };
  }
  const graphqlOperationsAttribute = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_GRAPHQL_OPERATION];
  const baseDescription = `${httpMethod} ${urlPath}`;
  const inferredDescription = graphqlOperationsAttribute ? `${baseDescription} (${getGraphqlOperationNamesFromAttribute(graphqlOperationsAttribute)})` : baseDescription;
  const inferredSource = hasRoute || urlPath === "/" ? "route" : "url";
  const data = {};
  if (url) {
    data.url = url;
  }
  if (query) {
    data["http.query"] = query;
  }
  if (fragment) {
    data["http.fragment"] = fragment;
  }
  const isClientOrServerKind = kind === SpanKind.CLIENT || kind === SpanKind.SERVER;
  const origin = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN] || "manual";
  const isManualSpan = !`${origin}`.startsWith("auto");
  const alreadyHasCustomSource = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] === "custom";
  const customSpanName = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
  const useInferredDescription = !alreadyHasCustomSource && customSpanName == null && (isClientOrServerKind || !isManualSpan);
  const { description, source } = useInferredDescription ? { description: inferredDescription, source: inferredSource } : getUserUpdatedNameAndSource(name, attributes2);
  return {
    op: opParts.join("."),
    description,
    source,
    data
  };
}
function getGraphqlOperationNamesFromAttribute(attr) {
  if (Array.isArray(attr)) {
    const sorted = attr.slice().sort();
    if (sorted.length <= 5) {
      return sorted.join(", ");
    } else {
      return `${sorted.slice(0, 5).join(", ")}, +${sorted.length - 5}`;
    }
  }
  return `${attr}`;
}
function getSanitizedUrl(attributes2, kind) {
  const httpTarget = attributes2[SEMATTRS_HTTP_TARGET];
  const httpUrl = attributes2[SEMATTRS_HTTP_URL] || attributes2[ATTR_URL_FULL];
  const httpRoute = attributes2[ATTR_HTTP_ROUTE];
  const parsedUrl = typeof httpUrl === "string" ? parseUrl(httpUrl) : void 0;
  const url = parsedUrl ? getSanitizedUrlString(parsedUrl) : void 0;
  const query = parsedUrl?.search || void 0;
  const fragment = parsedUrl?.hash || void 0;
  if (typeof httpRoute === "string") {
    return { urlPath: httpRoute, url, query, fragment, hasRoute: true };
  }
  if (kind === SpanKind.SERVER && typeof httpTarget === "string") {
    return { urlPath: stripUrlQueryAndFragment(httpTarget), url, query, fragment, hasRoute: false };
  }
  if (parsedUrl) {
    return { urlPath: url, url, query, fragment, hasRoute: false };
  }
  if (typeof httpTarget === "string") {
    return { urlPath: stripUrlQueryAndFragment(httpTarget), url, query, fragment, hasRoute: false };
  }
  return { urlPath: void 0, url, query, fragment, hasRoute: false };
}
function getUserUpdatedNameAndSource(originalName, attributes2, fallbackSource = "custom") {
  const source = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE] || fallbackSource;
  const description = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
  if (description && typeof description === "string") {
    return {
      description,
      source
    };
  }
  return { description: originalName, source };
}
function getActiveSpan() {
  return trace.getActiveSpan();
}
function makeTraceState({
  dsc,
  sampled
}) {
  const dscString = dsc ? dynamicSamplingContextToSentryBaggageHeader(dsc) : void 0;
  const traceStateBase = new TraceState();
  const traceStateWithDsc = dscString ? traceStateBase.set(SENTRY_TRACE_STATE_DSC, dscString) : traceStateBase;
  return sampled === false ? traceStateWithDsc.set(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING, "1") : traceStateWithDsc;
}
const setupElements = /* @__PURE__ */ new Set();
function setIsSetup(element) {
  setupElements.add(element);
}
class SentryPropagator extends W3CBaggagePropagator {
  /** A map of URLs that have already been checked for if they match tracePropagationTargets. */
  constructor() {
    super();
    setIsSetup("SentryPropagator");
    this._urlMatchesTargetsMap = new LRUMap(100);
  }
  /**
   * @inheritDoc
   */
  inject(context2, carrier, setter) {
    if (isTracingSuppressed(context2)) {
      DEBUG_BUILD$1 && debug.log("[Tracing] Not injecting trace data for url because tracing is suppressed.");
      return;
    }
    const activeSpan = trace.getSpan(context2);
    const url = activeSpan && getCurrentURL(activeSpan);
    const { tracePropagationTargets, propagateTraceparent } = getClient()?.getOptions() || {};
    if (!shouldPropagateTraceForUrl(url, tracePropagationTargets, this._urlMatchesTargetsMap)) {
      DEBUG_BUILD$1 && debug.log("[Tracing] Not injecting trace data for url because it does not match tracePropagationTargets:", url);
      return;
    }
    const existingBaggageHeader = getExistingBaggage(carrier);
    const existingSentryTraceHeader = getExistingSentryTrace(carrier);
    let baggage = propagation.getBaggage(context2) || propagation.createBaggage({});
    const { dynamicSamplingContext, traceId, spanId, sampled } = getInjectionData(context2);
    if (existingBaggageHeader) {
      const baggageEntries = parseBaggageHeader(existingBaggageHeader);
      if (baggageEntries) {
        Object.entries(baggageEntries).forEach(([key, value]) => {
          if (!existingSentryTraceHeader && key.startsWith(SENTRY_BAGGAGE_KEY_PREFIX)) {
            return;
          }
          baggage = baggage.setEntry(key, { value });
        });
      }
    }
    if (!existingSentryTraceHeader && dynamicSamplingContext) {
      baggage = Object.entries(dynamicSamplingContext).reduce((b, [dscKey, dscValue]) => {
        if (dscValue) {
          return b.setEntry(`${SENTRY_BAGGAGE_KEY_PREFIX}${dscKey}`, { value: dscValue });
        }
        return b;
      }, baggage);
    }
    if (!existingSentryTraceHeader && traceId && traceId !== INVALID_TRACEID) {
      setter.set(carrier, SENTRY_TRACE_HEADER, generateSentryTraceHeader(traceId, spanId, sampled));
      if (propagateTraceparent) {
        setter.set(carrier, "traceparent", generateTraceparentHeader(traceId, spanId, sampled));
      }
    }
    super.inject(propagation.setBaggage(context2, baggage), carrier, setter);
  }
  /**
   * @inheritDoc
   */
  extract(context2, carrier, getter) {
    const maybeSentryTraceHeader = getter.get(carrier, SENTRY_TRACE_HEADER);
    const baggage = getter.get(carrier, SENTRY_BAGGAGE_HEADER);
    const sentryTrace = maybeSentryTraceHeader ? Array.isArray(maybeSentryTraceHeader) ? maybeSentryTraceHeader[0] : maybeSentryTraceHeader : void 0;
    return ensureScopesOnContext(getContextWithRemoteActiveSpan(context2, { sentryTrace, baggage }));
  }
  /**
   * @inheritDoc
   */
  fields() {
    return [SENTRY_TRACE_HEADER, SENTRY_BAGGAGE_HEADER, "traceparent"];
  }
}
function getInjectionData(context2, options = {}) {
  const span = trace.getSpan(context2);
  if (span?.spanContext().isRemote) {
    const spanContext = span.spanContext();
    const dynamicSamplingContext2 = getDynamicSamplingContextFromSpan(span);
    return {
      dynamicSamplingContext: dynamicSamplingContext2,
      traceId: spanContext.traceId,
      spanId: void 0,
      sampled: getSamplingDecision(spanContext)
      // TODO: Do we need to change something here?
    };
  }
  if (span) {
    const spanContext = span.spanContext();
    const dynamicSamplingContext2 = getDynamicSamplingContextFromSpan(span);
    return {
      dynamicSamplingContext: dynamicSamplingContext2,
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      sampled: getSamplingDecision(spanContext)
      // TODO: Do we need to change something here?
    };
  }
  const scope = options.scope || getScopesFromContext(context2)?.scope || getCurrentScope();
  const client = options.client || getClient();
  const propagationContext = scope.getPropagationContext();
  const dynamicSamplingContext = client ? getDynamicSamplingContextFromScope(client, scope) : void 0;
  return {
    dynamicSamplingContext,
    traceId: propagationContext.traceId,
    spanId: propagationContext.propagationSpanId,
    sampled: propagationContext.sampled
  };
}
function getContextWithRemoteActiveSpan(ctx, { sentryTrace, baggage }) {
  const propagationContext = propagationContextFromHeaders(sentryTrace, baggage);
  const { traceId, parentSpanId, sampled, dsc } = propagationContext;
  const client = getClient();
  const incomingDsc = baggageHeaderToDynamicSamplingContext(baggage);
  if (!parentSpanId || client && !shouldContinueTrace(client, incomingDsc?.org_id)) {
    return ctx;
  }
  const spanContext = generateRemoteSpanContext({
    traceId,
    spanId: parentSpanId,
    sampled,
    dsc
  });
  return trace.setSpanContext(ctx, spanContext);
}
function continueTraceAsRemoteSpan(ctx, options, callback) {
  const ctxWithSpanContext = ensureScopesOnContext(getContextWithRemoteActiveSpan(ctx, options));
  return context.with(ctxWithSpanContext, callback);
}
function ensureScopesOnContext(ctx) {
  const scopes = getScopesFromContext(ctx);
  const newScopes = {
    // If we have no scope here, this is most likely either the root context or a context manually derived from it
    // In this case, we want to fork the current scope, to ensure we do not pollute the root scope
    scope: scopes ? scopes.scope : getCurrentScope().clone(),
    isolationScope: scopes ? scopes.isolationScope : getIsolationScope()
  };
  return setScopesOnContext(ctx, newScopes);
}
function getExistingBaggage(carrier) {
  try {
    const baggage = carrier[SENTRY_BAGGAGE_HEADER];
    return Array.isArray(baggage) ? baggage.join(",") : baggage;
  } catch {
    return void 0;
  }
}
function getExistingSentryTrace(carrier) {
  try {
    return carrier[SENTRY_TRACE_HEADER];
  } catch {
    return void 0;
  }
}
function getCurrentURL(span) {
  const spanData = spanToJSON(span).data;
  const urlAttribute = spanData[SEMATTRS_HTTP_URL] || spanData[ATTR_URL_FULL];
  if (typeof urlAttribute === "string") {
    return urlAttribute;
  }
  const urlTraceState = span.spanContext().traceState?.get(SENTRY_TRACE_STATE_URL);
  if (urlTraceState) {
    return urlTraceState;
  }
  return void 0;
}
function generateRemoteSpanContext({
  spanId,
  traceId,
  sampled,
  dsc
}) {
  const traceState = makeTraceState({
    dsc,
    sampled
  });
  const spanContext = {
    traceId,
    spanId,
    isRemote: true,
    traceFlags: sampled ? TraceFlags.SAMPLED : TraceFlags.NONE,
    traceState
  };
  return spanContext;
}
function _startSpan(options, callback, autoEnd) {
  const tracer = getTracer();
  const { name, parentSpan: customParentSpan } = options;
  const wrapper = getActiveSpanWrapper(customParentSpan);
  return wrapper(() => {
    const activeCtx = getContext(options.scope, options.forceTransaction);
    const missingRequiredParent = options.onlyIfParent && !trace.getSpan(activeCtx);
    const ctx = missingRequiredParent ? suppressTracing$1(activeCtx) : activeCtx;
    if (missingRequiredParent) {
      getClient()?.recordDroppedEvent("no_parent_span", "span");
    }
    const spanOptions = getSpanOptions(options);
    if (!hasSpansEnabled()) {
      const suppressedCtx = isTracingSuppressed(ctx) ? ctx : suppressTracing$1(ctx);
      return context.with(suppressedCtx, () => {
        return tracer.startActiveSpan(name, spanOptions, suppressedCtx, (span) => {
          patchSpanEnd(span);
          return context.with(activeCtx, () => {
            return handleCallbackErrors(
              () => callback(span),
              () => {
                if (spanToJSON(span).status === void 0) {
                  span.setStatus({ code: SpanStatusCode.ERROR });
                }
              },
              autoEnd ? () => span.end() : void 0
            );
          });
        });
      });
    }
    return tracer.startActiveSpan(name, spanOptions, ctx, (span) => {
      patchSpanEnd(span);
      return handleCallbackErrors(
        () => callback(span),
        () => {
          if (spanToJSON(span).status === void 0) {
            span.setStatus({ code: SpanStatusCode.ERROR });
          }
        },
        autoEnd ? () => span.end() : void 0
      );
    });
  });
}
function startSpan(options, callback) {
  return _startSpan(options, callback, true);
}
function startSpanManual(options, callback) {
  return _startSpan(options, (span) => callback(span, () => span.end()), false);
}
function startInactiveSpan(options) {
  const tracer = getTracer();
  const { name, parentSpan: customParentSpan } = options;
  const wrapper = getActiveSpanWrapper(customParentSpan);
  return wrapper(() => {
    const activeCtx = getContext(options.scope, options.forceTransaction);
    const missingRequiredParent = options.onlyIfParent && !trace.getSpan(activeCtx);
    let ctx = missingRequiredParent ? suppressTracing$1(activeCtx) : activeCtx;
    if (missingRequiredParent) {
      getClient()?.recordDroppedEvent("no_parent_span", "span");
    }
    const spanOptions = getSpanOptions(options);
    if (!hasSpansEnabled()) {
      ctx = isTracingSuppressed(ctx) ? ctx : suppressTracing$1(ctx);
    }
    const span = tracer.startSpan(name, spanOptions, ctx);
    patchSpanEnd(span);
    return span;
  });
}
function withActiveSpan(span, callback) {
  const newContextWithActiveSpan = span ? trace.setSpan(context.active(), span) : trace.deleteSpan(context.active());
  return context.with(newContextWithActiveSpan, () => callback(getCurrentScope()));
}
function getTracer() {
  const client = getClient();
  return client?.tracer || trace.getTracer("@sentry/opentelemetry", SDK_VERSION$1);
}
function getSpanOptions(options) {
  const { startTime, attributes: attributes2, kind, op, links } = options;
  const fixedStartTime = typeof startTime === "number" ? ensureTimestampInMilliseconds(startTime) : startTime;
  return {
    attributes: op ? {
      [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
      ...attributes2
    } : attributes2,
    kind,
    links,
    startTime: fixedStartTime
  };
}
function ensureTimestampInMilliseconds(timestamp) {
  const isMs = timestamp < 9999999999;
  return isMs ? timestamp * 1e3 : timestamp;
}
function patchSpanEnd(span) {
  const originalEnd = span.end.bind(span);
  span.end = (endTime) => {
    return originalEnd(typeof endTime === "number" ? ensureTimestampInMilliseconds(endTime) : endTime);
  };
}
function getContext(scope, forceTransaction) {
  const ctx = getContextForScope(scope);
  const parentSpan = trace.getSpan(ctx);
  if (!parentSpan) {
    return ctx;
  }
  if (!forceTransaction) {
    return ctx;
  }
  const ctxWithoutSpan = trace.deleteSpan(ctx);
  const { spanId, traceId } = parentSpan.spanContext();
  const sampled = getSamplingDecision(parentSpan.spanContext());
  const rootSpan = getRootSpan(parentSpan);
  const dsc = getDynamicSamplingContextFromSpan(rootSpan);
  const traceState = makeTraceState({
    dsc,
    sampled
  });
  const spanOptions = {
    traceId,
    spanId,
    isRemote: true,
    traceFlags: sampled ? TraceFlags.SAMPLED : TraceFlags.NONE,
    traceState
  };
  const ctxWithSpanContext = trace.setSpanContext(ctxWithoutSpan, spanOptions);
  return ctxWithSpanContext;
}
function getContextForScope(scope) {
  if (scope) {
    const ctx = getContextFromScope(scope);
    if (ctx) {
      return ctx;
    }
  }
  return context.active();
}
function continueTrace(options, callback) {
  return continueTraceAsRemoteSpan(context.active(), options, callback);
}
function startNewTrace(callback) {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const spanContext = {
    traceId,
    spanId,
    isRemote: true,
    traceFlags: TraceFlags.NONE
  };
  const ctxWithTrace = trace.setSpanContext(context.active(), spanContext);
  return context.with(ctxWithTrace, () => {
    getCurrentScope().setPropagationContext({
      traceId,
      sampleRand: safeMathRandom()
    });
    return callback();
  });
}
function getTraceContextForScope(client, scope) {
  const ctx = getContextFromScope(scope);
  const span = ctx && trace.getSpan(ctx);
  const traceContext = span ? spanToTraceContext(span) : getTraceContextFromScope(scope);
  const dynamicSamplingContext = span ? getDynamicSamplingContextFromSpan(span) : getDynamicSamplingContextFromScope(client, scope);
  return [dynamicSamplingContext, traceContext];
}
function getActiveSpanWrapper(parentSpan) {
  return parentSpan !== void 0 ? (callback) => {
    return withActiveSpan(parentSpan, callback);
  } : (callback) => callback();
}
function suppressTracing(callback) {
  const ctx = suppressTracing$1(context.active());
  return context.with(ctx, callback);
}
function getTraceData({
  span,
  scope,
  client,
  propagateTraceparent
} = {}) {
  let ctx = (scope && getContextFromScope(scope)) ?? context.active();
  if (span) {
    const { scope: scope2 } = getCapturedScopesOnSpan(span);
    ctx = scope2 && getContextFromScope(scope2) || trace.setSpan(context.active(), span);
  }
  const { traceId, spanId, sampled, dynamicSamplingContext } = getInjectionData(ctx, { scope, client });
  const traceData = {
    "sentry-trace": generateSentryTraceHeader(traceId, spanId, sampled),
    baggage: dynamicSamplingContextToSentryBaggageHeader(dynamicSamplingContext)
  };
  if (propagateTraceparent) {
    traceData.traceparent = generateTraceparentHeader(traceId, spanId, sampled);
  }
  return traceData;
}
function setOpenTelemetryContextAsyncContextStrategy() {
  function getScopes() {
    const ctx = context.active();
    const scopes = getScopesFromContext(ctx);
    if (scopes) {
      return scopes;
    }
    return {
      scope: getDefaultCurrentScope(),
      isolationScope: getDefaultIsolationScope()
    };
  }
  function withScope2(callback) {
    const ctx = context.active();
    return context.with(ctx, () => {
      return callback(getCurrentScope2());
    });
  }
  function withSetScope2(scope, callback) {
    const ctx = getContextFromScope(scope) || context.active();
    return context.with(ctx.setValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY, scope), () => {
      return callback(scope);
    });
  }
  function withIsolationScope2(callback) {
    const ctx = context.active();
    return context.with(ctx.setValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY, true), () => {
      return callback(getIsolationScope2());
    });
  }
  function withSetIsolationScope(isolationScope, callback) {
    const ctx = context.active();
    return context.with(ctx.setValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY, isolationScope), () => {
      return callback(getIsolationScope2());
    });
  }
  function getCurrentScope2() {
    return getScopes().scope;
  }
  function getIsolationScope2() {
    return getScopes().isolationScope;
  }
  setAsyncContextStrategy({
    withScope: withScope2,
    withSetScope: withSetScope2,
    withSetIsolationScope,
    withIsolationScope: withIsolationScope2,
    getCurrentScope: getCurrentScope2,
    getIsolationScope: getIsolationScope2,
    startSpan,
    startSpanManual,
    startInactiveSpan,
    getActiveSpan,
    suppressTracing,
    getTraceData,
    continueTrace,
    startNewTrace,
    // The types here don't fully align, because our own `Span` type is narrower
    // than the OTEL one - but this is OK for here, as we now we'll only have OTEL spans passed around
    withActiveSpan
  });
}
function buildContextWithSentryScopes(context2, activeContext) {
  const span = trace.getSpan(context2);
  let effectiveContext;
  if (span?.spanContext().traceState?.get(SENTRY_TRACE_STATE_CHILD_IGNORED) === "1") {
    const contextWithoutSpan = trace.deleteSpan(context2);
    const parentSpan = trace.getSpan(activeContext);
    effectiveContext = parentSpan ? trace.setSpan(contextWithoutSpan, parentSpan) : contextWithoutSpan;
  } else {
    effectiveContext = context2;
  }
  const currentScopes = getScopesFromContext(effectiveContext);
  const currentScope = currentScopes?.scope || getCurrentScope();
  const currentIsolationScope = currentScopes?.isolationScope || getIsolationScope();
  const shouldForkIsolationScope = effectiveContext.getValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY) === true;
  const scope = effectiveContext.getValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY);
  const isolationScope = effectiveContext.getValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY);
  const newCurrentScope = scope || currentScope.clone();
  const newIsolationScope = isolationScope || (shouldForkIsolationScope ? currentIsolationScope.clone() : currentIsolationScope);
  const scopes = { scope: newCurrentScope, isolationScope: newIsolationScope };
  const ctx1 = setScopesOnContext(effectiveContext, scopes);
  const ctx2 = ctx1.deleteValue(SENTRY_FORK_ISOLATION_SCOPE_CONTEXT_KEY).deleteValue(SENTRY_FORK_SET_SCOPE_CONTEXT_KEY).deleteValue(SENTRY_FORK_SET_ISOLATION_SCOPE_CONTEXT_KEY);
  setContextOnScope(newCurrentScope, ctx2);
  return ctx2;
}
const ADD_LISTENER_METHODS = ["addListener", "on", "once", "prependListener", "prependOnceListener"];
class SentryAsyncLocalStorageContextManager {
  __init() {
    this._asyncLocalStorage = new AsyncLocalStorage();
  }
  __init2() {
    this._kOtListeners = Symbol("OtListeners");
  }
  __init3() {
    this._wrapped = false;
  }
  constructor() {
    SentryAsyncLocalStorageContextManager.prototype.__init.call(this);
    SentryAsyncLocalStorageContextManager.prototype.__init2.call(this);
    SentryAsyncLocalStorageContextManager.prototype.__init3.call(this);
    setIsSetup("SentryContextManager");
  }
  active() {
    return this._asyncLocalStorage.getStore() ?? ROOT_CONTEXT;
  }
  with(context2, fn, thisArg, ...args) {
    const ctx2 = buildContextWithSentryScopes(context2, this.active());
    const cb = thisArg == null ? fn : fn.bind(thisArg);
    return this._asyncLocalStorage.run(ctx2, cb, ...args);
  }
  enable() {
    return this;
  }
  disable() {
    this._asyncLocalStorage.disable();
    return this;
  }
  bind(context2, target) {
    if (target instanceof EventEmitter) {
      return this._bindEventEmitter(context2, target);
    }
    if (typeof target === "function") {
      return this._bindFunction(context2, target);
    }
    return target;
  }
  /**
   * Gets underlying AsyncLocalStorage and symbol to allow lookup of scope.
   * This is Sentry-specific.
   */
  getAsyncLocalStorageLookup() {
    return {
      asyncLocalStorage: this._asyncLocalStorage,
      contextSymbol: SENTRY_SCOPES_CONTEXT_KEY
    };
  }
  _bindFunction(context2, target) {
    const managerWith = this.with.bind(this);
    const contextWrapper = function(...args) {
      return managerWith(context2, () => target.apply(this, args));
    };
    Object.defineProperty(contextWrapper, "length", {
      enumerable: false,
      configurable: true,
      writable: false,
      value: target.length
    });
    return contextWrapper;
  }
  _bindEventEmitter(context2, ee) {
    if (this._getPatchMap(ee) !== void 0) {
      return ee;
    }
    this._createPatchMap(ee);
    for (const methodName of ADD_LISTENER_METHODS) {
      if (ee[methodName] === void 0) continue;
      ee[methodName] = this._patchAddListener(
        ee,
        ee[methodName],
        context2
      );
    }
    if (typeof ee.removeListener === "function") {
      ee.removeListener = this._patchRemoveListener(ee, ee.removeListener);
    }
    if (typeof ee.off === "function") {
      ee.off = this._patchRemoveListener(ee, ee.off);
    }
    if (typeof ee.removeAllListeners === "function") {
      ee.removeAllListeners = this._patchRemoveAllListeners(
        ee,
        // oxlint-disable-next-line @typescript-eslint/unbound-method
        ee.removeAllListeners
      );
    }
    return ee;
  }
  _patchRemoveListener(ee, original) {
    const contextManager = this;
    return function(event, listener) {
      const events = contextManager._getPatchMap(ee)?.[event];
      if (events === void 0) {
        return original.call(this, event, listener);
      }
      const patchedListener = events.get(listener);
      return original.call(this, event, patchedListener || listener);
    };
  }
  _patchRemoveAllListeners(ee, original) {
    const contextManager = this;
    return function(event) {
      const map = contextManager._getPatchMap(ee);
      if (map !== void 0) {
        if (arguments.length === 0) {
          contextManager._createPatchMap(ee);
        } else if (event !== void 0 && map[event] !== void 0) {
          delete map[event];
        }
      }
      return original.apply(this, arguments);
    };
  }
  _patchAddListener(ee, original, context2) {
    const contextManager = this;
    return function(event, listener) {
      if (contextManager._wrapped) {
        return original.call(this, event, listener);
      }
      let map = contextManager._getPatchMap(ee);
      if (map === void 0) {
        map = contextManager._createPatchMap(ee);
      }
      let listeners = map[event];
      if (listeners === void 0) {
        listeners = /* @__PURE__ */ new WeakMap();
        map[event] = listeners;
      }
      const patchedListener = contextManager.bind(context2, listener);
      listeners.set(listener, patchedListener);
      contextManager._wrapped = true;
      try {
        return original.call(this, event, patchedListener);
      } finally {
        contextManager._wrapped = false;
      }
    };
  }
  _createPatchMap(ee) {
    const map = /* @__PURE__ */ Object.create(null);
    ee[this._kOtListeners] = map;
    return map;
  }
  _getPatchMap(ee) {
    return ee[this._kOtListeners];
  }
}
function groupSpansWithParents(spans) {
  const nodeMap = /* @__PURE__ */ new Map();
  for (const span of spans) {
    createOrUpdateSpanNodeAndRefs(nodeMap, span);
  }
  return Array.from(nodeMap, function([_id, spanNode]) {
    return spanNode;
  });
}
function getLocalParentId(span) {
  const parentIsRemote = span.attributes[SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE] === true;
  return !parentIsRemote ? getParentSpanId(span) : void 0;
}
function createOrUpdateSpanNodeAndRefs(nodeMap, span) {
  const id = span.spanContext().spanId;
  const parentId = getLocalParentId(span);
  if (!parentId) {
    createOrUpdateNode(nodeMap, { id, span, children: [] });
    return;
  }
  const parentNode = createOrGetParentNode(nodeMap, parentId);
  const node2 = createOrUpdateNode(nodeMap, { id, span, parentNode, children: [] });
  parentNode.children.push(node2);
}
function createOrGetParentNode(nodeMap, id) {
  const existing = nodeMap.get(id);
  if (existing) {
    return existing;
  }
  return createOrUpdateNode(nodeMap, { id, children: [] });
}
function createOrUpdateNode(nodeMap, spanNode) {
  const existing = nodeMap.get(spanNode.id);
  if (existing?.span) {
    return existing;
  }
  if (existing && !existing.span) {
    existing.span = spanNode.span;
    existing.parentNode = spanNode.parentNode;
    return existing;
  }
  nodeMap.set(spanNode.id, spanNode);
  return spanNode;
}
const canonicalGrpcErrorCodesMap = {
  "1": "cancelled",
  "2": "unknown_error",
  "3": "invalid_argument",
  "4": "deadline_exceeded",
  "5": "not_found",
  "6": "already_exists",
  "7": "permission_denied",
  "8": "resource_exhausted",
  "9": "failed_precondition",
  "10": "aborted",
  "11": "out_of_range",
  "12": "unimplemented",
  "13": "internal_error",
  "14": "unavailable",
  "15": "data_loss",
  "16": "unauthenticated"
};
const isStatusErrorMessageValid = (message) => {
  return Object.values(canonicalGrpcErrorCodesMap).includes(message);
};
function mapStatus(span) {
  const attributes2 = spanHasAttributes(span) ? span.attributes : {};
  const status = spanHasStatus(span) ? span.status : void 0;
  if (status) {
    if (status.code === SpanStatusCode.OK) {
      return { code: SPAN_STATUS_OK };
    } else if (status.code === SpanStatusCode.ERROR) {
      if (typeof status.message === "undefined") {
        const inferredStatus2 = inferStatusFromAttributes(attributes2);
        if (inferredStatus2) {
          return inferredStatus2;
        }
      }
      if (status.message && isStatusErrorMessageValid(status.message)) {
        return { code: SPAN_STATUS_ERROR, message: status.message };
      } else {
        return { code: SPAN_STATUS_ERROR, message: "internal_error" };
      }
    }
  }
  const inferredStatus = inferStatusFromAttributes(attributes2);
  if (inferredStatus) {
    return inferredStatus;
  }
  if (status?.code === SpanStatusCode.UNSET) {
    return { code: SPAN_STATUS_OK };
  } else {
    return { code: SPAN_STATUS_ERROR, message: "unknown_error" };
  }
}
function inferStatusFromAttributes(attributes2) {
  const httpCodeAttribute = attributes2[ATTR_HTTP_RESPONSE_STATUS_CODE] || attributes2[SEMATTRS_HTTP_STATUS_CODE];
  const grpcCodeAttribute = attributes2[SEMATTRS_RPC_GRPC_STATUS_CODE];
  const numberHttpCode = typeof httpCodeAttribute === "number" ? httpCodeAttribute : typeof httpCodeAttribute === "string" ? parseInt(httpCodeAttribute) : void 0;
  if (typeof numberHttpCode === "number") {
    return getSpanStatusFromHttpCode(numberHttpCode);
  }
  if (typeof grpcCodeAttribute === "string") {
    return { code: SPAN_STATUS_ERROR, message: canonicalGrpcErrorCodesMap[grpcCodeAttribute] || "unknown_error" };
  }
  return void 0;
}
const MAX_SPAN_COUNT = 1e3;
const DEFAULT_TIMEOUT = 300;
class SentrySpanExporter {
  /*
   * A quick explanation on the buckets: We do bucketing of finished spans for efficiency. This span exporter is
   * accumulating spans until a root span is encountered and then it flushes all the spans that are descendants of that
   * root span. Because it is totally in the realm of possibilities that root spans are never finished, and we don't
   * want to accumulate spans indefinitely in memory, we need to periodically evacuate spans. Naively we could simply
   * store the spans in an array and each time a new span comes in we could iterate through the entire array and
   * evacuate all spans that have an end-timestamp that is older than our limit. This could get quite expensive because
   * we would have to iterate a potentially large number of spans every time we evacuate. We want to avoid these large
   * bursts of computation.
   *
   * Instead we go for a bucketing approach and put spans into buckets, based on what second
   * (modulo the time limit) the span was put into the exporter. With buckets, when we decide to evacuate, we can
   * iterate through the bucket entries instead, which have an upper bound of items, making the evacuation much more
   * efficient. Cleaning up also becomes much more efficient since it simply involves de-referencing a bucket within the
   * bucket array, and letting garbage collection take care of the rest.
   */
  // Essentially a a set of span ids that are already sent. The values are expiration
  // times in this cache so we don't hold onto them indefinitely.
  /* Internally, we use a debounced flush to give some wiggle room to the span processor to accumulate more spans. */
  constructor(options) {
    this._finishedSpanBucketSize = options?.timeout || DEFAULT_TIMEOUT;
    this._finishedSpanBuckets = new Array(this._finishedSpanBucketSize).fill(void 0);
    this._lastCleanupTimestampInS = Math.floor(safeDateNow() / 1e3);
    this._spansToBucketEntry = /* @__PURE__ */ new WeakMap();
    this._sentSpans = /* @__PURE__ */ new Map();
    this._debouncedFlush = debounce(this.flush.bind(this), 1, { maxWait: 100 });
  }
  /**
   * Export a single span.
   * This is called by the span processor whenever a span is ended.
   */
  export(span) {
    const currentTimestampInS = Math.floor(safeDateNow() / 1e3);
    if (this._lastCleanupTimestampInS !== currentTimestampInS) {
      let droppedSpanCount = 0;
      this._finishedSpanBuckets.forEach((bucket, i) => {
        if (bucket && bucket.timestampInS <= currentTimestampInS - this._finishedSpanBucketSize) {
          droppedSpanCount += bucket.spans.size;
          this._finishedSpanBuckets[i] = void 0;
        }
      });
      if (droppedSpanCount > 0) {
        DEBUG_BUILD$1 && debug.log(
          `SpanExporter dropped ${droppedSpanCount} spans because they were pending for more than ${this._finishedSpanBucketSize} seconds.`
        );
      }
      this._lastCleanupTimestampInS = currentTimestampInS;
    }
    const currentBucketIndex = currentTimestampInS % this._finishedSpanBucketSize;
    const currentBucket = this._finishedSpanBuckets[currentBucketIndex] || {
      timestampInS: currentTimestampInS,
      spans: /* @__PURE__ */ new Set()
    };
    this._finishedSpanBuckets[currentBucketIndex] = currentBucket;
    currentBucket.spans.add(span);
    this._spansToBucketEntry.set(span, currentBucket);
    const localParentId = getLocalParentId(span);
    if (!localParentId || this._sentSpans.has(localParentId)) {
      this._debouncedFlush();
    }
  }
  /**
   * Try to flush any pending spans immediately.
   * This is called internally by the exporter (via _debouncedFlush),
   * but can also be triggered externally if we force-flush.
   */
  flush() {
    const finishedSpans = this._finishedSpanBuckets.flatMap((bucket) => bucket ? Array.from(bucket.spans) : []);
    this._flushSentSpanCache();
    const sentSpans = this._maybeSend(finishedSpans);
    const sentSpanCount = sentSpans.size;
    const remainingOpenSpanCount = finishedSpans.length - sentSpanCount;
    DEBUG_BUILD$1 && debug.log(
      `SpanExporter exported ${sentSpanCount} spans, ${remainingOpenSpanCount} spans are waiting for their parent spans to finish`
    );
    const expirationDate = safeDateNow() + DEFAULT_TIMEOUT * 1e3;
    for (const span of sentSpans) {
      this._sentSpans.set(span.spanContext().spanId, expirationDate);
      const bucketEntry = this._spansToBucketEntry.get(span);
      if (bucketEntry) {
        bucketEntry.spans.delete(span);
      }
    }
    this._debouncedFlush.cancel();
  }
  /**
   * Clear the exporter.
   * This is called when the span processor is shut down.
   */
  clear() {
    this._finishedSpanBuckets = this._finishedSpanBuckets.fill(void 0);
    this._sentSpans.clear();
    this._debouncedFlush.cancel();
  }
  /**
   * Send the given spans, but only if they are part of a finished transaction.
   *
   * Returns the sent spans.
   * Spans remain unsent when their parent span is not yet finished.
   * This will happen regularly, as child spans are generally finished before their parents.
   * But it _could_ also happen because, for whatever reason, a parent span was lost.
   * In this case, we'll eventually need to clean this up.
   */
  _maybeSend(spans) {
    const grouped = groupSpansWithParents(spans);
    const sentSpans = /* @__PURE__ */ new Set();
    const rootNodes = this._getCompletedRootNodes(grouped);
    for (const root of rootNodes) {
      const span = root.span;
      sentSpans.add(span);
      const transactionEvent = createTransactionForOtelSpan(span);
      if (root.parentNode && this._sentSpans.has(root.parentNode.id)) {
        const traceData = transactionEvent.contexts?.trace?.data;
        if (traceData) {
          traceData["sentry.parent_span_already_sent"] = true;
        }
      }
      const spans2 = transactionEvent.spans || [];
      for (const child of root.children) {
        createAndFinishSpanForOtelSpan(child, spans2, sentSpans);
      }
      transactionEvent.spans = spans2.length > MAX_SPAN_COUNT ? spans2.sort((a, b) => a.start_timestamp - b.start_timestamp).slice(0, MAX_SPAN_COUNT) : spans2;
      const measurements = timedEventsToMeasurements(span.events);
      if (measurements) {
        transactionEvent.measurements = measurements;
      }
      captureEvent(transactionEvent);
    }
    return sentSpans;
  }
  /** Remove "expired" span id entries from the _sentSpans cache. */
  _flushSentSpanCache() {
    const currentTimestamp = safeDateNow();
    for (const [spanId, expirationTime] of this._sentSpans.entries()) {
      if (expirationTime <= currentTimestamp) {
        this._sentSpans.delete(spanId);
      }
    }
  }
  /** Check if a node is a completed root node or a node whose parent has already been sent */
  _nodeIsCompletedRootNodeOrHasSentParent(node2) {
    return !!node2.span && (!node2.parentNode || this._sentSpans.has(node2.parentNode.id));
  }
  /** Get all completed root nodes from a list of nodes */
  _getCompletedRootNodes(nodes) {
    return nodes.filter((node2) => this._nodeIsCompletedRootNodeOrHasSentParent(node2));
  }
}
function parseSpan(span) {
  const attributes2 = span.attributes;
  const origin = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN];
  const op = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_OP];
  const source = attributes2[SEMANTIC_ATTRIBUTE_SENTRY_SOURCE];
  return { origin, op, source };
}
function createTransactionForOtelSpan(span) {
  const { op, description, data, origin = "manual", source } = getSpanData(span);
  const capturedSpanScopes = getCapturedScopesOnSpan(span);
  const sampleRate = span.attributes[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
  const attributes2 = {
    [SEMANTIC_ATTRIBUTE_SENTRY_SOURCE]: source,
    [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: sampleRate,
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
    ...data,
    ...removeSentryAttributes(span.attributes)
  };
  const { links } = span;
  const { traceId: trace_id, spanId: span_id } = span.spanContext();
  const parent_span_id = getParentSpanId(span);
  const status = mapStatus(span);
  const traceContext = {
    parent_span_id,
    span_id,
    trace_id,
    data: attributes2,
    origin,
    op,
    status: getStatusMessage(status),
    // As per protocol, span status is allowed to be undefined
    links: convertSpanLinksForEnvelope(links)
  };
  const statusCode = attributes2[ATTR_HTTP_RESPONSE_STATUS_CODE];
  const responseContext = typeof statusCode === "number" ? { response: { status_code: statusCode } } : void 0;
  const transactionEvent = {
    contexts: {
      trace: traceContext,
      otel: {
        resource: span.resource.attributes
      },
      ...responseContext
    },
    spans: [],
    start_timestamp: spanTimeInputToSeconds(span.startTime),
    timestamp: spanTimeInputToSeconds(span.endTime),
    transaction: description,
    type: "transaction",
    sdkProcessingMetadata: {
      capturedSpanScope: capturedSpanScopes.scope,
      capturedSpanIsolationScope: capturedSpanScopes.isolationScope,
      sampleRate,
      dynamicSamplingContext: getDynamicSamplingContextFromSpan(span)
    },
    ...source && {
      transaction_info: {
        source
      }
    }
  };
  return transactionEvent;
}
function createAndFinishSpanForOtelSpan(node2, spans, sentSpans) {
  const span = node2.span;
  if (span) {
    sentSpans.add(span);
  }
  const shouldDrop = !span;
  if (shouldDrop) {
    node2.children.forEach((child) => {
      createAndFinishSpanForOtelSpan(child, spans, sentSpans);
    });
    return;
  }
  const span_id = span.spanContext().spanId;
  const trace_id = span.spanContext().traceId;
  const parentSpanId = getParentSpanId(span);
  const { attributes: attributes2, startTime, endTime, links } = span;
  const { op, description, data, origin = "manual" } = getSpanData(span);
  const allData = {
    [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: origin,
    [SEMANTIC_ATTRIBUTE_SENTRY_OP]: op,
    ...removeSentryAttributes(attributes2),
    ...data
  };
  const status = mapStatus(span);
  const spanJSON = {
    span_id,
    trace_id,
    data: allData,
    description,
    parent_span_id: parentSpanId,
    start_timestamp: spanTimeInputToSeconds(startTime),
    // This is [0,0] by default in OTEL, in which case we want to interpret this as no end time
    timestamp: spanTimeInputToSeconds(endTime) || void 0,
    status: getStatusMessage(status),
    // As per protocol, span status is allowed to be undefined
    op,
    origin,
    measurements: timedEventsToMeasurements(span.events),
    links: convertSpanLinksForEnvelope(links)
  };
  spans.push(spanJSON);
  node2.children.forEach((child) => {
    createAndFinishSpanForOtelSpan(child, spans, sentSpans);
  });
}
function getSpanData(span) {
  const { op: definedOp, source: definedSource, origin } = parseSpan(span);
  const { op: inferredOp, description, source: inferredSource, data: inferredData } = parseSpanDescription(span);
  const op = definedOp || inferredOp;
  const source = definedSource || inferredSource;
  const data = { ...inferredData, ...getData(span) };
  return {
    op,
    description,
    source,
    origin,
    data
  };
}
function removeSentryAttributes(data) {
  const cleanedData = { ...data };
  delete cleanedData[SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE];
  delete cleanedData[SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE];
  delete cleanedData[SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME];
  return cleanedData;
}
function getData(span) {
  const attributes2 = span.attributes;
  const data = {};
  if (span.kind !== SpanKind.INTERNAL) {
    data["otel.kind"] = SpanKind[span.kind];
  }
  const maybeHttpStatusCodeAttribute = attributes2[SEMATTRS_HTTP_STATUS_CODE];
  if (maybeHttpStatusCodeAttribute) {
    data[ATTR_HTTP_RESPONSE_STATUS_CODE] = maybeHttpStatusCodeAttribute;
  }
  const requestData = getRequestSpanData(span);
  if (requestData.url) {
    data.url = requestData.url;
  }
  if (requestData["http.query"]) {
    data["http.query"] = requestData["http.query"].slice(1);
  }
  if (requestData["http.fragment"]) {
    data["http.fragment"] = requestData["http.fragment"].slice(1);
  }
  return data;
}
class SentrySpanProcessor {
  constructor(options) {
    setIsSetup("SentrySpanProcessor");
    this._exporter = new SentrySpanExporter(options);
  }
  /**
   * @inheritDoc
   */
  async forceFlush() {
    this._exporter.flush();
  }
  /**
   * @inheritDoc
   */
  async shutdown() {
    this._exporter.clear();
  }
  /**
   * @inheritDoc
   */
  onStart(span, parentContext) {
    const parentSpan = trace.getSpan(parentContext);
    let scopes = getScopesFromContext(parentContext);
    if (parentSpan && !parentSpan.spanContext().isRemote) {
      addChildSpanToSpan(parentSpan, span);
    }
    if (parentSpan?.spanContext().isRemote) {
      span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_PARENT_IS_REMOTE, true);
    }
    if (parentContext === ROOT_CONTEXT) {
      scopes = {
        scope: getDefaultCurrentScope(),
        isolationScope: getDefaultIsolationScope()
      };
    }
    if (scopes) {
      setCapturedScopesOnSpan(span, scopes.scope, scopes.isolationScope);
    }
    logSpanStart(span);
    const client = getClient();
    client?.emit("spanStart", span);
  }
  /** @inheritDoc */
  onEnd(span) {
    logSpanEnd(span);
    const client = getClient();
    client?.emit("spanEnd", span);
    if (client && hasSpanStreamingEnabled(client)) {
      client.emit("afterSpanEnd", span);
    } else {
      this._exporter.export(span);
    }
  }
}
class SentrySampler {
  constructor(client) {
    this._client = client;
    this._isSpanStreaming = hasSpanStreamingEnabled(client);
    setIsSetup("SentrySampler");
  }
  /** @inheritDoc */
  shouldSample(context2, traceId, spanName, spanKind, spanAttributes, _links) {
    const options = this._client.getOptions();
    const { ignoreSpans } = options;
    const parentSpan = getValidSpan(context2);
    const parentContext = parentSpan?.spanContext();
    if (!hasSpansEnabled(options)) {
      return wrapSamplingDecision({ decision: void 0, context: context2, spanAttributes });
    }
    const maybeSpanHttpMethod = spanAttributes[SEMATTRS_HTTP_METHOD] || spanAttributes[ATTR_HTTP_REQUEST_METHOD];
    if (spanKind === SpanKind.CLIENT && maybeSpanHttpMethod && (!parentSpan || parentContext?.isRemote)) {
      this._client.recordDroppedEvent("no_parent_span", "span");
      return wrapSamplingDecision({ decision: void 0, context: context2, spanAttributes });
    }
    const parentSampled = parentSpan ? getParentSampled(parentSpan, traceId, spanName) : void 0;
    const isRootSpan = !parentSpan || parentContext?.isRemote;
    if (!isRootSpan) {
      if (this._isSpanStreaming) {
        if (parentSampled) {
          if (ignoreSpans?.length) {
            const { description: inferredChildName, op: childOp } = inferSpanData(spanName, spanAttributes, spanKind);
            if (shouldIgnoreSpan(
              { description: inferredChildName, op: spanAttributes[SEMANTIC_ATTRIBUTE_SENTRY_OP] ?? childOp },
              ignoreSpans
            )) {
              this._client.recordDroppedEvent("ignored", "span");
              return wrapSamplingDecision({
                decision: SamplingDecision.NOT_RECORD,
                context: context2,
                spanAttributes,
                ignoredChildSpan: true
              });
            }
          }
        }
        if (!parentSampled) {
          const parentSegmentIgnored = parentContext?.traceState?.get(SENTRY_TRACE_STATE_SEGMENT_IGNORED) === "1";
          this._client.recordDroppedEvent(parentSegmentIgnored ? "ignored" : "sample_rate", "span");
        }
      }
      return wrapSamplingDecision({
        decision: parentSampled ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD,
        context: context2,
        spanAttributes
      });
    }
    const {
      description: inferredSpanName,
      data: inferredAttributes,
      op
    } = inferSpanData(spanName, spanAttributes, spanKind);
    const mergedAttributes = {
      ...inferredAttributes,
      ...spanAttributes
    };
    if (op) {
      mergedAttributes[SEMANTIC_ATTRIBUTE_SENTRY_OP] = op;
    }
    if (this._isSpanStreaming && ignoreSpans?.length && shouldIgnoreSpan(
      { description: inferredSpanName, op: mergedAttributes[SEMANTIC_ATTRIBUTE_SENTRY_OP] ?? op },
      ignoreSpans
    )) {
      this._client.recordDroppedEvent("ignored", "span");
      return wrapSamplingDecision({
        decision: SamplingDecision.NOT_RECORD,
        context: context2,
        spanAttributes,
        ignoredSegmentSpan: true
      });
    }
    const mutableSamplingDecision = { decision: true };
    this._client.emit(
      "beforeSampling",
      {
        spanAttributes: mergedAttributes,
        spanName: inferredSpanName,
        parentSampled,
        parentContext
      },
      mutableSamplingDecision
    );
    if (!mutableSamplingDecision.decision) {
      return wrapSamplingDecision({ decision: void 0, context: context2, spanAttributes });
    }
    const { isolationScope } = getScopesFromContext(context2) ?? {};
    const dscString = parentContext?.traceState ? parentContext.traceState.get(SENTRY_TRACE_STATE_DSC) : void 0;
    const dsc = dscString ? baggageHeaderToDynamicSamplingContext(dscString) : void 0;
    const sampleRand = parseSampleRate(dsc?.sample_rand) ?? safeMathRandom();
    const [sampled, sampleRate, localSampleRateWasApplied] = sampleSpan(
      options,
      {
        name: inferredSpanName,
        attributes: mergedAttributes,
        normalizedRequest: isolationScope?.getScopeData().sdkProcessingMetadata.normalizedRequest,
        parentSampled,
        parentSampleRate: parseSampleRate(dsc?.sample_rate)
      },
      sampleRand
    );
    const method = `${maybeSpanHttpMethod}`.toUpperCase();
    if (method === "OPTIONS" || method === "HEAD") {
      DEBUG_BUILD$1 && debug.log(`[Tracing] Not sampling span because HTTP method is '${method}' for ${spanName}`);
      return wrapSamplingDecision({
        decision: SamplingDecision.NOT_RECORD,
        context: context2,
        spanAttributes,
        sampleRand,
        downstreamTraceSampleRate: 0
        // we don't want to sample anything in the downstream trace either
      });
    }
    if (!sampled && // We check for `parentSampled === undefined` because we only want to record client reports for spans that are trace roots (ie. when there was incoming trace)
    parentSampled === void 0) {
      DEBUG_BUILD$1 && debug.log("[Tracing] Discarding root span because its trace was not chosen to be sampled.");
      this._client.recordDroppedEvent("sample_rate", this._isSpanStreaming ? "span" : "transaction");
    }
    return {
      ...wrapSamplingDecision({
        decision: sampled ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD,
        context: context2,
        spanAttributes,
        sampleRand,
        downstreamTraceSampleRate: localSampleRateWasApplied ? sampleRate : void 0
      }),
      attributes: {
        // We set the sample rate on the span when a local sample rate was applied to better understand how traces were sampled in Sentry
        [SEMANTIC_ATTRIBUTE_SENTRY_SAMPLE_RATE]: localSampleRateWasApplied ? sampleRate : void 0
      }
    };
  }
  /** Returns the sampler name or short description with the configuration. */
  toString() {
    return "SentrySampler";
  }
}
function getParentSampled(parentSpan, traceId, spanName) {
  const parentContext = parentSpan.spanContext();
  if (isSpanContextValid(parentContext) && parentContext.traceId === traceId) {
    if (parentContext.isRemote) {
      const parentSampled2 = getSamplingDecision(parentSpan.spanContext());
      DEBUG_BUILD$1 && debug.log(`[Tracing] Inheriting remote parent's sampled decision for ${spanName}: ${parentSampled2}`);
      return parentSampled2;
    }
    const parentSampled = getSamplingDecision(parentContext);
    DEBUG_BUILD$1 && debug.log(`[Tracing] Inheriting parent's sampled decision for ${spanName}: ${parentSampled}`);
    return parentSampled;
  }
  return void 0;
}
function wrapSamplingDecision({
  decision,
  context: context2,
  spanAttributes,
  sampleRand,
  downstreamTraceSampleRate,
  ignoredChildSpan,
  ignoredSegmentSpan
}) {
  let traceState = getBaseTraceState(context2, spanAttributes);
  if (downstreamTraceSampleRate !== void 0) {
    traceState = traceState.set(SENTRY_TRACE_STATE_SAMPLE_RATE, `${downstreamTraceSampleRate}`);
  }
  if (sampleRand !== void 0) {
    traceState = traceState.set(SENTRY_TRACE_STATE_SAMPLE_RAND, `${sampleRand}`);
  }
  if (ignoredChildSpan) {
    traceState = traceState.set(SENTRY_TRACE_STATE_CHILD_IGNORED, "1");
  }
  if (ignoredSegmentSpan) {
    traceState = traceState.set(SENTRY_TRACE_STATE_SEGMENT_IGNORED, "1");
  }
  if (decision == void 0) {
    return { decision: SamplingDecision.NOT_RECORD, traceState };
  }
  if (decision === SamplingDecision.NOT_RECORD) {
    return { decision, traceState: traceState.set(SENTRY_TRACE_STATE_SAMPLED_NOT_RECORDING, "1") };
  }
  return { decision, traceState };
}
function getBaseTraceState(context2, spanAttributes) {
  const parentSpan = trace.getSpan(context2);
  const parentContext = parentSpan?.spanContext();
  let traceState = parentContext?.traceState || new TraceState();
  const url = spanAttributes[SEMATTRS_HTTP_URL] || spanAttributes[ATTR_URL_FULL];
  if (url && typeof url === "string") {
    traceState = traceState.set(SENTRY_TRACE_STATE_URL, url);
  }
  return traceState;
}
function getValidSpan(context2) {
  const span = trace.getSpan(context2);
  return span && isSpanContextValid(span.spanContext()) ? span : void 0;
}
class SentryResource {
  constructor(attributes2) {
    this._attributes = attributes2;
  }
  get attributes() {
    return this._attributes;
  }
  merge(other) {
    if (!other) {
      return this;
    }
    return new SentryResource({ ...this._attributes, ...other.attributes });
  }
  getRawAttributes() {
    return Object.entries(this._attributes);
  }
}
function getSentryResource(serviceName2) {
  return new SentryResource({
    [ATTR_SERVICE_NAME]: serviceName2,
    // eslint-disable-next-line deprecation/deprecation
    [SEMRESATTRS_SERVICE_NAMESPACE]: "sentry",
    [ATTR_SERVICE_VERSION]: SDK_VERSION$1,
    [ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
    [ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
    [ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION]
  });
}
const SentryContextManager = SentryAsyncLocalStorageContextManager;
function setupOpenTelemetryLogger() {
  diag.disable();
  diag.setLogger(
    {
      error: debug.error,
      warn: debug.warn,
      info: debug.log,
      debug: debug.log,
      verbose: debug.log
    },
    DiagLogLevel.DEBUG
  );
}
const INTEGRATION_NAME$6 = "ChildProcess";
const childProcessIntegration$1 = defineIntegration((options = {}) => {
  return {
    name: INTEGRATION_NAME$6,
    setup() {
      diagnosticsChannel.channel("child_process").subscribe((event) => {
        if (event && typeof event === "object" && "process" in event) {
          captureChildProcessEvents(event.process, options);
        }
      });
      diagnosticsChannel.channel("worker_threads").subscribe((event) => {
        if (event && typeof event === "object" && "worker" in event) {
          captureWorkerThreadEvents(event.worker, options);
        }
      });
    }
  };
});
function captureChildProcessEvents(child, options) {
  let hasExited = false;
  let data;
  child.on("spawn", () => {
    if (child.spawnfile === "/usr/bin/sw_vers") {
      hasExited = true;
      return;
    }
    data = { spawnfile: child.spawnfile };
    if (options.includeChildProcessArgs) {
      data.spawnargs = child.spawnargs;
    }
  }).on("exit", (code) => {
    if (!hasExited) {
      hasExited = true;
      if (code !== null && code !== 0) {
        addBreadcrumb({
          category: "child_process",
          message: `Child process exited with code '${code}'`,
          level: code === 0 ? "info" : "warning",
          data
        });
      }
    }
  }).on("error", (error2) => {
    if (!hasExited) {
      hasExited = true;
      addBreadcrumb({
        category: "child_process",
        message: `Child process errored with '${error2.message}'`,
        level: "error",
        data
      });
    }
  });
}
function captureWorkerThreadEvents(worker, options) {
  let threadId2;
  worker.on("online", () => {
    threadId2 = worker.threadId;
  }).on("error", (error2) => {
    if (options.captureWorkerErrors !== false) {
      captureException(error2, {
        mechanism: { type: "auto.child_process.worker_thread", handled: false, data: { threadId: String(threadId2) } }
      });
    } else {
      addBreadcrumb({
        category: "worker_thread",
        message: `Worker thread errored with '${error2.message}'`,
        level: "error",
        data: { threadId: threadId2 }
      });
    }
  });
}
const readFileAsync = promisify(readFile);
const readDirAsync = promisify(readdir);
const INTEGRATION_NAME$5 = "Context";
const _nodeContextIntegration = (options = {}) => {
  let cachedContext;
  const _options = {
    app: true,
    os: true,
    device: true,
    culture: true,
    cloudResource: true,
    ...options
  };
  async function addContext(event) {
    if (cachedContext === void 0) {
      cachedContext = _getContexts();
    }
    const updatedContext = _updateContext(await cachedContext);
    event.contexts = {
      ...event.contexts,
      app: { ...updatedContext.app, ...event.contexts?.app },
      os: { ...updatedContext.os, ...event.contexts?.os },
      device: { ...updatedContext.device, ...event.contexts?.device },
      culture: { ...updatedContext.culture, ...event.contexts?.culture },
      cloud_resource: { ...updatedContext.cloud_resource, ...event.contexts?.cloud_resource }
    };
    return event;
  }
  async function _getContexts() {
    const contexts = {};
    if (_options.os) {
      contexts.os = await getOsContext();
    }
    if (_options.app) {
      contexts.app = getAppContext();
    }
    if (_options.device) {
      contexts.device = getDeviceContext(_options.device);
    }
    if (_options.culture) {
      const culture = getCultureContext();
      if (culture) {
        contexts.culture = culture;
      }
    }
    if (_options.cloudResource) {
      contexts.cloud_resource = getCloudResourceContext();
    }
    return contexts;
  }
  return {
    name: INTEGRATION_NAME$5,
    processEvent(event) {
      return addContext(event);
    }
  };
};
const nodeContextIntegration = defineIntegration(_nodeContextIntegration);
function _updateContext(contexts) {
  if (contexts.app?.app_memory) {
    contexts.app.app_memory = process.memoryUsage().rss;
  }
  if (contexts.app?.free_memory && typeof process.availableMemory === "function") {
    const freeMemory = process.availableMemory?.();
    if (freeMemory != null) {
      contexts.app.free_memory = freeMemory;
    }
  }
  if (contexts.device?.free_memory) {
    contexts.device.free_memory = os.freemem();
  }
  return contexts;
}
async function getOsContext() {
  const platformId = os.platform();
  switch (platformId) {
    case "darwin":
      return getDarwinInfo();
    case "linux":
      return getLinuxInfo();
    default:
      return {
        name: PLATFORM_NAMES[platformId] || platformId,
        version: os.release()
      };
  }
}
function getCultureContext() {
  try {
    if (typeof process.versions.icu !== "string") {
      return;
    }
    const january = /* @__PURE__ */ new Date(9e8);
    const spanish = new Intl.DateTimeFormat("es", { month: "long" });
    if (spanish.format(january) === "enero") {
      const options = Intl.DateTimeFormat().resolvedOptions();
      return {
        locale: options.locale,
        timezone: options.timeZone
      };
    }
  } catch {
  }
  return;
}
function getAppContext() {
  const app_memory = process.memoryUsage().rss;
  const app_start_time = new Date(Date.now() - process.uptime() * 1e3).toISOString();
  const appContext = { app_start_time, app_memory };
  if (typeof process.availableMemory === "function") {
    const freeMemory = process.availableMemory?.();
    if (freeMemory != null) {
      appContext.free_memory = freeMemory;
    }
  }
  return appContext;
}
function getDeviceContext(deviceOpt) {
  const device = {};
  let uptime;
  try {
    uptime = os.uptime();
  } catch {
  }
  if (typeof uptime === "number") {
    device.boot_time = new Date(Date.now() - uptime * 1e3).toISOString();
  }
  device.arch = os.arch();
  if (deviceOpt === true || deviceOpt.memory) {
    device.memory_size = os.totalmem();
    device.free_memory = os.freemem();
  }
  if (deviceOpt === true || deviceOpt.cpu) {
    const cpuInfo = os.cpus();
    const firstCpu = cpuInfo?.[0];
    if (firstCpu) {
      device.processor_count = cpuInfo.length;
      device.cpu_description = firstCpu.model;
      device.processor_frequency = firstCpu.speed;
    }
  }
  return device;
}
const PLATFORM_NAMES = {
  aix: "IBM AIX",
  freebsd: "FreeBSD",
  openbsd: "OpenBSD",
  sunos: "SunOS",
  win32: "Windows",
  ohos: "OpenHarmony",
  android: "Android"
};
const LINUX_DISTROS = [
  { name: "fedora-release", distros: ["Fedora"] },
  { name: "redhat-release", distros: ["Red Hat Linux", "Centos"] },
  { name: "redhat_version", distros: ["Red Hat Linux"] },
  { name: "SuSE-release", distros: ["SUSE Linux"] },
  { name: "lsb-release", distros: ["Ubuntu Linux", "Arch Linux"] },
  { name: "debian_version", distros: ["Debian"] },
  { name: "debian_release", distros: ["Debian"] },
  { name: "arch-release", distros: ["Arch Linux"] },
  { name: "gentoo-release", distros: ["Gentoo Linux"] },
  { name: "novell-release", distros: ["SUSE Linux"] },
  { name: "alpine-release", distros: ["Alpine Linux"] }
];
const LINUX_VERSIONS = {
  alpine: (content) => content,
  arch: (content) => matchFirst(/distrib_release=(.*)/, content),
  centos: (content) => matchFirst(/release ([^ ]+)/, content),
  debian: (content) => content,
  fedora: (content) => matchFirst(/release (..)/, content),
  mint: (content) => matchFirst(/distrib_release=(.*)/, content),
  red: (content) => matchFirst(/release ([^ ]+)/, content),
  suse: (content) => matchFirst(/VERSION = (.*)\n/, content),
  ubuntu: (content) => matchFirst(/distrib_release=(.*)/, content)
};
function matchFirst(regex, text) {
  const match = regex.exec(text);
  return match ? match[1] : void 0;
}
async function getDarwinInfo() {
  const darwinInfo = {
    kernel_version: os.release(),
    name: "Mac OS X",
    version: `10.${Number(os.release().split(".")[0]) - 4}`
  };
  try {
    const output = await new Promise((resolve2, reject) => {
      execFile("/usr/bin/sw_vers", (error2, stdout) => {
        if (error2) {
          reject(error2);
          return;
        }
        resolve2(stdout);
      });
    });
    darwinInfo.name = matchFirst(/^ProductName:\s+(.*)$/m, output);
    darwinInfo.version = matchFirst(/^ProductVersion:\s+(.*)$/m, output);
    darwinInfo.build = matchFirst(/^BuildVersion:\s+(.*)$/m, output);
  } catch {
  }
  return darwinInfo;
}
function getLinuxDistroId(name) {
  return name.split(" ")[0].toLowerCase();
}
async function getLinuxInfo() {
  const linuxInfo = {
    kernel_version: os.release(),
    name: "Linux"
  };
  try {
    const etcFiles = await readDirAsync("/etc");
    const distroFile = LINUX_DISTROS.find((file) => etcFiles.includes(file.name));
    if (!distroFile) {
      return linuxInfo;
    }
    const distroPath = join("/etc", distroFile.name);
    const contents = (await readFileAsync(distroPath, { encoding: "utf-8" })).toLowerCase();
    const { distros } = distroFile;
    linuxInfo.name = distros.find((d) => contents.indexOf(getLinuxDistroId(d)) >= 0) || distros[0];
    const id = getLinuxDistroId(linuxInfo.name);
    linuxInfo.version = LINUX_VERSIONS[id]?.(contents);
  } catch {
  }
  return linuxInfo;
}
function getCloudResourceContext() {
  if (process.env.VERCEL) {
    return {
      "cloud.provider": "vercel",
      "cloud.region": process.env.VERCEL_REGION
    };
  } else if (process.env.AWS_REGION) {
    return {
      "cloud.provider": "aws",
      "cloud.region": process.env.AWS_REGION,
      "cloud.platform": process.env.AWS_EXECUTION_ENV
    };
  } else if (process.env.GCP_PROJECT) {
    return {
      "cloud.provider": "gcp"
    };
  } else if (process.env.ALIYUN_REGION_ID) {
    return {
      "cloud.provider": "alibaba_cloud",
      "cloud.region": process.env.ALIYUN_REGION_ID
    };
  } else if (process.env.WEBSITE_SITE_NAME && process.env.REGION_NAME) {
    return {
      "cloud.provider": "azure",
      "cloud.region": process.env.REGION_NAME
    };
  } else if (process.env.IBM_CLOUD_REGION) {
    return {
      "cloud.provider": "ibm_cloud",
      "cloud.region": process.env.IBM_CLOUD_REGION
    };
  } else if (process.env.TENCENTCLOUD_REGION) {
    return {
      "cloud.provider": "tencent_cloud",
      "cloud.region": process.env.TENCENTCLOUD_REGION,
      "cloud.account.id": process.env.TENCENTCLOUD_APPID,
      "cloud.availability_zone": process.env.TENCENTCLOUD_ZONE
    };
  } else if (process.env.NETLIFY) {
    return {
      "cloud.provider": "netlify"
    };
  } else if (process.env.FLY_REGION) {
    return {
      "cloud.provider": "fly.io",
      "cloud.region": process.env.FLY_REGION
    };
  } else if (process.env.DYNO) {
    return {
      "cloud.provider": "heroku"
    };
  } else {
    return void 0;
  }
}
const LRU_FILE_CONTENTS_CACHE = new LRUMap(10);
const LRU_FILE_CONTENTS_FS_READ_FAILED = new LRUMap(20);
const DEFAULT_LINES_OF_CONTEXT = 7;
const INTEGRATION_NAME$4 = "ContextLines";
const MAX_CONTEXTLINES_COLNO = 1e3;
const MAX_CONTEXTLINES_LINENO = 1e4;
function emplace(map, key, contents) {
  const value = map.get(key);
  if (value === void 0) {
    map.set(key, contents);
    return contents;
  }
  return value;
}
function shouldSkipContextLinesForFile(path2) {
  if (path2.startsWith("node:")) return true;
  if (path2.endsWith(".min.js")) return true;
  if (path2.endsWith(".min.cjs")) return true;
  if (path2.endsWith(".min.mjs")) return true;
  if (path2.startsWith("data:")) return true;
  return false;
}
function shouldSkipContextLinesForFrame(frame) {
  if (frame.lineno !== void 0 && frame.lineno > MAX_CONTEXTLINES_LINENO) return true;
  if (frame.colno !== void 0 && frame.colno > MAX_CONTEXTLINES_COLNO) return true;
  return false;
}
function rangeExistsInContentCache(file, range) {
  const contents = LRU_FILE_CONTENTS_CACHE.get(file);
  if (contents === void 0) return false;
  for (let i = range[0]; i <= range[1]; i++) {
    if (contents[i] === void 0) {
      return false;
    }
  }
  return true;
}
function makeLineReaderRanges(lines, linecontext) {
  if (!lines.length) {
    return [];
  }
  let i = 0;
  const line = lines[0];
  if (typeof line !== "number") {
    return [];
  }
  let current = makeContextRange(line, linecontext);
  const out = [];
  while (true) {
    if (i === lines.length - 1) {
      out.push(current);
      break;
    }
    const next = lines[i + 1];
    if (typeof next !== "number") {
      break;
    }
    if (next <= current[1]) {
      current[1] = next + linecontext;
    } else {
      out.push(current);
      current = makeContextRange(next, linecontext);
    }
    i++;
  }
  return out;
}
function getContextLinesFromFile(path2, ranges, output) {
  return new Promise((resolve2, _reject) => {
    const stream = createReadStream(path2);
    const lineReaded = createInterface({
      input: stream
    });
    function destroyStreamAndResolve() {
      stream.destroy();
      resolve2();
    }
    let lineNumber = 0;
    let currentRangeIndex = 0;
    const range = ranges[currentRangeIndex];
    if (range === void 0) {
      destroyStreamAndResolve();
      return;
    }
    let rangeStart = range[0];
    let rangeEnd = range[1];
    function onStreamError(e) {
      LRU_FILE_CONTENTS_FS_READ_FAILED.set(path2, 1);
      DEBUG_BUILD$2 && debug.error(`Failed to read file: ${path2}. Error: ${e}`);
      lineReaded.close();
      lineReaded.removeAllListeners();
      destroyStreamAndResolve();
    }
    stream.on("error", onStreamError);
    lineReaded.on("error", onStreamError);
    lineReaded.on("close", destroyStreamAndResolve);
    lineReaded.on("line", (line) => {
      lineNumber++;
      if (lineNumber < rangeStart) return;
      output[lineNumber] = snipLine(line, 0);
      if (lineNumber >= rangeEnd) {
        if (currentRangeIndex === ranges.length - 1) {
          lineReaded.close();
          lineReaded.removeAllListeners();
          return;
        }
        currentRangeIndex++;
        const range2 = ranges[currentRangeIndex];
        if (range2 === void 0) {
          lineReaded.close();
          lineReaded.removeAllListeners();
          return;
        }
        rangeStart = range2[0];
        rangeEnd = range2[1];
      }
    });
  });
}
async function addSourceContext(event, contextLines) {
  const filesToLines = {};
  if (contextLines > 0 && event.exception?.values) {
    for (const exception of event.exception.values) {
      if (!exception.stacktrace?.frames?.length) {
        continue;
      }
      for (let i = exception.stacktrace.frames.length - 1; i >= 0; i--) {
        const frame = exception.stacktrace.frames[i];
        const filename = frame?.filename;
        if (!frame || typeof filename !== "string" || typeof frame.lineno !== "number" || shouldSkipContextLinesForFile(filename) || shouldSkipContextLinesForFrame(frame)) {
          continue;
        }
        const filesToLinesOutput = filesToLines[filename];
        if (!filesToLinesOutput) filesToLines[filename] = [];
        filesToLines[filename].push(frame.lineno);
      }
    }
  }
  const files = Object.keys(filesToLines);
  if (files.length == 0) {
    return event;
  }
  const readlinePromises = [];
  for (const file of files) {
    if (LRU_FILE_CONTENTS_FS_READ_FAILED.get(file)) {
      continue;
    }
    const filesToLineRanges = filesToLines[file];
    if (!filesToLineRanges) {
      continue;
    }
    filesToLineRanges.sort((a, b) => a - b);
    const ranges = makeLineReaderRanges(filesToLineRanges, contextLines);
    if (ranges.every((r) => rangeExistsInContentCache(file, r))) {
      continue;
    }
    const cache = emplace(LRU_FILE_CONTENTS_CACHE, file, {});
    readlinePromises.push(getContextLinesFromFile(file, ranges, cache));
  }
  await Promise.all(readlinePromises).catch(() => {
    DEBUG_BUILD$2 && debug.log("Failed to read one or more source files and resolve context lines");
  });
  if (contextLines > 0 && event.exception?.values) {
    for (const exception of event.exception.values) {
      if (exception.stacktrace?.frames && exception.stacktrace.frames.length > 0) {
        addSourceContextToFrames(exception.stacktrace.frames, contextLines, LRU_FILE_CONTENTS_CACHE);
      }
    }
  }
  return event;
}
function addSourceContextToFrames(frames, contextLines, cache) {
  for (const frame of frames) {
    if (frame.filename && frame.context_line === void 0 && typeof frame.lineno === "number") {
      const contents = cache.get(frame.filename);
      if (contents === void 0) {
        continue;
      }
      addContextToFrame(frame.lineno, frame, contextLines, contents);
    }
  }
}
function clearLineContext(frame) {
  delete frame.pre_context;
  delete frame.context_line;
  delete frame.post_context;
}
function addContextToFrame(lineno, frame, contextLines, contents) {
  if (frame.lineno === void 0 || contents === void 0) {
    DEBUG_BUILD$2 && debug.error("Cannot resolve context for frame with no lineno or file contents");
    return;
  }
  frame.pre_context = [];
  for (let i = makeRangeStart(lineno, contextLines); i < lineno; i++) {
    const line = contents[i];
    if (line === void 0) {
      clearLineContext(frame);
      DEBUG_BUILD$2 && debug.error(`Could not find line ${i} in file ${frame.filename}`);
      return;
    }
    frame.pre_context.push(line);
  }
  if (contents[lineno] === void 0) {
    clearLineContext(frame);
    DEBUG_BUILD$2 && debug.error(`Could not find line ${lineno} in file ${frame.filename}`);
    return;
  }
  frame.context_line = contents[lineno];
  const end = makeRangeEnd(lineno, contextLines);
  frame.post_context = [];
  for (let i = lineno + 1; i <= end; i++) {
    const line = contents[i];
    if (line === void 0) {
      break;
    }
    frame.post_context.push(line);
  }
}
function makeRangeStart(line, linecontext) {
  return Math.max(1, line - linecontext);
}
function makeRangeEnd(line, linecontext) {
  return line + linecontext;
}
function makeContextRange(line, linecontext) {
  return [makeRangeStart(line, linecontext), makeRangeEnd(line, linecontext)];
}
const _contextLinesIntegration = (options = {}) => {
  const contextLines = options.frameContextLines !== void 0 ? options.frameContextLines : DEFAULT_LINES_OF_CONTEXT;
  return {
    name: INTEGRATION_NAME$4,
    processEvent(event) {
      return addSourceContext(event, contextLines);
    }
  };
};
const contextLinesIntegration = defineIntegration(_contextLinesIntegration);
let cachedDebuggerEnabled;
async function isDebuggerEnabled() {
  if (cachedDebuggerEnabled === void 0) {
    try {
      const inspector = await import("node:inspector");
      cachedDebuggerEnabled = !!inspector.url();
    } catch {
      cachedDebuggerEnabled = false;
    }
  }
  return cachedDebuggerEnabled;
}
const LOCAL_VARIABLES_KEY = "__SENTRY_ERROR_LOCAL_VARIABLES__";
function createRateLimiter(maxPerSecond, enable2, disable2) {
  let count = 0;
  let retrySeconds = 5;
  let disabledTimeout = 0;
  setInterval(() => {
    if (disabledTimeout === 0) {
      if (count > maxPerSecond) {
        retrySeconds *= 2;
        disable2(retrySeconds);
        if (retrySeconds > 86400) {
          retrySeconds = 86400;
        }
        disabledTimeout = retrySeconds;
      }
    } else {
      disabledTimeout -= 1;
      if (disabledTimeout === 0) {
        enable2();
      }
    }
    count = 0;
  }, 1e3).unref();
  return () => {
    count += 1;
  };
}
function isAnonymous(name) {
  return name !== void 0 && (name.length === 0 || name === "?" || name === "<anonymous>");
}
function functionNamesMatch(a, b) {
  return a === b || `Object.${a}` === b || a === `Object.${b}` || isAnonymous(a) && isAnonymous(b);
}
const base64WorkerScript = "LyohIEBzZW50cnkvbm9kZS1jb3JlIDEwLjUwLjAgKDc4NWU3NTYpIHwgaHR0cHM6Ly9naXRodWIuY29tL2dldHNlbnRyeS9zZW50cnktamF2YXNjcmlwdCAqLwppbXBvcnR7U2Vzc2lvbiBhcyBlfWZyb20ibm9kZTppbnNwZWN0b3IvcHJvbWlzZXMiO2ltcG9ydHt3b3JrZXJEYXRhIGFzIHR9ZnJvbSJub2RlOndvcmtlcl90aHJlYWRzIjtjb25zdCBuPWdsb2JhbFRoaXMsaT17fTtjb25zdCBvPSJfX1NFTlRSWV9FUlJPUl9MT0NBTF9WQVJJQUJMRVNfXyI7Y29uc3QgYT10O2Z1bmN0aW9uIHMoLi4uZSl7YS5kZWJ1ZyYmZnVuY3Rpb24oZSl7aWYoISgiY29uc29sZSJpbiBuKSlyZXR1cm4gZSgpO2NvbnN0IHQ9bi5jb25zb2xlLG89e30sYT1PYmplY3Qua2V5cyhpKTthLmZvckVhY2goZT0+e2NvbnN0IG49aVtlXTtvW2VdPXRbZV0sdFtlXT1ufSk7dHJ5e3JldHVybiBlKCl9ZmluYWxseXthLmZvckVhY2goZT0+e3RbZV09b1tlXX0pfX0oKCk9PmNvbnNvbGUubG9nKCJbTG9jYWxWYXJpYWJsZXMgV29ya2VyXSIsLi4uZSkpfWFzeW5jIGZ1bmN0aW9uIGMoZSx0LG4saSl7Y29uc3Qgbz1hd2FpdCBlLnBvc3QoIlJ1bnRpbWUuZ2V0UHJvcGVydGllcyIse29iamVjdElkOnQsb3duUHJvcGVydGllczohMH0pO2lbbl09by5yZXN1bHQuZmlsdGVyKGU9PiJsZW5ndGgiIT09ZS5uYW1lJiYhaXNOYU4ocGFyc2VJbnQoZS5uYW1lLDEwKSkpLnNvcnQoKGUsdCk9PnBhcnNlSW50KGUubmFtZSwxMCktcGFyc2VJbnQodC5uYW1lLDEwKSkubWFwKGU9PmUudmFsdWU/LnZhbHVlKX1hc3luYyBmdW5jdGlvbiByKGUsdCxuLGkpe2NvbnN0IG89YXdhaXQgZS5wb3N0KCJSdW50aW1lLmdldFByb3BlcnRpZXMiLHtvYmplY3RJZDp0LG93blByb3BlcnRpZXM6ITB9KTtpW25dPW8ucmVzdWx0Lm1hcChlPT5bZS5uYW1lLGUudmFsdWU/LnZhbHVlXSkucmVkdWNlKChlLFt0LG5dKT0+KGVbdF09bixlKSx7fSl9ZnVuY3Rpb24gdShlLHQpe2UudmFsdWUmJigidmFsdWUiaW4gZS52YWx1ZT92b2lkIDA9PT1lLnZhbHVlLnZhbHVlfHxudWxsPT09ZS52YWx1ZS52YWx1ZT90W2UubmFtZV09YDwke2UudmFsdWUudmFsdWV9PmA6dFtlLm5hbWVdPWUudmFsdWUudmFsdWU6ImRlc2NyaXB0aW9uImluIGUudmFsdWUmJiJmdW5jdGlvbiIhPT1lLnZhbHVlLnR5cGU/dFtlLm5hbWVdPWA8JHtlLnZhbHVlLmRlc2NyaXB0aW9ufT5gOiJ1bmRlZmluZWQiPT09ZS52YWx1ZS50eXBlJiYodFtlLm5hbWVdPSI8dW5kZWZpbmVkPiIpKX1hc3luYyBmdW5jdGlvbiBsKGUsdCl7Y29uc3Qgbj1hd2FpdCBlLnBvc3QoIlJ1bnRpbWUuZ2V0UHJvcGVydGllcyIse29iamVjdElkOnQsb3duUHJvcGVydGllczohMH0pLGk9e307Zm9yKGNvbnN0IHQgb2Ygbi5yZXN1bHQpaWYodC52YWx1ZT8ub2JqZWN0SWQmJiJBcnJheSI9PT10LnZhbHVlLmNsYXNzTmFtZSl7Y29uc3Qgbj10LnZhbHVlLm9iamVjdElkO2F3YWl0IGMoZSxuLHQubmFtZSxpKX1lbHNlIGlmKHQudmFsdWU/Lm9iamVjdElkJiYiT2JqZWN0Ij09PXQudmFsdWUuY2xhc3NOYW1lKXtjb25zdCBuPXQudmFsdWUub2JqZWN0SWQ7YXdhaXQgcihlLG4sdC5uYW1lLGkpfWVsc2UgdC52YWx1ZSYmdSh0LGkpO3JldHVybiBpfWxldCBmOyhhc3luYyBmdW5jdGlvbigpe2NvbnN0IHQ9bmV3IGU7dC5jb25uZWN0VG9NYWluVGhyZWFkKCkscygiQ29ubmVjdGVkIHRvIG1haW4gdGhyZWFkIik7bGV0IG49ITE7dC5vbigiRGVidWdnZXIucmVzdW1lZCIsKCk9PntuPSExfSksdC5vbigiRGVidWdnZXIucGF1c2VkIixlPT57bj0hMCxhc3luYyBmdW5jdGlvbihlLHtyZWFzb246dCxkYXRhOntvYmplY3RJZDpufSxjYWxsRnJhbWVzOml9KXtpZigiZXhjZXB0aW9uIiE9PXQmJiJwcm9taXNlUmVqZWN0aW9uIiE9PXQpcmV0dXJuO2lmKGY/LigpLG51bGw9PW4pcmV0dXJuO2NvbnN0IGE9W107Zm9yKGxldCB0PTA7dDxpLmxlbmd0aDt0Kyspe2NvbnN0e3Njb3BlQ2hhaW46bixmdW5jdGlvbk5hbWU6byx0aGlzOnN9PWlbdF0sYz1uLmZpbmQoZT0+ImxvY2FsIj09PWUudHlwZSkscj0iZ2xvYmFsIiE9PXMuY2xhc3NOYW1lJiZzLmNsYXNzTmFtZT9gJHtzLmNsYXNzTmFtZX0uJHtvfWA6bztpZih2b2lkIDA9PT1jPy5vYmplY3Qub2JqZWN0SWQpYVt0XT17ZnVuY3Rpb246cn07ZWxzZXtjb25zdCBuPWF3YWl0IGwoZSxjLm9iamVjdC5vYmplY3RJZCk7YVt0XT17ZnVuY3Rpb246cix2YXJzOm59fX1hd2FpdCBlLnBvc3QoIlJ1bnRpbWUuY2FsbEZ1bmN0aW9uT24iLHtmdW5jdGlvbkRlY2xhcmF0aW9uOmBmdW5jdGlvbigpIHsgdGhpcy4ke299ID0gdGhpcy4ke299IHx8ICR7SlNPTi5zdHJpbmdpZnkoYSl9OyB9YCxzaWxlbnQ6ITAsb2JqZWN0SWQ6bn0pLGF3YWl0IGUucG9zdCgiUnVudGltZS5yZWxlYXNlT2JqZWN0Iix7b2JqZWN0SWQ6bn0pfSh0LGUucGFyYW1zKS50aGVuKGFzeW5jKCk9PntuJiZhd2FpdCB0LnBvc3QoIkRlYnVnZ2VyLnJlc3VtZSIpfSxhc3luYyBlPT57biYmYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5yZXN1bWUiKX0pfSksYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5lbmFibGUiKTtjb25zdCBpPSExIT09YS5jYXB0dXJlQWxsRXhjZXB0aW9ucztpZihhd2FpdCB0LnBvc3QoIkRlYnVnZ2VyLnNldFBhdXNlT25FeGNlcHRpb25zIix7c3RhdGU6aT8iYWxsIjoidW5jYXVnaHQifSksaSl7Y29uc3QgZT1hLm1heEV4Y2VwdGlvbnNQZXJTZWNvbmR8fDUwO2Y9ZnVuY3Rpb24oZSx0LG4pe2xldCBpPTAsbz01LGE9MDtyZXR1cm4gc2V0SW50ZXJ2YWwoKCk9PnswPT09YT9pPmUmJihvKj0yLG4obyksbz44NjQwMCYmKG89ODY0MDApLGE9byk6KGEtPTEsMD09PWEmJnQoKSksaT0wfSwxZTMpLnVucmVmKCksKCk9PntpKz0xfX0oZSxhc3luYygpPT57cygiUmF0ZS1saW1pdCBsaWZ0ZWQuIiksYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5zZXRQYXVzZU9uRXhjZXB0aW9ucyIse3N0YXRlOiJhbGwifSl9LGFzeW5jIGU9PntzKGBSYXRlLWxpbWl0IGV4Y2VlZGVkLiBEaXNhYmxpbmcgY2FwdHVyaW5nIG9mIGNhdWdodCBleGNlcHRpb25zIGZvciAke2V9IHNlY29uZHMuYCksYXdhaXQgdC5wb3N0KCJEZWJ1Z2dlci5zZXRQYXVzZU9uRXhjZXB0aW9ucyIse3N0YXRlOiJ1bmNhdWdodCJ9KX0pfX0pKCkuY2F0Y2goZT0+e3MoIkZhaWxlZCB0byBzdGFydCBkZWJ1Z2dlciIsZSl9KSxzZXRJbnRlcnZhbCgoKT0+e30sMWU0KTs=";
function log$2(...args) {
  debug.log("[LocalVariables]", ...args);
}
const localVariablesAsyncIntegration = defineIntegration((integrationOptions = {}) => {
  function addLocalVariablesToException(exception, localVariables) {
    const frames = (exception.stacktrace?.frames || []).filter((frame) => frame.function !== "new Promise");
    for (let i = 0; i < frames.length; i++) {
      const frameIndex = frames.length - i - 1;
      const frameLocalVariables = localVariables[i];
      const frame = frames[frameIndex];
      if (!frame || !frameLocalVariables) {
        break;
      }
      if (
        // We need to have vars to add
        frameLocalVariables.vars === void 0 || // Only skip out-of-app frames if includeOutOfAppFrames is not true
        frame.in_app === false && integrationOptions.includeOutOfAppFrames !== true || // The function names need to match
        !functionNamesMatch(frame.function, frameLocalVariables.function)
      ) {
        continue;
      }
      frame.vars = frameLocalVariables.vars;
    }
  }
  function addLocalVariablesToEvent(event, hint) {
    if (hint.originalException && typeof hint.originalException === "object" && LOCAL_VARIABLES_KEY in hint.originalException && Array.isArray(hint.originalException[LOCAL_VARIABLES_KEY])) {
      for (const exception of event.exception?.values || []) {
        addLocalVariablesToException(exception, hint.originalException[LOCAL_VARIABLES_KEY]);
      }
      hint.originalException[LOCAL_VARIABLES_KEY] = void 0;
    }
    return event;
  }
  async function startInspector() {
    const inspector = await import("node:inspector");
    if (!inspector.url()) {
      inspector.open(0);
    }
  }
  function startWorker(options) {
    const worker = new Worker(new URL(`data:application/javascript;base64,${base64WorkerScript}`), {
      workerData: options,
      // We don't want any Node args to be passed to the worker
      execArgv: [],
      env: { ...process.env, NODE_OPTIONS: void 0 }
    });
    process.on("exit", () => {
      worker.terminate();
    });
    worker.once("error", (err) => {
      log$2("Worker error", err);
    });
    worker.once("exit", (code) => {
      log$2("Worker exit", code);
    });
    worker.unref();
  }
  return {
    name: "LocalVariablesAsync",
    async setup(client) {
      const clientOptions = client.getOptions();
      if (!clientOptions.includeLocalVariables) {
        return;
      }
      if (await isDebuggerEnabled()) {
        debug.warn("Local variables capture has been disabled because the debugger was already enabled");
        return;
      }
      const options = {
        ...integrationOptions,
        debug: debug.isEnabled()
      };
      startInspector().then(
        () => {
          try {
            startWorker(options);
          } catch (e) {
            debug.error("Failed to start worker", e);
          }
        },
        (e) => {
          debug.error("Failed to start inspector", e);
        }
      );
    },
    processEvent(event, hint) {
      return addLocalVariablesToEvent(event, hint);
    }
  };
});
function hashFrames(frames) {
  if (frames === void 0) {
    return;
  }
  return frames.slice(-10).reduce((acc, frame) => `${acc},${frame.function},${frame.lineno},${frame.colno}`, "");
}
function hashFromStack(stackParser, stack) {
  if (stack === void 0) {
    return void 0;
  }
  return hashFrames(stackParser(stack, 1));
}
function createCallbackList(complete) {
  let callbacks = [];
  let completedCalled = false;
  function checkedComplete(result) {
    callbacks = [];
    if (completedCalled) {
      return;
    }
    completedCalled = true;
    complete(result);
  }
  callbacks.push(checkedComplete);
  function add(fn) {
    callbacks.push(fn);
  }
  function next(result) {
    const popped = callbacks.pop() || checkedComplete;
    try {
      popped(result);
    } catch {
      checkedComplete(result);
    }
  }
  return { add, next };
}
class AsyncSession {
  /** Throws if inspector API is not available */
  constructor(_session) {
    this._session = _session;
  }
  static async create(orDefault) {
    if (orDefault) {
      return orDefault;
    }
    const inspector = await import("node:inspector");
    return new AsyncSession(new inspector.Session());
  }
  /** @inheritdoc */
  configureAndConnect(onPause, captureAll) {
    this._session.connect();
    this._session.on("Debugger.paused", (event) => {
      onPause(event, () => {
        this._session.post("Debugger.resume");
      });
    });
    this._session.post("Debugger.enable");
    this._session.post("Debugger.setPauseOnExceptions", { state: captureAll ? "all" : "uncaught" });
  }
  setPauseOnExceptions(captureAll) {
    this._session.post("Debugger.setPauseOnExceptions", { state: captureAll ? "all" : "uncaught" });
  }
  /** @inheritdoc */
  getLocalVariables(objectId, complete) {
    this._getProperties(objectId, (props) => {
      const { add, next } = createCallbackList(complete);
      for (const prop of props) {
        if (prop.value?.objectId && prop.value.className === "Array") {
          const id = prop.value.objectId;
          add((vars) => this._unrollArray(id, prop.name, vars, next));
        } else if (prop.value?.objectId && prop.value.className === "Object") {
          const id = prop.value.objectId;
          add((vars) => this._unrollObject(id, prop.name, vars, next));
        } else if (prop.value) {
          add((vars) => this._unrollOther(prop, vars, next));
        }
      }
      next({});
    });
  }
  /**
   * Gets all the PropertyDescriptors of an object
   */
  _getProperties(objectId, next) {
    this._session.post(
      "Runtime.getProperties",
      {
        objectId,
        ownProperties: true
      },
      (err, params) => {
        if (err) {
          next([]);
        } else {
          next(params.result);
        }
      }
    );
  }
  /**
   * Unrolls an array property
   */
  _unrollArray(objectId, name, vars, next) {
    this._getProperties(objectId, (props) => {
      vars[name] = props.filter((v) => v.name !== "length" && !isNaN(parseInt(v.name, 10))).sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10)).map((v) => v.value?.value);
      next(vars);
    });
  }
  /**
   * Unrolls an object property
   */
  _unrollObject(objectId, name, vars, next) {
    this._getProperties(objectId, (props) => {
      vars[name] = props.map((v) => [v.name, v.value?.value]).reduce((obj, [key, val]) => {
        obj[key] = val;
        return obj;
      }, {});
      next(vars);
    });
  }
  /**
   * Unrolls other properties
   */
  _unrollOther(prop, vars, next) {
    if (prop.value) {
      if ("value" in prop.value) {
        if (prop.value.value === void 0 || prop.value.value === null) {
          vars[prop.name] = `<${prop.value.value}>`;
        } else {
          vars[prop.name] = prop.value.value;
        }
      } else if ("description" in prop.value && prop.value.type !== "function") {
        vars[prop.name] = `<${prop.value.description}>`;
      } else if (prop.value.type === "undefined") {
        vars[prop.name] = "<undefined>";
      }
    }
    next(vars);
  }
}
const INTEGRATION_NAME$3 = "LocalVariables";
const _localVariablesSyncIntegration = (options = {}, sessionOverride) => {
  const cachedFrames = new LRUMap(20);
  let rateLimiter;
  let shouldProcessEvent = false;
  function addLocalVariablesToException(exception) {
    const hash = hashFrames(exception.stacktrace?.frames);
    if (hash === void 0) {
      return;
    }
    const cachedFrame = cachedFrames.remove(hash);
    if (cachedFrame === void 0) {
      return;
    }
    const frames = (exception.stacktrace?.frames || []).filter((frame) => frame.function !== "new Promise");
    for (let i = 0; i < frames.length; i++) {
      const frameIndex = frames.length - i - 1;
      const cachedFrameVariable = cachedFrame[i];
      const frameVariable = frames[frameIndex];
      if (!frameVariable || !cachedFrameVariable) {
        break;
      }
      if (
        // We need to have vars to add
        cachedFrameVariable.vars === void 0 || // Only skip out-of-app frames if includeOutOfAppFrames is not true
        frameVariable.in_app === false && options.includeOutOfAppFrames !== true || // The function names need to match
        !functionNamesMatch(frameVariable.function, cachedFrameVariable.function)
      ) {
        continue;
      }
      frameVariable.vars = cachedFrameVariable.vars;
    }
  }
  function addLocalVariablesToEvent(event) {
    for (const exception of event.exception?.values || []) {
      addLocalVariablesToException(exception);
    }
    return event;
  }
  let setupPromise;
  async function setup() {
    const client = getClient();
    const clientOptions = client?.getOptions();
    if (!clientOptions?.includeLocalVariables) {
      return;
    }
    const unsupportedNodeVersion = NODE_MAJOR < 18;
    if (unsupportedNodeVersion) {
      debug.log("The `LocalVariables` integration is only supported on Node >= v18.");
      return;
    }
    if (await isDebuggerEnabled()) {
      debug.warn("Local variables capture has been disabled because the debugger was already enabled");
      return;
    }
    try {
      const session2 = await AsyncSession.create(sessionOverride);
      const handlePaused = (stackParser, { params: { reason, data, callFrames } }, complete) => {
        if (reason !== "exception" && reason !== "promiseRejection") {
          complete();
          return;
        }
        rateLimiter?.();
        const exceptionHash = hashFromStack(stackParser, data.description);
        if (exceptionHash == void 0) {
          complete();
          return;
        }
        const { add, next } = createCallbackList((frames) => {
          cachedFrames.set(exceptionHash, frames);
          complete();
        });
        for (let i = 0; i < Math.min(callFrames.length, 5); i++) {
          const { scopeChain, functionName, this: obj } = callFrames[i];
          const localScope = scopeChain.find((scope) => scope.type === "local");
          const fn = obj.className === "global" || !obj.className ? functionName : `${obj.className}.${functionName}`;
          if (localScope?.object.objectId === void 0) {
            add((frames) => {
              frames[i] = { function: fn };
              next(frames);
            });
          } else {
            const id = localScope.object.objectId;
            add(
              (frames) => session2.getLocalVariables(id, (vars) => {
                frames[i] = { function: fn, vars };
                next(frames);
              })
            );
          }
        }
        next([]);
      };
      const captureAll = options.captureAllExceptions !== false;
      session2.configureAndConnect(
        (ev, complete) => handlePaused(clientOptions.stackParser, ev, complete),
        captureAll
      );
      if (captureAll) {
        const max = options.maxExceptionsPerSecond || 50;
        rateLimiter = createRateLimiter(
          max,
          () => {
            debug.log("Local variables rate-limit lifted.");
            session2.setPauseOnExceptions(true);
          },
          (seconds) => {
            debug.log(
              `Local variables rate-limit exceeded. Disabling capturing of caught exceptions for ${seconds} seconds.`
            );
            session2.setPauseOnExceptions(false);
          }
        );
      }
      shouldProcessEvent = true;
    } catch (error2) {
      debug.log("The `LocalVariables` integration failed to start.", error2);
    }
  }
  return {
    name: INTEGRATION_NAME$3,
    setupOnce() {
      setupPromise = setup();
    },
    async processEvent(event) {
      await setupPromise;
      if (shouldProcessEvent) {
        return addLocalVariablesToEvent(event);
      }
      return event;
    },
    // These are entirely for testing
    _getCachedFramesCount() {
      return cachedFrames.size;
    },
    _getFirstCachedFrame() {
      return cachedFrames.values()[0];
    }
  };
};
const localVariablesSyncIntegration = defineIntegration(_localVariablesSyncIntegration);
const localVariablesIntegration = (options = {}) => {
  return NODE_VERSION.major < 19 ? localVariablesSyncIntegration(options) : localVariablesAsyncIntegration(options);
};
const DEFAULT_SHUTDOWN_TIMEOUT = 2e3;
function logAndExitProcess(error2) {
  consoleSandbox(() => {
    console.error(error2);
  });
  const client = getClient();
  if (client === void 0) {
    DEBUG_BUILD$2 && debug.warn("No NodeClient was defined, we are exiting the process now.");
    global.process.exit(1);
    return;
  }
  const options = client.getOptions();
  const timeout = options?.shutdownTimeout && options.shutdownTimeout > 0 ? options.shutdownTimeout : DEFAULT_SHUTDOWN_TIMEOUT;
  client.close(timeout).then(
    (result) => {
      if (!result) {
        DEBUG_BUILD$2 && debug.warn("We reached the timeout for emptying the request buffer, still exiting now!");
      }
      global.process.exit(1);
    },
    (error3) => {
      DEBUG_BUILD$2 && debug.error(error3);
    }
  );
}
const INTEGRATION_NAME$2 = "OnUnhandledRejection";
const DEFAULT_IGNORES = [
  {
    name: "AI_NoOutputGeneratedError"
    // When stream aborts in Vercel AI SDK V5, Vercel flush() fails with an error
  },
  {
    name: "AbortError"
    // When stream aborts in Vercel AI SDK V6
  }
];
const _onUnhandledRejectionIntegration = (options = {}) => {
  const opts = {
    mode: options.mode ?? "warn",
    ignore: [...DEFAULT_IGNORES, ...options.ignore ?? []]
  };
  return {
    name: INTEGRATION_NAME$2,
    setup(client) {
      global.process.on("unhandledRejection", makeUnhandledPromiseHandler(client, opts));
    }
  };
};
const onUnhandledRejectionIntegration = defineIntegration(_onUnhandledRejectionIntegration);
function extractErrorInfo(reason) {
  if (typeof reason !== "object" || reason === null) {
    return { name: "", message: String(reason ?? "") };
  }
  const errorLike = reason;
  const name = typeof errorLike.name === "string" ? errorLike.name : "";
  const message = typeof errorLike.message === "string" ? errorLike.message : String(reason);
  return { name, message };
}
function isMatchingReason(matcher, errorInfo) {
  const nameMatches = matcher.name === void 0 || isMatchingPattern(errorInfo.name, matcher.name, true);
  const messageMatches = matcher.message === void 0 || isMatchingPattern(errorInfo.message, matcher.message);
  return nameMatches && messageMatches;
}
function matchesIgnore(list, reason) {
  const errorInfo = extractErrorInfo(reason);
  return list.some((matcher) => isMatchingReason(matcher, errorInfo));
}
function makeUnhandledPromiseHandler(client, options) {
  return function sendUnhandledPromise(reason, _promise) {
    if (getClient() !== client) {
      return;
    }
    if (matchesIgnore(options.ignore ?? [], reason)) {
      return;
    }
    const level = options.mode === "strict" ? "fatal" : "error";
    const activeSpanForError = reason && typeof reason === "object" ? reason._sentry_active_span : void 0;
    const activeSpanWrapper = activeSpanForError ? (fn) => withActiveSpan$1(activeSpanForError, fn) : (fn) => fn();
    activeSpanWrapper(() => {
      captureException(reason, {
        originalException: reason,
        captureContext: {
          extra: { unhandledPromiseRejection: true },
          level
        },
        mechanism: {
          handled: false,
          type: "auto.node.onunhandledrejection"
        }
      });
    });
    handleRejection(reason, options.mode);
  };
}
function handleRejection(reason, mode) {
  const rejectionWarning = "This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). The promise rejected with the reason:";
  if (mode === "warn") {
    consoleSandbox(() => {
      console.warn(rejectionWarning);
      console.error(reason && typeof reason === "object" && "stack" in reason ? reason.stack : reason);
    });
  } else if (mode === "strict") {
    consoleSandbox(() => {
      console.warn(rejectionWarning);
    });
    logAndExitProcess(reason);
  }
}
const consoleIntegration = defineIntegration((options = {}) => {
  return {
    name: "Console",
    setup(client) {
      if (process.env.LAMBDA_TASK_ROOT) {
        maybeInstrument("console", instrumentConsoleLambda);
      }
      const core = consoleIntegration$1(options);
      core.setup?.(client);
    }
  };
});
function instrumentConsoleLambda() {
  const consoleObj = GLOBAL_OBJ?.console;
  if (!consoleObj) {
    return;
  }
  CONSOLE_LEVELS.forEach((level) => {
    if (level in consoleObj) {
      patchWithDefineProperty(consoleObj, level);
    }
  });
}
function patchWithDefineProperty(consoleObj, level) {
  const nativeMethod = consoleObj[level];
  originalConsoleMethods[level] = nativeMethod;
  let delegate = nativeMethod;
  let savedDelegate;
  let isExecuting = false;
  const wrapper = function(...args) {
    if (isExecuting) {
      nativeMethod.apply(consoleObj, args);
      return;
    }
    isExecuting = true;
    try {
      triggerHandlers("console", { args, level });
      delegate.apply(consoleObj, args);
    } finally {
      isExecuting = false;
    }
  };
  markFunctionWrapped(wrapper, nativeMethod);
  const sandboxBypass = nativeMethod.bind(consoleObj);
  originalConsoleMethods[level] = sandboxBypass;
  try {
    let current = wrapper;
    Object.defineProperty(consoleObj, level, {
      configurable: true,
      enumerable: true,
      get() {
        return current;
      },
      set(newValue) {
        if (newValue === wrapper) {
          if (savedDelegate !== void 0) {
            delegate = savedDelegate;
            savedDelegate = void 0;
          }
          current = wrapper;
        } else if (newValue === sandboxBypass) {
          savedDelegate = delegate;
          current = sandboxBypass;
        } else if (typeof newValue === "function" && !newValue.__sentry_original__) {
          delegate = newValue;
          current = wrapper;
        } else {
          current = newValue;
        }
      }
    });
  } catch {
    fill(consoleObj, level, function(originalConsoleMethod) {
      originalConsoleMethods[level] = originalConsoleMethod;
      return function(...args) {
        triggerHandlers("console", { args, level });
        originalConsoleMethods[level]?.apply(this, args);
      };
    });
  }
}
function normalizeWindowsPath(path2) {
  return path2.replace(/^[A-Z]:/, "").replace(/\\/g, "/");
}
function createGetModuleFromFilename(basePath = process.argv[1] ? dirname(process.argv[1]) : process.cwd(), isWindows = sep$1 === "\\") {
  const normalizedBase = isWindows ? normalizeWindowsPath(basePath) : basePath;
  return (filename) => {
    if (!filename) {
      return;
    }
    const normalizedFilename = isWindows ? normalizeWindowsPath(filename) : filename;
    let { dir, base: file, ext } = posix.parse(normalizedFilename);
    if (ext === ".js" || ext === ".mjs" || ext === ".cjs") {
      file = file.slice(0, ext.length * -1);
    }
    const decodedFile = decodeURIComponent(file);
    if (!dir) {
      dir = ".";
    }
    const n = dir.lastIndexOf("/node_modules");
    if (n > -1) {
      return `${dir.slice(n + 14).replace(/\//g, ".")}:${decodedFile}`;
    }
    if (dir.startsWith(normalizedBase)) {
      const moduleName = dir.slice(normalizedBase.length + 1).replace(/\//g, ".");
      return moduleName ? `${moduleName}:${decodedFile}` : decodedFile;
    }
    return decodedFile;
  };
}
const DEFAULT_CLIENT_REPORT_FLUSH_INTERVAL_MS = 6e4;
class NodeClient extends ServerRuntimeClient {
  constructor(options) {
    const serverName = options.includeServerName === false ? void 0 : options.serverName || global.process.env.SENTRY_NAME || os.hostname();
    const clientOptions = {
      ...options,
      platform: "node",
      // Use provided runtime or default to 'node' with current process version
      runtime: options.runtime || { name: "node", version: global.process.version },
      serverName
    };
    if (options.openTelemetryInstrumentations) {
      registerInstrumentations({
        instrumentations: options.openTelemetryInstrumentations
      });
    }
    applySdkMetadata(clientOptions, "node");
    debug.log(`Initializing Sentry: process: ${process.pid}, thread: ${isMainThread ? "main" : `worker-${threadId}`}.`);
    super(clientOptions);
    if (this.getOptions().enableLogs) {
      this._logOnExitFlushListener = () => {
        _INTERNAL_flushLogsBuffer(this);
      };
      if (serverName) {
        this.on("beforeCaptureLog", (log2) => {
          log2.attributes = {
            ...log2.attributes,
            "server.address": serverName
          };
        });
      }
      process.on("beforeExit", this._logOnExitFlushListener);
    }
  }
  /** Get the OTEL tracer. */
  get tracer() {
    if (this._tracer) {
      return this._tracer;
    }
    const name = "@sentry/node";
    const version2 = SDK_VERSION$1;
    const tracer = trace.getTracer(name, version2);
    this._tracer = tracer;
    return tracer;
  }
  /** @inheritDoc */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async flush(timeout) {
    await this.traceProvider?.forceFlush();
    if (this.getOptions().sendClientReports) {
      this._flushOutcomes();
    }
    return super.flush(timeout);
  }
  /** @inheritDoc */
  // @ts-expect-error - PromiseLike is a subset of Promise
  async close(timeout) {
    if (this._clientReportInterval) {
      clearInterval(this._clientReportInterval);
    }
    if (this._clientReportOnExitFlushListener) {
      process.off("beforeExit", this._clientReportOnExitFlushListener);
    }
    if (this._logOnExitFlushListener) {
      process.off("beforeExit", this._logOnExitFlushListener);
    }
    const allEventsSent = await super.close(timeout);
    if (this.traceProvider) {
      await this.traceProvider.shutdown();
    }
    return allEventsSent;
  }
  /**
   * Will start tracking client reports for this client.
   *
   * NOTICE: This method will create an interval that is periodically called and attach a `process.on('beforeExit')`
   * hook. To clean up these resources, call `.close()` when you no longer intend to use the client. Not doing so will
   * result in a memory leak.
   */
  // The reason client reports need to be manually activated with this method instead of just enabling them in a
  // constructor, is that if users periodically and unboundedly create new clients, we will create more and more
  // intervals and beforeExit listeners, thus leaking memory. In these situations, users are required to call
  // `client.close()` in order to dispose of the acquired resources.
  // We assume that calling this method in Sentry.init() is a sensible default, because calling Sentry.init() over and
  // over again would also result in memory leaks.
  // Note: We have experimented with using `FinalizationRegisty` to clear the interval when the client is garbage
  // collected, but it did not work, because the cleanup function never got called.
  startClientReportTracking() {
    const clientOptions = this.getOptions();
    if (clientOptions.sendClientReports) {
      this._clientReportOnExitFlushListener = () => {
        this._flushOutcomes();
      };
      this._clientReportInterval = setInterval(() => {
        DEBUG_BUILD$2 && debug.log("Flushing client reports based on interval.");
        this._flushOutcomes();
      }, clientOptions.clientReportFlushInterval ?? DEFAULT_CLIENT_REPORT_FLUSH_INTERVAL_MS).unref();
      process.on("beforeExit", this._clientReportOnExitFlushListener);
    }
  }
  /** @inheritDoc */
  _setupIntegrations() {
    _INTERNAL_clearAiProviderSkips();
    super._setupIntegrations();
  }
  /** Custom implementation for OTEL, so we can handle scope-span linking. */
  _getTraceInfoFromScope(scope) {
    if (!scope) {
      return [void 0, void 0];
    }
    return getTraceContextForScope(this, scope);
  }
}
function captureLog(level, ...args) {
  const [messageOrMessageTemplate, paramsOrAttributes, maybeAttributesOrMetadata, maybeMetadata] = args;
  if (Array.isArray(paramsOrAttributes)) {
    const attributes2 = { ...maybeAttributesOrMetadata };
    attributes2["sentry.message.template"] = messageOrMessageTemplate;
    paramsOrAttributes.forEach((param, index) => {
      attributes2[`sentry.message.parameter.${index}`] = param;
    });
    const message = format(messageOrMessageTemplate, ...paramsOrAttributes);
    _INTERNAL_captureLog({ level, message, attributes: attributes2 }, maybeMetadata?.scope);
  } else {
    _INTERNAL_captureLog(
      { level, message: messageOrMessageTemplate, attributes: paramsOrAttributes },
      // type-casting here because from the type definitions we know that `maybeAttributesOrMetadata` is a metadata object (or undefined)
      maybeAttributesOrMetadata?.scope ?? maybeMetadata?.scope
    );
  }
}
function info(...args) {
  captureLog("info", ...args);
}
function warn(...args) {
  captureLog("warn", ...args);
}
function error(...args) {
  captureLog("error", ...args);
}
const PACKAGE_NAME = "@sentry/instrumentation-undici";
class UndiciInstrumentation extends InstrumentationBase {
  // Keep ref to avoid https://github.com/nodejs/node/issues/42170 bug and for
  // unsubscribing.
  __init() {
    this._recordFromReq = /* @__PURE__ */ new WeakMap();
  }
  constructor(config = {}) {
    super(PACKAGE_NAME, SDK_VERSION$1, config);
    UndiciInstrumentation.prototype.__init.call(this);
  }
  // No need to instrument files/modules
  init() {
    return void 0;
  }
  disable() {
    super.disable();
    this._channelSubs.forEach((sub) => sub.unsubscribe());
    this._channelSubs.length = 0;
  }
  enable() {
    super.enable();
    this._channelSubs = this._channelSubs || [];
    if (this._channelSubs.length > 0) {
      return;
    }
    this.subscribeToChannel("undici:request:create", this.onRequestCreated.bind(this));
    this.subscribeToChannel("undici:client:sendHeaders", this.onRequestHeaders.bind(this));
    this.subscribeToChannel("undici:request:headers", this.onResponseHeaders.bind(this));
    this.subscribeToChannel("undici:request:trailers", this.onDone.bind(this));
    this.subscribeToChannel("undici:request:error", this.onError.bind(this));
  }
  _updateMetricInstruments() {
    this._httpClientDurationHistogram = this.meter.createHistogram(METRIC_HTTP_CLIENT_REQUEST_DURATION, {
      description: "Measures the duration of outbound HTTP requests.",
      unit: "s",
      valueType: ValueType.DOUBLE,
      advice: {
        explicitBucketBoundaries: [5e-3, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10]
      }
    });
  }
  subscribeToChannel(diagnosticChannel, onMessage) {
    const [major2 = 0, minor = 0] = process.version.replace("v", "").split(".").map((n) => Number(n));
    const useNewSubscribe = major2 > 18 || major2 === 18 && minor >= 19;
    let unsubscribe;
    if (useNewSubscribe) {
      diagch.subscribe?.(diagnosticChannel, onMessage);
      unsubscribe = () => diagch.unsubscribe?.(diagnosticChannel, onMessage);
    } else {
      const channel = diagch.channel(diagnosticChannel);
      channel.subscribe(onMessage);
      unsubscribe = () => channel.unsubscribe(onMessage);
    }
    this._channelSubs.push({
      name: diagnosticChannel,
      unsubscribe
    });
  }
  parseRequestHeaders(request) {
    const result = /* @__PURE__ */ new Map();
    if (Array.isArray(request.headers)) {
      for (let i = 0; i < request.headers.length; i += 2) {
        const key = request.headers[i];
        const value = request.headers[i + 1];
        if (typeof key === "string" && value !== void 0) {
          result.set(key.toLowerCase(), value);
        }
      }
    } else if (typeof request.headers === "string") {
      const headers = request.headers.split("\r\n");
      for (const line of headers) {
        if (!line) {
          continue;
        }
        const colonIndex = line.indexOf(":");
        if (colonIndex === -1) {
          continue;
        }
        const key = line.substring(0, colonIndex).toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        const allValues = result.get(key);
        if (allValues && Array.isArray(allValues)) {
          allValues.push(value);
        } else if (allValues) {
          result.set(key, [allValues, value]);
        } else {
          result.set(key, value);
        }
      }
    }
    return result;
  }
  // This is the 1st message we receive for each request (fired after request creation). Here we will
  // create the span and populate some atttributes, then link the span to the request for further
  // span processing
  onRequestCreated({ request }) {
    const config = this.getConfig();
    const enabled = config.enabled !== false;
    const shouldIgnoreReq = safeExecuteInTheMiddle(
      () => !enabled || request.method === "CONNECT" || config.ignoreRequestHook?.(request),
      (e) => e && this._diag.error("caught ignoreRequestHook error: ", e)
    );
    if (shouldIgnoreReq) {
      return;
    }
    const startTime = hrTime();
    let requestUrl;
    try {
      requestUrl = new URL$1(request.path, request.origin);
    } catch (err) {
      this._diag.warn("could not determine url.full:", err);
      return;
    }
    const urlScheme = requestUrl.protocol.replace(":", "");
    const requestMethod = this.getRequestMethod(request.method);
    const attributes2 = {
      [ATTR_HTTP_REQUEST_METHOD]: requestMethod,
      [ATTR_HTTP_REQUEST_METHOD_ORIGINAL]: request.method,
      [ATTR_URL_FULL]: requestUrl.toString(),
      [ATTR_URL_PATH]: requestUrl.pathname,
      [ATTR_URL_QUERY]: requestUrl.search,
      [ATTR_URL_SCHEME]: urlScheme
    };
    const schemePorts = { https: "443", http: "80" };
    const serverAddress = requestUrl.hostname;
    const serverPort = requestUrl.port || schemePorts[urlScheme];
    attributes2[ATTR_SERVER_ADDRESS] = serverAddress;
    if (serverPort && !isNaN(Number(serverPort))) {
      attributes2[ATTR_SERVER_PORT] = Number(serverPort);
    }
    const headersMap = this.parseRequestHeaders(request);
    const userAgentValues = headersMap.get("user-agent");
    if (userAgentValues) {
      const userAgent = Array.isArray(userAgentValues) ? userAgentValues[userAgentValues.length - 1] : userAgentValues;
      attributes2[ATTR_USER_AGENT_ORIGINAL] = userAgent;
    }
    const hookAttributes = safeExecuteInTheMiddle(
      () => config.startSpanHook?.(request),
      (e) => e && this._diag.error("caught startSpanHook error: ", e)
    );
    if (hookAttributes) {
      Object.entries(hookAttributes).forEach(([key, val]) => {
        attributes2[key] = val;
      });
    }
    const activeCtx = context.active();
    const currentSpan = trace.getSpan(activeCtx);
    let span;
    if (config.requireParentforSpans && (!currentSpan || !trace.isSpanContextValid(currentSpan.spanContext()))) {
      span = trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
    } else {
      span = this.tracer.startSpan(
        requestMethod === "_OTHER" ? "HTTP" : requestMethod,
        {
          kind: SpanKind.CLIENT,
          attributes: attributes2
        },
        activeCtx
      );
    }
    safeExecuteInTheMiddle(
      () => config.requestHook?.(span, request),
      (e) => e && this._diag.error("caught requestHook error: ", e)
    );
    const requestContext = trace.setSpan(context.active(), span);
    const addedHeaders = {};
    propagation.inject(requestContext, addedHeaders);
    const headerEntries = Object.entries(addedHeaders);
    for (let i = 0; i < headerEntries.length; i++) {
      const pair = headerEntries[i];
      if (!pair) {
        continue;
      }
      const [k, v] = pair;
      if (typeof request.addHeader === "function") {
        request.addHeader(k, v);
      } else if (typeof request.headers === "string") {
        request.headers += `${k}: ${v}\r
`;
      } else if (Array.isArray(request.headers)) {
        request.headers.push(k, v);
      }
    }
    this._recordFromReq.set(request, { span, attributes: attributes2, startTime });
  }
  // This is the 2nd message we receive for each request. It is fired when connection with
  // the remote is established and about to send the first byte. Here we do have info about the
  // remote address and port so we can populate some `network.*` attributes into the span
  onRequestHeaders({ request, socket }) {
    const record = this._recordFromReq.get(request);
    if (!record) {
      return;
    }
    const config = this.getConfig();
    const { span } = record;
    const { remoteAddress, remotePort } = socket;
    const spanAttributes = {
      [ATTR_NETWORK_PEER_ADDRESS]: remoteAddress,
      [ATTR_NETWORK_PEER_PORT]: remotePort
    };
    if (config.headersToSpanAttributes?.requestHeaders) {
      const headersToAttribs = new Set(config.headersToSpanAttributes.requestHeaders.map((n) => n.toLowerCase()));
      const headersMap = this.parseRequestHeaders(request);
      for (const [name, value] of headersMap.entries()) {
        if (headersToAttribs.has(name)) {
          const attrValue = Array.isArray(value) ? value : [value];
          spanAttributes[`http.request.header.${name}`] = attrValue;
        }
      }
    }
    span.setAttributes(spanAttributes);
  }
  // This is the 3rd message we get for each request and it's fired when the server
  // headers are received, body may not be accessible yet.
  // From the response headers we can set the status and content length
  onResponseHeaders({ request, response }) {
    const record = this._recordFromReq.get(request);
    if (!record) {
      return;
    }
    const { span, attributes: attributes2 } = record;
    const spanAttributes = {
      [ATTR_HTTP_RESPONSE_STATUS_CODE]: response.statusCode
    };
    const config = this.getConfig();
    safeExecuteInTheMiddle(
      () => config.responseHook?.(span, { request, response }),
      (e) => e && this._diag.error("caught responseHook error: ", e)
    );
    if (config.headersToSpanAttributes?.responseHeaders) {
      const headersToAttribs = /* @__PURE__ */ new Set();
      config.headersToSpanAttributes?.responseHeaders.forEach((name) => headersToAttribs.add(name.toLowerCase()));
      for (let idx = 0; idx < response.headers.length; idx = idx + 2) {
        const nameBuf = response.headers[idx];
        const valueBuf = response.headers[idx + 1];
        if (nameBuf === void 0 || valueBuf === void 0) {
          continue;
        }
        const name = nameBuf.toString().toLowerCase();
        const value = valueBuf;
        if (headersToAttribs.has(name)) {
          const attrName = `http.response.header.${name}`;
          if (!Object.prototype.hasOwnProperty.call(spanAttributes, attrName)) {
            spanAttributes[attrName] = [value.toString()];
          } else {
            spanAttributes[attrName].push(value.toString());
          }
        }
      }
    }
    span.setAttributes(spanAttributes);
    span.setStatus({
      code: response.statusCode >= 400 ? SpanStatusCode.ERROR : SpanStatusCode.UNSET
    });
    record.attributes = Object.assign(attributes2, spanAttributes);
  }
  // This is the last event we receive if the request went without any errors
  onDone({ request }) {
    const record = this._recordFromReq.get(request);
    if (!record) {
      return;
    }
    const { span, attributes: attributes2, startTime } = record;
    span.end();
    this._recordFromReq.delete(request);
    this.recordRequestDuration(attributes2, startTime);
  }
  // This is the event we get when something is wrong in the request like
  // - invalid options when calling `fetch` global API or any undici method for request
  // - connectivity errors such as unreachable host
  // - requests aborted through an `AbortController.signal`
  // NOTE: server errors are considered valid responses and it's the lib consumer
  // who should deal with that.
  onError({ request, error: error2 }) {
    const record = this._recordFromReq.get(request);
    if (!record) {
      return;
    }
    const { span, attributes: attributes2, startTime } = record;
    span.recordException(error2);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error2.message
    });
    span.end();
    this._recordFromReq.delete(request);
    attributes2[ATTR_ERROR_TYPE] = error2.message;
    this.recordRequestDuration(attributes2, startTime);
  }
  recordRequestDuration(attributes2, startTime) {
    const metricsAttributes = {};
    const keysToCopy = [
      ATTR_HTTP_RESPONSE_STATUS_CODE,
      ATTR_HTTP_REQUEST_METHOD,
      ATTR_SERVER_ADDRESS,
      ATTR_SERVER_PORT,
      ATTR_URL_SCHEME,
      ATTR_ERROR_TYPE
    ];
    keysToCopy.forEach((key) => {
      if (key in attributes2) {
        metricsAttributes[key] = attributes2[key];
      }
    });
    const durationSeconds = hrTimeToMilliseconds(hrTimeDuration(startTime, hrTime())) / 1e3;
    this._httpClientDurationHistogram.record(durationSeconds, metricsAttributes);
  }
  getRequestMethod(original) {
    const knownMethods = {
      CONNECT: true,
      OPTIONS: true,
      HEAD: true,
      GET: true,
      POST: true,
      PUT: true,
      PATCH: true,
      DELETE: true,
      TRACE: true,
      // QUERY from https://datatracker.ietf.org/doc/draft-ietf-httpbis-safe-method-w-body/
      QUERY: true
    };
    if (original.toUpperCase() in knownMethods) {
      return original.toUpperCase();
    }
    return "_OTHER";
  }
}
const INTEGRATION_NAME$1 = "NodeFetch";
const instrumentOtelNodeFetch = generateInstrumentOnce(
  INTEGRATION_NAME$1,
  UndiciInstrumentation,
  (options) => {
    return _getConfigWithDefaults(options);
  }
);
const instrumentSentryNodeFetch = generateInstrumentOnce(
  `${INTEGRATION_NAME$1}.sentry`,
  SentryNodeFetchInstrumentation,
  (options) => {
    return options;
  }
);
const _nativeNodeFetchIntegration = (options = {}) => {
  return {
    name: "NodeFetch",
    setupOnce() {
      const instrumentSpans = _shouldInstrumentSpans(options, getClient()?.getOptions());
      if (instrumentSpans) {
        instrumentOtelNodeFetch(options);
      }
      instrumentSentryNodeFetch(options);
    }
  };
};
const nativeNodeFetchIntegration = defineIntegration(_nativeNodeFetchIntegration);
function getAbsoluteUrl(origin, path2 = "/") {
  const url = `${origin}`;
  if (url.endsWith("/") && path2.startsWith("/")) {
    return `${url}${path2.slice(1)}`;
  }
  if (!url.endsWith("/") && !path2.startsWith("/")) {
    return `${url}/${path2}`;
  }
  return `${url}${path2}`;
}
function _shouldInstrumentSpans(options, clientOptions = {}) {
  return typeof options.spans === "boolean" ? options.spans : !clientOptions.skipOpenTelemetrySetup && hasSpansEnabled(clientOptions);
}
function _getConfigWithDefaults(options = {}) {
  const instrumentationConfig = {
    requireParentforSpans: false,
    ignoreRequestHook: (request) => {
      const url = getAbsoluteUrl(request.origin, request.path);
      const _ignoreOutgoingRequests = options.ignoreOutgoingRequests;
      const shouldIgnore = _ignoreOutgoingRequests && url && _ignoreOutgoingRequests(url);
      return !!shouldIgnore;
    },
    startSpanHook: (request) => {
      const url = getAbsoluteUrl(request.origin, request.path);
      if (url.startsWith("data:")) {
        const sanitizedUrl = stripDataUrlContent(url);
        return {
          [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.otel.node_fetch",
          "http.url": sanitizedUrl,
          [SEMANTIC_ATTRIBUTE_URL_FULL]: sanitizedUrl,
          [SEMANTIC_ATTRIBUTE_SENTRY_CUSTOM_SPAN_NAME]: `${request.method || "GET"} ${sanitizedUrl}`
        };
      }
      return {
        [SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN]: "auto.http.otel.node_fetch"
      };
    },
    requestHook: options.requestHook,
    responseHook: options.responseHook,
    headersToSpanAttributes: options.headersToSpanAttributes
  };
  return instrumentationConfig;
}
const DEBUG_BUILD = typeof __SENTRY_DEBUG__ === "undefined" || __SENTRY_DEBUG__;
const MAX_MAX_SPAN_WAIT_DURATION = 1e6;
function initOpenTelemetry(client, options = {}) {
  if (client.getOptions().debug) {
    setupOpenTelemetryLogger();
  }
  const [provider, asyncLocalStorageLookup] = setupOtel(client, options);
  client.traceProvider = provider;
  client.asyncLocalStorageLookup = asyncLocalStorageLookup;
}
function setupOtel(client, options = {}) {
  const provider = new BasicTracerProvider({
    sampler: new SentrySampler(client),
    resource: getSentryResource("node"),
    forceFlushTimeoutMillis: 500,
    spanProcessors: [
      new SentrySpanProcessor({
        timeout: _clampSpanProcessorTimeout(client.getOptions().maxSpanWaitDuration)
      }),
      ...options.spanProcessors || []
    ]
  });
  trace.setGlobalTracerProvider(provider);
  propagation.setGlobalPropagator(new SentryPropagator());
  const ctxManager = new SentryContextManager();
  context.setGlobalContextManager(ctxManager);
  return [provider, ctxManager.getAsyncLocalStorageLookup()];
}
function _clampSpanProcessorTimeout(maxSpanWaitDuration) {
  if (maxSpanWaitDuration == null) {
    return void 0;
  }
  if (maxSpanWaitDuration > MAX_MAX_SPAN_WAIT_DURATION) {
    DEBUG_BUILD && debug.warn(`\`maxSpanWaitDuration\` is too high, using the maximum value of ${MAX_MAX_SPAN_WAIT_DURATION}`);
    return MAX_MAX_SPAN_WAIT_DURATION;
  } else if (maxSpanWaitDuration <= 0 || Number.isNaN(maxSpanWaitDuration)) {
    DEBUG_BUILD && debug.warn("`maxSpanWaitDuration` must be a positive number, using default value instead.");
    return void 0;
  }
  return maxSpanWaitDuration;
}
function removePrivateProperties(event) {
  delete event.sdkProcessingMetadata?.capturedSpanScope;
  delete event.sdkProcessingMetadata?.capturedSpanIsolationScope;
  for (const span of event.spans || []) {
    delete span.spanRecorder;
  }
}
function mergeEvents(defaults, event) {
  removePrivateProperties(event);
  const newEvent = {
    ...defaults,
    ...event,
    contexts: {
      ...defaults.contexts,
      ...event.contexts,
      app: {
        ...defaults.contexts?.app,
        ...event.contexts?.app
      },
      device: {
        ...defaults.contexts?.device,
        ...event.contexts?.device
      }
    },
    tags: {
      ...defaults.tags,
      ...event.tags
    },
    sdk: {
      ...defaults.sdk,
      ...event.sdk
    }
  };
  if (defaults.extra || event.extra) {
    newEvent.extra = {
      ...defaults.extra,
      ...event.extra
    };
  }
  return newEvent;
}
const DEFAULT_OPTIONS$2 = {
  screen: true,
  deviceModelManufacturer: false
};
function getWindowsDeviceModelManufacturer() {
  return new Promise((resolve2) => {
    try {
      exec('powershell -NoProfile "Get-CimInstance -ClassName Win32_ComputerSystem | ConvertTo-Json"', (error2, stdout) => {
        if (error2) {
          resolve2({});
        }
        try {
          const details = JSON.parse(stdout);
          if (details.Manufacturer || details.Model) {
            resolve2({
              manufacturer: details.Manufacturer,
              model: details.Model
            });
            return;
          }
        } catch {
        }
        resolve2({});
      });
    } catch {
      resolve2({});
    }
  });
}
function getMacOSDeviceModelManufacturer() {
  return new Promise((resolve2) => {
    try {
      exec("system_profiler SPHardwareDataType -json", (error2, stdout) => {
        if (error2) {
          resolve2({});
        }
        try {
          const details = JSON.parse(stdout.trim());
          if (details.SPHardwareDataType?.[0]?.machine_model) {
            resolve2({
              manufacturer: "Apple",
              model: details.SPHardwareDataType[0].machine_model
            });
            return;
          }
        } catch {
        }
        resolve2({});
      });
    } catch {
      resolve2({});
    }
  });
}
function getDeviceModelManufacturer() {
  if (process.platform === "win32") {
    return getWindowsDeviceModelManufacturer();
  } else if (process.platform === "darwin") {
    return getMacOSDeviceModelManufacturer();
  }
  return Promise.resolve({});
}
const additionalContextIntegration = defineIntegration((userOptions = {}) => {
  const _lazyDeviceContext = {};
  let captureDeviceModelManufacturer = userOptions.deviceModelManufacturer;
  const options = {
    ...DEFAULT_OPTIONS$2,
    ...userOptions
  };
  function setPrimaryDisplayInfo() {
    const display = screen.getPrimaryDisplay();
    const width = Math.floor(display.size.width * display.scaleFactor);
    const height = Math.floor(display.size.height * display.scaleFactor);
    _lazyDeviceContext.screen_density = display.scaleFactor;
    _lazyDeviceContext.screen_resolution = `${width}x${height}`;
  }
  async function setDeviceModelManufacturer() {
    const { manufacturer, model } = await getDeviceModelManufacturer();
    if (manufacturer || model) {
      _lazyDeviceContext.manufacturer = manufacturer;
      _lazyDeviceContext.model = model;
    }
  }
  return {
    name: "AdditionalContext",
    setup() {
      if (!options.screen) {
        return;
      }
      app.whenReady().then(() => {
        setPrimaryDisplayInfo();
        screen.on("display-metrics-changed", () => {
          setPrimaryDisplayInfo();
        });
      }, () => {
      });
    },
    processEvent: async (event) => {
      if (captureDeviceModelManufacturer) {
        captureDeviceModelManufacturer = false;
        await setDeviceModelManufacturer();
      }
      return mergeEvents(event, { contexts: { device: _lazyDeviceContext } });
    }
  };
});
var IPCMode;
(function(IPCMode2) {
  IPCMode2[IPCMode2["Classic"] = 1] = "Classic";
  IPCMode2[IPCMode2["Protocol"] = 2] = "Protocol";
  IPCMode2[IPCMode2["Both"] = 3] = "Both";
})(IPCMode || (IPCMode = {}));
function ipcChannelUtils(namespace) {
  return {
    createUrl: (channel) => {
      return `${namespace}://${channel}/sentry_key`;
    },
    urlMatches: function(url, channel) {
      return url.startsWith(this.createUrl(channel));
    },
    createKey: (channel) => {
      return `${namespace}.${channel}`;
    },
    namespace
  };
}
const RENDERER_ID_HEADER = "sentry-electron-renderer-id";
const UTILITY_PROCESS_MAGIC_MESSAGE_KEY = "__sentry_message_port_message__";
function isMagicMessage(msg) {
  return !!(msg && typeof msg === "object" && UTILITY_PROCESS_MAGIC_MESSAGE_KEY in msg);
}
function getMagicMessage() {
  return { [UTILITY_PROCESS_MAGIC_MESSAGE_KEY]: true };
}
const parsed = parseSemver(process.versions.electron);
const version = { major: parsed.major || 0 };
const ELECTRON_MAJOR_VERSION = version.major;
const EXIT_REASONS = [
  "clean-exit",
  "abnormal-exit",
  "killed",
  "crashed",
  "oom",
  "launch-failed",
  "integrity-failure"
];
function getSentryCachePath() {
  return join$1(app.getPath("userData"), "sentry");
}
function supportsProtocolHandle() {
  return version.major >= 25;
}
function registerProtocol(protocol2, scheme, callback) {
  if (supportsProtocolHandle()) {
    protocol2.handle(scheme, async (request) => {
      callback({
        windowId: request.headers.get(RENDERER_ID_HEADER) || void 0,
        url: request.url,
        body: Buffer.from(await request.arrayBuffer())
      });
      return new Response("");
    });
  } else {
    protocol2.registerStringProtocol(scheme, (request, complete) => {
      callback({
        windowId: request.headers[RENDERER_ID_HEADER],
        url: request.url,
        body: request.uploadData?.[0]?.bytes
      });
      complete("");
    });
  }
}
function setPreload(sesh, path2) {
  if (sesh.registerPreloadScript) {
    sesh.registerPreloadScript({ type: "frame", filePath: path2 });
  } else {
    const existing = sesh.getPreloads();
    sesh.setPreloads([path2, ...existing]);
  }
}
class Mutex {
  constructor() {
    this._entries = [];
    this._waiters = [];
    this._value = 1;
  }
  /** Run a task when all pending tasks are complete */
  async runExclusive(task) {
    const release = await this._acquire();
    try {
      return await task();
    } finally {
      release();
    }
  }
  /** Gets a promise that resolves when all pending tasks are complete */
  _acquire() {
    return new Promise((resolve2, reject) => {
      this._entries.push({ resolve: resolve2, reject });
      this._dispatch();
    });
  }
  /** Releases after a task is complete */
  _release() {
    this._value += 1;
    this._dispatch();
  }
  /** Dispatches pending tasks */
  _dispatch() {
    for (let weight = this._value; weight > 0; weight--) {
      const queueEntry = this._entries?.shift();
      if (!queueEntry)
        continue;
      this._value -= weight;
      weight = this._value + 1;
      queueEntry.resolve(this._newReleaser());
    }
    this._drainUnlockWaiters();
  }
  /** Creates a new releaser */
  _newReleaser() {
    let called = false;
    return () => {
      if (called)
        return;
      called = true;
      this._release();
    };
  }
  /** Drain unlock waiters */
  _drainUnlockWaiters() {
    for (let weight = this._value; weight > 0; weight--) {
      if (!this._waiters[weight - 1])
        continue;
      this._waiters.forEach((waiter) => waiter());
      this._waiters = [];
    }
  }
}
const dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.*\d{0,10}Z$/;
function dateReviver(_, value) {
  if (typeof value === "string" && dateFormat.test(value)) {
    return new Date(value);
  }
  return value;
}
class Store {
  /**
   * Creates a new store.
   *
   * @param path A unique filename to store this data.
   * @param id A unique filename to store this data.
   * @param initial An initial value to initialize data with.
   */
  constructor(path2, id, initial) {
    this._lock = new Mutex();
    this._path = join$1(path2, `${id}.json`);
    this._initial = initial;
  }
  /**
   * Updates data by replacing it with the given value.
   * @param data New data to replace the previous one.
   */
  async set(data) {
    await this._lock.runExclusive(async () => {
      this._data = data;
      try {
        if (data === void 0) {
          try {
            await promises.unlink(this._path);
          } catch {
          }
        } else {
          await promises.mkdir(dirname$1(this._path), { recursive: true });
          await promises.writeFile(this._path, JSON.stringify(data));
        }
      } catch (e) {
        debug.warn("Failed to write to store", e);
      }
    });
  }
  /**
   * Returns the current data.
   *
   * When invoked for the first time, it will try to load previously stored data
   * from disk. If the file does not exist, the initial value provided to the
   * constructor is used.
   */
  async get() {
    return this._lock.runExclusive(async () => {
      if (this._data === void 0) {
        try {
          this._data = JSON.parse(await promises.readFile(this._path, "utf8"), dateReviver);
        } catch {
          this._data = this._initial;
        }
      }
      return this._data;
    });
  }
  /**
   * Updates data by passing it through the given function.
   * @param fn A function receiving the current data and returning new one.
   */
  async update(fn) {
    await this.set(fn(await this.get()));
  }
  /** Returns store to its initial state */
  async clear() {
    await this.set(this._initial);
  }
  /** Gets the Date that the file was last modified */
  async getModifiedDate() {
    try {
      return (await promises.stat(this._path))?.mtime;
    } catch {
      return void 0;
    }
  }
}
class BufferedWriteStore extends Store {
  /**
   * Creates a new ThrottledStore.
   *
   * @param path A unique filename to store this data.
   * @param id A unique filename to store this data.
   * @param initial An initial value to initialize data with.
   * @param throttleTime The minimum time between writes
   */
  constructor(path2, id, initial, _throttleTime = 500) {
    super(path2, id, initial);
    this._throttleTime = _throttleTime;
  }
  /** @inheritdoc */
  async set(data) {
    this._data = data;
    this._pendingWrite = {
      // We overwrite the data for the pending write so that the latest data is written in the next flush
      data,
      // If there is already a pending timeout, we keep that rather than starting the timeout again
      timeout: this._pendingWrite?.timeout || setTimeout(() => this._writePending(), this._throttleTime)
    };
  }
  /** Writes the pending write to disk */
  _writePending() {
    if (this._pendingWrite) {
      const data = this._pendingWrite.data;
      this._pendingWrite = void 0;
      super.set(data).catch(() => {
      });
    }
  }
}
const PERSIST_INTERVAL_MS = 6e4;
let sessionStore;
let previousSession;
function getSessionStore() {
  if (!sessionStore) {
    sessionStore = new Store(getSentryCachePath(), "session", void 0);
    previousSession = sessionStore.get().then((sesh) => sesh ? makeSession(sesh) : sesh);
  }
  return sessionStore;
}
function makeSessionSafeToSerialize(session2) {
  const copy = { ...session2 };
  delete copy.toJSON;
  return copy;
}
let persistTimer;
function startSession(sendOnCreate) {
  const session2 = startSession$1();
  if (sendOnCreate) {
    captureSession();
  }
  getSessionStore().set(makeSessionSafeToSerialize(session2)).catch(() => {
  });
  persistTimer = setInterval(async () => {
    const currentSession = getIsolationScope().getSession();
    if (currentSession && currentSession.status === "ok") {
      await getSessionStore().set(makeSessionSafeToSerialize(currentSession));
    }
  }, PERSIST_INTERVAL_MS);
}
async function endSession() {
  if (persistTimer) {
    clearInterval(persistTimer);
  }
  const session2 = getIsolationScope().getSession();
  if (session2) {
    if (session2.status === "ok") {
      debug.log("Ending session");
      endSession$1();
    } else {
      debug.log("Session was already ended");
    }
  } else {
    debug.log("No session");
  }
  await getSessionStore().clear();
  await flush(2e3);
}
async function setPreviousSessionAsCurrent() {
  const previous = await previousSession;
  const scope = getIsolationScope();
  const currentSession = scope.getSession();
  if (previous) {
    previousSession = void 0;
    if (previous.status === "ok") {
      scope.setSession(makeSession(previous));
    }
  }
  return currentSession;
}
function restorePreviousSession(session2) {
  getIsolationScope().setSession(session2);
}
async function previousSessionWasAbnormal() {
  const client = getClient();
  const previous = await previousSession;
  if (previous && client) {
    if (previous.status !== "ok") {
      previousSession = void 0;
      return;
    }
    debug.log("Found previous abnormal session");
    const sesh = makeSession(previous);
    updateSession(sesh, {
      status: "abnormal",
      errors: (sesh.errors || 0) + 1,
      release: previous.attrs?.release,
      environment: previous.attrs?.environment
    });
    await client.sendSession(sesh);
    previousSession = void 0;
  }
}
function sessionAnr() {
  if (persistTimer) {
    clearInterval(persistTimer);
  }
  const session2 = getIsolationScope().getSession();
  if (!session2) {
    return;
  }
  if (session2.status === "ok") {
    debug.log("Setting session as abnormal ANR");
    updateSession(session2, { status: "abnormal", abnormal_mechanism: "anr_foreground" });
    captureSession();
  }
}
function endSessionOnExit() {
  app.on("before-quit", () => {
    app.removeListener("will-quit", exitHandler);
    app.on("will-quit", exitHandler);
  });
}
const exitHandler = async (event) => {
  if (event.defaultPrevented) {
    return;
  }
  debug.log("[Session] Exit Handler");
  event.preventDefault();
  try {
    await endSession();
  } catch (e) {
    debug.warn("[Session] Error ending session:", e);
  }
  app.exit();
};
const DEFAULT_OPTIONS$1 = {
  breadcrumbs: EXIT_REASONS,
  events: ["abnormal-exit", "launch-failed", "integrity-failure"]
};
function getMessageAndSeverity(reason, process2) {
  const message = `'${process2}' process exited with '${reason}'`;
  const messageFmt = fmt`'${process2}' process exited with '${reason}'`;
  switch (reason) {
    case "abnormal-exit":
    case "killed":
      return { message, level: "warning", log: warn, messageFmt };
    case "crashed":
    case "oom":
    case "launch-failed":
    case "integrity-failure":
      return { message, level: "fatal", log: error, messageFmt };
    default:
      return { message, level: "debug", log: info, messageFmt };
  }
}
const childProcessIntegration = defineIntegration((userOptions = {}) => {
  const { breadcrumbs, events } = userOptions;
  const nodeIntegration = childProcessIntegration$1(userOptions);
  const options = {
    breadcrumbs: Array.isArray(breadcrumbs) ? breadcrumbs : breadcrumbs === false ? [] : DEFAULT_OPTIONS$1.breadcrumbs,
    events: Array.isArray(events) ? events : events === false ? [] : DEFAULT_OPTIONS$1.events
  };
  return {
    name: "ChildProcess",
    setup(client) {
      nodeIntegration.setup?.(client);
      const { breadcrumbs: breadcrumbs2, events: events2 } = options;
      const allReasons = Array.from(/* @__PURE__ */ new Set([...breadcrumbs2, ...events2]));
      if (allReasons.length > 0) {
        const clientOptions = client.getOptions();
        const enableLogs = !!clientOptions?.enableLogs;
        app.on("child-process-gone", (_, details) => {
          const { reason } = details;
          const { message, level, log: log2, messageFmt } = getMessageAndSeverity(details.reason, details.type);
          if (events2.includes(reason)) {
            captureMessage(message, { level, tags: { "event.process": details.type } });
          }
          if (breadcrumbs2.includes(reason)) {
            addBreadcrumb({
              type: "process",
              category: "child-process",
              message,
              level,
              data: details
            });
            if (enableLogs) {
              log2(messageFmt, {
                "sentry.origin": "auto.electron.child-process",
                exitCode: details.exitCode,
                name: details.name,
                serviceName: details.serviceName
              });
            }
          }
        });
        app.on("render-process-gone", (_, contents, details) => {
          const { reason } = details;
          const name = clientOptions?.getRendererName?.(contents) || "renderer";
          const { message, level, log: log2, messageFmt } = getMessageAndSeverity(details.reason, name);
          if (events2.includes(reason)) {
            captureMessage(message, level);
          }
          if (breadcrumbs2.includes(reason)) {
            addBreadcrumb({
              type: "process",
              category: "child-process",
              message,
              level,
              data: details
            });
            if (enableLogs) {
              log2(messageFmt, {
                "sentry.origin": "auto.electron.child-process",
                exitCode: details.exitCode
              });
            }
          }
        });
      }
    }
  };
});
let RENDERERS;
function trackRendererProperties() {
  if (RENDERERS) {
    return;
  }
  const renderers = RENDERERS = /* @__PURE__ */ new Map();
  function updateUrl(id, url) {
    const state = renderers.get(id) || { id };
    state.url = normalizeUrlToBase(url, app.getAppPath());
    renderers.set(id, state);
  }
  function updateTitle(id, title) {
    const state = renderers.get(id) || { id };
    state.title = title;
    renderers.set(id, state);
  }
  app.on("web-contents-created", (_, contents) => {
    const id = contents.id;
    contents.on("did-navigate", (_2, url) => updateUrl(id, url));
    contents.on("did-navigate-in-page", (_2, url) => updateUrl(id, url));
    contents.on("page-title-updated", (_2, title) => updateTitle(id, title));
    contents.on("destroyed", () => {
      setTimeout(() => {
        renderers.delete(id);
      }, 5e3);
    });
  });
}
function getRendererProperties(id) {
  return RENDERERS?.get(id);
}
const DEFAULT_OPTIONS = {
  // We exclude events starting with remote as they can be quite verbose
  app: (name) => !name.startsWith("remote-"),
  autoUpdater: () => true,
  webContents: (name) => ["dom-ready", "context-menu", "load-url", "destroyed"].includes(name),
  browserWindow: (name) => [
    "closed",
    "close",
    "unresponsive",
    "responsive",
    "show",
    "blur",
    "focus",
    "hide",
    "maximize",
    "minimize",
    "restore",
    "enter-full-screen",
    "leave-full-screen"
  ].includes(name),
  screen: () => true,
  powerMonitor: () => true,
  captureWindowTitles: false
};
function normalizeOptions(options) {
  return Object.keys(options).reduce((obj, k) => {
    if (k === "captureWindowTitles") {
      obj[k] = !!options[k];
    } else {
      const val = options[k];
      if (Array.isArray(val)) {
        obj[k] = (name) => val.includes(name);
      } else if (typeof val === "function" || val === false) {
        obj[k] = val;
      }
    }
    return obj;
  }, {});
}
const electronBreadcrumbsIntegration = defineIntegration((userOptions = {}) => {
  const options = {
    ...DEFAULT_OPTIONS,
    ...normalizeOptions(userOptions)
  };
  return {
    name: "ElectronBreadcrumbs",
    setup(client) {
      const clientOptions = client.getOptions();
      const enableLogs = !!clientOptions?.enableLogs;
      function patchEventEmitter(emitter, category, shouldCapture, id) {
        const emit = emitter.emit.bind(emitter);
        emitter.emit = (event, ...args) => {
          if (shouldCapture && shouldCapture(event)) {
            const breadcrumb = {
              category: "electron",
              message: `${category}.${event}`,
              timestamp: (/* @__PURE__ */ new Date()).getTime() / 1e3,
              type: "ui"
            };
            if (id) {
              breadcrumb.data = { ...getRendererProperties(id) };
              if (!options.captureWindowTitles && breadcrumb.data?.title) {
                delete breadcrumb.data?.title;
              }
            }
            addBreadcrumb(breadcrumb);
            const attributes2 = {
              "sentry.origin": "auto.electron.events"
            };
            if (breadcrumb.data?.id) {
              attributes2.id = breadcrumb.data.id;
            }
            if (breadcrumb.data?.url) {
              attributes2.url = breadcrumb.data.url;
            }
            if (enableLogs) {
              info(fmt`electron.${category}.${event}`, attributes2);
            }
          }
          return emit(event, ...args);
        };
      }
      trackRendererProperties();
      app.whenReady().then(() => {
        if (options.screen) {
          patchEventEmitter(screen, "screen", options.screen);
        }
        if (options.powerMonitor) {
          patchEventEmitter(powerMonitor, "powerMonitor", options.powerMonitor);
        }
      }, () => {
      });
      if (options.app) {
        patchEventEmitter(app, "app", options.app);
      }
      if (options.autoUpdater) {
        patchEventEmitter(autoUpdater, "autoUpdater", options.autoUpdater);
      }
      if (options.browserWindow) {
        app.on("browser-window-created", (_, window2) => {
          const id = window2.webContents.id;
          const windowName = clientOptions?.getRendererName?.(window2.webContents) || "window";
          patchEventEmitter(window2, windowName, options.browserWindow, id);
        });
      }
      if (options.webContents) {
        app.on("web-contents-created", (_, contents) => {
          const id = contents.id;
          const webContentsName = clientOptions?.getRendererName?.(contents) || "renderer";
          patchEventEmitter(contents, webContentsName, options.webContents, id);
        });
      }
    }
  };
});
const SDK_VERSION = "7.13.0";
const SDK_NAME = "sentry.javascript.electron";
function getSdkInfo(sendDefaultPii) {
  return {
    name: SDK_NAME,
    packages: [
      {
        name: "npm:@sentry/electron",
        version: SDK_VERSION
      }
    ],
    version: SDK_VERSION,
    settings: { infer_ip: sendDefaultPii ? "auto" : "never" }
  };
}
function getDefaultReleaseName() {
  const app_name = app.name || app.getName();
  return `${app_name.replace(/\W/g, "-")}@${app.getVersion()}`;
}
function getDefaultEnvironment() {
  return app.isPackaged ? "production" : "development";
}
async function getEventDefaults(client) {
  let event = { message: "test" };
  const eventHint = {};
  for (const processor of client.getEventProcessors()) {
    if (event === null)
      break;
    event = await processor(event, eventHint);
  }
  delete event?.message;
  return event || {};
}
function getAppMemory() {
  return app.getAppMetrics().reduce((acc, metric) => acc + metric.memory.workingSetSize * 1024, 0);
}
const electronContextIntegration = defineIntegration(() => {
  return {
    name: "ElectronContext",
    processEvent(event, _, client) {
      delete event.contexts?.runtime;
      delete event.contexts?.app?.app_memory;
      if (event.request?.headers) {
        delete event.request.headers["User-Agent"];
      }
      const { release = getDefaultReleaseName(), environment = getDefaultEnvironment() } = client.getOptions();
      return mergeEvents({
        contexts: {
          app: {
            app_name: app.name || app.getName(),
            app_version: app.getVersion(),
            build_type: process.mas ? "app-store" : process.windowsStore ? "windows-store" : void 0,
            app_memory: getAppMemory(),
            app_arch: process.arch
          },
          browser: {
            name: "Chrome"
          },
          chrome: {
            name: "Chrome",
            type: "runtime",
            version: process.versions.chrome
          },
          device: {
            family: "Desktop"
          },
          node: {
            name: "Node",
            type: "runtime",
            version: process.versions.node
          },
          runtime: {
            name: "Electron",
            version: process.versions.electron
          }
        },
        environment,
        release,
        tags: {
          "event.origin": "electron",
          "event.environment": "javascript",
          "event.process": "browser"
        }
      }, event);
    }
  };
});
function getScopeData() {
  const globalScope = getGlobalScope().getScopeData();
  const isolationScope = getIsolationScope().getScopeData();
  const currentScope = getCurrentScope().getScopeData();
  mergeScopeData(globalScope, isolationScope);
  mergeScopeData(globalScope, currentScope);
  globalScope.eventProcessors = [];
  return globalScope;
}
function addScopeListener(callback) {
  getIsolationScope().addScopeListener((isolation) => {
    const merged = getScopeData();
    callback(merged, isolation);
  });
  getCurrentScope().addScopeListener((current) => {
    const merged = getScopeData();
    callback(merged, current);
  });
  getGlobalScope().addScopeListener((global2) => {
    const merged = getScopeData();
    callback(merged, global2);
  });
}
const getModuleFromFilename = createGetModuleFromFilename(app.getAppPath());
function normalizePaths(event, basePath) {
  for (const exception of event.exception?.values || []) {
    for (const frame of exception.stacktrace?.frames || []) {
      if (frame.filename) {
        frame.filename = normalizeUrlToBase(frame.filename, basePath);
      }
    }
  }
  for (const debugImage of event.debug_meta?.images || []) {
    if (debugImage.type === "sourcemap") {
      debugImage.code_file = normalizeUrlToBase(debugImage.code_file, basePath);
    }
  }
  if (event.transaction) {
    event.transaction = normalizeUrlToBase(event.transaction, basePath);
  }
  const { request = {} } = event;
  if (request.url) {
    request.url = normalizeUrlToBase(request.url, basePath);
  }
  if (event.contexts?.feedback?.url && typeof event.contexts.feedback.url === "string") {
    event.contexts.feedback.url = normalizeUrlToBase(event.contexts.feedback.url, basePath);
  }
  if (event.spans) {
    for (const span of event.spans) {
      if (span.description) {
        span.description = normalizeUrlToBase(span.description, basePath);
      }
    }
  }
  return event;
}
function normalizeReplayEnvelope(options, envelope, basePath) {
  let modifiedEnvelope = createEnvelope(envelope[0]);
  let isReplay = false;
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type === "replay_event") {
      isReplay = true;
      const [headers, event] = item;
      const currentScope = getCurrentScope().getScopeData();
      event.breadcrumbs = currentScope.breadcrumbs;
      event.tags = currentScope.tags;
      event.user = currentScope.user;
      event.environment = options.environment;
      if (Array.isArray(event.urls)) {
        event.urls = event.urls.map((url) => normalizeUrlToBase(url, basePath));
      }
      if (event?.request?.url) {
        event.request.url = normalizeUrlToBase(event.request.url, basePath);
      }
      modifiedEnvelope = addItemToEnvelope(modifiedEnvelope, [headers, event]);
    } else if (type === "replay_recording") {
      modifiedEnvelope = addItemToEnvelope(modifiedEnvelope, item);
    }
  });
  return isReplay ? modifiedEnvelope : envelope;
}
function normaliseProfile(profile, basePath) {
  for (const frame of profile.profile.frames) {
    if (frame.abs_path) {
      frame.abs_path = normalizeUrlToBase(frame.abs_path, basePath);
    }
    if ("filename" in frame && typeof frame.filename === "string") {
      frame.filename = normalizeUrlToBase(frame.filename, basePath);
    }
    if (frame.module) {
      frame.module = getModuleFromFilename(frame.abs_path);
    }
  }
}
function normaliseProfileChunk(profileChunk, basePath, options) {
  if (options.release) {
    profileChunk.release = options.release;
  }
  if (options.environment) {
    profileChunk.environment = options.environment;
  }
  const profile = profileChunk.profile;
  if (profile?.frames) {
    for (const frame of profile.frames) {
      if (frame.abs_path) {
        frame.abs_path = normalizeUrlToBase(frame.abs_path, basePath);
      }
      if (frame.filename) {
        frame.filename = normalizeUrlToBase(frame.filename, basePath);
      }
      if (frame.module) {
        frame.module = getModuleFromFilename(frame.abs_path);
      }
    }
  }
}
function normalizeProfileChunkEnvelope(options, envelope, basePath) {
  const [originalHeader] = envelope;
  const modifiedHeader = {
    ...originalHeader,
    sdk: { name: "sentry.javascript.electron", version: SDK_VERSION }
  };
  let modifiedEnvelope = createEnvelope(modifiedHeader);
  let isProfileChunk = false;
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type === "profile_chunk") {
      isProfileChunk = true;
      const [headers, chunk] = item;
      normaliseProfileChunk(chunk, basePath, options);
      modifiedEnvelope = addItemToEnvelope(modifiedEnvelope, [headers, chunk]);
    }
  });
  return isProfileChunk ? modifiedEnvelope : envelope;
}
function parseOptions(optionsIn) {
  if (typeof optionsIn === "string") {
    try {
      return { method: "GET", url: new URL(optionsIn).href };
    } catch {
      return { method: "GET", url: optionsIn };
    }
  }
  const method = (optionsIn.method || "GET").toUpperCase();
  const options = optionsIn;
  let url = "url" in options ? options.url : void 0;
  if (!url) {
    const urlObj = {};
    urlObj.protocol = options.protocol || "http:";
    if (options.host) {
      urlObj.host = options.host;
    } else {
      if (options.hostname) {
        urlObj.hostname = options.hostname;
      } else {
        urlObj.hostname = "localhost";
      }
      if (options.port) {
        urlObj.port = options.port;
      }
    }
    const pathObj = parseStringToURLObject(options.path || "/");
    urlObj.pathname = pathObj?.pathname;
    urlObj.search = pathObj?.search;
    urlObj.hash = pathObj?.hash;
    url = format$1(urlObj);
  }
  return {
    method,
    url
  };
}
function createWrappedRequestFactory({ tracing, breadcrumbs }, { enableLogs, tracePropagationTargets, propagateTraceparent }) {
  const createSpanUrlMap = new LRUMap(100);
  const headersUrlMap = new LRUMap(100);
  const shouldCreateSpan = (method, url) => {
    if (tracing === void 0) {
      return true;
    }
    if (tracing === false) {
      return false;
    }
    const key = `${method}:${url}`;
    const cachedDecision = createSpanUrlMap.get(key);
    if (cachedDecision !== void 0) {
      return cachedDecision;
    }
    const decision = tracing === true || tracing(method, url);
    createSpanUrlMap.set(key, decision);
    return decision;
  };
  const shouldAttachTraceData = (method, url) => {
    const key = `${method}:${url}`;
    const cachedDecision = headersUrlMap.get(key);
    if (cachedDecision !== void 0) {
      return cachedDecision;
    }
    if (tracePropagationTargets) {
      const decision = stringMatchesSomePattern(url, tracePropagationTargets);
      headersUrlMap.set(key, decision);
      return decision;
    }
    return true;
  };
  const addRequestBreadcrumb = (event, method, url, req, res) => {
    const level = getBreadcrumbLogLevelFromHttpStatusCode(res?.statusCode);
    addBreadcrumb({
      type: "http",
      category: "electron.net",
      data: {
        url,
        method,
        status_code: res?.statusCode
      },
      level
    }, {
      event,
      request: req,
      response: res
    });
    if (!enableLogs) {
      return;
    }
    const attributes2 = {
      "sentry.origin": "auto.electron.net",
      statusCode: res?.statusCode
    };
    switch (level) {
      case "error":
        error(fmt`Electron.net request failed: ${method} ${url}`, attributes2);
        break;
      case "warning":
        warn(fmt`Electron.net request warning: ${method} ${url}`, attributes2);
        break;
      default:
        info(fmt`Electron.net request succeeded: ${method} ${url}`, attributes2);
    }
  };
  return function wrappedRequestMethodFactory(originalRequestMethod) {
    return function requestMethod(reqOptions) {
      const { url, method } = parseOptions(reqOptions);
      const request = originalRequestMethod.apply(this, [reqOptions]);
      if (url.match(/sentry_key/) || request.getHeader("x-sentry-auth")) {
        return request;
      }
      const span = shouldCreateSpan(method, url) ? startInactiveSpan$1({
        name: `${method} ${url}`,
        onlyIfParent: true,
        attributes: {
          url,
          type: "net.request",
          "http.method": method
        },
        op: "http.client"
      }) : new SentryNonRecordingSpan();
      span.setAttribute(SEMANTIC_ATTRIBUTE_SENTRY_ORIGIN, "auto.http.electron.net");
      if (shouldAttachTraceData(method, url)) {
        for (const [key, value] of Object.entries(getTraceData$1({ span, propagateTraceparent }))) {
          debug.log(`[Tracing] Adding ${key} header ${value} to outgoing request to "${url}": `);
          request.setHeader(key, value);
        }
      }
      return request.once("response", function(res) {
        if (breadcrumbs !== false) {
          addRequestBreadcrumb("response", method, url, this, res);
        }
        if (res.statusCode) {
          setHttpStatus(span, res.statusCode);
        }
        span.end();
      }).once("error", function(_error) {
        if (breadcrumbs !== false) {
          addRequestBreadcrumb("error", method, url, this, void 0);
        }
        setHttpStatus(span, 500);
        span.end();
      });
    };
  };
}
const electronNetIntegration = defineIntegration((options = {}) => {
  return {
    name: "ElectronNet",
    setup(client) {
      if (options.breadcrumbs === false && options.tracing === false) {
        return;
      }
      fill(net, "request", createWrappedRequestFactory(options, client.getOptions()));
    }
  };
});
function gpuDeviceToGpuContext(device) {
  return {
    name: device.deviceString || "GPU",
    active: device.active,
    id: `0x${device.deviceId.toString(16).padStart(4, "0")}`,
    vendor_id: `0x${device.vendorId.toString(16).padStart(4, "0")}`,
    vendor_name: device.vendorString,
    driver_version: device.driverVersion
  };
}
const gpuContextIntegration = defineIntegration((options = { infoLevel: "basic" }) => {
  let gpuContexts;
  return {
    name: "GpuContext",
    processEvent: async (event) => {
      if (gpuContexts === void 0) {
        try {
          const result = await app.getGPUInfo(options.infoLevel);
          gpuContexts = result.gpuDevice.map(gpuDeviceToGpuContext);
        } catch {
          gpuContexts = [];
        }
      }
      if (gpuContexts.length === 1) {
        event.contexts = { ...event.contexts, gpu: gpuContexts[0] };
      } else if (gpuContexts.length > 1) {
        event.contexts = { ...event.contexts };
        for (let i = 0; i < gpuContexts.length; i++) {
          const gpuContext = gpuContexts[i];
          gpuContext.type = "gpu";
          event.contexts[`gpu_${i + 1}`] = gpuContext;
        }
      }
      return event;
    }
  };
});
const mainProcessSessionIntegration = defineIntegration((options = {}) => {
  return {
    name: "MainProcessSession",
    setup() {
      startSession(!!options.sendOnCreate);
      endSessionOnExit();
    }
  };
});
const normalizePathsIntegration = defineIntegration(() => {
  return {
    name: "NormalizePaths",
    setup: (client) => {
      setImmediate(() => {
        client.on("beforeEnvelope", (envelope) => {
          forEachEnvelopeItem(envelope, (item, type) => {
            if (type === "profile") {
              normaliseProfile(item[1], app.getAppPath());
            }
          });
        });
      });
    },
    processEvent(event) {
      return normalizePaths(event, app.getAppPath());
    }
  };
});
const onUncaughtExceptionIntegration = defineIntegration(() => {
  return {
    name: "OnUncaughtException",
    setup(client) {
      const options = client.getOptions();
      global.process.on("uncaughtException", (error2) => {
        captureException(error2, {
          originalException: error2,
          captureContext: {
            level: "fatal"
          },
          data: {
            mechanism: {
              handled: false,
              type: "generic"
            }
          }
        });
        client.flush(options.shutdownTimeout || 2e3).then(() => {
          if (options?.onFatalError) {
            options.onFatalError(error2);
          } else if (global.process.listenerCount("uncaughtException") <= 2) {
            console.error("Uncaught Exception:");
            console.error(error2);
            const ref = error2.stack;
            const stack = ref !== void 0 ? ref : `${error2.name}: ${error2.message}`;
            const message = `Uncaught Exception:
${stack}`;
            dialog.showErrorBox("A JavaScript error occurred in the main process", message);
          }
        }, () => {
        });
      });
    }
  };
});
function getPreloadPath() {
  try {
    return require2.resolve("../../preload/default.js");
  } catch {
    try {
      const currentDir = fileURLToPath$1(import.meta.url);
      return resolve(currentDir, "..", "..", "..", "..", "preload", "default.js");
    } catch {
    }
  }
  return void 0;
}
const preloadInjectionIntegration = defineIntegration(() => {
  return {
    name: "PreloadInjection",
    setup(client) {
      const options = client.getOptions();
      if ((options.ipcMode & IPCMode.Classic) === 0) {
        return;
      }
      app.once("ready", () => {
        const path2 = getPreloadPath();
        if (path2 && typeof path2 === "string" && isAbsolute(path2) && existsSync(path2)) {
          for (const sesh of options.getSessions()) {
            setPreload(sesh, path2);
          }
        } else {
          debug.log("The preload script could not be injected automatically. This is most likely caused by bundling of the main process");
        }
      });
    }
  };
});
function addHeader(responseHeaders = {}, name, value) {
  if (responseHeaders[name]) {
    const existing = responseHeaders[name];
    if (Array.isArray(existing)) {
      existing.push(value);
    } else {
      responseHeaders[name] = [existing, value];
    }
  } else {
    responseHeaders[name] = value;
  }
  return { responseHeaders };
}
function addHeaderToSession(sesh, header, value) {
  sesh.webRequest.onHeadersReceived((details, callback) => {
    callback(addHeader(details.responseHeaders, header, value));
  });
}
const CHROME_PRIORITY = 30;
const GECKO_PRIORITY = 50;
function createFrame(filename, func, lineno, colno) {
  const frame = {
    filename,
    function: func === "<anonymous>" ? UNKNOWN_FUNCTION : func,
    in_app: true
    // All browser frames are considered in_app
  };
  if (lineno !== void 0) {
    frame.lineno = lineno;
  }
  if (colno !== void 0) {
    frame.colno = colno;
  }
  return frame;
}
const chromeRegexNoFnName = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
const chromeRegex = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
const chromeEvalRegex = /\((\S*)(?::(\d+))(?::(\d+))\)/;
const chromeDataUriRegex = /at (.+?) ?\(data:(.+?),/;
const chromeStackParserFn = (line) => {
  const dataUriMatch = line.match(chromeDataUriRegex);
  if (dataUriMatch) {
    return {
      filename: `<data:${dataUriMatch[2]}>`,
      function: dataUriMatch[1]
    };
  }
  const noFnParts = chromeRegexNoFnName.exec(line);
  if (noFnParts) {
    const [, filename, line2, col] = noFnParts;
    return createFrame(filename, UNKNOWN_FUNCTION, +line2, +col);
  }
  const parts = chromeRegex.exec(line);
  if (parts) {
    const isEval = parts[2]?.indexOf("eval") === 0;
    if (isEval) {
      const subMatch = chromeEvalRegex.exec(parts[2]);
      if (subMatch) {
        parts[2] = subMatch[1];
        parts[3] = subMatch[2];
        parts[4] = subMatch[3];
      }
    }
    const [func, filename] = extractSafariExtensionDetails(parts[1] || UNKNOWN_FUNCTION, parts[2]);
    return createFrame(filename, func, parts[3] ? +parts[3] : void 0, parts[4] ? +parts[4] : void 0);
  }
  return;
};
const chromeStackLineParser = [CHROME_PRIORITY, chromeStackParserFn];
const geckoREgex = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
const geckoEvalRegex = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
const gecko = (line) => {
  const parts = geckoREgex.exec(line);
  if (parts) {
    const isEval = parts[3] && parts[3].indexOf(" > eval") > -1;
    if (isEval) {
      const subMatch = geckoEvalRegex.exec(parts[3]);
      if (subMatch) {
        parts[1] = parts[1] || "eval";
        parts[3] = subMatch[1];
        parts[4] = subMatch[2];
        parts[5] = "";
      }
    }
    let filename = parts[3];
    let func = parts[1] || UNKNOWN_FUNCTION;
    [func, filename] = extractSafariExtensionDetails(func, filename);
    return createFrame(filename, func, parts[4] ? +parts[4] : void 0, parts[5] ? +parts[5] : void 0);
  }
  return;
};
const geckoStackLineParser = [GECKO_PRIORITY, gecko];
const defaultStackLineParsers = [chromeStackLineParser, geckoStackLineParser];
createStackParser(...defaultStackLineParsers);
const extractSafariExtensionDetails = (func, filename) => {
  const isSafariExtension = func.indexOf("safari-extension") !== -1;
  const isSafariWebExtension = func.indexOf("safari-web-extension") !== -1;
  return isSafariExtension || isSafariWebExtension ? [
    func.indexOf("@") !== -1 ? func.split("@")[0] : UNKNOWN_FUNCTION,
    isSafariExtension ? `safari-extension:${filename}` : `safari-web-extension:${filename}`
  ] : [func, filename];
};
const STACKTRACE_FRAME_LIMIT = 50;
const [, chrome] = chromeStackLineParser;
const [, node] = nodeStackLineParser();
const electronRendererStackParser = (stack, skipFirst = 0) => {
  const frames = [];
  for (const line of stack.split("\n").slice(skipFirst)) {
    const chromeFrame = chrome(line);
    const nodeFrame = node(line);
    if (chromeFrame && nodeFrame?.in_app !== false) {
      frames.push(chromeFrame);
    } else if (nodeFrame) {
      if (nodeFrame.module === void 0) {
        delete nodeFrame.module;
      }
      frames.push(nodeFrame);
    }
    if (frames.length >= STACKTRACE_FRAME_LIMIT) {
      break;
    }
  }
  return stripSentryFramesAndReverse(frames);
};
const defaultStackParser = createStackParser(nodeStackLineParser(createGetModuleFromFilename(app.getAppPath())));
async function captureRendererStackFrames(webContents2) {
  if (ELECTRON_MAJOR_VERSION < 34) {
    throw new Error("Electron >= 34 required to capture stack frames via `frame.collectJavaScriptCallStack()`");
  }
  if (webContents2.isDestroyed()) {
    return void 0;
  }
  const frame = webContents2.mainFrame;
  const stack = await frame.collectJavaScriptCallStack();
  if (!stack) {
    return void 0;
  }
  if (stack.includes("Website owner has not opted in")) {
    debug.warn("Could not collect renderer stack frames.\nA 'Document-Policy' header of 'include-js-call-stacks-in-crash-reports' must be set");
    return void 0;
  }
  return electronRendererStackParser(stack);
}
function log$1(message, ...args) {
  debug.log(`[Renderer Event Loop Block] ${message}`, ...args);
}
function nativeStackTraceCapture(contents, pausedStack) {
  return () => {
    captureRendererStackFrames(contents).then((frames) => {
      if (frames) {
        pausedStack(frames);
      }
    }).catch(() => {
    });
  };
}
function debuggerStackTraceCapture(contents, pausedStack) {
  log$1("Connecting to debugger");
  contents.debugger.attach("1.3");
  const scripts = /* @__PURE__ */ new Map();
  const getModuleFromFilename2 = createGetModuleFromFilename(app.getAppPath());
  contents.debugger.on("message", (_, method, params) => {
    if (method === "Debugger.scriptParsed") {
      const param = params;
      scripts.set(param.scriptId, param.url);
    } else if (method === "Debugger.paused") {
      const param = params;
      if (param.reason !== "other") {
        return;
      }
      const callFrames = [...param.callFrames];
      contents.debugger.sendCommand("Debugger.resume").then(null, () => {
      });
      const stackFrames = stripSentryFramesAndReverse(callFrames.map((frame) => callFrameToStackFrame(frame, scripts.get(frame.location.scriptId), getModuleFromFilename2)));
      pausedStack(stackFrames);
    }
  });
  contents.debugger.sendCommand("Debugger.enable").catch(() => {
  });
  return () => {
    if (contents.isDestroyed()) {
      return;
    }
    log$1("Pausing debugger to capture stack trace");
    return contents.debugger.sendCommand("Debugger.pause");
  };
}
function createHrTimer() {
  let lastPoll = process.hrtime();
  return {
    getTimeMs: () => {
      const [seconds, nanoSeconds] = process.hrtime(lastPoll);
      return Math.floor(seconds * 1e3 + nanoSeconds / 1e6);
    },
    reset: () => {
      lastPoll = process.hrtime();
    }
  };
}
const INTEGRATION_NAME = "RendererEventLoopBlock";
const rendererEventLoopBlockIntegration = defineIntegration((options = {}) => {
  const rendererWatchdogTimers = /* @__PURE__ */ new Map();
  let clientOptions;
  function getRendererName(contents) {
    return clientOptions?.getRendererName?.(contents);
  }
  function sendRendererEventLoopBlockEvent(contents, blockedMs, frames) {
    sessionAnr();
    const rendererName = getRendererName(contents) || "renderer";
    const event = {
      level: "error",
      exception: {
        values: [
          {
            type: "ApplicationNotResponding",
            value: `Application Not Responding for at least ${blockedMs} ms`,
            stacktrace: { frames },
            mechanism: {
              // This ensures the UI doesn't say 'Crashed in' for the stack trace
              type: "ANR"
            }
          }
        ]
      },
      tags: {
        "event.process": rendererName
      }
    };
    captureEvent(event);
  }
  return {
    name: INTEGRATION_NAME,
    setup: (client) => {
      clientOptions = client.getOptions();
      if (ELECTRON_MAJOR_VERSION >= 34) {
        app.commandLine.appendSwitch("enable-features", "DocumentPolicyIncludeJSCallStacksInCrashReports");
        if (options.captureNativeStacktrace) {
          app.on("ready", () => {
            clientOptions?.getSessions().forEach((sesh) => addHeaderToSession(sesh, "Document-Policy", "include-js-call-stacks-in-crash-reports"));
          });
        }
      }
    },
    createRendererEventLoopBlockStatusHandler: () => {
      return (message, contents) => {
        let watchdog = rendererWatchdogTimers.get(contents);
        function disable2() {
          watchdog?.enabled(false);
        }
        function enable2() {
          watchdog?.enabled(true);
        }
        if (watchdog === void 0) {
          log$1("Renderer sent first status message", message.config);
          let pauseAndCapture;
          if (message.config.captureStackTrace) {
            const stackCaptureImpl = options.captureNativeStacktrace && ELECTRON_MAJOR_VERSION >= 34 ? nativeStackTraceCapture : debuggerStackTraceCapture;
            pauseAndCapture = stackCaptureImpl(contents, (frames) => {
              log$1("Event captured with stack frames");
              sendRendererEventLoopBlockEvent(contents, message.config.anrThreshold, frames);
            });
          }
          watchdog = watchdogTimer(createHrTimer, 100, message.config.anrThreshold, async () => {
            log$1("Watchdog timeout");
            if (pauseAndCapture) {
              pauseAndCapture();
            } else {
              log$1("Capturing event");
              sendRendererEventLoopBlockEvent(contents, message.config.anrThreshold);
            }
          });
          contents.once("destroyed", () => {
            rendererWatchdogTimers?.delete(contents);
            powerMonitor.off("suspend", disable2);
            powerMonitor.off("resume", enable2);
            powerMonitor.off("lock-screen", disable2);
            powerMonitor.off("unlock-screen", enable2);
          });
          contents.once("blur", disable2);
          contents.once("focus", enable2);
          powerMonitor.on("suspend", disable2);
          powerMonitor.on("resume", enable2);
          powerMonitor.on("lock-screen", disable2);
          powerMonitor.on("unlock-screen", enable2);
          rendererWatchdogTimers.set(contents, watchdog);
        }
        watchdog.poll();
        if (message.status !== "alive") {
          log$1(`Renderer visibility changed '${message.status}'`);
          watchdog.enabled(message.status === "visible");
        }
      };
    }
  };
});
function createRendererEventLoopBlockStatusHandler(client) {
  const integration = client.getIntegrationByName(INTEGRATION_NAME);
  return integration?.createRendererEventLoopBlockStatusHandler();
}
let RENDERER_PROFILES;
function rendererProfileFromIpc(event, profile) {
  if (!RENDERER_PROFILES) {
    return;
  }
  const profile_id = profile.event_id;
  RENDERER_PROFILES.set(profile_id, profile);
  if (event) {
    event.contexts = {
      ...event.contexts,
      // Re-add the profile context which we can later use to find the correct profile
      profile: {
        profile_id
      }
    };
  }
}
const rendererProfilingIntegration = defineIntegration(() => {
  return {
    name: "RendererProfiling",
    setup(client) {
      const options = client.getOptions();
      if (!options.enableRendererProfiling) {
        return;
      }
      RENDERER_PROFILES = new LRUMap(10);
      app.on("ready", () => {
        options.getSessions().forEach((sesh) => addHeaderToSession(sesh, "Document-Policy", "js-profiling"));
      });
      client.on?.("beforeEnvelope", (envelope) => {
        let profile_id;
        forEachEnvelopeItem(envelope, (item, type) => {
          if (type !== "transaction") {
            return;
          }
          for (let j = 1; j < item.length; j++) {
            const event = item[j];
            if (event?.contexts?.profile?.profile_id) {
              profile_id = event.contexts.profile.profile_id;
              delete event.contexts.profile;
            }
          }
        });
        if (!profile_id) {
          return;
        }
        const profile = RENDERER_PROFILES?.remove(profile_id);
        if (!profile) {
          return;
        }
        normaliseProfile(profile, app.getAppPath());
        profile.release = options.release || getDefaultReleaseName();
        profile.environment = options.environment || getDefaultEnvironment();
        envelope[1].push([{ type: "profile" }, profile]);
      });
    }
  };
});
const screenshotsIntegration = defineIntegration(() => {
  return {
    name: "Screenshots",
    async processEvent(event, hint, client) {
      const attachScreenshot = !!client.getOptions().attachScreenshot;
      if (!attachScreenshot) {
        return event;
      }
      if (!event.transaction && event.platform !== "native") {
        let count = 1;
        for (const window2 of BrowserWindow.getAllWindows()) {
          if (!hint.attachments) {
            hint.attachments = [];
          }
          try {
            if (!window2.isDestroyed() && window2.isVisible()) {
              const filename = count === 1 ? "screenshot.png" : `screenshot-${count}.png`;
              const image = await window2.capturePage();
              hint.attachments.push({ filename, data: image.toPNG(), contentType: "image/png" });
              count += 1;
            }
          } catch (e) {
            debug.error("Error capturing screenshot", e);
          }
        }
      }
      return event;
    }
  };
});
const MINIDUMP_MAGIC_SIGNATURE = "MDMP";
const MAX_ANNOTATION_COUNT = 1e3;
const MAX_MODULE_COUNT = 1e3;
const MAX_STRING_LENGTH = 1024 * 100;
function readHeader(buf) {
  return {
    //   pub signature: u32,
    signature: buf.subarray(0, 4).toString(),
    //   pub version: u32,
    version: buf.readUInt32LE(4),
    //   pub stream_count: u32,
    streamCount: buf.readUInt32LE(8),
    //   pub stream_directory_rva: u32,
    streamDirectoryRva: buf.readUInt32LE(12),
    //   pub checksum: u32,
    checksum: buf.readUInt32LE(16),
    //   pub time_date_stamp: u32,
    timeDateStamp: new Date(buf.readUInt32LE(20) * 1e3),
    //   pub flags: u64,
    flags: buf.readBigUInt64LE(24)
  };
}
function readLocationDescriptor(buf, base) {
  return {
    //   pub data_size: u32,
    dataSize: buf.readUInt32LE(base),
    //   pub rva: u32,
    rva: buf.readUInt32LE(base + 4)
  };
}
function readDirectoryStream(buf, rva) {
  return {
    //   pub stream_type: u32,
    streamType: buf.readUInt32LE(rva),
    //   pub location: [u32, u32],
    location: readLocationDescriptor(buf, rva + 4)
  };
}
function readCrashpadInfoBuffer(buf, location) {
  return buf.subarray(location.rva, location.rva + location.dataSize);
}
function readCrashpadModuleInfoAnnotationObjectsLocation(buf, base) {
  const annotation_objects = readLocationDescriptor(buf, base + 20);
  return annotation_objects;
}
function readStringUtf8Unterminated(buf, rva) {
  const length = buf.readUInt32LE(rva);
  if (length > MAX_STRING_LENGTH) {
    throw new Error(`String length ${length} exceeds maximum allowed ${MAX_STRING_LENGTH}`);
  }
  const endOffset = rva + 4 + length;
  if (endOffset > buf.length) {
    throw new Error(`String extends beyond buffer bounds (${endOffset} > ${buf.length})`);
  }
  return buf.toString("utf8", rva + 4, endOffset);
}
function readAnnotationObject(buf, all, offset) {
  const name = buf.readUInt32LE(offset);
  const ty = buf.readUInt16LE(offset + 4);
  const value = buf.readUInt32LE(offset + 8);
  if (ty === 1) {
    return { name: readStringUtf8Unterminated(all, name), value: readStringUtf8Unterminated(all, value) };
  }
  return void 0;
}
function readAnnotationObjects(buf, location) {
  const data = buf.subarray(location.rva, location.rva + location.dataSize);
  if (data.length === 0) {
    return {};
  }
  const annotationObjectsLocation = readCrashpadModuleInfoAnnotationObjectsLocation(data, 0);
  const annotationObjectsData = buf.subarray(annotationObjectsLocation.rva, annotationObjectsLocation.rva + annotationObjectsLocation.dataSize);
  const count = annotationObjectsData.readUInt32LE(0);
  if (count > MAX_ANNOTATION_COUNT) {
    throw new Error(`Annotation count ${count} exceeds maximum allowed ${MAX_ANNOTATION_COUNT}`);
  }
  let offset = 4;
  const annotationObjects = {};
  for (let i = 0; i < count; i++) {
    const annotation = readAnnotationObject(annotationObjectsData, buf, offset);
    if (annotation) {
      const { name, value } = annotation;
      annotationObjects[name] = value;
    }
    offset += 12;
  }
  return annotationObjects;
}
function readCrashpadModuleLinks(buf, location) {
  const data = buf.subarray(location.rva, location.rva + location.dataSize);
  if (data.length === 0) {
    return {};
  }
  const count = data.readUInt32LE(0);
  if (count > MAX_MODULE_COUNT) {
    throw new Error(`Module count ${count} exceeds maximum allowed ${MAX_MODULE_COUNT}`);
  }
  let offset = 4;
  let annotationObjects = {};
  for (let i = 0; i < count; i++) {
    const annotationObjectsLocation = readLocationDescriptor(data, offset + 4);
    annotationObjects = { ...annotationObjects, ...readAnnotationObjects(buf, annotationObjectsLocation) };
    offset += 12;
  }
  return annotationObjects;
}
function parseCrashpadInfo(buf, info2) {
  const module_list = readLocationDescriptor(info2, 44);
  return readCrashpadModuleLinks(buf, module_list);
}
function parseMinidump(buf) {
  if (buf.length < 1e4) {
    throw new Error("Minidump was less than 10KB so likely incomplete.");
  }
  let header;
  try {
    header = readHeader(buf);
  } catch {
    throw new Error("Failed to parse minidump header");
  }
  if (header.signature !== MINIDUMP_MAGIC_SIGNATURE) {
    throw new Error(`Minidump signature was not '${MINIDUMP_MAGIC_SIGNATURE}'`);
  }
  try {
    for (let i = 0; i < header.streamCount; i++) {
      const stream = readDirectoryStream(buf, header.streamDirectoryRva + i * 12);
      if (stream.streamType === 1129316353) {
        const crashpadInfo = readCrashpadInfoBuffer(buf, stream.location);
        const crashpadAnnotations = parseCrashpadInfo(buf, crashpadInfo);
        return {
          header,
          crashpadAnnotations
        };
      }
    }
  } catch {
  }
  return { header };
}
const MAX_AGE_DAYS = 30;
const MS_PER_DAY = 24 * 3600 * 1e3;
const NOT_MODIFIED_MS = 1e3;
const MAX_RETRY_MS = 5e3;
const RETRY_DELAY_MS = 500;
const MAX_RETRIES = MAX_RETRY_MS / RETRY_DELAY_MS;
function delay(ms2) {
  return new Promise((resolve2) => setTimeout(resolve2, ms2));
}
function createMinidumpLoader(getMinidumpPaths) {
  const mutex = new Mutex();
  return async (deleteAll, callback) => {
    await mutex.runExclusive(async () => {
      for (const path2 of await getMinidumpPaths()) {
        try {
          if (deleteAll) {
            continue;
          }
          debug.log("Found minidump", path2);
          let stats = await promises.stat(path2);
          const thirtyDaysAgo = (/* @__PURE__ */ new Date()).getTime() - MAX_AGE_DAYS * MS_PER_DAY;
          if (stats.mtimeMs < thirtyDaysAgo) {
            debug.log(`Ignoring minidump as it is over ${MAX_AGE_DAYS} days old`);
            continue;
          }
          let retries = 0;
          while (retries <= MAX_RETRIES) {
            const twoSecondsAgo = (/* @__PURE__ */ new Date()).getTime() - NOT_MODIFIED_MS;
            if (stats.mtimeMs < twoSecondsAgo) {
              const data = await promises.readFile(path2);
              try {
                const parsedMinidump = parseMinidump(data);
                debug.log("Sending minidump");
                await callback(parsedMinidump, {
                  attachmentType: "event.minidump",
                  filename: basename(path2),
                  data
                });
              } catch (e) {
                const message = e instanceof Error ? e.toString() : "Unknown error";
                debug.warn(`Dropping minidump:
${message}`);
                break;
              }
              break;
            }
            debug.log(`Waiting. Minidump has been modified in the last ${NOT_MODIFIED_MS} milliseconds.`);
            retries += 1;
            await delay(RETRY_DELAY_MS);
            stats = await promises.stat(path2);
          }
          if (retries >= MAX_RETRIES) {
            debug.warn("Timed out waiting for minidump to stop being modified");
          }
        } catch (e) {
          debug.error("Failed to load minidump", e);
        } finally {
          try {
            await promises.unlink(path2);
          } catch {
            debug.warn("Could not delete minidump", path2);
          }
        }
      }
    });
  };
}
async function deleteCrashpadMetadataFile(crashesDirectory, waitMs = 100) {
  if (waitMs > 2e3) {
    return;
  }
  const metadataPath = join$1(crashesDirectory, "metadata");
  try {
    await promises.unlink(metadataPath);
    debug.log("Deleted Crashpad metadata file", metadataPath);
  } catch (e) {
    if (e.code && e.code == "EBUSY") {
      setTimeout(async () => {
        await deleteCrashpadMetadataFile(crashesDirectory, waitMs * 2);
      }, waitMs);
    }
  }
}
async function readDirsAsync(paths) {
  const found = [];
  for (const path2 of paths) {
    try {
      const files = await promises.readdir(path2);
      found.push(...files.map((file) => join$1(path2, file)));
    } catch {
    }
  }
  return found;
}
function getMinidumpLoader() {
  const crashesDirectory = app.getPath("crashDumps");
  const crashpadSubDirectory = process.platform === "win32" ? "reports" : "completed";
  const dumpDirectories = [join$1(crashesDirectory, crashpadSubDirectory)];
  if (process.platform === "darwin") {
    dumpDirectories.push(join$1(crashesDirectory, "pending"));
  }
  return createMinidumpLoader(async () => {
    await deleteCrashpadMetadataFile(crashesDirectory).catch((error2) => debug.error(error2));
    const files = await readDirsAsync(dumpDirectories);
    return files.filter((file) => file.endsWith(".dmp"));
  });
}
const sentryMinidumpIntegration = defineIntegration((options = {}) => {
  let minidumpsRemaining = options.maxMinidumpsPerSession || 10;
  let scopeStore;
  let scopeLastRun;
  let minidumpLoader;
  function startCrashReporter() {
    debug.log("Starting Electron crashReporter");
    crashReporter.start({
      companyName: "",
      ignoreSystemCrashHandler: true,
      productName: app.name || app.getName(),
      // Empty string doesn't work for Linux Crashpad and no submitURL doesn't work for older versions of Electron
      submitURL: "https://f.a.k/e",
      uploadToServer: false,
      compress: true
    });
  }
  function setupScopeListener(client) {
    function scopeChanged(scope) {
      setImmediate(async () => scopeStore?.set({
        scope,
        event: await getEventDefaults(client)
      }));
    }
    addScopeListener((scope) => {
      scopeChanged(scope);
    });
    scopeChanged(getScopeData());
  }
  async function sendNativeCrashes(client, getEvent) {
    if (minidumpsRemaining <= 0) {
      debug.log("Not sending minidumps because the limit has been reached");
    }
    const deleteAll = client.getOptions().enabled === false || minidumpsRemaining <= 0;
    let minidumpFound = false;
    await minidumpLoader?.(deleteAll, async (minidumpResult, attachment) => {
      minidumpFound = true;
      const minidumpProcess = minidumpResult.crashpadAnnotations?.process_type?.replace("-process", "");
      const event = await getEvent(minidumpProcess);
      if (minidumpResult.crashpadAnnotations) {
        const prependedAnnotations = Object.entries(minidumpResult.crashpadAnnotations).reduce((acc, [key, val]) => (acc[`crashpad.${key}`] = val, acc), {});
        event.contexts = {
          ...event.contexts,
          electron: {
            ...event.contexts?.electron,
            ...prependedAnnotations
          }
        };
      }
      if (minidumpsRemaining > 0) {
        minidumpsRemaining -= 1;
        captureEvent(event, { attachments: [attachment] });
      }
    });
    return minidumpFound;
  }
  async function sendRendererCrash(client, options2, contents, details) {
    const { getRendererName } = options2;
    await sendNativeCrashes(client, (minidumpProcess) => {
      const crashedProcess = (minidumpProcess === "renderer" && getRendererName ? getRendererName(contents) : minidumpProcess) || "unknown";
      debug.log(`'${crashedProcess}' process '${details.reason}'`);
      return {
        contexts: {
          electron: {
            crashed_url: getRendererProperties(contents.id)?.url || "unknown",
            details
          }
        },
        level: "fatal",
        // The default is javascript
        platform: "native",
        tags: {
          "event.environment": "native",
          "event.process": crashedProcess,
          "exit.reason": details.reason
        }
      };
    });
  }
  async function sendChildProcessCrash(client, details) {
    debug.log(`${details.type} process has ${details.reason}`);
    await sendNativeCrashes(client, (minidumpProcess) => ({
      contexts: {
        electron: { details }
      },
      level: "fatal",
      // The default is javascript
      platform: "native",
      tags: {
        "event.environment": "native",
        "event.process": minidumpProcess || details.type,
        "exit.reason": details.reason
      }
    }));
  }
  return {
    name: "SentryMinidump",
    setup(client) {
      if (process.mas) {
        return;
      }
      startCrashReporter();
      scopeStore = new BufferedWriteStore(getSentryCachePath(), "scope_v3", {
        scope: new Scope().getScopeData()
      });
      scopeLastRun = scopeStore.get();
      try {
        minidumpLoader = getMinidumpLoader();
      } catch (error2) {
        debug.error("Failed to create minidump loader", error2);
      }
      const options2 = client.getOptions();
      setupScopeListener(client);
      if (!options2?.dsn) {
        throw new Error("Attempted to enable Electron native crash reporter but no DSN was supplied");
      }
      trackRendererProperties();
      app.on("render-process-gone", async (_, contents, details) => {
        if (EXIT_REASONS.includes(details.reason)) {
          await sendRendererCrash(client, options2, contents, details);
        }
      });
      app.on("child-process-gone", async (_, details) => {
        if (EXIT_REASONS.includes(details.reason)) {
          await sendChildProcessCrash(client, details);
        }
      });
      let sessionToRestore;
      sendNativeCrashes(client, async (minidumpProcess) => {
        const event = {
          level: "fatal",
          platform: "native",
          tags: {
            "event.environment": "native",
            "event.process": minidumpProcess || "unknown"
          }
        };
        const previousRun = await scopeLastRun;
        if (previousRun) {
          if (previousRun.scope) {
            applyScopeDataToEvent(event, previousRun.scope);
          }
          event.release = previousRun.event?.release;
          event.environment = previousRun.event?.environment;
          event.contexts = previousRun.event?.contexts;
          event.sdkProcessingMetadata = {
            dynamicSamplingContext: {
              trace_id: previousRun.scope.propagationContext.traceId,
              release: previousRun.event?.release,
              environment: previousRun.event?.environment,
              public_key: client.getDsn()?.publicKey
            }
          };
        }
        sessionToRestore = await setPreviousSessionAsCurrent();
        return event;
      }).then(async (minidumpsFound) => {
        if (!minidumpsFound) {
          await previousSessionWasAbnormal();
        } else if (sessionToRestore) {
          restorePreviousSession(sessionToRestore);
        }
      }).catch((error2) => debug.error(error2));
    }
  };
});
function eventFromEnvelope(envelope) {
  let event;
  const attachments = [];
  let profile;
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type === "event" || type === "transaction" || type === "feedback") {
      event = Array.isArray(item) ? item[1] : void 0;
    } else if (type === "attachment") {
      const [headers, data] = item;
      attachments.push({
        filename: headers.filename,
        attachmentType: headers.attachment_type,
        contentType: headers.content_type,
        data
      });
    } else if (type === "profile") {
      profile = item[1];
    }
  });
  return event ? [event, attachments, profile] : void 0;
}
function profileChunkFromEnvelope(envelope) {
  let profileChunk;
  forEachEnvelopeItem(envelope, (item, type) => {
    if (type === "profile_chunk") {
      profileChunk = item[1];
    }
  });
  return profileChunk;
}
async function getAttributes(client) {
  const contextIntegration = client.getIntegrationByName("Context");
  const additionalContextIntegration2 = client.getIntegrationByName("AdditionalContext");
  let event = {};
  const hint = {};
  event = await contextIntegration?.processEvent?.(event, hint, client) || event;
  event = await additionalContextIntegration2?.processEvent?.(event, hint, client) || event;
  const attrs = {};
  if (event.contexts?.os?.name) {
    attrs["os.name"] = event.contexts.os.name;
  }
  if (event.contexts?.os?.version) {
    attrs["os.version"] = event.contexts.os.version;
  }
  if (event.contexts?.device?.brand) {
    attrs["device.brand"] = event.contexts.device.brand;
  }
  if (event.contexts?.device?.model) {
    attrs["device.model"] = event.contexts.device.model;
  }
  if (event.contexts?.device?.family) {
    attrs["device.family"] = event.contexts.device.family;
  }
  return attrs;
}
let attributes;
function getOsDeviceLogAttributes(client) {
  if (attributes === void 0) {
    attributes = {};
    getAttributes(client).then((attrs) => {
      attributes = attrs;
    }).catch(() => {
    });
  }
  return attributes || {};
}
const ipcMainHooks = new EventEmitter();
let KNOWN_RENDERERS;
let WINDOW_ID_TO_WEB_CONTENTS;
function newProtocolRenderer() {
  KNOWN_RENDERERS = KNOWN_RENDERERS || /* @__PURE__ */ new Set();
  WINDOW_ID_TO_WEB_CONTENTS = WINDOW_ID_TO_WEB_CONTENTS || /* @__PURE__ */ new Map();
  for (const wc of webContents.getAllWebContents()) {
    const wcId = wc.id;
    if (KNOWN_RENDERERS.has(wcId)) {
      continue;
    }
    if (!wc.isDestroyed()) {
      wc.executeJavaScript("window.__SENTRY_RENDERER_ID__").then((windowId) => {
        if (windowId && KNOWN_RENDERERS && WINDOW_ID_TO_WEB_CONTENTS) {
          KNOWN_RENDERERS.add(wcId);
          WINDOW_ID_TO_WEB_CONTENTS.set(windowId, wcId);
          wc.once("destroyed", () => {
            KNOWN_RENDERERS?.delete(wcId);
            WINDOW_ID_TO_WEB_CONTENTS?.delete(windowId);
          });
        }
      }, debug.error);
    }
  }
}
function captureEventFromRenderer(options, event, dynamicSamplingContext, attachments, contents) {
  const process2 = contents ? options?.getRendererName?.(contents) || "renderer" : "renderer";
  event.breadcrumbs = event.breadcrumbs || [];
  delete event.environment;
  delete event.sdk?.name;
  delete event.sdk?.version;
  delete event.sdk?.packages;
  if (dynamicSamplingContext) {
    event.sdkProcessingMetadata = { ...event.sdkProcessingMetadata, dynamicSamplingContext };
  }
  captureEvent(mergeEvents(event, { tags: { "event.process": process2 } }), { attachments });
}
let cached_public_key;
function handleEnvelope(client, options, env, contents) {
  const envelope = parseEnvelope(env);
  const [envelopeHeader] = envelope;
  const dynamicSamplingContext = envelopeHeader.trace;
  if (dynamicSamplingContext) {
    if (!cached_public_key) {
      const dsn = client.getDsn();
      cached_public_key = dsn?.publicKey;
    }
    dynamicSamplingContext.release = options.release;
    dynamicSamplingContext.environment = options.environment;
    dynamicSamplingContext.public_key = cached_public_key;
  }
  const eventAndAttachments = eventFromEnvelope(envelope);
  if (eventAndAttachments) {
    const [event, attachments, profile] = eventAndAttachments;
    if (profile) {
      rendererProfileFromIpc(event, profile);
    }
    if (ipcMainHooks.listenerCount("pageload-transaction") > 0 && event.type === "transaction" && event.contexts?.trace?.origin === "auto.pageload.browser") {
      ipcMainHooks.emit("pageload-transaction", event, contents);
      return;
    }
    captureEventFromRenderer(options, event, dynamicSamplingContext, attachments, contents);
  } else {
    const profileChunk = profileChunkFromEnvelope(envelope);
    if (profileChunk) {
      const normalizedEnvelope = normalizeProfileChunkEnvelope(options, envelope, app.getAppPath());
      void getClient()?.getTransport()?.send(normalizedEnvelope);
    } else {
      const normalizedEnvelope = normalizeReplayEnvelope(options, envelope, app.getAppPath());
      void getClient()?.getTransport()?.send(normalizedEnvelope);
    }
  }
}
function hasKeys(obj) {
  return obj != void 0 && Object.keys(obj).length > 0;
}
function handleScope(options, jsonScope) {
  let sentScope;
  try {
    sentScope = JSON.parse(jsonScope);
  } catch {
    debug.warn("sentry-electron received an invalid scope message");
    return;
  }
  const scope = getCurrentScope();
  if (hasKeys(sentScope.user)) {
    scope.setUser(sentScope.user);
  }
  if (hasKeys(sentScope.tags)) {
    scope.setTags(sentScope.tags);
  }
  if (hasKeys(sentScope.extra)) {
    scope.setExtras(sentScope.extra);
  }
  for (const attachment of sentScope.attachments || []) {
    scope.addAttachment(attachment);
  }
  const breadcrumb = sentScope.breadcrumbs.pop();
  if (breadcrumb) {
    scope.addBreadcrumb(breadcrumb, options?.maxBreadcrumbs || 100);
  }
}
function handleAttributes(client, options, contents, maybeAttributes) {
  const process2 = contents ? options?.getRendererName?.(contents) || "renderer" : "renderer";
  const attributes2 = maybeAttributes || {};
  if (options.release) {
    attributes2["sentry.release"] = { value: options.release, type: "string" };
  }
  if (options.environment) {
    attributes2["sentry.environment"] = { value: options.environment, type: "string" };
  }
  attributes2["sentry.sdk.name"] = { value: "sentry.javascript.electron", type: "string" };
  attributes2["sentry.sdk.version"] = { value: SDK_VERSION, type: "string" };
  attributes2["electron.process"] = { value: process2, type: "string" };
  const osDeviceAttributes = getOsDeviceLogAttributes(client);
  if (osDeviceAttributes["os.name"]) {
    attributes2["os.name"] = { value: osDeviceAttributes["os.name"], type: "string" };
  }
  if (osDeviceAttributes["os.version"]) {
    attributes2["os.version"] = { value: osDeviceAttributes["os.version"], type: "string" };
  }
  if (osDeviceAttributes["device.brand"]) {
    attributes2["device.brand"] = { value: osDeviceAttributes["device.brand"], type: "string" };
  }
  if (osDeviceAttributes["device.model"]) {
    attributes2["device.model"] = { value: osDeviceAttributes["device.model"], type: "string" };
  }
  if (osDeviceAttributes["device.family"]) {
    attributes2["device.family"] = { value: osDeviceAttributes["device.family"], type: "string" };
  }
  return attributes2;
}
function handleLogFromRenderer(client, options, log2, contents) {
  log2.attributes = handleAttributes(client, options, contents, log2.attributes);
  _INTERNAL_captureSerializedLog(client, log2);
}
function handleMetricFromRenderer(client, options, metric, contents) {
  metric.attributes = handleAttributes(client, options, contents, metric.attributes);
  _INTERNAL_captureSerializedMetric(client, metric);
}
function configureProtocol(client, ipcUtil, options) {
  if (app.isReady()) {
    throw new Error("Sentry SDK should be initialized before the Electron app 'ready' event is fired");
  }
  const scheme = {
    scheme: ipcUtil.namespace,
    privileges: { bypassCSP: true, corsEnabled: true, supportFetchAPI: true, secure: true }
  };
  protocol.registerSchemesAsPrivileged([scheme]);
  protocol.registerSchemesAsPrivileged = new Proxy(protocol.registerSchemesAsPrivileged, {
    apply: (target, __, args) => {
      target([...args[0], scheme]);
    }
  });
  const rendererStatusChanged = createRendererEventLoopBlockStatusHandler(client);
  app.whenReady().then(() => {
    for (const sesh of options.getSessions()) {
      registerProtocol(sesh.protocol, ipcUtil.namespace, (request) => {
        const getWebContents = () => {
          const webContentsId = request.windowId ? WINDOW_ID_TO_WEB_CONTENTS?.get(request.windowId) : void 0;
          return webContentsId ? webContents.fromId(webContentsId) : void 0;
        };
        const data = request.body;
        if (ipcUtil.urlMatches(request.url, "start")) {
          newProtocolRenderer();
        } else if (ipcUtil.urlMatches(request.url, "scope") && data) {
          handleScope(options, data.toString());
        } else if (ipcUtil.urlMatches(request.url, "envelope") && data) {
          handleEnvelope(client, options, data, getWebContents());
        } else if (ipcUtil.urlMatches(request.url, "structured-log") && data) {
          let log2;
          try {
            log2 = JSON.parse(data.toString());
          } catch {
            debug.warn("sentry-electron received an invalid structured-log message");
            return;
          }
          handleLogFromRenderer(client, options, log2, getWebContents());
        } else if (ipcUtil.urlMatches(request.url, "metric") && data) {
          let metric;
          try {
            metric = JSON.parse(data.toString());
          } catch {
            debug.warn("sentry-electron received an invalid metric message");
            return;
          }
          handleMetricFromRenderer(client, options, metric, getWebContents());
        } else if (rendererStatusChanged && ipcUtil.urlMatches(request.url, "status") && data) {
          const contents = getWebContents();
          if (contents) {
            let status;
            try {
              status = JSON.parse(data.toString()).status;
            } catch {
              debug.warn("sentry-electron received an invalid status message");
              return;
            }
            rendererStatusChanged(status, contents);
          }
        }
      });
    }
  }).catch((error2) => debug.error(error2));
}
function configureClassic(client, ipcUtil, options) {
  ipcMain.on(ipcUtil.createKey("start"), ({ sender }) => {
    const id = sender.id;
    KNOWN_RENDERERS = KNOWN_RENDERERS || /* @__PURE__ */ new Set();
    if (KNOWN_RENDERERS.has(id)) {
      return;
    }
    if (!sender.isDestroyed()) {
      KNOWN_RENDERERS.add(id);
      sender.once("destroyed", () => {
        KNOWN_RENDERERS?.delete(id);
      });
    }
  });
  ipcMain.on(ipcUtil.createKey("scope"), (_, jsonScope) => handleScope(options, jsonScope));
  ipcMain.on(ipcUtil.createKey("envelope"), ({ sender }, env) => handleEnvelope(client, options, env, sender));
  ipcMain.on(ipcUtil.createKey("structured-log"), ({ sender }, log2) => handleLogFromRenderer(client, options, log2, sender));
  ipcMain.on(ipcUtil.createKey("metric"), ({ sender }, metric) => handleMetricFromRenderer(client, options, metric, sender));
  const rendererStatusChanged = createRendererEventLoopBlockStatusHandler(client);
  if (rendererStatusChanged) {
    ipcMain.on(ipcUtil.createKey("status"), ({ sender }, status) => rendererStatusChanged(status, sender));
  }
}
function configureIPC(client, options) {
  const ipcUtil = ipcChannelUtils(options.ipcNamespace);
  if ((options.ipcMode & IPCMode.Protocol) > 0) {
    configureProtocol(client, ipcUtil, options);
  }
  if ((options.ipcMode & IPCMode.Classic) > 0) {
    configureClassic(client, ipcUtil, options);
  }
}
const GZIP_THRESHOLD = 1024 * 32;
function streamFromBody(body) {
  return new Readable({
    read() {
      this.push(body);
      this.push(null);
    }
  });
}
function getRequestOptions(url) {
  const { hostname, pathname, port, protocol: protocol2, search } = new URL$1(url);
  return {
    method: "POST",
    hostname,
    path: `${pathname}${search}`,
    port: parseInt(port, 10),
    protocol: protocol2
  };
}
function makeElectronTransport(options) {
  return createTransport(options, createElectronNetRequestExecutor(options.url, options.headers || {}));
}
function createElectronNetRequestExecutor(url, baseHeaders) {
  baseHeaders["Content-Type"] = "application/x-sentry-envelope";
  return function makeRequest(request) {
    return app.whenReady().then(() => new Promise((resolve2, reject) => {
      let bodyStream = streamFromBody(request.body);
      const headers = { ...baseHeaders };
      if (request.body.length > GZIP_THRESHOLD) {
        headers["content-encoding"] = "gzip";
        bodyStream = bodyStream.pipe(createGzip());
      }
      const req = net.request(getRequestOptions(url));
      for (const [header, value] of Object.entries(headers)) {
        req.setHeader(header, value);
      }
      req.on("response", (res) => {
        res.on("error", reject);
        res.on("data", () => {
        });
        res.on("end", () => {
        });
        const retryAfterHeader = res.headers["retry-after"] ?? null;
        const rateLimitsHeader = res.headers["x-sentry-rate-limits"] ?? null;
        resolve2({
          statusCode: res.statusCode,
          headers: {
            "retry-after": Array.isArray(retryAfterHeader) ? retryAfterHeader[0] || null : retryAfterHeader,
            "x-sentry-rate-limits": Array.isArray(rateLimitsHeader) ? rateLimitsHeader[0] || null : rateLimitsHeader
          }
        });
      });
      req.on("error", reject);
      bodyStream.pipe(req);
    }));
  };
}
const MILLISECONDS_PER_DAY = 864e5;
function isOutdated(request, maxAgeDays) {
  const cutOff = Date.now() - MILLISECONDS_PER_DAY * maxAgeDays;
  return (request?.date?.getTime() || 0) < cutOff;
}
function getSentAtFromEnvelope(envelope) {
  const header = envelope[0];
  if (typeof header.sent_at === "string") {
    return new Date(header.sent_at);
  }
  return void 0;
}
function createOfflineStore(userOptions) {
  function log2(...args) {
    debug.log("[Offline Store]:", ...args);
  }
  const options = {
    maxAgeDays: userOptions.maxAgeDays || 30,
    maxQueueSize: userOptions.maxQueueSize || 30,
    queuePath: userOptions.queuePath || join$1(getSentryCachePath(), "queue")
  };
  const queue = new Store(options.queuePath, "queue-v2", []);
  function removeBody(id) {
    promises.unlink(join$1(options.queuePath, id)).catch(() => {
    });
  }
  function removeStaleRequests(queue2) {
    while (queue2[0] && isOutdated(queue2[0], options.maxAgeDays)) {
      const removed = queue2.shift();
      log2("Removing stale envelope", removed);
      removeBody(removed.id);
    }
  }
  async function insert(env, which, previousDate) {
    log2(`${which}ing envelope into offline storage`);
    const id = uuid4();
    try {
      const data = serializeEnvelope(env);
      await promises.mkdir(options.queuePath, { recursive: true });
      await promises.writeFile(join$1(options.queuePath, id), data);
    } catch (e) {
      log2("Failed to save", e);
    }
    await queue.update((queue2) => {
      if (which === "push") {
        removeStaleRequests(queue2);
        if (queue2.length >= options.maxQueueSize) {
          removeBody(id);
          return queue2;
        }
      }
      queue2[which]({ id, date: previousDate || getSentAtFromEnvelope(env) || /* @__PURE__ */ new Date() });
      return queue2;
    });
  }
  let lastShiftedDate;
  return {
    push: async (env) => {
      await insert(env, "push");
    },
    unshift: async (env) => {
      await insert(env, "unshift", lastShiftedDate);
    },
    shift: async () => {
      log2("Popping envelope from offline storage");
      let request;
      await queue.update((queue2) => {
        removeStaleRequests(queue2);
        request = queue2.shift();
        return queue2;
      });
      if (request) {
        try {
          const data = await promises.readFile(join$1(options.queuePath, request.id));
          removeBody(request.id);
          lastShiftedDate = request.date;
          return parseEnvelope(data);
        } catch (e) {
          log2("Failed to read", e);
        }
      }
      return void 0;
    }
  };
}
function makeElectronOfflineTransport(baseTransport = makeElectronTransport) {
  return (userOptions) => {
    return makeOfflineTransport(baseTransport)({
      flushAtStartup: true,
      createStore: createOfflineStore,
      ...userOptions
    });
  };
}
function log(message) {
  debug.log(`[Utility Process] ${message}`);
}
function configureUtilityProcessIPC() {
  if (!electron.utilityProcess?.fork) {
    return;
  }
  electron.utilityProcess.fork = new Proxy(electron.utilityProcess.fork, {
    apply: (target, thisArg, args) => {
      const child = target.apply(thisArg, args);
      function getProcessName() {
        const [, , options] = args;
        return options?.serviceName || `pid:${child.pid}`;
      }
      child.on("message", (msg) => {
        if (isMagicMessage(msg)) {
          log(`SDK started in utility process '${getProcessName()}'`);
          const { port1, port2 } = new electron.MessageChannelMain();
          port2.on("message", (msg2) => {
            if (msg2.data instanceof Uint8Array || typeof msg2.data === "string") {
              handleEnvelopeFromUtility(msg2.data);
            }
          });
          port2.start();
          child.postMessage(getMagicMessage(), [port1]);
        }
      });
      child.on = new Proxy(child.on, {
        apply: (target2, thisArg2, [event, listener]) => {
          if (event === "message") {
            return target2.apply(thisArg2, [
              "message",
              (msg) => {
                if (isMagicMessage(msg)) {
                  return;
                }
                return listener(msg);
              }
            ]);
          }
          return target2.apply(thisArg2, [event, listener]);
        }
      });
      return child;
    }
  });
}
function handleEnvelopeFromUtility(env) {
  const envelope = parseEnvelope(env);
  const eventAndAttachments = eventFromEnvelope(envelope);
  if (eventAndAttachments) {
    const [event, attachments] = eventAndAttachments;
    captureEventFromUtility(event, attachments);
  } else {
    void getClient()?.getTransport()?.send(envelope);
  }
}
function captureEventFromUtility(event, attachments) {
  delete event.environment;
  delete event.release;
  delete event.sdk?.name;
  delete event.sdk?.version;
  delete event.sdk?.packages;
  captureEvent(mergeEvents(event, { tags: { "event.process": "utility" } }), { attachments });
}
function getDefaultIntegrations(options) {
  const integrations = [
    // Electron integrations
    sentryMinidumpIntegration(),
    electronBreadcrumbsIntegration(),
    electronNetIntegration(),
    electronContextIntegration(),
    childProcessIntegration(),
    onUncaughtExceptionIntegration(),
    preloadInjectionIntegration(),
    additionalContextIntegration(),
    screenshotsIntegration(),
    gpuContextIntegration(),
    rendererEventLoopBlockIntegration(),
    // Main process sessions
    mainProcessSessionIntegration(),
    // Node integrations
    eventFiltersIntegration(),
    functionToStringIntegration(),
    linkedErrorsIntegration(),
    consoleIntegration(),
    nativeNodeFetchIntegration(),
    onUnhandledRejectionIntegration(),
    contextLinesIntegration(),
    localVariablesIntegration(),
    nodeContextIntegration({ cloudResource: false }),
    // We want paths to be normailzed after we've captured context
    normalizePathsIntegration()
  ];
  if (options.attachScreenshot) {
    integrations.push(screenshotsIntegration());
  }
  if (options.enableRendererProfiling) {
    integrations.push(rendererProfilingIntegration());
  }
  return integrations;
}
function init(userOptions) {
  const [major2 = 0] = process.versions.electron.split(".").map(Number);
  if (major2 < 23) {
    throw new Error("Sentry Electron SDK requires Electron 23 or higher");
  }
  const optionsWithDefaults = {
    _metadata: { sdk: getSdkInfo(!!userOptions.sendDefaultPii) },
    ipcMode: IPCMode.Both,
    ipcNamespace: "sentry-ipc",
    release: getDefaultReleaseName(),
    environment: getDefaultEnvironment(),
    defaultIntegrations: getDefaultIntegrations(userOptions),
    transport: makeElectronOfflineTransport(),
    transportOptions: {},
    getSessions: () => [session.defaultSession],
    ...userOptions,
    stackParser: stackParserFromStackParserOptions(userOptions.stackParser || defaultStackParser),
    includeServerName: false
  };
  const options = {
    ...optionsWithDefaults,
    integrations: getIntegrationsToSetup(optionsWithDefaults)
  };
  if (options.debug) {
    debug.enable();
  }
  removeRedundantIntegrations(options);
  configureUtilityProcessIPC();
  setOpenTelemetryContextAsyncContextStrategy();
  const scope = getCurrentScope();
  scope.update(options.initialScope);
  const client = new NodeClient(options);
  if (options.sendDefaultPii === true) {
    client.on("beforeSendSession", addAutoIpAddressToSession);
  }
  client.on("beforeCaptureLog", (log2) => {
    log2.attributes = {
      ...log2.attributes,
      "electron.process": "browser",
      ...getOsDeviceLogAttributes(client)
    };
  });
  scope.setClient(client);
  client.init();
  configureIPC(client, options);
  if (!options.skipOpenTelemetrySetup) {
    initOpenTelemetry(client);
  }
}
const INTEGRATION_OVERRIDES = [
  { userAdded: "ElectronMinidump", toRemove: "SentryMinidump" },
  { userAdded: "BrowserWindowSession", toRemove: "MainProcessSession" }
];
function removeRedundantIntegrations(options) {
  for (const { userAdded, toRemove } of INTEGRATION_OVERRIDES) {
    if (options.integrations.some((i) => i.name === userAdded)) {
      options.integrations = options.integrations.filter((i) => i.name !== toRemove);
    }
  }
}
function initMainSentry() {
  if (!process.env.SENTRY_DSN) return;
  init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.APP_ENV || process.env.NODE_ENV || "production",
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0
  });
}
const isDev = process.env.NODE_ENV === "development";
initMainSentry();
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1040,
    minHeight: 680,
    title: "Coral",
    backgroundColor: "#0C0B0F",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: join(__dirname, "../preload/index.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true
    }
  });
  Menu.setApplicationMenu(null);
  mainWindow.setMenuBarVisibility(false);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
  }
}
app.whenReady().then(() => {
  app.setName("Coral");
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
