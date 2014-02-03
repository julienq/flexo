"use strict";

var fs = require("fs");
var path = require("path");
var flexo = require("flexo");

exports.init = function (morbo) {
  morbo.Transaction.prototype.serve_directory = function (dirname) {
    morbo.promisify(fs.readdir, dirname).then(function (files) {
      return flexo.collect_promises(files.map(function (filename) {
        var filepath = path.normalize(path.join(dirname, filename));
        return morbo.promisify(fs.lstat, filepath).then(function (stat) {
          var a = {};
          if (stat.isDirectory()) {
            filename += "/";
            a["class"] = "dir";
          } else if (stat.isSymbolicLink()) {
            a["class"] = "link";
          }
          a.href = filename; // path.relative(this.root, filepath);
          return flexo.$li(flexo.$a(a, filename));
        }.bind(this));
      }.bind(this)));
    }.bind(this)).then(function (files) {
      files.unshift(flexo.$li(flexo.$a({ "class": "dir", href: "../" },
            "parent directory")));
      var relative = path.relative(this.root, dirname);
      this.serve_html(morbo.html({ title: "Directory listing of %0/"
        .fmt(relative) },
        flexo.$style(
          flexo.css("body", { "font-family": "Univers, Avenir, sans-serif" }),
          flexo.css("a", { "text-decoration": "none", color: "#ff4040" }),
          flexo.css("ul", { "list-style-type": "none", padding: 0 }),
          flexo.css(".dir", { "font-weight": "bold" }),
          flexo.css(".link", { "font-style": "italic" })),
        flexo.$ul(files.join(""))));
    }.bind(this)).then(flexo.nop, function (err) {
      console.log(err);
      this.serve_error(500);
    }.bind(this));
  };
};
