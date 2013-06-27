"use strict";

var flexo = require("../flexo.js");

describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha({
    pending: function () {
      var promise = new flexo.Promise;
      return {
        promise: promise,
        fulfill: function (v) { return promise.fulfill(v); },
        reject: function (r) { return promise.reject(r); }
      };
    }
  });
});
