"use strict";

var fs = require("fs");
var http = require("http");
var path = require("path");
var util = require("util");
var url = require("url");
var flexo = require("flexo");

exports.PATTERNS = [];
exports.SERVER_NAME = "Morbo!";

// Known content types by extension.
exports.CONTENT_TYPES = {
  "": "text/plain",
  css: "text/css",
  html: "text/html",
  jpg: "image/jpeg",
  js: "application/javascript",
  png: "image/png",
  svg: "image/svg+xml",
  xml: "application/xml"
};

// Get the content type for a file from its extension, with a fallback.
exports.content_type = function (filename) {
  return exports.CONTENT_TYPES[path.extname(filename).substr(1)] ||
    exports.CONTENT_TYPES[""];
};

// Create a new HTTP server with the given args (keys are: host, port, and root
// for the root directory, relative to the current directory.)
exports.create_server = function (args) {
  var promise = new flexo.Promise();
  var port = flexo.to_number(args.port);
  var root = path.resolve(process.cwd(), args.documents);
  var server = http.createServer(function (request, response) {
    new exports.Transaction(request, response, root).handle();
  }).listen(port, args.host);
  server.on("listening", function () {
    promise.fulfill({ host: args.host, port: port, documents: root });
  });
  return promise;
};

// Fill up the parameters for the heading
exports.head_params = function (params, data) {
  if (!params.hasOwnProperty("Accept-Ranges")) {
    params["Accept-Ranges"] = "bytes";
  }
  if (!params.hasOwnProperty("Content-Length")) {
    params["Content-Length"] = data ? Buffer.byteLength(data.toString()) : 0;
  }
  if (params["Content-Type"] &&
      !(/\bcharset=/.test(params["Content-Type"]) &&
        /script|text|xml/.test(params["Content-Type"]))) {
    params["Content-Type"] += "; charset=utf-8";
  }
  if (!params.hasOwnProperty("Date")) {
    params.Date = (new Date()).toUTCString();
  }
  if (!params.hasOwnProperty("Server")) {
    params.Server = exports.SERVER_NAME;
  }
  return params;
};

exports.html = function (params, head, body) {
  return html_top(params, head) + body + "</body></html>";
};

// Turn a Node async function expecting a callback of the form f(error, value)
// as its last argument into a promise
exports.promisify = function (f) {
  var p = new flexo.Promise();
  var args = flexo.slice(arguments, 1);
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
};


// Transaction object—wraps a request and response object, and knows the root
// documents directory.
var transaction = (exports.Transaction = function (request, response, root) {
  this.request = request;
  this.url = url.parse(this.request.url, true);
  this.response = response;
  this.root = root;
}).prototype;

// Handle the transaction, depending on the request method.
transaction.handle = function () {
  var f = this.handle[this.request.method.toUpperCase()];
  if (typeof f === "function") {
    f.call(this);
  } else {
    this.plain_status(501);
  }
};

// GET a file; return 403/404 errors in case of error.
transaction.handle.GET = function () {
  var filename = path.normalize(path.join(this.root,
        decodeURIComponent(this.url.pathname)));
  console.log("GET %0 -> %1".fmt(this.request.url, filename));
  if (filename.indexOf(this.root) !== 0) {
    console.log("  not rooted: forbidden");
    return this.plain_status(403);
  }
  exports.promisify(fs.lstat, filename).then(function (stats) {
    if (stats.isFile()) {
      this.serve_local_file(filename, stats);
    } else if (stats.isDirectory()) {
      this.serve_directory(filename, stats);
    } else if (stats.isSymbolicLink()) {
      this.serve_symbolic_link(filename, stats);
    } else {
      this.plain_status(403);
    }
  }.bind(this), function () {
    this.plain_status(404);
  }.bind(this));
};

// Send a text/plain status response
transaction.plain_status = function (status) {
  this.response.writeHead(status,
      head_params({ "Content-Type": "text/plain" }));
  var text = status.toString();
  var message = http.STATUS_CODES[status];
  if (message) {
    text += " " + message;
  }
  this.response.end(text);
};

