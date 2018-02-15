const I18n = require("i18n-node");
var i18n = new I18n({
  locales: ['en'],
  directory: __dirname + '/../../locales/'
});

const hell = new (require(__dirname + "/../../common/models/helper.js"))({module_name: "translator"});

module.exports = function( options ) {
  hell.o("loaded","translator","info");

  return function translateErrorMessage(err, req, res, next) {
    let translation = i18n.t('en',err.message);
    err.message = translation;
    next(err);
  };

};
