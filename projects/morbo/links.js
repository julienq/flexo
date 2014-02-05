"use strict";

var fs = require("fs");
var path = require("path");

exports.init = function (morbo) {
  morbo.Transaction.prototype.serve_symbolic_link = function (filename) {
    morbo.promisify(fs.readlink, filename).then(function (link) {
      console.log("  symlink: %0 -> %1".fmt(filename, link));
      this.serve_static_path(undefined, path.resolve(filename, "..", link));
    }.bind(this), function (err) {
      util.log("[500] serve_symbolic_link: %0".fmt(err));
      this.serve_error(500);
    }.bind(this));
  };
};
