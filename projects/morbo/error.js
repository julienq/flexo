"use strict";

var http = require("http");
var flexo = require("flexo");

exports.init = function (morbo) {
  morbo.Transaction.prototype.serve_error = function (code) {
    var msg = "%0 %1"
    this.serve_html(morbo.html({ title: "Error %0".fmt(code) },
      flexo.$style(
        flexo.css("p", { "text-align": "center", "font-size": "10rem" }),
        flexo.css("body", { "font-family": "Univers, Avenir, sans-serif" })),
      flexo.$p("%0 %1".fmt(code, http.STATUS_CODES[code] || "Unknown Error"))));
  };
};
