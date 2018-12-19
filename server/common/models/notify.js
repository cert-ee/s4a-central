'use strict';
// const elasticsearch = require('elasticsearch');
const nodemailer = require('nodemailer');
const hell = new (require(__dirname + "/helper.js"))({module_name: "notify"});
// const {gzip} = require('node-gzip');

module.exports = function (notify) {

  /**
   * INITIALIZE NOTIFY
   *
   */
  notify.initialize = async function () {
    hell.o("start", "initialize", "info");

    try {
      hell.o("check/init notifier", "init", "info");

      await notify.initializeMailer();

      hell.o("done", "init", "info");
      return true;
    } catch (err) {
      hell.o(err, "initialize", "error");
      return false;
    }

  };

  /**
   * INIT nodemailer when config changes
   * @param cb
   * @returns {*}
   */
  notify.initializeMailer = async function (cb) {
    hell.o("init nodemailer", "initializeMailer", "info");

    try {

      let settings = await notify.app.models.settings.findOne();

      let smtp_config = {
        host: settings['smtp_server_host'],
        port: settings['smtp_server_port'],
        secure: settings['smtp_server_tls'],
        ignoreTLS: settings['smtp_server_force_notls'],
      };

      if (settings['smtp_server_requires_auth']) {
        smtp_config.authMethod = settings['smtp_server_auth_method'];
        smtp_config.auth = {
          user: settings['smtp_server_username'],
          pass: settings['smtp_server_password']
        };
      }

      // notify.smtp_config = smtp_config;
      notify.nm_client = new nodemailer.createTransport(smtp_config);

      hell.o("done", "initializeMailer", "info");
      if (cb) return cb(null, {message: "ok"});
      return true;
    } catch (err) {
      hell.o(err, "initializeMailer", "error");
      notify.notify_routine_active = false;
      if (cb) return cb({name: "Error", status: 400, message: err.message});
      return false;
    }

  };

  /**
   * GET NOTIFICATION TEMPLATE
   *
   * @param input
   * @returns {Promise<*>}
   */

  notify.notificationTemplate = async function (input) {
    hell.o("start", "notificationTemplate", "info");
    try {
      // console.log(input);

      //TODO TEMPALTE

      let output = {
        subject: "[SUBJECT TAG]",
        body: "Dear _EMAIL_RECEIVER_NAME_ \n \
        \n \
        ... \n \
        \n "
      };

      output.body = output.body.replace("_EMAIL_RECEIVER_NAME_", input.email_receiver_name);

      hell.o("done", "notificationTemplate", "info");
      return output;
    } catch (err) {
      hell.o(err, "notificationTemplate", "error");
      return false;
    }
  };


  /**
   * SEND NOTIFICATION
   *
   * input:{
   *     email_to:
   *     receiver_name:
   * }
   *
   * @param input
   * @returns {Promise<boolean>}
   */

  notify.sendNotification = async function (input) {
    hell.o("start", "sendNotification", "info");
    try {
      // console.log("SEND NOTIFICATION");
      // console.log(input);

      let settings = await notify.app.models.settings.findOne();

      // LOAD TEMPLATE FROM notify
      let template = await notify.notificationTemplate(input);
      // console.log("EMAIL TEMPLATE:", template);

      // let attachment = await gzip(JSON.stringify(input.email_attachment_data));

      let message = {
        from: settings['smtp_server_from'],
        to: input.email_to,
        subject: template.subject,
        text: template.body,
        // attachments: [
        //   {
        //     filename: 'report.json.gz',
        //     content: attachment,
        //     contentType: 'application/json',
        //     encoding: 'gzip'
        //   }]
      };
      hell.o(["subject", template.subject], "sendNotification", "info");
      let send_notfications = await notify.nm_client.sendMail(message);

      hell.o("done", "sendNotification", "info");
    } catch (err) {
      hell.o(err, "sendNotification", "error");
      throw new Error(err);
      return false;
    }
  };

};
