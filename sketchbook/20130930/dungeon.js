(function () {
  "use strict";

  // Actions for the buttons (so far only up and down actually)
  // Note that the directions are reversed at the moment
  var buttons = {
    "dir-turn-left": [function() { player.turn(world, +1); }, "U"],
    "dir-up": [function() { player.step(world, 0, -1); }, "K"],
    "dir-turn-right": [function() { player.turn(world, -1)}, "O"],
    "dir-left": [function() { player.step(world, -1, 0); }, "H"],
    "dir-down": [function() { player.step(world, 0, +1); }, "J"],
    "dir-right": [function() { player.step(world, +1, 0); }, "L"],
  };

  // Make a button out of an element
  function make_button(button, f) {
    button.classList.add("button");
    var down = function(e) {
      e.preventDefault();
      if (!button.classList.contains("disabled")) {
        button.classList.add("pushed");
      }
    };
    var out = function(e) {
      e.preventDefault();
      button.classList.remove("pushed");
    }
    var up = function(e) {
      if (e) {
        e.preventDefault();
      }
      if (button.classList.remove("pushed")) {
        f(button);
      }
    }
    button.addEventListener("mousedown", down, false);
    button.addEventListener("touchstart", down, false);
    button.addEventListener("mouseout", out, false);
    button.addEventListener("mouseup", up, false);
    button.addEventListener("touchend", up, false);
  }

  // Adding keyboard shortcuts for buttons
  function make_button_(button, desc) {
    make_button(button, desc[0]);
    document.addEventListener("keydown", function(e) {
        if (e.keyCode === desc[1].charCodeAt(0)) {
          if (!button.classList.contains("disabled")) {
            button.classList.add("pushed");
          }
        }
      }, false);
    document.addEventListener("keyup", function(e) {
        if (e.keyCode === desc[1].charCodeAt(0)) {
          if (button.classList.remove("pushed")) {
            desc[0](button);
          }
        }
      }, false);
  }

  // Log messages to the console
  function log(msg) {
    var console = document.getElementById("console");
    console.insertBefore(flexo.$p(msg), console.firstElement);
  }

  for (var i in buttons) {
    make_button_(document.getElementById(i), buttons[i]);
  }
  log("You have been thrown into the Oubliette!");

}());
