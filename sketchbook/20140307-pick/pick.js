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

var v = 0;
function draw() {
  v = (v + 0.005) % (2 * π);
  gl.uniform1f(v_loc, (1 + Math.cos(v)) / 2);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
  requestAnimationFrame(draw);
}
draw();
