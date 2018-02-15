'use strict';

const util = require('util');
const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "init"});

module.exports = function (app) {
  hell.o("start", "apply_updates", "info");
  (async () => {
    try {

      let versions_load = util.promisify(app.models.system_info.version);
      let versions = await versions_load();
      let server_numbers = parseInt(versions.server.replace(/[^0-9]/g, '') );
      hell.o(["this product server version: ", server_numbers ], "apply_updates", "info");

      hell.o("find", "apply_updates", "info");
      let system_info_result = await app.models.system_info.findOne({id: "systeminfoid"});
      if( ! system_info_result ){
        system_info_result = await app.models.system_info.create({id: "systeminfoid", update_version: server_numbers });
        system_info_result = await app.models.system_info.findOne({id: "systeminfoid"});
      }

      hell.o([ system_info_result.update_version , server_numbers ], "apply_updates", "info");

      if( system_info_result.update_version === undefined || system_info_result.update_version < server_numbers ){
        hell.o( "start apply updates", "apply_updates", "info");
        //hell.o( "currently no updates", "apply_updates", "info");

         if( server_numbers < 128 ) {
           hell.o("need to destroy old feedbacks", "apply_updates", "info");
           await app.models.feedback.destroyAll();
         }

        hell.o( "save update / patch level", "apply_updates", "info");
        await app.models.system_info.update({id: "systeminfoid", update_version: server_numbers });
      } else {
        hell.o( "no updates to apply", "apply_updates", "info");
      }

    }
    catch (err) {
      hell.o(err, "load", "error");
    }
  })();
};
