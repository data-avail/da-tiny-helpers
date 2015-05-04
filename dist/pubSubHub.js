var Promise, PubSubHub, extend, rabbit;

rabbit = require('rabbit.js');

extend = require('util')._extend;

Promise = require("bluebird");

PubSubHub = (function() {
  function PubSubHub() {}

  PubSubHub.opts = {
    uri: void 0,
    queue: void 0,
    type: "PUB",
    onSub: void 0
  };

  PubSubHub.prototype.connect = function(_opts) {
    var context, deferred, opts;
    opts = extend({}, PubSubHub.opts);
    opts = extend(opts, _opts);
    if (!_opts.uri) {
      throw new Error("opts.uri must be defined");
    }
    if (!_opts.queue) {
      throw new Error("opts.queue must be defined");
    }
    context = rabbit.createContext(opts.uri);
    deferred = Promise.defer();
    context.on('error', function(err) {
      return deferred.reject(err);
    });
    context.on('ready', (function(_this) {
      return function() {
        var socket;
        socket = context.socket(opts.type);
        return socket.connect(opts.queue, function(res) {
          if ((res != null ? res.status : void 0) === "error") {
            deferred.reject(res);
          }
          _this.context = context;
          _this.socket = socket;
          if (opts.onSub) {
            _this.socket.setEncoding("utf8");
            _this.socket.on("data", function(data) {
              var json;
              try {
                json = JSON.parse(data);
                return opts.onSub(json);
              } catch (_error) {
                return console.log("Failed to parse data", data);
              }
            });
          }
          return deferred.resolve();
        });
      };
    })(this));
    return deferred.promise;
  };

  PubSubHub.prototype.pub = function(obj) {
    if (!this.socket) {
      throw new Error("Not connected");
    }
    return this.socket.write(JSON.stringify(obj), "utf8");
  };

  PubSubHub.prototype.close = function() {
    if (!this.socket) {
      console.log("close failed, not connected");
      return;
    }
    this.socket.close();
    this.context.close();
    this.socket = null;
    return this.context = null;
  };

  return PubSubHub;

})();

module.exports = PubSubHub;
