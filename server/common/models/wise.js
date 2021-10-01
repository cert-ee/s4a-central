'use strict';
const fs = require("fs");
// const util = require('util');
// const checksum = require('checksum');
const hell = new (require(__dirname + "/helper.js"))({module_name: "wise"});

module.exports = function (wise) {

  /**
   * INITIALIZE wise
   *
   * create defaults
   */
  wise.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {

      hell.o("done", "initialize", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "err");
      return false;
    }

  };


  /**
   * CHECK DETECTOR CS AGAINST CENTRAL
   *
   * return new wise if not matched
   */
  wise.checkForDetector = async function (detector_id, input) {
    hell.o("start", "checkForDetector", "info");
    try {
      // console.log(input);
      let output = [];

      let detector = await wise.app.models.detector.findById(detector_id, {
        include: {
          relation: "tags",
        }
      });
      let detector_tags = detector.tags().map(a => a.name);
      if (detector_tags.length > 0) {
        hell.o(["found tags for detector", detector_tags.join(', ')], "checkForDetector", "info");
      }

      let feeds = await wise.app.models.feed.find({
        where: {
          enabled: true,
          component_name: 'moloch',
          or: [
            {component_type: 'wise_domain'},
            {component_type: 'wise_ip'},
            {component_type: 'wise_ja3'},
            {component_type: 'wise_url'}
          ]
        },
        include: {
          relation: "tags",
        }
      });

      for (let feed of feeds) {

        // checks if detector has correct tags to receive the feed
        if (feed.tags().length > 0) {
          if (detector_tags == 0) {
            console.log("detector has no tags, IGNORE");
            continue;
          }

          let detector_has_the_tag = feed.tags().map(a => a.name).filter(a => detector_tags.indexOf(a) !== -1);
          if (detector_has_the_tag.length == 0) {
            console.log("NO MATCHES?");
            console.log(detector_has_the_tag);
            continue;
          }
        }

        // console.log( input );
        let detector_feed = input !== undefined && input.length > 0 ? input.filter(value => value.name === feed.name) : [];

        console.log("DETECTOR HAS THE FEED?:");
        console.log(detector_feed);

        let file_contents = "";
        let file_path = feed.location_folder + "" + feed.filename;
        // console.log(file_path);
        //detector_feed.length === 1 ||
        if (detector_feed.length === 0 || detector_feed.length > 0 && detector_feed[0].checksum !== feed.checksum) {
          console.log("DETECTOR HAS THE FEED AND NEED TO UPDATE");
          // console.log(detector_feed[0].checksum, feed.checksum);

          file_contents = fs.readFileSync(file_path, 'utf8');
        }

        let wise_feed = {
          name: feed.name,
          friendly_name: feed.friendly_name,
          enabled: feed.enabled,
          filename: feed.filename,
          type: feed.component_type,
          tag_name: feed.component_tag_name,
          checksum: feed.checksum,
          contents: file_contents
        };

        output.push(wise_feed);
      }
      // console.log(output);

      hell.o("done", "checkForDetector", "info");
      return output;

    } catch (err) {
      hell.o(err, "checkForDetector", "err");
      return false;
    }

  };

};
