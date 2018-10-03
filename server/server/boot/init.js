'use strict';
const util = require('util');
const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "init"});

module.exports = function (app) {
  hell.o("start", "load", "info");
  (async () => {
    try {

      await app.models.boot.initialize();
      await app.models.settings.initialize();
      await app.models.ruleset.initialize();
      await app.models.yara.initialize();
      await app.models.wise.initialize();
      await app.models.feed.initialize();
      await app.models.feedback.initialize();
      await app.models.tasker.initialize();

    }
    catch (err) {
      hell.o(err, "load", "error");
    }
  })();
};
