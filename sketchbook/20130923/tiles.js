(function () {
  "use strict";

  (function make_pond(r, amp, sectors) {
    var pts = [];
    for (var i = 0; i < sectors; ++i) {
      var th = i * (2 * Math.PI / sectors);
      var r_ = r + flexo.random_int(-amp, amp);
      pts.push([50 + r_ * Math.cos(th), 50 + r_ * Math.sin(th)]);
    }
    document.getElementById("pond").setAttribute("d", draw.d_from_points(pts));
  }(flexo.random_int(10, 20), flexo.random_int(1, 5), flexo.random_int(6, 12)));

  var tiles = new flexo.Urn(["straight", "straightc", "straightc", "straightc",
    "straightc", "bend", "bendc", "bendc", "parallel"]);
  var buildings = new flexo.Urn(["building", "building", "building", "building",
    "building", "building", "building", "building", "pond"])
  
  var g = document.getElementById("tiles");
  for (var x = 0; x < 300; x += 100) {
    for (var y = 0; y < 300; y += 100) {
      g.appendChild(
        flexo.$g({ transform: "translate(%0, %1)".fmt(x, y) },
          flexo.$use({ "xlink:href": "#tile-%0".fmt(tiles.pick()),
            transform: "rotate(%0, 50, 50)".fmt(90 * flexo.random_int(3)) }),
          flexo.$use({ "xlink:href": "#" + buildings.pick() })));
    }
  }

}());
