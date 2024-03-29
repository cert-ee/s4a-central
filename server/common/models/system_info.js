'use strict';
const shelljs = require('shelljs');
const hell = new (require(__dirname + '/helper.js'))({ module_name: 'system_info' });
const package_server = require('../../package.json');
//const package_client = require('../../../client/package.json');
//const package_main = require('../../../package.json');

module.exports = function (system_info) {
  /**
   * LIST PROJECT VERSIONS
   *
   * result is taken from package.json files
   *
   * @param options
   * @param cb
   */
  system_info.version = function (cb) {
    hell.o('start', 'version', 'info');

    (async function () {
      try {
        let output = {
          server: package_server.version,
          client: package_server.version,
          main: package_server.version,
          //          client: package_client.version,
          //          main: package_main.version
        };
        hell.o(output, 'version', 'info');
        hell.o('done', 'version', 'info');
        cb(null, output);
      } catch (err) {
        hell.o(err, 'version', 'error');
        cb({ name: 'Error', status: 400, err });
      }
    })(); //async
  };

  system_info.remoteMethod('version', {
    accepts: [
      //{arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: { type: 'object', root: true },
    http: { path: '/version', verb: 'get', status: 200 },
  });

  /**
   * LIST SYSTEM INFO
   *
   * result is generated by a shell script
   *
   * @param options
   * @param cb
   */
  system_info.list = function (options, cb) {
    hell.o('start', 'list', 'info');

    (async function () {
      try {
        let info = await shelljs.exec('./scripts/system_dump.sh');

        let system_info = JSON.parse(info.stdout);

        hell.o('done', 'list', 'info');
        cb(null, system_info);
      } catch (err) {
        hell.o(err, 'list', 'error');
        cb({ name: 'Error', status: 400, err });
      }
    })(); // async
  };

  system_info.remoteMethod('list', {
    accepts: [{ arg: 'options', type: 'object', http: 'optionsFromRequest' }],
    returns: { type: 'object', root: true },
    http: { path: '/list', verb: 'get', status: 200 },
  });
};
