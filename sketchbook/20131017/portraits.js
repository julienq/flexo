"use strict";

var URL = "https://dl.dropboxusercontent.com/u/7465599/romulusetrem.us/media/images/randomhead/portraits/%0.png";

var args = flexo.get_args({ n: 46, m: 10, seq: true });
flexo.safe_remove(document.getElementById(args.seq ? "par" : "seq"));

var urn = new flexo.Urn;
for (var i = 0; i < args.n; ++i) {
  urn.add(i + 1);
}
var picks = urn.picks(args.m);

var li = [];
var ul = document.getElementById("gallery");
for (var i = 0; i < args.m; ++i) {
  li.push(ul.appendChild(flexo.$li()));
}

function done() {
  document.getElementById("loading").classList.add("hidden");
}

function error(e) {
  done();
  document.getElementById("error").classList.remove("hidden");
  alert("Error loading image");
}

if (args.seq) {
  flexo.fold_promises(picks.map(function (n) {
    return flexo.promise_img(URL.fmt(flexo.pad(n, 2)));
  }), function (i, image) {
    li[i].appendChild(image);
    return i + 1;
  }, 0).then(done, error);
} else {
  flexo.collect_promises(picks.map(function (n, i) {
    return flexo.promise_img(URL.fmt(flexo.pad(n, 2))).then(function (image) {
      return li[i].appendChild(image);
    });
  })).then(done, error);
}


