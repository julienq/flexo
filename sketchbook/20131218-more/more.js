(function () {
  "use strict";

  var more = window.more = {};

  // Wrapper for promises, adding new instance methods resolve and reject, as
  // well timeout (see below.)
  var promise = (more.Promise = function (f) {
    var promise = new Promise(function (resolve, reject) {
      if (typeof resolve === "function") {
        this.resolve = resolve;
        this.reject = reject;
      } else {
        this.resolve = resolve.resolve.bind(resolve);
        this.reject = resolve.reject.bind(resolve);
      }
      if (typeof f === "function") {
        f(this.resolve, this.reject);
      }
    }.bind(this));
    this.then = promise.then.bind(promise);
    this["catch"] = promise["catch"].bind(promise);
  }).prototype;

  promise.timeout = function (delay, message) {
    if (delay >= 0) {
      setTimeout(function () {
        this.reject(new Error(message || "Timeout"));
      }.bind(this), delay);
    }
    return this;
  };


  more.Promise.img = function (attrs) {
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
        img.onload = resolve.bind(null, img);
        img.onerror = reject;
      }
    });
  };

  more.Promise.script = function (src, target, async) {
    return new more.Promise(function (resolve, reject) {
      if (!(target instanceof window.Node)) {
        async = !!target;
      }
      if (!target) {
        target = document.head;
      }
      var script = target.ownerDocument.createElement("script");
      script.src = src;
      script.async = async;
      script.onload = resolve.bind(null, script);
      script.onerror = reject;
      target.appendChild(script);
    });
  };

  // Fold for a list of promises.
  more.Promise.fold = function (ps, f, z) {
    return (function fold (i, n) {
      if (i === n) {
        return new more.Promise().resolve(z);
      }
      if (ps[i] && typeof ps[i].then === "function") {
        return ps[i].then(function (x) {
          z = f(z, x);
          return fold(i + 1, n);
        });
      }
      z = f(z, ps[i]);
      return fold(i + 1, n);
    }(0, ps.length));
  };

  more.Promise.collect = function (ps) {
    return more.Promise.fold(ps, function (z, x) {
      return z.push(x), z;
    }, []);
  };

}());
