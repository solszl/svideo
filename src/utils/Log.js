import IllegalStateException from "../error/IllegalStateException";

/**
 * 日志
 *
 * @export
 * @class Log
 * @author zhenliang.sun
 */
export default class Log {
    constructor() {
        if (this._OBJ) {
            throw new IllegalStateException("");
        }

        this._OBJ = this;
        this.logLevels = {
            all: "debug|log|warn|error",
            off: "",
            debug: "debug|log|warn|error",
            info: "info|warn|error",
            warn: "warn|error",
            error: "error",
            DEFAULT: "level"
        };
    }

    static get OBJ() {
        if (!this._OBJ) {
            this._OBJ = new Log();
        }

        return this._OBJ;
    }


    /**
     *
     * 设置日志错误输出等级，开发环境通常设置为 'all', 生产环境通常设置为 'error' 或 'off'
     * @memberof Log
     */
    set level(val) {
        if (typeof val !== 'string') {
            return this.level;
        }

        if (this.logLevels.hasOwnProperty(val)) {
            throw new IllegalStateException(`${val} is not a valid log level, should be in [all, off, debug, info, warn, error]`);
        }

        this._level = val;
    }

    get level() {
        return this._level;
    }

    info(...args) {
        this[private_log]("info", args);
    }

    debug(...args) {
        this[private_log]("debug", args);
    }

    warn(...args) {
        this[private_log]("warn", args);
    }

    error(...args) {
        this[private_log]("error", args);
    }

    [private_log](type, args) {
        if (!window.console) {
            return;
        }

        let fn = window.console[type];
        if (!fn && type === 'debug') {
            fn = window.console.info || window.console.log;
        }

        if (!fn || !this.level) {
            return;
        }

        fn[Array.isArray(args) ? 'apply' : 'call'](window.console, args);
    }
}

const private_log = Symbol("private_log");