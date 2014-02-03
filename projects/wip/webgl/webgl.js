"use strict";

// Create a program from a list of shaders.
function create_program(gl, shaders, attrs, locs) {
  var program = gl.createProgram();
  shaders.forEach(function (shader) {
    gl.attachShader(program, shader);
  });
  if (attrs) {
    attrs.forEach(function (attr, i) {
      gl.bindAttribLocation(program, locs ? locs[i] : i, attrs[i]);
    });
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    var error = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw "Error linking program: %0".fmt(error);
  }
  return program;
}

// Compile a shader in a GL context from its source text and type.
function compile_shader(gl, source, type) {
  var shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    var error = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw "Error compiling shader: %0\n%1".fmt(error, source);
  }
  return shader;
}

// Create a shader from a script element and an optional type (to override the
// one in the script tag.)
function create_shader_from_script(gl, script, type) {
  if (!script) {
    throw "Unknown script element “%0”".fmt(id);
  }
  if (!type) {
    if (script.type == "x-shader/x-vertex") {
      type = gl.VERTEX_SHADER;
    } else if (script.type == "x-shader/x-fragment") {
      type = gl.FRAGMENT_SHADER;
    } else if (type != gl.VERTEX_SHADER && type != gl.FRAGMENT_SHADER) {
      throw "Unknown shader type";
    }
  }
  return compile_shader(gl, script.textContent, type);
}
