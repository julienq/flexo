(function (rough) {
  "use strict";

  rough.HANDLE_RADIUS = 4;  // radius of handles


  // Create a button from an HTML element.
  var ui_button = (rough.UIButton = function (element) {
    this.element = element;
    this.element.addEventListener("mousedown", this);
    this.element.addEventListener("touchstart", this);
  }).prototype;

  // A button can be selected or unselected, which is represented by the class
  // of its element.
  Object.defineProperty(ui_button, "selected", {
    enumerable: true,
    get: function () {
      return this.element.classList.contains("selected");
    },
    set: function (p) {
      flexo.set_class_iff(this.element, "selected", p);
    }
  });

  // Reflect the current status of the button through the class of its element.
  ui_button.handleEvent = function (e) {
    if (e.type === "mousedown" && e.button === 0) {
      e.preventDefault();
      this.element.classList.add("down");
      window.document.addEventListener("mouseup", this);
    } else if (e.type === "touchstart") {
      e.preventDefault();
      this.element.classList.add("down");
      this.element.addEventListener("touchend", this);
    } else if (e.type === "mouseup" || e.type === "touchend") {
      this.element.classList.remove("down");
      window.document.removeEventListener("mouseup", this);
      this.element.removeEventListener("touchend", this);
      flexo.notify(this, "pushed", { element: this.element });
    }
  };


  // Tools
  // Prototype for a tool that draws by dragging the mouse from a starting point
  // in order to create an SVG element.
  var tool = (rough.Tool = function () {}).prototype;

  tool.init = function (sketch, drag) {
    this.sketch = sketch;
    this.drag = drag;
  };

  tool.enable = function (p) {
    this.drag.enable(p);
  };


  var select_rectangle_tool =
  flexo._class(rough.SelectRectangleTool = function (sketch) {
    this.init(sketch, new rough.DragArea(sketch.svg, function (p) {
      return sketch.add_shape(new rough.RectangleShape(flexo.$rect({ x: p.x,
        y: p.y, "stroke-dasharray": "3 3" })));
    }));
    flexo.listen(this.drag, "dragstop", function (e) {
      sketch.remove_shape(e.source.shape);
    });
  }, rough.Tool);


  var draw_rectangle_tool =
  flexo._class(rough.DrawRectangleTool = function (sketch) {
    this.init(sketch, new rough.DragArea(sketch.svg, function (p) {
      return sketch.add_shape(new rough.RectangleShape(flexo.$rect({ x: p.x,
        y: p.y })));
    }));
    flexo.listen(this.drag, "dragstop", function (e) {
      flexo.notify(this.sketch, "drawn", { shape: e.source.shape });
    }.bind(this));
  }, rough.Tool);

  var draw_ellipse_tool =
  flexo._class(rough.DrawEllipseTool = function (sketch) {
    this.init(sketch, new rough.DragArea(sketch.svg, function (p) {
      return sketch.add_shape(new rough.EllipseShape(flexo.$ellipse({ cx: p.x,
        cy: p.y })));
    }));
    flexo.listen(this.drag, "dragstop", function (e) {
      flexo.notify(this.sketch, "drawn", { shape: e.source.shape });
    }.bind(this));
  }, rough.Tool);


  // Init the sketch area and listen to events that are sent on its behalf.
  function init_sketch() {
    var sketch = new rough.Sketch(window.document.querySelector("svg"));
    var selection = [];
    flexo.listen(sketch, "selecting", function (e) {
      var area = e.area.getBBox();
      selection = sketch.bounding_boxes.filter(function (bbox) {
        return encloses(area, bbox);
      });
    });
    flexo.listen(sketch, "selected", function (e) {
      flexo.safe_remove(e.area);
    });
    return sketch;
  }

  // Return true if and only if the outer rectangle encloses the inner bounding
  // box.
  function encloses(outer, inner) {
    return outer.x <= inner.x && outer.y <= inner.y &&
      outer.x + outer.width >= inner.x + inner.width &&
      outer.y + outer.height >= inner.y + inner.height;
  }

  // Initialize the toolbar: associate a tool with each button, following the
  // data-tool attribute. When the button is pressed, it gets selected and the
  // corresponding tool gets enabled. The previous selection is, of course,
  // unselected/disabled. The first button gets selected.
  function init_toolbar(sketch) {
    var buttons = window.document.querySelectorAll(".toolbar .button");
    var default_button;
    var selected_shapes = [];
    var selected_button;
    var select_button = function (e) {
      var args = { tool: e.source.tool };
      if (selected_button) {
        selected_button.selected = false;
        selected_button.tool.enable(false);
        args.prev = selected_button.tool;
        sketch.svg.classList
          .remove("tool-" + selected_button.element.dataset.tool);
      }
      selected_button = e.source;
      selected_button.selected = true;
      selected_button.tool.enable(true);
      sketch.svg.classList.add("tool-" + selected_button.element.dataset.tool);
      selected_shapes.forEach(function (shape) {
        shape.show_handles(false);
      });
      flexo.notify(sketch, "new-tool", args);
    };
    Array.prototype.slice.call(buttons).forEach(function (element) {
      var button = new rough.UIButton(element);
      button.tool = new rough[element.dataset.tool](sketch);
      flexo.listen(button, "pushed", select_button);
      if (!selected_button) {
        select_button({ source: button });
        default_button = button;
      }
    });
    flexo.listen(sketch, "drawn", function (e) {
      select_button({ source: default_button });
      e.shape.show_handles(true);
      selected_shapes = [e.shape];
    });
  }

  // Initialize the sketch and the tools from the HTML toolbar.
  rough.init_gui = function () {
    var sketch = init_sketch();
    init_toolbar(sketch);
  };

}(window.rough = {}));
