(function () {
  "use strict";

  var ui = flexo.ui = {};

  ui.translate = function (elem, tx, ty) {
    elem.style.transform = elem.style.webkitTransform =
      "translate(%0px,%1px)".fmt(tx, ty);
  };

  // TODO get x/y position as well, button, touches, &c.
  var push = {
    handleEvent: function (e) {
      if (e.type === "mousedown" || e.type === "touchstart") {
        e.preventDefault();
        this.down = true;
      } else {
        if (this.down) {
          this.down = false;
          flexo.notify(e.currentTarget, "push");
        }
      }
    },
  };

  ui.pushable = function (node) {
    var p = Object.create(push);
    p.down = false;
    node.addEventListener("mousedown", p, false);
    document.addEventListener("mouseup", p, false);
    node.addEventListener("touchstart", p, false);
    node.addEventListener("touchend", p, false);
    return node;
  };

  var drag = {

    elements: [],

    handleEvent: function (e) {
      if (e.type === "mousedown") {
        e.preventDefault();
        e.stopPropagation();
        if (e.button === 0) {
          this.start(e, e.clientX, e.clientY);
        }
      } else if (e.type === "mousemove") {
        this.move(e.clientX, e.clientY);
      } else if (e.type === "mouseup") {
        this.stop();
      }
    },

    start: function (e, x, y) {
      this.stop();
      this.elem = e.currentTarget;
      var rect = this.elem.getBoundingClientRect();
      this.elem.__x = x - rect.left;
      this.elem.__y = y - rect.top;
      this.elem.classList.add("drag");
      var p = this.elem.parentNode;
      p.removeChild(this.elem);
      p.appendChild(this.elem);
    },

    move: function (x, y) {
      if (this.elem) {
        ui.translate(this.elem, x - this.elem.__x, y - this.elem.__y);
      }
    },

    stop: function () {
      if (this.elem) {
        delete this.elem.__x;
        delete this.elem.__y;
        this.elem.classList.remove("drag");
        delete this.elem;
      }
    }
  };

  ui.draggable = function (element) {
    element.addEventListener("mousedown", drag, false);
    if (drag.elements.length === 0) {
      document.addEventListener("mouseup", drag, false);
      document.addEventListener("mousemove", drag, false);
    }
    drag.elements.push(element);
    return element;
  };

}());
