(function () {
  "use strict";

  var more = window.more = {};


  // Create new promises

  // Create a promise with a set timeout
  more.promise_timeout = function (f, delay, message) {
    return new Promise(function (resolve, reject) {
      if (delay >= 0) {
        setTimeout(function () {
          reject(new Error(message || "Timeout"));
        }, delay);
      }
      f(resolve, reject);
    });
  };

  // Create a promise that loads an image. `attrs` is a dictionary of attribute
  // for the image and should contain a `src` property, or can simply be the
  // source attribute value itself. The promise has a pointer to the `img`
  // element.
  more.promise_img = function (attrs) {
    return new Promise(function (resolve, reject) {
      var img = new window.Image();
      if (typeof attrs === "object") {
        for (var attr in attrs) {
          img.setAttribute(attr, attrs[attr]);
        }
      } else {
        img.src = attrs;
      }
      if (img.complete) {
        resolve(img);
      } else {
        img.onload = function () {
          resolve(img);
        };
        img.onerror = reject;
      }
    });
  };

  // Fold for a list of promises.
  more.fold_promises = function (promises, f, z) {
    return (function fold (i, n) {
      if (i === n) {
        return new Promise(function (resolve) {
          resolve(z);
        });
      }
      if (promises[i] && typeof promises[i].then === "function") {
        return promises[i].then(function (value) {
          z = f(z, value);
          return fold(i + 1, n);
        });
      }
      z = f(z, promises[i]);
      return fold(i + 1, n);
    }(0, promises.length));
  };

  // Collect a list of promises into the promise of a list.
  more.collect_promises = function (promises) {
    return more.fold_promises(promises, function (values, value) {
      return values.push(value), values;
    }, []);
  };

}());
