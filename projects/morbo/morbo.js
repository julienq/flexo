"use strict";

var fs = require("fs");
var http = require("http");
var path = require("path");
var util = require("util");
var flexo = require("../../flexo.js");

exports.CONTENT_TYPES = {
  "": "text/plain",
  ".html": "text/html",
  ".js": "application/javascript",
  ".xml": "application/xml"
};

// Turn a Node async function expecting a callback of the form f(error, value)
// as its last argument into a promise
function promisify(f) {
  var p = new flexo.Promise();
  var args = Array.prototype.slice.call(arguments, 1);
  args.push(function (error, value) {
    if (error) {
      p.reject(error);
    } else {
      p.fulfill(value);
    }
  });
  try {
    f.apply(undefined, args);
  } catch (e) {
    p.reject(e);
  }
  return p;
}


exports.content_type = function (filename) {
  return exports.CONTENT_TYPES[path.extname(filename)] ||
    exports.CONTENT_TYPES[""];
};


var transaction = (exports.Transaction = function (request, response, root) {
  this.request = request;
  this.response = response;
  this.root = root;
}).prototype;

function plain_status(response, status) {
  response.writeHead(status, { "Content-Type": "text/plain" });
  response.end("%0 %1".fmt(status, http.STATUS_CODES[status]));
}

transaction.handle = function () {
  var f = this.handle[this.request.method.toUpperCase()];
  if (typeof f === "function") {
    f.call(this);
  } else {
    plain_status(this.response, 501);
  }
};

transaction.handle.GET = function () {
  var filename = path.normalize(path.join(this.root, this.request.url));
  console.log("GET %0".fmt(filename));
  if (filename.indexOf(this.root) !== 0) {
    return plain_status(this.response, 403);
  }
  promisify(fs.stat, filename).then(function (stats) {
    if (!stats.isFile()) {
      plain_status(this.response, 403);
    }
    this.serve_local_file(filename, stats);
  }.bind(this), function () {
    plain_status(this.response, 404);
  }.bind(this));
};

transaction.serve_local_file = function (filename, stats) {
  var stream = fs.createReadStream(filename);
  stream.on("error", function () {
    plain_status(this.response, 500);
  }.bind(this));
  stream.on("open", function (fd) {
    this.response.writeHead(200, {
      "Content-Length": stats.size,
      "Content-Type": exports.content_type(filename)
    });
  }.bind(this))
  stream.on("end", function () {
    this.response.end();
  }.bind(this));
  stream.pipe(this.response);
}


exports.create_server = function (args) {
  var promise = new flexo.Promise();
  var port = flexo.to_number(args.port);
  var root = path.resolve(process.cwd(), args.root);
  var server = http.createServer(function (request, response) {
    new exports.Transaction(request, response, root).handle();
  }).listen(port, args.host);
  server.on("listening", function () {
    promise.fulfill({ host: args.host, port: port, root: root });
  });
  return promise;
}


if (require.main === module) {

  var args = { host: "127.1", port: 8910, root: "." };

  var get_args = function (args) {
    for (var i = 2, n = process.argv.length; i < n; ++i) {
      var split = process.argv[i].split("=");
      args[split[0]] = split.length === 1 || split.slice(1).join("=");
    }
    return args;
  }

  exports.create_server(get_args(args)).then(function (conf) {
    console.info("Listening at http://%0:%1/".fmt(conf.host, conf.port));
    console.info("  document root: %0".fmt(conf.root));
  }, function (reason) {
    console.error("Could not create server: %0".fmt(reason));
  });

}
