"use strict";

var flexo = require("../flexo.js");


// Promises (see http://promisesaplus.com/)
var promise = (flexo.Promise_ = function () {
  this.pending = true;
  Object.defineProperty(this, "queue", { value: [], writable: true });
}).prototype;

promise.fulfill = function (value) {
  if (!this.pending && arguments.length === 1) {
    return;
  }
  if (arguments.length === 1) {
    delete this.pending;
    Object.defineProperty(this, "value", { value: value, enumerable: true });
  }
  var queue = this.queue;
  this.queue = [];
  var promise1 = this;
  flexo.asap(function () {
    queue.forEach(function (q) {
      promise.fulfill_.apply(promise1, q);
    });
  });
};

promise.fulfill_ = function (promise2, onFulfilled, onRejected) {
  if (typeof onFulfilled === "function") {
    try {
      resolve(promise2, onFulfilled(this.value));
    } catch (e) {
      promise2.reject(e);
    }
  } else {
    promise2.fulfill(this.value);
  }
}

promise.reject = function (reason) {
  if (!this.pending && arguments.length === 1) {
    return;
  }
  if (arguments.length === 1) {
    delete this.pending;
    Object.defineProperty(this, "reason", { value: reason, enumerable: true });
  }
  var queue = this.queue;
  this.queue = [];
  var promise1 = this;
  flexo.asap(function () {
    queue.forEach(function (q) {
      promise.reject_.apply(promise1, q);
    });
  });
};

promise.reject_ = function (promise2, onFulfilled, onRejected) {
  if (typeof onRejected === "function") {
    try {
      resolve(promise2, onRejected(this.reason));
    } catch (e) {
      promise2.reject(e);
    }
  } else {
    promise2.reject(this.reason);
  }
}

promise.then = function (onFulfilled, onRejected) {
  var promise2 = new flexo.Promise_();
  if (this.pending) {
    this.queue.push([promise2, onFulfilled, onRejected]);
  } else {
    var promise1 = this;
    if (this.hasOwnProperty("value")) {
      flexo.asap(function () {
        promise1.fulfill_(promise2, onFulfilled, onRejected);
      });
    } else {
      flexo.asap(function () {
        promise1.reject_(promise2, onFulfilled, onRejected);
      });
    }
  }
  return promise2;
};

function resolve(promise, x) {
  if (promise === x) {
    throw new TypeError();
  }
  if (x instanceof flexo.Promise_) {
    if (x.pending) {
      x.queue.push([promise, function (value) {
        return promise.fulfill(value);
      }, function (reason) {
        return promise.reject(reason);
      }]);
    } else if (x.hasOwnProperty("value")) {
      promise.fulfill(x.value);
    } else {
      promise.reject(x.reason);
    }
  } else if (x !== null && typeof x === "object" || typeof x === "function") {
    try {
      var then = x.then;
      if (typeof then === "function") {
        (function () {
          var handled = false;
          try {
            then.call(x, function (y) {
              if (!handled) {
                handled = true;
                resolve(promise, y);
              }
            }, function (r) {
              if (!handled) {
                handled = true;
                promise.reject(r);
              }
            });
          } catch (e) {
            if (!handled) {
              handled = true;
              promise.reject(e);
            }
          }
        }());
      } else {
        promise.fulfill(x);
      }
    } catch (e) {
      promise.reject(e);
    }
  } else {
    promise.fulfill(x);
  }
}



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
