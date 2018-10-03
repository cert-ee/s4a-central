'use strict';
const util = require('util');
const hell = new (require(__dirname + "/helper.js"))({module_name: "feedback"});

module.exports = function (feedback) {

  /**
   * INITIALIZE FEEDBACK
   *
   * create defaults
   */
  feedback.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      //insert demo feedback
      hell.o("start", "check feedbacks", "info");
      let feedbacks = false;
      try {
        feedbacks = await feedback.find();
      } catch (no_feedbacks) {
        hell.o("no feedbacks found", "check feedbacks", "info");
      }

      if (!feedbacks || feedbacks === undefined || feedbacks.length == 0) {
        hell.o("start", "create demo feedbacks", "info");
        let input_data = {
          case_number: 1,
          message: "Demo feedback message",
          comment: "Demo feedback comment",
          components: [],
          network_interfaces: []
        };

        await feedback.create(input_data);

        hell.o("done", "check feedbacks", "info");
      }


      hell.o("done", "initialize", "info");

      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };

};
