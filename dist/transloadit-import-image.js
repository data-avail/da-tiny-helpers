var Promise, TransloaditClient, _templateId, imageSize, mongo, path, request, transloadit;

TransloaditClient = require('transloadit');

Promise = require("bluebird");

mongo = require("mongojs");

path = require("path");

transloadit = null;

_templateId = null;

imageSize = Promise.promisifyAll({
  sizeOf: require("image-size")
});

request = Promise.promisifyAll(require("request").defaults({
  encoding: null
}));

exports.ini = function(config) {
  transloadit = Promise.promisifyAll(new TransloaditClient({
    authKey: config.TRANSLOADIT_KEY,
    authSecret: config.TRANSLOADIT_SECRET
  }));
  return _templateId = config.TRANSLOADIT_TEMPLATE_ID;
};

exports.importImg = function(src, key) {
  var buck, name, prms;
  if (!transloadit) {
    return Promise.reject(new Error("Not initialized"));
  }
  if (!src) {
    return Promise.resolve();
  }
  buck = "rb-" + key;
  name = buck + "-" + mongo.ObjectId().toString();
  prms = {
    params: {
      template_id: _templateId
    },
    fields: {
      href: src,
      name: name,
      bucket: buck
    }
  };
  return request.getAsync(src).then(function(resp) {
    var ex;
    if (resp[1]) {
      try {
        return imageSize.sizeOf(resp[1]);
      } catch (_error) {
        ex = _error;
        console.log("tt-import-image.coffee:18 >>>", ex);
      }
    }
    return {
      width: 500,
      height: 500
    };
  }).then(function(size) {
    prms.fields.name += "-" + size.width + "x" + size.height + (path.extname(src));
    return transloadit.createAssemblyAsync(prms).then(function(res) {
      return {
        key: key,
        src: ("http://" + buck + ".s3.amazonaws.com/thumbnail-") + prms.fields.name,
        imported_src: src
      };
    });
  });
};
