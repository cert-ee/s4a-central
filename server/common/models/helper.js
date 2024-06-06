/**
 * HELPER
 *
 * console.log wrap
 *
 * @param params
 */
const chalk = require('chalk');
const {lockSync, unlockSync} = require('proper-lockfile');

let helper = function (params) {
  let self = this;
  self.print_level = 1; // > default print out to console [error]
  self.method = 4; // default method console[log]
  self.module_name = params && params.module_name || "logger_undefined_module";
  self.fn_name = params && params.fn_name || "logger_undefined_function_name";
  self.method_map = [false, "error", "warn", "debug", "log", "info", "trace"];
  self.lock_dir = '/tmp';
  self.file_prefix = '.s4a-lock-'
  self.lock_base = `${self.lock_dir}/${self.file_prefix}`;

  if (process.env.DEBUG_LEVEL !== undefined) {
    //console.log( "ENV DEBUG_LEVEL SET", process.env.DEBUG_LEVEL );
    self.print_level = process.env.DEBUG_LEVEL;
  }

  if (params !== undefined && params.level !== undefined) {
    self.print_level = params.level;
  }

  self.o = function (input, settings, override_method, override_level) {

    let print_level = self.print_level;
    let method = self.method;
    let module_name = self.module_name;
    let fn_name = self.fn_name;

    if (typeof settings === 'object') {
      if (settings.method) {
        method = settings.method;
        delete settings.method;
      }
      if (settings.module_name) {
        module_name = settings.module_name;
        delete settings.module_name;
      }
      if (settings.fn_name) {
        fn_name = settings.fn_name;
        delete settings.fn_name;
      }
    } else {
      fn_name = settings;
    }

    if (override_method !== undefined) {
      method = self.method_map.indexOf( override_method );
    }

    if (override_level !== undefined) {
      print_level = override_level;
    }

    if (override_level !== undefined || print_level < method) return; //silence

    let cl = self.method_map[method], cl_chalked = "[" + cl + "]";
    let called = "[" + module_name + "." + fn_name + "]";

    if (input instanceof Error || method == "error") {
      if( print_level == 6 ){
        console.trace(chalk.red(input));
      }

      input = input.message;
      cl = "error";
    }

    if (cl == "warn") {
      cl_chalked = chalk.yellow("[" + cl + "]");
      called = chalk.yellow(called);
    }

    if (cl == "error") {
      cl_chalked = chalk.red("[" + cl + "]");
      called = chalk.red(called);
    }

    if (!Array.isArray(input)) {
      console[cl](cl_chalked, called, input);
      return;
    }

    if (input.length == 2) {
      console[cl](cl_chalked, called, input[0], input[1]);
      return;
    }

    for (let i = 0, l = input.length; i < l; i++) {
      console[cl](cl_chalked, called, input[i]);
    }

  };


  self.to_lock_path = function(path) {
    return self.lock_base + path.replace(/_/g, '__').replace(/\//g, '_s');
  }

  // try to acquire a file lock for a given fd;
  self.lock = function(path) {
    self.o(`creating lock on path ${path}, type ${type}`, "helper", "info");
    let lock_path = self.to_lock_path(path);
    lockSync(lock_path);
  };

  // remove a lock acquired by the lock function for a given fd
  self.unlock = function(fd) {
    self.o(`removing lock on path ${path}`, "helper", "info");
    let lock_path = self.to_lock_path(path);
    unlockSync(lock_path);
  };

  // call the callback only if a lock is successfully acquired + close it
  self.lockedCall = async function(path, cb) {
    self.lock(path);

    let ret, exception;
    try {
      ret = await cb();
    } catch(e) {
      exception = e;
    }
    self.unlock(path);

    if (exception !== undefined)
      throw exception;

    return ret;
  };

  self.sleep = function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
};

module.exports = helper;
