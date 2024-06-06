'use strict';

const https = require('https');
const tar = require('tar');
const fs = require('fs');
const walk = require('walkdir');
const stream = require('stream');

const hell = new (require(__dirname + '/helper.js'))({ module_name: 'contentman' });

module.exports = function (contentman) {
  /**
   * INITIALIZE CONTENTMAN
   *
   * check paths?
   */
  contentman.initialize = async function () {
    hell.o('start', 'initialize', 'info');
    try {
      hell.o('done', 'initialize', 'info');
      return true;
    } catch (err) {
      hell.o(err, 'initialize', 'error');
      return false;
    }
  };

  /**
   * DOWNLOAD AND SAVE CONTENT
   *
   * src
   * dst
   *
   * @returns {Promise}
   */
  contentman.downloadContent = function (src, dst) {
    hell.o('start', 'downloadContent', 'info');
    hell.o([src, dst], 'downloadContent', 'info');
    let file = fs.createWriteStream(dst);

    return new Promise((resolve, reject) => {
      https
        .get(src, response => {
          response.pipe(file);
          file.on('finish', function () {
            hell.o('done', 'downloadContent', 'info');
            file.close();
            resolve(true);
          });
        })
        .on('error', err => {
          hell.o(err, 'downloadContent', 'error');
          //fs.unlink(dst);
          reject(err);
        }); // https.get
    }); // promise
  };

  /**
   * extract suricata rules from archive, collect into a single file, replace dst atomically
   *
   * src
   * dst
   *
   * @returns {Promise}
   */
  contentman.extractContent = async function (src, dst) {
    hell.o('start', 'extractContent', 'info');
    hell.o(['tar file', path], 'extractContent', 'info');
    hell.o(['extract', dst], 'extractContent', 'info');

    try {
      let tmpfile = `${dst}.tmp`; // should be on the same filesystem as dst for atomic replacement via rename(2)
      await new Promise((resolve, reject) =>
        stream.pipeline(
          fs.createReadStream(src),
          new tar.Parse({ strict: true, filter: (path, entry) => entry.type === 'File' && path.endsWith('.rules') }),
          new extractTransform(),
          fs.createWriteStream(tmpfile),
        )
          .on('error', reject)
          .on('end', resolve)
      );
      await fs.promises.rename(tmpfile, dst);
      hell.o('done', 'extractContent', 'info');
      return true;
    } catch (err) {
      hell.o(err, 'extractContent', err);
      throw err;
    };
  };

  /**
   * REMOVE FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  contentman.removeFilesR = async function (folder, ignore_file) {
    hell.o('start', 'removeFilesR', 'info');

    try {
      let files = await contentman.readDirR(folder);

      if (files.length == 0) {
        //        throw new Error('no files to remove ' + folder);
        return true;
      }

      hell.o([files.length, ' files found to remove'], 'removeFilesR', 'info');
      let success = await Promise.all(files.map(async file => {
        let exists = await fs.promises.exists(file);
        if (!exists) {
          hell.o(['path does not exist:', file], 'removeFilesR', 'error');
          return false;
        };

        let stats = await fs.promises.stat(file);

        if (process.env.NODE_ENV == 'dev' && ignore_file !== undefined && file == ignore_file) {
          hell.o(
            ['DEV: ignore removing rules tar, so we would not abuse external sources', file],
            'removeFilesR',
            'info'
          );
          return false;
        };

        if (stats.isDirectory()) {
          hell.o(['ignore directory:', file], 'removeFilesR', 'info');
          return false;
        };

        return true;
      }));
      files = files.filter((_v, i) => success[i]);
      await Promise.all(files.map(file => fs.promises.unlink(file)));

      hell.o([files.length, ' files removed'], 'removeFilesR', 'info');
      hell.o('done', 'removeFilesR', 'info');
      return true;
    } catch (err) {
      throw new Error(err);
    }
  };

  /**
   * GET FILES RECURSIVELY
   *
   * @param dir
   * @returns {Promise}
   */
  contentman.readDirR = async function (folder) {
    hell.o('start', 'readDirR', 'info');

    let list = await walk.sync(folder);
    //console.log(list);

    hell.o('done', 'readDirR', 'info');
    return list;
  };

  /**
   * CHECK PATH
   * create folders if missing
   *
   * @param path_to_check
   * @param create_file ( default true )
   */
  contentman.pathCheck = async function (path_to_check, create_file) {
    hell.o('start', 'pathCheck', 'info');
    try {
      if (create_file === undefined) create_file = true;

      let file_exists = fs.existsSync(path_to_check);
      if (file_exists) {
        hell.o('done', 'pathCheck', 'info');
        return true;
      }
      if (!file_exists && !create_file) {
        throw new Error('not_found');
      }

      var splitted = path_to_check.split('/');
      splitted = splitted.filter(Boolean);

      var folders = splitted.slice(0, -1);

      let current_folder = '';
      for (const fd in folders) {
        current_folder = current_folder + '/' + folders[fd];
        let check_folder = fs.existsSync(current_folder);

        hell.o(['check folder', current_folder], 'pathCheck', 'info');
        if (!check_folder) {
          await fs.promises.mkdir(current_folder);
          hell.o(['make folder', current_folder], 'pathCheck', 'info');
        }
      }

      if (!file_exists) {
        hell.o(['make empty file', path_to_check], 'pathCheck', 'info');
        await fs.promises.writeFile(path_to_check, '');
      }
      hell.o('done', 'pathCheck', 'info');
      return true;
    } catch (err) {
      hell.o(err, 'pathCheck', 'error');
      throw new Error(err);
    }
  };
};

// helper transform stream for suricata rule file generation
// input: entries from tar stream
// output: comment with filename + file contents in a single stream
class extractTransform extends stream.Transform {
  _transform(entry, _encoding, callback) {
    this.push(`\n# ${entry.path}\n`);
    entry.on('data', this.push)
      .on('end', callback);
  }
}