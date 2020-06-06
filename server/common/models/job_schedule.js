'use strict';
const hell = new (require(__dirname + "/helper.js"))({module_name: "job_schedule"});
module.exports = function (job_schedule) {

  /**
   * ADD A JOB / TASK FOR A DETECTOR
   * @param input
   */
  job_schedule.jobAdd = async function (input) {
    hell.o([input.targetId, "start"], "jobAdd", "info");

    // return new Promise((success, reject) => {

    // (async () => {
    try {

      let job = {
        target: input.target,
        targetId: input.targetId,
        detectorId: input.targetId,
        name: input.name,
        description: input.description
      };

      if (input.data !== undefined) {
        job.data = input.data;
      }

      //check for duplicates
      hell.o([input.targetId, "find duplicate"], "jobAdd", "info");
      let job_find = await job_schedule.find({
        where: {
          detectorId: input.targetId,
          name: input.name,
          completed: false
        }
      });

      if (job_find.length > 0 && input.ignore_duplicate !== true) {
        hell.o([input.targetId, "found duplicate"], "jobAdd", "warn");
        // if( input.ignore_duplicate ){
        //   hell.o([input.targetId, "ignore duplicate"], "jobAdd", "warn");
        // return success( { message: "ok"} );
        // }
        throw new Error(input.detectorId + " found");
      }

      hell.o([input.targetId, "create job"], "jobAdd", "warn");
      let job_create = await job_schedule.create(job);
      if (!job_create) throw new Error(input.detectorId + " jobAdd failed");

      hell.o([input.targetId, "done"], "jobAdd", "warn");

      // success(job_create);
      return true;
    } catch (err) {
      hell.o(err, "jobAdd", "error");
      // reject(err);
      return false;
    }

    // })(); // async

    // }); // promise

  };

};
