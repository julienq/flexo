"use strict";

var draw = {
  rough: function (canvas) {
    var context = canvas.getContext("2d");
    var target =
      document.getElementById(canvas.dataset.target).getContext("2d");
    var points;
    var start = function (e) {
      if (e.button > 0) {
        return;
      }
      e.preventDefault();
      context.beginPath();
      var p = flexo.event_offset_pos(e, canvas);
      context.moveTo(p.x, p.y);
      points = [p];
      document.body.classList.add("drawing");
    };
    var move = function (e) {
      if (points) {
        var p = flexo.event_offset_pos(e, canvas);
        context.lineTo(p.x, p.y);
        context.stroke();
        points.push(p);
      }
    };
    var end = function () {
      if (points && points.length > 1) {
        target.beginPath();
        var p = points.shift();
        context.moveTo(p.x, p.y);
        points.forEach(function (p) {
          target.lineTo(p.x, p.y);
        });
        target.stroke();
        points = null;
        document.body.classList.remove("drawing");
      }
    };
    canvas.addEventListener("mousedown", start);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", move);
    canvas.addEventListener("touchend", end);
  },

  smooth: function (canvas) {
    var context = canvas.getContext("2d");
    var drawing = false;
    var start = function (e) {
      if (e.button > 0) {
        return;
      }
      e.preventDefault();
      context.beginPath();
      var p = flexo.event_offset_pos(e, canvas);
      context.moveTo(p.x, p.y);
      drawing = true;
      document.body.classList.add("drawing");
    };
    var move = function (e) {
      if (drawing) {
        var p = flexo.event_offset_pos(e, canvas);
        context.lineTo(p.x, p.y);
        context.stroke();
        context.beginPath();
        context.moveTo(p.x, p.y);
      }
    };
    var end = function () {
      if (drawing) {
        drawing = false;
        document.body.classList.remove("drawing");
      }
    };
    canvas.addEventListener("mousedown", start);
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", move);
    canvas.addEventListener("touchend", end);
  },

};

$foreach(document.querySelectorAll("[data-draw]"), function (canvas) {
  if (canvas.dataset.draw in draw) {
    draw[canvas.dataset.draw](canvas);
  }
});