// Serve a regular file from the root directory
transaction.serve_local_file = function (filename, stats) {
  var stream = fs.createReadStream(filename);
  stream.on("error", this.plain_status.bind(this, 500));
  stream.on("open", function (fd) {
    this.response.writeHead(200, exports.head_params({
      "Content-Length": stats.size,
      "Content-Type": exports.content_type(filename)
    }));
  }.bind(this))
  stream.on("end", function () {
    this.response.end();
  }.bind(this));
  stream.pipe(this.response);
};

transaction.serve_directory = function () {
  console.info("  directory: forbidden");
  this.plain_status(403);
};

transaction.serve_symbolic_link = function () {
  console.info("  symbolic link: forbidden");
  this.plain_status(403);
};


// Parse arguments from the command line, and add them to an object containing
// the default arguments.
function get_args(args) {
  var m;
  process.argv.slice(2).forEach(function (arg) {
    if (m = arg.match(/^-?-?port=(\d+)/i)) {
      args.port = parseInt(m[1], 10);
    } else if (m = arg.match(/^-?-?ip=(\S*)/i)) {
      args.ip = m[1];
    } else if (arg.match(/^-?-?h(elp)?$/i)) {
      args.help = true;
    } else if (m = arg.match(/^-?-?doc(?:ument)?s=(\S+)/)) {
      args.documents = m[1];
    } else if (m = arg.match(/^-?-?app=(\S+)/i)) {
      args.apps.push(m[1]);
    }
  });
  return args;
}

// Find first IP address that is not localhost, or failing that, localhost
function get_first_ip_address() {
  var ip = "127.1";
  flexo.find_first(flexo.values(require("os").networkInterfaces()),
      function (if_) {
        return flexo.find_first(if_, function (a) {
          if (a.family === "IPv4" && a.address !== "127.0.0.1") {
            ip = a.address;
          }
        });
      });
  return ip;
}

// Params should include at least "title"; "lang" and "charset" have default
// values. DOCTYPE can be overridden with the DOCTYPE parameter.
function html_top(params, head) {
  if (head == null) {
    head = "";
  }
  if (!params.DOCTYPE) {
    params.DOCTYPE = "<!DOCTYPE html>";
  }
  if (!params.title) {
    params.title = "Untilted";
  }
  if (!params.charset) {
    params.charset = "UTF-8";
  }
  return params.DOCTYPE  + "\n" +
    flexo.$html({ lang: params.lang },
      flexo.$head(
        flexo.$title(params.title),
        flexo.$meta({ charset: params.charset }, true),
        head),
      flexo.$body(true),
      true);
}

// Show help info and quit.
function show_help(node, name) {
  console.log("\nUsage: %0 %1 [options]\n\nOptions:".fmt(node, name));
  console.log("  app=<app.js>:       path to application file");
  console.log("  documents=<dir>:    path to the documents directory");
  console.log("  help:               show this help message");
  console.log("  host=<ip address>:  host IP address to listen to");
  console.log("  port=<port number>: port number for the server");
  console.log("");
  process.exit(0);
}

// Run the server when called as main.
(function () {
  if (require.main !== module) {
    return;
  }
  var args = get_args({ apps: [], host: get_first_ip_address(), port: 8910,
    documents: "." });
  if (args.help) {
    show_help.apply(null, process.argv);
  }
  flexo.fold_promises(args.apps.map(function (appname) {
    util.log("App: %0 (%1)".fmt(appname, require.resolve(appname)));
    var app = require(appname);
    flexo.unshift_all(exports.PATTERNS, app.PATTERNS);
    if (typeof app.init === "function") {
      return app.init(exports);
    }
  }), flexo.nop).then(function () {
    return exports.create_server(args);
  }).then(function (conf) {
    util.log("Listening at http://%0:%1/".fmt(conf.host, conf.port));
    util.log("Document root: %0".fmt(conf.documents));
  }, function (reason) {
    console.error("Could not create server: %0".fmt(reason));
  });

}());
