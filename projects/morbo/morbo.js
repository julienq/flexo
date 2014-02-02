"use strict";

var fs = require("fs");
var http = require("http");
var path = require("path");
var util = require("util");
var url = require("url");
var flexo = require("flexo");

exports.routes = [];
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
    new exports.Transaction(request, response, root).route();
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

// Override this function in a module for fancier error pages.
exports.serve_error_page = function (transaction, code) {
  var msg = http.STATUS_CODES[code] || "(unknown error code)";
  transaction.serve_data(code, { "Content-Type": "text/plain" },
      "%0 %1\n".fmt(code, msg));
};


// Transaction object—wraps a request and response object, and knows the root
// documents directory.
var transaction = (exports.Transaction = function (request, response, root) {
  this.request = request;
  this.response = response;
  this.root = root;
  this.url = url.parse(this.request.url, true);
}).prototype;

// Return a promise of the data for the request
transaction.get_data = function () {
  var promise = new flexo.Promise();
  var data = "";
  this.request.on("data", function (chunk) {
    data += chunk.toString();
  });
  this.request.on("error", function () {
    promise.reject();
  });
  this.request.on("end", function () {
    promise.fulfill(data);
  });
  return promise;
};

// Send a text/plain status response
transaction.plain_status = function (status) {
  var text = status.toString();
  var message = http.STATUS_CODES[status];
  if (message) {
    text += " " + message;
  }
  this.response.writeHead(status,
      exports.head_params({ "Content-Type": "text/plain" }, text));
  this.response.write(text);
  this.response.end();
};

transaction.route = function () {
  var pathname = decodeURIComponent(this.url.pathname);
  var method = this.request.method.toUpperCase();
  if (method === "HEAD") {
    method = "GET";
  }
  var handled = false;
  for (var i = 0, n = exports.routes.length; !handled && i < n; ++i) {
    var m = pathname.match(exports.routes[i][0]);
    if (m) {
      var methods = exports.routes[i][1];
      if (!methods.hasOwnProperty(method)) {
        var allowed = [];
        if (methods.hasOwnProperty("GET")) {
          allowed.push("HEAD");
        }
        flexo.push_all(allowed, Object.keys(methods));
        this.response.setHeader("Allow", allowed.sort().join(", "));
        return this.serve_error(405,
            "Method %0 not allowed for %1".fmt(method, pathname));
      }
      var args = m.slice();
      args[0] = this;
      handled = methods[method].apply(exports, args) !== false;
    }
  }
  if (!handled) {
    if (method === "GET") {
      this.serve_static_path(pathname);
    } else {
      this.response.setHeader("Allow", "GET, HEAD");
      this.serve_error(405,
        "Method %0 not allowed for %1".fmt(method, pathname));
    }
  }
}

// Serve data by writing the correct headers (plus the ones already given,
// if any) and the data
transaction.serve_data = function (code, params, data) {
  this.response.writeHead(code, exports.head_params(params, data));
  if (this.request.method.toUpperCase() === "HEAD") {
    this.response.end();
  } else {
    this.response.end(data);
  }
},

// Return an error as text with a code and an optional debug message
// TODO provide a function to customize error pages
transaction.serve_error = function (code) {
  exports.serve_error_page(this, code);
},

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

transaction.serve_index = function (dirname, stats) {
  var index = path.join(dirname, "index.html");
  console.info("  index:", index);
  exports.promisify(fs.lstat, index).then(function (stats) {
    if (stats.isFile()) {
      this.serve_local_file(index, stats);
    } else {
      this.serve_directory(dirname, stats);
    }
  }.bind(this), function (err) {
    this.serve_directory(dirname, stats);
  }.bind(this));
};

transaction.serve_directory = function () {
  console.info("  directory: forbidden");
  this.plain_status(403);
};

transaction.serve_static_path = function (pathname) {
  var filename = path.normalize(path.join(this.root,
        decodeURIComponent(pathname || this.url.pathname)));
  if (filename.indexOf(this.root) !== 0) {
    console.info("  not rooted: forbidden");
    return this.plain_status(403);
  }
  exports.promisify(fs.lstat, filename).then(function (stats) {
    if (stats.isFile()) {
      this.serve_local_file(filename, stats);
    } else if (stats.isDirectory()) {
      this.serve_index(filename, stats);
    } else if (stats.isSymbolicLink()) {
      this.serve_symbolic_link(filename, stats);
    } else {
      this.plain_status(403);
    }
  }.bind(this), function () {
    this.plain_status(404);
  }.bind(this));
}

transaction.serve_symbolic_link = function () {
  console.info("  symbolic link: forbidden");
  this.plain_status(403);
};


// Parse arguments from the command line, and add them to an object containing
// the default arguments.
function get_args(argv, args) {
  var m;
  argv.forEach(function (arg) {
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
            return true;
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
  console.info("\nUsage: %0 %1 [options]\n\nOptions:".fmt(node, name));
  console.info("  app=<app.js>:       path to application file");
  console.info("  documents=<dir>:    path to the documents directory");
  console.info("  help:               show this help message");
  console.info("  host=<ip address>:  host IP address to listen to");
  console.info("  port=<port number>: port number for the server");
  console.info("");
  process.exit(0);
}

// Run the server when called as main.
(function () {
  if (require.main !== module) {
    return;
  }
  var argv = process.argv.slice(2);
  var args = get_args(argv, { apps: [], host: get_first_ip_address(),
    port: 8910, documents: "." });
  if (args.help) {
    show_help.apply(null, process.argv);
  }

  (function load(i, n) {
    if (i === n) {
      exports.create_server(args).then(function (conf) {
        util.info("Listening at http://%0:%1/".fmt(conf.host, conf.port));
        util.info("Document root: %0".fmt(conf.documents));
      }, function (reason) {
        console.error("Could not create server: %0".fmt(reason));
      });
    } else {
      var appname = args.apps[i];
      util.log("App: %0 (%1)".fmt(appname, require.resolve(appname)));
      var app = require(appname);
      flexo.unshift_all(exports.routes, app.routes);
      if (typeof app.init === "function") {
        var p = app.init(exports, argv);
        if (p && p.then) {
          return p.then(function () {
            load(i + 1, n);
          });
        }
      }
      load(i + 1, n);
    }
  }(0, args.apps.length));

}());
