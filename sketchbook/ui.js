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
        return true;
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
        return true;
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


  // Drop-down menus
  var menu_bar = (ui.MenuBar = function (div) {
    this.div = div;
    this.div.addEventListener("mousedown", prevent_default);
    this.div.addEventListener("touchstart", prevent_default);
    document.addEventListener("mousedown", this);
    document.addEventListener("touchstart", this);
    this.menus = $map(this.div.querySelectorAll(".menu"), function (div) {
      var menu = new ui.Menu(div);
      menu.bar = this;
      flexo.listen(menu, "down", this);
      flexo.listen(menu, "select", this);
      flexo.listen(menu, "item", this);
      return menu;
    }, this);
  }).prototype;

  menu_bar.handleEvent = function (e) {
    if (e.type === "mousedown" && e.button === 0 || e.type === "touchstart") {
      for (var p = e.target; p; p = p.parentNode) {
        if (p === this.div) {
          return;
        }
      }
      this.undown();
    } else if ((e.type === "select" && this.down && this.down !== e.source)) {
      this.undown();
    } else if (e.type === "item") {
      this.__item = e.item;
      this.__undown = window.setTimeout(this.undown.bind(this), 200);
    } else if (e.type === "down") {
      if (this.__undown) {
        this.undown();
      }
      this.down = e.source;
    }
  };

  menu_bar.undown = function () {
    if (this.down) {
      this.down.down = false;
      delete this.down;
    }
    if (this.__undown) {
      flexo.notify(this, "item", { item: this.__item });
      this.__item.done();
      delete this.__item;
      delete this.__undown;
    }
  };


  var menu = (ui.Menu = function (div) {
    this.div = div;
    this.ul = div.querySelector("ul");
    this.items = $map(div.querySelectorAll("li"), function (li) {
      var item = new ui.MenuItem(li);
      flexo.listen(item, "select", this);
      item.menu = this;
      return item;
    }, this);
    this.name = this.div.dataset.name;
    div.addEventListener("mousedown", this);
    div.addEventListener("touchstart", this);
  }).prototype;

  Object.defineProperty(menu, "enabled", {
    enumerable: true,
    get: function () {
      return !this.div.classList.contains("disabled");
    },
    set: function (p) {
      flexo.set_class_iff(this.div, "disabled", !p);
    }
  });

  Object.defineProperty(menu, "selected", {
    enumerable: true,
    get: function () {
      return this.div.classList.contains("selected");
    },
    set: function (p) {
      flexo.set_class_iff(this.div, "selected", p);
      if (!!p) {
        flexo.notify(this, "select");
      }
    }
  });

  Object.defineProperty(menu, "down", {
    enumerable: true,
    get: function () {
      return this.ul && this.ul.classList.contains("down");
    },
    set: function (p) {
      if (this.ul) {
        flexo.set_class_iff(this.ul, "down", p);
        if (!!p) {
          var bbox = this.div.getBoundingClientRect();
          this.ul.style.top = "%0px".fmt(bbox.bottom);
          this.ul.style.left = "%0px".fmt(bbox.left);
        }
      }
      this.selected = p;
      if (!!p) {
        flexo.notify(this, "down");
      }
    }
  });

  menu.handleEvent = function (e) {
    if (e.type === "select") {
      flexo.notify(this, "item", { item: e.source });
    } else if (e.type === "mousedown" && e.button === 0 && this.enabled) {
      e.preventDefault();
      this.selected = true;
      this.div.addEventListener("mouseout", this);
      window.document.addEventListener("mouseup", this);
    } else if (e.type === "touchstart" && this.enabled) {
      e.preventDefault();
      this.selected = true;
      this.div.addEventListener("touchcancel", this);
      this.div.addEventListener("touchend", this);
    } else {
      if (e.type === "mouseup" || e.type === "touchend") {
        this.down = true;
      } else {
        this.selected = false;
      }
      this.div.removeEventListener("mouseout", this);
      window.document.removeEventListener("mouseup", this);
      this.div.removeEventListener("touchcancel", this);
      this.div.removeEventListener("touchend", this);
    }
  };


  var menu_item = (ui.MenuItem = function (li) {
    this.li = li;
    this.name = li.dataset.name;
    li.addEventListener("mousedown", this);
    li.addEventListener("touchstart", this);
  }).prototype;

  Object.defineProperty(menu_item, "selected", {
    get: function () {
      return this.li.classList.contains("selected");
    },
    set: function (p) {
      flexo.set_class_iff(this.li, "selected", p);
    }
  });

  Object.defineProperty(menu_item, "enabled", {
    enumerable: true,
    get: function () {
      return !this.li.classList.contains("disabled");
    },
    set: function (p) {
      flexo.set_class_iff(this.li, "disabled", !p);
    }
  });

  menu_item.handleEvent = function (e) {
    if (e.type === "mousedown" && e.button === 0 && this.enabled) {
      e.preventDefault();
      this.selected = true;
      this.li.addEventListener("mouseout", this);
      window.document.addEventListener("mouseup", this);
    } else if (e.type === "touchstart" && this.enabled) {
      e.preventDefault();
      this.selected = true;
      this.li.addEventListener("touchcancel", this);
      this.li.addEventListener("touchend", this);
    } else {
      if (e.type === "mouseup" || e.type === "touchend") {
        flexo.notify(this, "select");
        this.li.classList.add("flash");
      }
      this.selected = false;
      this.li.removeEventListener("mouseout", this);
      window.document.removeEventListener("mouseup", this);
      this.li.removeEventListener("touchcancel", this);
      this.li.removeEventListener("touchend", this);
    }
  };

  menu_item.done = function () {
    this.li.classList.remove("flash");
  };


  function prevent_default(e) {
    e.preventDefault();
  }


  // Localization
  (function () {
    ui.l = {};
    $foreach(document.querySelectorAll("[data-key]"), function (elem) {
      ui.l[elem.dataset.key] = elem.textContent;
    });
  }());

}());
