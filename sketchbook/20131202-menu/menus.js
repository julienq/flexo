(function (ui) {
  "use strict";

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


  var on = {
    about: function () {
      alert("This is a simple demo of drop-down menus.");
    },
    quit: function () {
      window.location = "../index.html";
    },
    enable: function (item) {
      var item_ = item.menu.items[item.menu.items.indexOf(item) + 1];
      if (item_) {
        item.enabled = false;
        item_.enabled = true;
      }
    },
    disable: function (item) {
      var item_ = item.menu.items[item.menu.items.indexOf(item) - 1];
      if (item_) {
        item.enabled = false;
        item_.enabled = true;
      }
    }
  };

  (function () {
    var menu = new ui.MenuBar(document.querySelector(".menubar"));
    flexo.listen(menu, "item", function (e) {
      var f = on[e.item.name];
      if (typeof f === "function") {
        f(e.item);
      }
    });
  }());


}(window.ui = {}));
