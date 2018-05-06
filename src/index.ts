
import * as colors from "colors";
import * as minimatch from "minimatch";
import * as cluster from "cluster";
import * as path from "path";
import { ConsolePro } from "console-pro";

const _CONSOLE_PRO_TRACE = process.env.CONSOLE_PRO_TRACE || process.env.TRACE || "";
export const console = new ConsolePro({
    async_log: false,
    auto_reduce_indent: true,
    date_format: "hh:mm:ss",
    silence: !_CONSOLE_PRO_TRACE
});

const AsyncFuncton = (async () => { }).constructor;
const REGISTERED_DEBUG_SYMBOL = Symbol("Debug registed");
const process_base_name = require.main ? path.parse(require.main.filename).base : ""
const process_name = (process['name'] || process.env.name)
    || cluster.isWorker
    ? `CLUSTER-${process_base_name}-${process.pid}`
    : "";

const minmatch_options = { nocase: true };

export const CONSOLE_PRO_MODES = _CONSOLE_PRO_TRACE.split(",").map(item => item.trim());

// console.flag('CONSOLE_PRO_MODE', CONSOLE_PRO_MODES)
function matchDebugName(debug_name: string) {
    if (!_CONSOLE_PRO_TRACE) {
        return false;
    }
    return CONSOLE_PRO_MODES.some(CONSOLE_PRO_MODE => {
        if (debug_name === CONSOLE_PRO_MODE || minimatch(debug_name, CONSOLE_PRO_MODE, minmatch_options)) {
            return true;
        }
        if (process_name) {
            return minimatch(process_name + ":" + debug_name, CONSOLE_PRO_MODE, minmatch_options);
        } else if (cluster.isMaster) {
            return minimatch("master:" + debug_name, CONSOLE_PRO_MODE, minmatch_options);
        }
    });
}

export function registerClassDebug(Constructor: Function, debug_name: string, _undebug_names?: string[]) {
    // 这里不能用isArray，因为需要Array原型链上的迭代器：Symbol.iterator
    if (!(_undebug_names instanceof Array)
        && typeof Constructor['getUnDebugMethodNames'] === 'function') {
        _undebug_names = Constructor['getUnDebugMethodNames']();
    }
    registerInstanceDebug(Constructor.prototype, debug_name, _undebug_names);
    return Constructor
}
export function registerInstanceDebug(instance: any, debug_name: string, _undebug_names?: string[]) {
    const log_dname = process_name ? (console.flagHead(process_name) + ' ' + debug_name) : debug_name;
    if (matchDebugName(debug_name) && !instance[REGISTERED_DEBUG_SYMBOL]) {
        instance[REGISTERED_DEBUG_SYMBOL] = debug_name;
        console.log(colors.green.bgBlack('[TRACE  ON]'), log_dname);
        if (!(_undebug_names instanceof Array)
            && typeof instance.getUnDebugMethodNames === 'function') {
            _undebug_names = instance.getUnDebugMethodNames();
        }
        const undebug_names = new Set(_undebug_names instanceof Array ? _undebug_names : []);
        Object.getOwnPropertyNames(instance).forEach((method_name) => {
            if (method_name === 'constructor'
                || method_name === 'getUnDebugMethodNames'
                || undebug_names.has(method_name)) {
                return;
            }
            const old_handle = instance[method_name];
            if (typeof old_handle !== 'function') {
                return;
            }
            const handle_flag = console.flagHead(method_name, false);
            if (old_handle.constructor === AsyncFuncton) {
                var fun = async function (...args) {
                    const t = console.time(handle_flag, log_dname);
                    try {
                        return await old_handle.apply(this, args);
                    } finally {
                        console.timeEnd(t, handle_flag);
                    }
                }
            } else {
                fun = function (...args) {
                    const t = console.time(handle_flag, log_dname);
                    const last_arg = args[args.length - 1];
                    var may_be_callback = typeof last_arg === 'function';
                    if (may_be_callback) {
                        args[args.length - 1] = (...args) => {
                            if (!is_promise) {
                                console.timeEnd(t, handle_flag);
                            }
                            return last_arg(...args);
                        }
                    }
                    const res = old_handle.call(this, ...args);
                    var is_promise = res instanceof Promise;
                    const run_time_end = () => {
                        console.timeEnd(t, handle_flag);

                    }
                    if (is_promise) {
                        return res
                            // finally
                            .then(value => {
                                return Promise.resolve(run_time_end())
                                    .then(() => value)
                            })
                            .catch(reason => {
                                return Promise.resolve(run_time_end())
                                    .then(() => Promise.reject(reason))
                            })
                    } else if (!may_be_callback) {
                        run_time_end()
                        return res;
                    }
                }
            }
            Object.defineProperty(fun, 'name', { value: old_handle.name });
            instance[method_name] = fun;
        });
    } else {
        console.log(colors.red.bgBlack('[TRACE OFF]'), log_dname);
    }
    return instance
}