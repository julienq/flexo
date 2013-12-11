(function (rough) {
  "use strict";

  // SVG drag manager
  var drag = (rough.Drag = function () {}).prototype;

  // Initialize the drag manager for an element, registering mouse/touch events.
  // TODO pointer events
  drag.init = function (element) {
    this.element = element;
  };

  drag.enable = function (p) {
    if (p) {
      this.element.addEventListener("mousedown", this);
      this.element.addEventListener("touchstart", this);
    } else {
      this.element.removeEventListener("mousedown", this);
      this.element.removeEventListener("touchstart", this);
    }
  };

  // Start dragging using mouse events
  drag.mousedrag = function (e) {
    if (!e) {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", this);
      document.removeEventListener("mouseup", this);
      delete this.svg;
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    document.addEventListener("mousemove", this);
    document.addEventListener("mouseup", this);
    this.svg = flexo.find_svg(e.target);
    return flexo.event_svg_point(e, this.svg);
  };

  // Start dragging using touch events
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

  // Stubs for event handling
  drag.start = function (p) {};
  drag.move = function (p) {};

  drag.stop = function () {
    flexo.notify(this, "dragstop");
  };

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


  // Drag to move
  var drag_move = flexo._class(rough.DragMove = function (handle, shape) {
    this.init(handle);
    this.shape = shape;
    this.enable(true);
  }, rough.Drag);

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


  var drag_area = flexo._class(rough.DragArea = function (elem, f) {
    this.init(elem);
    this.f = f;
  }, rough.Drag);

  drag_area.start = function (p) {
    this.shape = this.f.call(this, p);
    this.x0 = this.x = p.x;
    this.y0 = this.y = p.y;
  };

  drag_area.move = function (p) {
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


  // Drag to resize
  var drag_resize =
  flexo._class(rough.DragResize = function (handle, shape, i) {
    this.init(handle);
    this.shape = shape;
    this.index = i;
    this.enable(true);
  }, rough.Drag);

  drag_resize.start = function (p) {
    document.body.style.cursor = "pointer";  // TODO directions
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

  drag_resize.move = drag_area.move;


  // Drag to make a polyline
  var drag_polyline = flexo._class(rough.DragPolyline = function (elem) {
    this.init(elem);
  }, rough.Drag);

  drag_polyline.start = function (p) {
  };

}(window.rough));
