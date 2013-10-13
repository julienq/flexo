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
      if ((e.type === "mousedown" || e.type === "touchstart") &&
        !(e.currentTarget.classList &&
          e.currentTarget.classList.contains("disabled"))) {
        e.preventDefault();
        this.down = e.currentTarget;
        if (this.down.classList) {
          this.down.classList.add("down");
        }
      } else {
        if (this.down) {
          if (this.down.classList) {
            this.down.classList.remove("down");
          }
          flexo.notify(this.down, "push");
          delete this.down;
        }
      }
    },
  };

  ui.pushable = function (node) {
    var p = Object.create(push);
    node.addEventListener("mousedown", p, false);
    document.addEventListener("mouseup", p, false);
    node.addEventListener("touchstart", p, false);
    node.addEventListener("touchend", p, false);
    return node;
  };

  var drag = ui.drag = {

    elements: [],

    timeout: flexo.nop,

    handleEvent: function (e) {
      if (e.type === "mousedown") {
        if (e.button === 0 && !e.target.isContentEditable) {
          e.preventDefault();
          e.stopPropagation();
          this.set_timeout(e);
          this.set_offset(e);
          this.start(e.clientX - this.x, e.clientY - this.y, e);
        }
      } else if (e.type === "touchstart") {
        if (e.touches.length > 0 && !e.target.isContentEditable) {
          e.preventDefault();
          e.stopPropagation();
          this.set_timeout(e);
          this.set_offset(e);
          this.start(e.touches[0].clientX - this.x,
              e.touches[0].clientY - this.y, e);
        }
      } else if (e.type === "mousemove") {
        this.clear_timeout();
        this.move(e.clientX - this.x, e.clientY - this.y);
      } else if (e.type === "touchmove" && e.touches.length > 0) {
        this.clear_timeout();
        this.move(e.touches[0].clientX - this.x, e.touches[0].clientY - this.y);
      } else if (e.type === "mouseup" || e.type == "touchend") {
        this.stop();
      }
    },

    set_timeout: function (e) {
      var args = { currentTarget: e.currentTarget, target: e.target };
      flexo.notify(args.currentTarget, "drag", args);
      console.log("drag", args.currentTarget);
      var timeout = this.timeout(e);
      if (timeout >= 0) {
        this.__timeout = window.setTimeout(function () {
          delete this.__timeout;
          this.stop();
          flexo.notify(args.currentTarget, "undrag", args);
        }.bind(this), timeout);
      }
    },

    clear_timeout: function () {
      if (this.__timeout) {
        window.clearTimeout(this.__timeout);
        delete this.__timeout;
      }
    },

    set_offset: function (e) {
      var rect = e.currentTarget.getBoundingClientRect();
      this.x = rect.left;
      this.y = rect.top;
    },

    start: function (x, y, e) {
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
        delete this.x;
        delete this.y;
        this.elem.classList.remove("drag");
        delete this.elem;
      }
    }
  };

  ui.draggable = function (element, drag) {
    if (typeof drag === "undefined") {
      drag = ui.drag;
    }
    element.addEventListener("mousedown", drag, false);
    element.addEventListener("touchstart", drag, false);
    element.addEventListener("touchmove", drag, false);
    element.addEventListener("touchend", drag, false);
    if (drag.elements.length === 0) {
      document.addEventListener("mouseup", drag, false);
      document.addEventListener("mousemove", drag, false);
    }
    drag.elements.push(element);
    return element;
  };

  ui.undraggable = function (element, drag) {
    if (typeof drag === "undefined") {
      drag = ui.drag;
    }
    element.removeEventListener("mousedown", drag, false);
    element.removeEventListener("touchstart", drag, false);
    element.removeEventListener("touchmove", drag, false);
    element.removeEventListener("touchend", drag, false);
    flexo.remove_from_array(drag.elements, element);
    if (drag.elements.length === 0) {
      document.removeEventListener("mouseup", drag, false);
      document.removeEventListener("mousemove", drag, false);
    }
    return element;
  };

  (function () {
    ui.l = {};
    Array.prototype.forEach.call(document.querySelectorAll("[data-key]"),
      function (elem) {
        ui.l[elem.dataset.key] = elem.textContent;
      });
  }());

}());
