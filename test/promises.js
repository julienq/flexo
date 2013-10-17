"use strict";

var flexo = require("../flexo.js");

/*
var p = new flexo.Promise("p");
var q = new flexo.Promise("q");
var r = new flexo.Promise("r");
var s = new flexo.Promise("s");
var c = flexo.collect_promises([1, p, 2.5, q, 4]);
c.then(function (a) {
  console.log("C = ", a);
});
var d = flexo.collect_promises(["foo", r, c, "bar", s]);
d.then(function (a) {
  console.log("D = ", a);
}).then(undefined, function (r) {
  console.log("D error:", r);
});
setTimeout(function () { console.log("p = 2"); p.fulfill(2); },
    1000 * Math.random());
setTimeout(function () { if (!q.pending) return; console.log("q fails!!!"); q.reject("AUGH"); },
    1500 * Math.random());
setTimeout(function () { if (!q.pending) return; console.log("q = 3"); q.fulfill(3); },
    1000 * Math.random());
setTimeout(function () { console.log("r = fum"); r.fulfill("fum"); },
    1000 * Math.random());
setTimeout(function () { console.log("s = baz"); s.fulfill("baz"); },
    1000 * Math.random());
q.timeout(1500 * Math.random());
*/

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
