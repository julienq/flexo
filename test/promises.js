"use strict";

var flexo = require("../flexo.js");

describe("Promises/A+ Tests", function () {
  require("promises-aplus-tests").mocha({
    deferred: function () {
      return {
        promise: new flexo.Promise(),
        resolve: function (value) { return this.promise.fulfill(value); },
        reject: function (reason) { return this.promise.reject(reason); }
      };
    }
  });
});
