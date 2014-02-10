"use strict";

var fs = require("fs");
var path = require("path");
var flexo = require("flexo");

exports.init = function (morbo) {
  var dir = morbo.dir = {

    title: function (transaction, dirname) {
      return "Directory listing of %0/"
        .fmt(path.relative(transaction.root, dirname));
    },

    parent: function(transaction) {
      return flexo.$li(flexo.$a({ "class": "dir", href: "../" },
            "parent directory"));
    },

    item: function (transaction, dirname, filename, stat) {
      var a = {};
      if (stat.isDirectory()) {
        filename += "/";
        a.class = "dir";
      } else if (stat.isSymbolicLink()) {
        a.class = "link";
      }
      if (filename[0] === ".") {
        a.class = (a.class ? a.class + " " : "") + "dot";
      }
      a.href = filename;
      return flexo.$li(flexo.$a(a, filename));
    },

    // Create a style element for the directory listing stylesheet
    style: function (transaction) {
      return [
        flexo.css("body", { "font-family": "Univers, Avenir, sans-serif" }),
        flexo.css("a", { "text-decoration": "none", color: "#ff4040" }),
        flexo.css("h1", { "font-weight": "normal" }),
        flexo.css("ul", { "list-style-type": "none", padding: 0 }),
        flexo.css(".dot", { "opacity": 0.5 }),
        flexo.css(".dir", { "font-weight": "bold" }),
        flexo.css(".link", { "font-style": "italic" })
      ];
    }

  };

  morbo.Transaction.prototype.serve_directory = function (dirname) {
    morbo.promisify(fs.readdir, dirname).then(function (files) {
      return flexo.collect_promises(files.map(function (filename) {
        var filepath = path.normalize(path.join(dirname, filename));
        return morbo.promisify(fs.lstat, filepath).then(function (stat) {
          return dir.item(this, dirname, filename, stat);
        }.bind(this));
      }.bind(this)));
    }.bind(this)).then(function (items) {
      var parent = dir.parent();
      if (parent) {
        items.unshift(parent);
      }
      var title = dir.title(this, dirname);
      this.serve_html(morbo.html({ title: title },
          flexo.$style.apply(null, dir.style(this)),
          flexo.$h1(title) + flexo.$ul(items.join(""))));
    }.bind(this)).then(flexo.nop, function (err) {
      console.log(err);
      this.serve_error(500);
    }.bind(this));
  };
};
