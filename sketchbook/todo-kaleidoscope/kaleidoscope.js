"use strict";

var args = flexo.get_args({ fps: 15, rpf: π / 45 });
var r = 0;
var _theta = 0;
var flip = false;

var MEDIA_ERROR = ["No or unknown error", "MEDIA_ERR_ABORTED",
  "MEDIA_ERR_NETWORK", "MEDIA_ERR_DECODE", "MEDIA_ERR_SRC_NOT_SUPPORTED"];

var video = document.querySelector("video");
var canvases = [0,1,2,3,4,5,6].map(function () {
  var canvas = document.body.appendChild(flexo.$canvas());
  canvas._theta = _theta;
  _theta += 60;
  canvas._flip = flip;
  flip = !flip;
  return canvas;
});
var contexts = canvases.map(function (canvas) {
  return canvas.getContext("2d");
});

function play() {
  var h = Math.min(video.videoWidth, video.videoHeight);
  var x = 2 * h / Math.sqrt(3);
  var xv = (video.videoWidth - h) / 2;
  var yv = (video.videoHeight - h) / 2;

  // Resize the canvases
  canvases.forEach(function(canvas) {
    canvas.style.left = (x / 2) + "px";
    canvas.width = x;
    canvas.height = h;
  });

  // Make the clipping mask (a π/3 radian wedge of a circle)
  // Unfortunately the clipping is a bit messy, in Safari at least
  // h_ is the radius of the circle, y_ is used to compute the end
  // points  of the wedge (the x one is easy since cos(π/3) = 0.5)
  var h_ = h / (Math.sqrt(3) * 2 / 3);
  var y_ = h - h_ * Math.sin(2 * Math.PI / 3);
  contexts.forEach(function(context) {
    context.beginPath();
    context.moveTo(x / 2, h);
    context.lineTo(x / 2 - h_ / 2, y_);
    context.arcTo(x / 2, 0, x / 2 + h_ / 2, y_, h_);
    context.lineTo(x / 2, h);
    context.clip();
  });

  // Draw a frame: in each canvas, draw the visible part of the video
  // after a rotation of the current angle around the center of the
  // video window. Canvases themselves are rotated as well.
  var draw_frame = function () {
    contexts.forEach(function(context) {
      context.save();
      context.clearRect(0, 0, x, h);
      context.translate(x / 2, h / 2);
      context.rotate(true ? r * rpf : theta);
      context.translate(-x / 2, -h / 2);
      context.drawImage(video, xv, yv, x, h, 0, 0, x, h);
      context.restore();
    });
    canvases.forEach(function(canvas) {
      canvas.style.WebkitTransform =
      canvas.style.MozTransform = "{0}rotate({1}deg)"
        .fmt(canvas._flip ? "scaleX(-1) " : "",
          canvas._theta + 8 * (true ? r * rpf : theta) *
            (canvas._flip ? 1 : -1));
      });
    ++r;
  }

  var video_sampling = setInterval(draw_frame, 1000.0 / fps);
  video.play();
  // Video is loaded so hide the loading image

}

video.addEventListener("error", function () {
  alert("Error loading video: {0}".fmt(MEDIA_ERROR[video.error.code]));
}, false)
video.addEventListener("canplaythrough", play, false);
