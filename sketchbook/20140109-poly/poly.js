"use strict";

var args = flexo.get_args({ max: 13, stroke: 12, dur: 750, pause: 1250 });

var g = document.querySelector("g");
g.setAttribute("stroke-width", args.stroke);
var vb = g.parentNode.viewBox.baseVal;
var r = Math.min(vb.width, vb.height) / 2;
var l = 2 * r * Math.sin(π / args.max) - (args.stroke / 2);

// TODO: compute the right h so that the largest polygon is inscribed in the
// circle.

/*
var h = Math.sin(π / args.max) * (Math.sqrt((l / 2) * (l / 2) + r * r) - r);
g.parentNode.appendChild(flexo.$rect({ x: (vb.width + vb.x - h) / 2, width: h,
      height: h }));
g.parentNode.appendChild(flexo.$circle({ cx: (vb.width + vb.x) / 2, cy: y - r,
      r: r, stroke: "red", fill: "none" }));
*/

var x = (vb.width + vb.x - l) / 2;
var y = vb.height + vb.y - (args.stroke / 2); //  - h;

// Draw a regular polygon (into a path element) starting at x, y, with sides
// sides of length sz. The fill is given by h (the phase for hue, in radians),
// s and v.
function polygon(x, y, sz, sides, h, s, v) {
  var d = "M%0,%1".fmt(x, y);
  var th = _2π / sides;
  for (var i = 0; i < sides; ++i) {
    x += sz * Math.cos(th * i);
    y -= sz * Math.sin(th * i);
    d += "L%0,%1".fmt(x, y);
  }
  var color = flexo.hsv_to_hex(h + (sides - 2) * (_2π / args.max), s, v);
  return flexo.$path({ d: d + "Z", fill: color, stroke: color });
}

// Clear the draw area; then draw polygon after polygon, with increasing number
// of sides, then wait and start again.
// TODO improve the scheduling so that we don’t have to accumulate the waiting
// time.
(function polygons() {
  var h = flexo.random_number(_2π);
  var s = flexo.random_number(0.5, 1);
  var v = flexo.random_number(0.5, 1);
  flexo.remove_children(g);
  flexo.collect_promises(flexo.times(args.max - 2, function (i) {
    return flexo.promise_delay(function () {
      g.insertBefore(polygon(x, y, l, i + 3, h, s, v), g.firstChild);
    }, args.dur * (i + 1));
  })).then(function() {
    return flexo.promise_delay(flexo.nop, args.pause);
  }).then(polygons);
}());
