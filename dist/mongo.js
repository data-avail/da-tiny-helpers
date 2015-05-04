var Promise, _db, close, mongo;

Promise = require("bluebird");

mongo = require("mongojs");

_db = null;

exports.ObjectId = mongo.ObjectId;

exports.ini = function(uri, colls) {
  var coll, i, len;
  if (_db) {
    throw new Error("Already initialized");
  } else {
    _db = mongo(uri, colls);
    for (i = 0, len = colls.length; i < len; i++) {
      coll = colls[i];
      exports[coll] = Promise.promisifyAll(_db[coll]);
    }
  }
  return _db;
};

close = function() {
  if (!_db) {
    throw new Error("Not initialized yet");
  } else {
    _db.close();
    return _db = null;
  }
};

exports.read = function(coll, next, query, sort, limit) {
  var _end, _readOne, cursor, deferred;
  if (!_db) {
    return Promise.reject(new Error("Not initialized yet"));
  }
  _end = false;
  _readOne = false;
  deferred = Promise.defer();
  cursor = _db[coll].find(query);
  if (sort) {
    cursor = cursor.sort(sort);
  }
  if (limit) {
    cursor = cursor.limit(limit);
  }
  cursor.on("data", function(data) {
    _readOne = true;
    cursor.pause();
    return next(data).then(function() {
      if (_end) {
        close();
        return deferred.resolve();
      } else {
        return cursor.resume();
      }
    }, function(err) {
      return cursor.emit("error", err);
    });
  });
  cursor.on("error", function(err) {
    close();
    return deferred.reject(err);
  });
  cursor.on("end", function(data) {
    _end = true;
    if (!_readOne) {
      close();
      return deferred.resolve();
    }
  });
  return deferred.promise;
};

exports.updOrCreate = function(coll, query, upd, doc) {
  if (!_db) {
    return Promise.reject(new Error("Not initialized yet"));
  }
  return exports[coll].updateAsync(query, upd).then(function(res) {
    if (res.n === 0) {
      return exports[coll].insertAsync(doc);
    } else {
      return res;
    }
  });
};
