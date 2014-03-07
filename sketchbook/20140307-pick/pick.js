"use strict";

function get_shader(gl, script) {
  if (!script) {
    return;
  }
  var shader;
  if (script.type === "x-shader/x-fragment") {
    shader = gl.createShader(gl.FRAGMENT_SHADER);
  } else if (script.type === "x-shader/x-vertex") {
    shader = gl.createShader(gl.VERTEX_SHADER);
  } else {
    return;
  }
  gl.shaderSource(shader, script.textContent);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw "Error while compiling shader: " + gl.getShaderInfoLog(shader);
  }
  return shader;
}

function link_shaders(gl) {
  var program = gl.createProgram();
  for (var i = 1, n = arguments.length; i < n; ++i) {
    gl.attachShader(program, arguments[i]);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw "Unable to link shader program.";
  }
  gl.useProgram(program);
  return program;
}

var canvas = document.querySelector("canvas");

var svg = document.querySelector("svg");
var m = 10;
var bbox = canvas.getBoundingClientRect();
var sz = bbox.width;
var R = sz / 2;
svg.style.width = "%0px".fmt(sz + 2 * m);
svg.setAttribute("height", "%0px".fmt(sz + 2 * m));
svg.style.left = "%0px".fmt(bbox.left - m);
svg.style.top = "%0px".fmt(bbox.top - m);
svg.setAttribute("viewBox", "%0 %0 %1 %1".fmt(-m, sz + 2 * m));
var circle = svg.appendChild(flexo.$circle({ cx: R, cy: R, r: R,
  stroke: "#333", "stroke-width": 2, fill: "none" }));
var cursor = svg.appendChild(flexo.$g({ fill: "none" },
      flexo.$circle({ r: m / 2, stroke: "#333", "stroke-width": 4 }),
      flexo.$circle({ r: m / 2, stroke: "#f8f9f0", "stroke-width": 2 })));

var gl = canvas.getContext("experimental-webgl");
var program = link_shaders(gl,
    get_shader(gl, document.getElementById("fs")),
    get_shader(gl, document.getElementById("vs")));

var position_loc = gl.getAttribLocation(program, "a_position");
var v_loc = gl.getUniformLocation(program, "v");

var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW);
gl.enableVertexAttribArray(position_loc);
gl.vertexAttribPointer(position_loc, 2, gl.FLOAT, false, 0, 0);

function draw(v) {
  gl.uniform1f(v_loc, v);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

var color = {
  _h: 0,
  _s: 0,
  _v: 0,
  show: function () {
    var hex = this.color;
    this.__lock = true;
    document.getElementById("h-in").value = (this.h * 180 / π).toFixed(2);
    document.getElementById("s-in").value = this.s.toFixed(2);
    document.getElementById("v-in").value = this.v.toFixed(2);
    document.getElementById("hex").textContent = hex;
    document.getElementById("color").style.backgroundColor = hex;
    var x = R + this.s * R * Math.cos(this.h);
    var y = R - this.s * R * Math.sin(this.h);
    cursor.setAttribute("transform", "translate(%0, %1)".fmt(x, y));
    this.__lock = false;
  }
};

Object.defineProperty(color, "color", {
  enumerable: true,
  get: function () {
    return flexo.hsv_to_hex(this.h, this.s, this.v);
  }
});

document.getElementById("h-in").addEventListener("change", function (e) {
  if (color.__lock) {
    return;
  }
  color.h = flexo.to_number(e.currentTarget.value) * π / 180;
});

document.getElementById("s-in").addEventListener("change", function (e) {
  if (color.__lock) {
    return;
  }
  color.s = flexo.to_number(e.currentTarget.value);
});

document.getElementById("v-in").addEventListener("change", function (e) {
  if (color.__lock) {
    return;
  }
  color.v = flexo.to_number(e.currentTarget.value);
});

Object.defineProperty(color, "h", {
  enumerable: true,
  get: function () {
    return this._h;
  },
  set: function (h) {
    this._h = h % (2 * π);
    this.show();
  }
});

Object.defineProperty(color, "s", {
  enumerable: true,
  get: function () {
    return this._s;
  },
  set: function (s) {
    this._s = flexo.clamp(s, 0, 1);
    this.show();
  }
});

Object.defineProperty(color, "v", {
  enumerable: true,
  get: function () {
    return this._v;
  },
  set: function (v) {
    this._v = flexo.clamp(v, 0, 1);
    this.show();
    draw(this._v);
  }
});

color.v = 1;

canvas.addEventListener("mousedown", function (e) {
  e.preventDefault();
  move(flexo.event_offset_pos(e, canvas));
  document.body.style.cursor = "none";
  color.__drag = true;
});

document.addEventListener("mousemove", function (e) {
  if (!color.__drag) {
    return;
  }
  move(flexo.event_offset_pos(e, canvas));
});

document.addEventListener("mouseup", function (e) {
  color.__drag = false;
  document.body.style.cursor = "default";
});

function move(p) {
  var x = (canvas.width / 2 - p.x) / (canvas.width / 2);
  var y = (canvas.height / 2 - p.y) / (canvas.height / 2);
  color.h = π - Math.atan2(y, x);
  color.s = Math.min(Math.sqrt(x * x + y * y), 1);
}

canvas.addEventListener("wheel", function (e) {
  e.preventDefault();
  color.v = flexo.clamp(color.v - e.deltaY / (2 * canvas.height), 0, 1);
});
