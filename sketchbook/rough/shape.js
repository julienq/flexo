(function (rough) {
  "use strict";

  // A shape is represented by an element (e.g. SVG rect or ellipse) and can
  // have handles to stretch it. Shapes should be subclassed to handle the
  // actual updating of the element when stretched.
  var shape = (rough.Shape = function () {}).prototype;

  // Initialize the shape with an element.
  shape.init = function (element) {
    this.element = element;
  };

  // Show or hide handles depending on p
  shape.show_handles = function (p) {
    if (p && !this.handles) {
      this.resize = init_handles(this)
      this.handles = flexo.add_after(this.resize.parentNode, this.element);
      update_handles(this);
    } else if (!p) {
      flexo.safe_remove(this.handles);
      delete this.handles;
    }
  };

  function init_handles(shape) {
    var handles = flexo.$g({ fill: "black", stroke: "none" });
    var mask = null;
    var update_mask = function () {
      var mask_ = shape.element.cloneNode(true);
      if (mask) {
        handles.replaceChild(mask_, mask);
      } else {
        handles.appendChild(mask_);
      }
      mask = mask_;
      mask.setAttribute("fill-opacity", 0.1);
      flexo.listen_once(new rough.DragMove(mask, shape), "dragstop",
          update_mask);
    };
    update_mask();
    var resize = handles.appendChild(flexo.$g());
    for (var i = 0; i < 8; ++i) {
      var elem = resize.appendChild(flexo.$circle({ r: rough.HANDLE_RADIUS }));
      flexo.listen(new rough.DragResize(elem, shape, i + (i > 3 ? 1 : 0)),
          "dragstop", update_mask);
    }
    return resize;
  }

  // Update the handles with the current bounding box of the shape’s element
  function update_handles(shape) {
    if (!shape.handles) {
      return;
    }
    var bb = shape.element.getBBox();
    var w = bb.width / 2;
    var h = bb.height / 2;
    $foreach(shape.resize.childNodes, function (c, i) {
      var j = i + (i > 3 ? 1 : 0);
      c.setAttribute("cx", bb.x + w * Math.floor(j / 3));
      c.setAttribute("cy", bb.y + h * (j % 3));
    });
  }


  // Rectangle shape
  var rectangle = flexo._class(rough.RectangleShape = function (elem) {
    this.init(elem || flexo.$rect());
  }, rough.Shape);

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
  var ellipse = flexo._class(rough.EllipseShape = function (elem) {
    this.init(elem || flexo.$ellipse());
  }, rough.Shape);

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


  var sketch = (rough.Sketch = function (svg) {
    this.svg = svg;
    this.g = svg.querySelector("g");
  }).prototype;

  // Get the bounding boxes of all shapes in the drawing.
  // TODO update when shapes are added or removed.
  Object.defineProperty(sketch, "bounding_boxes", {
    enumerable: true,
    get: function () {
      return $filter(this.g.childNodes, function (n) {
        return n.nodeType === window.Node.ELEMENT_NODE;
      }).map(function (element) {
        return element.getBBox();
      });
    }
  });

  // Add a shape to the right destination in the drawing and return it.
  sketch.add_shape = function (shape) {
    shape.sketch = this;
    flexo.listen_once(shape, "drawn", function (e) {
      notify(this, "drawn", { shape: shape });
    }.bind(this));
    return this.g.appendChild(shape.element), shape;
  };

  sketch.remove_shape = function (shape) {
    if (shape.sketch !== this) {
      return;
    }
    delete shape.sketch;
    flexo.safe_remove(shape.element);
  };

}(window.rough));
