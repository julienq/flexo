(function (bbox) {
  "use strict";

  bbox.HANDLE_RADIUS = 4;  // radius of handles


  // A shape is represented by an element (e.g. SVG rect or ellipse) and can
  // have handles to stretch it. Shapes should be subclassed to handle the
  // actual updating of the element when stretched.
  var shape = (bbox.Shape = function () {}).prototype;

  // Initialize the shape with an element.
  shape.init = function (element) {
    this.element = element;
  };

  // Add/remove handles from a shape. The handles can be dragged to stretch the
  // shape.
  Object.defineProperty(shape, "handles", {
    enumerable: true,
    set: function (p) {
      p = !!p;
      if (p && !this._handles) {
        this._handles = flexo.add_after(init_handles(this), this.element);
        update_handles(this);
      } else if (!p) {
        flexo.safe_remove(this._handles);
        delete this._handles;
      }
    }
  });


  // Rectangle shape
  var rectangle = flexo._class(bbox.Rectangle = function (elem) {
    this.init(elem || flexo.$rect());
  }, bbox.Shape);

  rectangle.update_bbox = function (x, y, w, h) {
    if (x != null) {
      this.element.setAttribute("x", x);
    }
    if (y != null) {
      this.element.setAttribute("y", y);
    }
    if (w != null) {
      this.element.setAttribute("width", w);
    }
    if (h != null) {
      this.element.setAttribute("height", h);
    }
    update_handles(this);
  };


  // Ellipse shape
  var ellipse = flexo._class(bbox.Ellipse = function (elem) {
    this.init(elem || flexo.$ellipse());
  }, bbox.Shape);

  ellipse.update_bbox = function (x, y, w, h) {
    if (x != null) {
      w = w / 2;
      this.element.setAttribute("cx", x + w);
      this.element.setAttribute("rx", w);
    }
    if (y != null) {
      h = h / 2;
      this.element.setAttribute("cy", y + h);
      this.element.setAttribute("ry", h);
    }
    update_handles(this);
  };


  // Create handles for the shape. The outer handles will stretch, while the
  // inner handle will move.
  function init_handles(shape) {
    var handles = flexo.$g({ fill: "black", stroke: "none" });
    for (var i = 0; i < 9; ++i) {
      handles.appendChild(draggable(flexo.$circle({ r: bbox.HANDLE_RADIUS }),
            shape, i));
    }
    return handles;
  }

  // Update the handles with the current bounding box of the shape’s element
  function update_handles(shape) {
    if (!shape._handles) {
      return;
    }
    var bb = shape.element.getBBox();
    var w = bb.width / 2;
    var h = bb.height / 2;
    $foreach(shape._handles.childNodes, function (c, i) {
      c.setAttribute("cx", bb.x + w * Math.floor(i / 3));
      c.setAttribute("cy", bb.y + h * (i % 3));
    });
  }


  // Drag manager
  var drag = (bbox.Drag = function () {}).prototype;

  drag.init = function (elem) {
    this.element = elem;
    elem.addEventListener("mousedown", this);
    elem.addEventListener("touchstart", this);
  };

  drag.mousedrag = function (e) {
    if (!e) {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", this);
      document.removeEventListener("mouseup", this);
      delete this.svg;
      return;
    }
    e.preventDefault();
    document.addEventListener("mousemove", this);
    document.addEventListener("mouseup", this);
    this.svg = flexo.find_svg(e.target);
    return flexo.event_svg_point(e, this.svg);
  };

  drag.touchdrag = function (e) {
    if (!e) {
      document.body.style.cursor = "";
      this.element.removeEventListener("touchmove", this);
      this.element.removeEventListener("touchend", this);
      delete this.svg;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    this.element.addEventListener("touchmove", this);
    this.element.addEventListener("touchend", this);
    this.svg = flexo.find_svg(e.target);
    return flexo.event_svg_point(e, this.svg);
  };

  drag.start = function (p) {};
  drag.move = function (p) {};
  drag.stop = function () {};

  drag.handleEvent = function (e) {
    if (e.type === "mousedown" && e.button === 0) {
      this.start(this.mousedrag(e));
    } else if (e.type === "touchstart") {
      this.start(this.touchdrag(e));
    } else if (e.type === "mousemove" || e.type === "touchmove") {
      this.move(flexo.event_svg_point(e, this.svg));
    } else if (e.type === "mouseup") {
      this.stop();
      this.mousedrag();
    } else if (e.type === "touchend") {
      this.stop();
      this.touchdrag();
    }
  };


  var drag_move = flexo._class(bbox.DragMove = function (handle, shape) {
    this.init(handle);
    this.shape = shape;
  }, bbox.Drag);

  drag_move.start = function (p) {
    document.body.style.cursor = "move";
    this.x = p.x;
    this.y = p.y;
    var bb = this.shape.element.getBBox();
    this.x0 = bb.x;
    this.y0 = bb.y;
    this.w = bb.width;
    this.h = bb.height;
  };

  drag_move.move = function (p) {
    this.shape.update_bbox(this.x0 + p.x - this.x, this.y0 + p.y - this.y,
        this.w, this.h);
  };


  var drag_stretch = flexo._class(bbox.DragStretch = function (handle, shape, i) {
    this.init(handle);
    this.shape = shape;
    this.index = i;
  }, bbox.Drag);

  drag_stretch.start = function (p) {
    document.body.style.cursor = "pointer";
    var bb = this.shape.element.getBBox();
    var w = bb.width / 2;
    var h = bb.height / 2;
    this.x0 = bb.x + w * (2 - Math.floor(this.index / 3));
    this.y0 = bb.y + h * (2 - (this.index % 3));
    this.x = p.x;
    this.y = p.y;
    this.xlock = Math.floor(this.index / 3) === 1;
    this.ylock = this.index % 3 === 1;
  };

  drag_stretch.move = function (p) {
    if (this.xlock) {
      this.shape.update_bbox(null, Math.min(this.y0, p.y), null,
          Math.abs(p.y - this.y0));
    } else if (this.ylock) {
      this.shape.update_bbox(Math.min(this.x0, p.x), null,
          Math.abs(p.x - this.x0), null);
    } else {
      this.shape.update_bbox(Math.min(this.x0, p.x), Math.min(this.y0, p.y),
          Math.abs(p.x - this.x0), Math.abs(p.y - this.y0));
    }
  };


  function draggable(elem, shape, index) {
    if (index === 4) {
      new bbox.DragMove(elem, shape);
    } else {
      new bbox.DragStretch(elem, shape, index);
    }
    return elem;
  }


  (function () {
    var rect = new bbox.Rectangle(document.querySelector("rect"));
    var ellipse = new bbox.Ellipse(document.querySelector("ellipse"));
    rect.handles = true;
    var on = {
      about: function () {
        alert("BBox drawing");
      },
      quit: function () {
        window.location = "../index.html";
      },
      rect: function (item) {
        item.enabled = false;
        document.querySelector("[data-name=ellipse]").classList
          .remove("disabled");
        ellipse.handles = false;
        var bb = ellipse.element.getBBox();
        rect.update_bbox(bb.x, bb.y, bb.width, bb.height);
        rect.handles = true;
      },
      ellipse: function (item) {
        item.enabled = false;
        document.querySelector("[data-name=rect]").classList.remove("disabled");
        rect.handles = false;
        var bb = rect.element.getBBox();
        ellipse.update_bbox(bb.x, bb.y, bb.width, bb.height);
        ellipse.handles = true;
      },
    };
    var menu = new flexo.ui.MenuBar(document.querySelector(".menubar"));
    flexo.listen(menu, "item", function (e) {
      var f = on[e.item.name];
      if (typeof f === "function") {
        f(e.item);
      }
    });
  }());


}(window.bbox = {}));
