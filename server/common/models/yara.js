'use strict';
const fs = require("fs");
// const util = require('util');
// const checksum = require('checksum');
const hell = new (require(__dirname + "/helper.js"))({module_name: "yara"});

module.exports = function (yara) {

  /**
   * INITIALIZE YARA
   *
   * create defaults
   */
  yara.initialize = async function () {
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
   * return new yara if not matched
   */
  yara.checkForDetector = async function (detector_id, input) {
    hell.o("start", "checkForDetector", "info");
    try {
      // console.log(input);
      let output = [];

      let detector = await yara.app.models.detector.findById(detector_id, {
        include: {
          relation: "tags",
        }
      });
      let detector_tags = detector.tags().map(a => a.name);
      if (detector_tags.length > 0) {
        hell.o(["found tags for detector", detector_tags.join(', ')], "checkForDetector", "info");
      }

      let feeds = await yara.app.models.feed.find({
        where: {
          enabled: true,
          component_name: 'moloch',
          component_type: 'yara',
        },
        include: {
          relation: "tags",
        }
      });

      let yara_feed, file_path, file_contents, detector_feed = [], feed_tags, detector_has_the_tag;
      for (let fd of feeds) {
        // checks if detector has correct tags to receive the feed
        if (fd.tags().length > 0) {
          if (detector_tags == 0) {
            console.log("detector has no tags, IGNORE");
            continue;
          }
          detector_has_the_tag = [];
          feed_tags = fd.tags().map(a => a.name);
          detector_has_the_tag = feed_tags.filter(a => detector_tags.indexOf(a) !== -1);
          if (detector_has_the_tag.length == 0) {
            console.log("NO MATCHES?");
            console.log(detector_has_the_tag);
            continue;
          }
        }

        // console.log( input );
        if (input !== undefined && input.length > 0) {
          detector_feed = input.filter(function (value, index, arr) {
            return value.name === fd.name;
          });
        }

        console.log("DETECTOR HAS THE FEED?:");
        console.log(detector_feed);


        file_contents = "";
        file_path = fd.location_folder + "" + fd.filename;
        // console.log(file_path);
        if (detector_feed.length === 0 || detector_feed.length > 0 && detector_feed[0].checksum !== fd.checksum) {
          console.log("DETECTOR HAS THE FEED AND NEED TO UPDATE");
          // console.log(detector_feed[0].checksum, fd.checksum);
          // console.log(detector_feed[0].checksum, fd.checksum);

          file_contents = await fs.readFileSync(file_path, 'utf8');
        }

        yara_feed = {
          name: fd.name,
          friendly_name: fd.friendly_name,
          enabled: fd.enabled,
          filename: fd.filename,
          type: fd.component_type,
          tag_name: fd.component_tag_name,
          checksum: fd.checksum,
          contents: file_contents
        };

        output.push(yara_feed);
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
