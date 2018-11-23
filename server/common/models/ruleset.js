'use strict';

const hell = new (require(__dirname + "/helper.js"))({module_name: "ruleset"});

module.exports = function (ruleset) {

  /**
   * INITIALIZE RULESETS
   *
   * create defaults
   */
  ruleset.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      let default_rulesets = [
        {name: "cert", description: "Cert Ruleset"}
        //{name: "custom", description: "Custom Ruleset"}
      ];


      hell.o("check rulesets", "initialize", "info");
      let create_result;
      for (const rs of default_rulesets) {
        hell.o(["check ruleset", rs.name], "initialize", "info");
        create_result = await ruleset.findOrCreate({where: rs}, rs);
        if (!create_result) throw new Error("failed to create ruleset " + rs.name);
      }
      return true;
    } catch (err) {
      hell.o(err, "initialize", "error");
      return false;
    }

  };

  /**
   * TOGGLE FULL RULESET
   *
   * @param name
   * @param enabled
   * @param options
   * @param cb
   */
  ruleset.toggleAll = function (ruleset_name, enabled, options, cb) {
    hell.o(["start " + ruleset_name, "enabled " + enabled], "toggleAll", "info");

    (async function () {
      try {

        const rule = ruleset.app.models.rule;
        hell.o([ruleset_name, "find all rulesets"], "toggleAll", "info");
        let rs = await ruleset.find({where: {name: ruleset_name}});
        if (!rs) throw new Error(ruleset_name + " could not find ruleset");

        let update_input = {enabled: enabled, last_modified: new Date()};
        let update_result = await rule.updateAll({ruleset: ruleset_name}, update_input);
        if (!update_result) throw new Error(ruleset_name + " could not update ruleset ");

        hell.o([ruleset_name, update_result], "toggleAll", "info");
        hell.o([ruleset_name, "done"], "toggleAll", "info");

        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "toggleAll", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  ruleset.remoteMethod('toggleAll', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'enabled', type: 'boolean', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/toggleAll', verb: 'post', status: 201}
  });

  /**
   * TOGGLE TAG FOR ALL RULES IN A RULESET
   *
   * @param name
   * @param name
   * @param enabled
   * @param options
   * @param cb
   */
  ruleset.tagAll = function (ruleset_name, tag_id, enabled, options, cb) {

    hell.o([ruleset_name + " start", ruleset_name + " " + " tag: " + tag_id + " enabled: " + enabled], "tagAll", "info");

    (async function () {
      try {

        const rule = ruleset.app.models.rule;
        const tag = ruleset.app.models.tag;

        hell.o([ruleset_name, "find ruleset"], "tagAll", "info");
        let rs = await ruleset.findOne({where: {name: ruleset_name}, include: ["tags"]});
        if (!rs) throw new Error(ruleset_name + " could not find ruleset");

        hell.o([ruleset_name, "find tag"], "tagAll", "info");
        let tag_exists = await tag.findById(tag_id);
        if (!tag_exists) throw new Error(ruleset_name + " could not find tag: " + tag_id);

        if (enabled) {
          hell.o([ruleset_name, "add tag to ruleset"], "tagAll", "info");
          let ruleset_tag = await rs.tags.add(tag_exists);
          let rules = await rule.find({where: {ruleset: ruleset_name}});

          for (let i = 0, l = rules.length; i < l; i++) {
            rules[i].tags.add(tag_exists);
          }
        }

        if (!enabled) {
          hell.o([ruleset_name, "remove tag from ruleset"], "tagAll", "info");
          let ruleset_tag = await rs.tags.remove(tag_exists);
          let rules = await rule.find({where: {ruleset: ruleset_name}});

          for (let i = 0, l = rules.length; i < l; i++) {
            rules[i].tags.remove(tag_exists);
          }
        }

        hell.o([ruleset_name, "done"], "tagAll", "info");

        cb(null, {message: "ok"});

      } catch (err) {
        hell.o(err, "tagAll", "error");
        cb({name: "Error", status: 400, message: err.message});
      }

    })(); // async

  };

  ruleset.remoteMethod('tagAll', {
    accepts: [
      {arg: 'name', type: 'string', required: true},
      {arg: 'tag', type: 'string', required: true},
      {arg: 'enabled', type: 'boolean', required: true},
      {arg: "options", type: "object", http: "optionsFromRequest"}
    ],
    returns: {type: 'object', root: true},
    http: {path: '/tagAll', verb: 'post', status: 201}
  });

};
