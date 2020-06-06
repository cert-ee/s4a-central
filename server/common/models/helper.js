/**
 * HELPER
 *
 * console.log wrap
 *
 * @param params
 */
const chalk = require('chalk');

let helper = function (params) {
  let self = this;
  self.print_level = 1; // > default print out to console [error]
  self.method = 4; // default method console[log]
  self.module_name = params && params.module_name || "logger_undefined_module";
  self.fn_name = params && params.fn_name || "logger_undefined_function_name";
  self.method_map = [false, "error", "warn", "debug", "log", "info", "trace"];

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

};

module.exports = helper;
