(function () {
  "use strict";

  var colors = "red orange yellow green blue indigo violet".split(" ");

  var box_drag = Object.create(flexo.ui.drag, {
    elements: { enumerable: true, value: [] }
  });

  box_drag.start = function (x, y, e) {
    flexo.ui.drag.start.call(this, x, y, e);
    this.links = Array.prototype.filter.call(this.elem
      .querySelectorAll(".links > div"), function (div) {
        return !!div._line;
      });
  };

  box_drag.move = function (x, y) {
    if (flexo.ui.drag.move.call(this, x, y)) {
      this.links.forEach(function (div) {
        var rect = div.getBoundingClientRect();
        div._line.setAttribute("x1", rect.left + rect.width / 2);
        div._line.setAttribute("y1", rect.bottom);
      }, this);
      var rect = this.elem.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top;
      this.elem._lines.forEach(function (line) {
        line.setAttribute("x2", x);
        line.setAttribute("y2", y);
      });
    }
  };

  box_drag.stop = function () {
    if (flexo.ui.drag.stop.call(this)) {
      delete this.links;
    }
  };

  var link_drag = Object.create(flexo.ui.drag, {
    elements: { enumerable: true, value: [] }
  });

  link_drag.start = function (x, y, e) {
    this.stop();
    var rect = e.currentTarget.getBoundingClientRect();
    if (e.currentTarget._line) {
      flexo.safe_remove(e.currentTarget._line);
    }
    this.x = 0;
    this.y = 0;
    var x = rect.left + rect.width / 2;
    var y = rect.bottom;
    this.line = this.underlay.appendChild(flexo.$line({ x1: x, y1: y, x2: x,
      y2: y, "stroke-width": 2, stroke: window.getComputedStyle(e.currentTarget)
        .getPropertyValue("background-color") }));
    e.currentTarget._line = this.line;
  };

  link_drag.move = function (x, y) {
    if (this.line) {
      this.box = box_of(document.elementFromPoint(x, y));
      if (this.box) {
        var rect = this.box.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top;
      }
      this.line.setAttribute("x2", x);
      this.line.setAttribute("y2", y);
    }
  };

  link_drag.stop = function () {
    if (this.line) {
      if (this.box) {
        this.box._lines.push(this.line);
      } else {
        flexo.safe_remove(line);
      }
      delete this.box;
      delete this.line;
    }
  };


  var edit = window.edit = {};

  edit.init = function () {
    flexo.ui.drag.timeout = function (e) {
      var node = flexo.find_ancestor_or_self(e.target, function (node) {
        return node.dataset && node.dataset.editable;
      });
      if (node) {
        return node.dataset.editable === "inline" ? 300 : 0;
      }
    };
    link_drag.underlay = document.querySelector(".underlay");
    var toolbar = new edit.Toolbar().init(document.querySelector(".toolbar"));
    toolbar.story = new edit.Story().init();
    toolbar.add_();
  };


  var story = (edit.Story = function () {}).prototype;

  story.init = function () {
    this.id = Math.random().toString(36).substr(2);
    this.fragments = {};
    this.counter = 0;
    this.lang = flexo.ui.l.default_lang;
    return this;
  };

  story.serialize = function () {
    console.log(new XMLSerializer().serializeToString(this.to_xml()));
  };

  story.to_xml = function () {
    var doc = window.document.implementation
      .createDocument(null, "story", null);
    doc.documentElement.setAttribute("lang", this.lang);
    for (var id in this.fragments) {
      doc.documentElement.appendChild(this.fragments[id].to_xml(doc));
    }
    return doc;
  };

  story.add_fragment = function (fragment) {
    fragment.id = "f%0".fmt(this.counter++);
    fragment.story = this;
    this.fragments[fragment.id] = fragment;
    return fragment;
  };

  story.delete_fragment = function (fragment) {
    delete this.fragments[fragment.id];
  };


  var fragment = (edit.Fragment = function () {}).prototype;

  fragment.init = function () {
    this.title = flexo.ui.l.untitled;
    this.links = [];
    return this;
  };

  fragment.to_xml = function (doc) {
    var elem = doc.createElement("fragment");
    elem.id = this.id;
    elem.setAttribute("title", this.title);
    for (var node = this.content.firstChild; node; node = node.nextSibling) {
      content_to_xml(node, elem);
    }
    return elem;
  };

  function content_to_xml(node, parent) {
    if (node.nodeType === window.Node.TEXT_NODE) {
      parent.appendChild(parent.ownerDocument.createTextNode(node.textContent));
    } else if (node.nodeType === window.Node.ELEMENT_NODE) {
      var a = parent.appendChild(parent.ownerDocument.createElement("a"));
      a.setAttribute("href", "#");
      for (var node = node.firstChild; node; node = node.nextSibling) {
        content_to_xml(node, a);
      }
    }
  }


  var box = (edit.Box = function () {}).prototype;

  box.init = function (fragment) {
    this.fragment = fragment;
    this.title = flexo.$div({ "class": "title", "data-editable": "inline" },
        fragment.title);
    this.content = fragment.content = flexo.$div({ "class": "content",
      "data-editable": "linkable" }, "Foo bar baz");
    this.links = flexo.$div({ "class": "links" });
    this.title.addEventListener("keydown", function (e) {
      if (e.keyCode === 13) {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.blur();
      }
    }, false);
    this.title.addEventListener("blur", unedit, false);
    this.content.addEventListener("blur", unedit, false);
    this.elem = flexo.ui.draggable(flexo.$div({ "class": "box",
      spellcheck: "false" }, this.title, this.content, this.links), box_drag);
    this.elem._lines = [];
    flexo.listen(this.elem, "undrag", this);
    flexo.listen(this.elem, "link", this);
    flexo.listen(this.elem, "title", this);
    return this;
  };

  box.handleEvent = function (e) {
    if (e.type === "undrag") {
      if (e.target.dataset.editable) {
        e.target.contentEditable = "true";
        var range = document.createRange();
        range.selectNodeContents(e.target);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } else if (e.type === "link") {
      var color = colors[this.fragment.links.length % colors.length];
      this.fragment.links.push(e.span);
      e.span.classList.add(color);
      var n = this.fragment.links.length.toString();
      /*e.span.appendChild(flexo.$span({ "class": "linkno %0".fmt(color) },
            flexo.$span(n)));*/
      this.links.appendChild(flexo.ui.draggable(flexo.$div({ "class": color },
              n), link_drag));
    } else if (e.type === "title") {
      if (/\S/.test(this.title.textContent)) {
        this.fragment.title = this.title.textContent;
      } else {
        this.title.textContent = this.fragment.title;
      }
    }
  };

  function unedit(e) {
    e.currentTarget.contentEditable = "false";
    if (e.currentTarget.classList.contains("title")) {
      flexo.notify(box_of(e.currentTarget), "title");
    }
  }


  var toolbar = (edit.Toolbar = function () {}).prototype;

  toolbar.handleEvent = function (e) {
    var f = toolbar[e.type] || toolbar[e.source.dataset.action];
    if (typeof f === "function") {
      f.call(this, e.source);
    }
  };

  toolbar.select = function (elem) {
    if (this.selected && this.selected !== elem) {
      this.selected.classList.remove("selected");
    }
    if (this.selected !== elem) {
      this.selected = elem;
      if (this.selected) {
        this.selected.classList.add("selected");
      }
    }
    flexo.set_class_iff(this.buttons["delete"], "disabled", !this.selected);
  }

  toolbar.drag = function (elem) {
    this.select(elem);
  };

  toolbar.add = function () {
    this.select(this.add_().elem);
  };

  toolbar.add_ = function () {
    var fragment = this.story.add_fragment(new edit.Fragment().init());
    var box = new edit.Box().init(fragment);
    document.body.appendChild(box.elem);
    var rect = box.elem.getBoundingClientRect();
    flexo.ui.translate(box.elem,
      flexo.random_int(0, window.innerWidth - rect.width),
      flexo.random_int(0, window.innerHeight - rect.height));
    flexo.listen(box.elem, "drag", this);
    return box;
  };

  toolbar["delete"] = function () {
    if (this.selected) {
      flexo.unlisten(this.selected, "drag", this);
      flexo.ui.undraggable(this.selected);
      flexo.safe_remove(this.selected);
      this.story.delete_fragment(this.selected.fragment);
      this.select(null);
    }
  };

  toolbar.link = function () {
    var selection = window.getSelection();
    if (linkable(selection)) {
      if (selection.isCollapsed) {
        start_link(selection);
      } else {
        link_range(selection);
      }
    }
  };

  toolbar.init = function (div) {
    div.__toolbar = this;
    this.buttons = {};
    Array.prototype.forEach.call(div.querySelectorAll("[data-action]"),
      function (elem) {
        flexo.listen(this.buttons[elem.dataset.action] = flexo.ui.pushable(elem),
          "push", this);
      }, this);
    return this;
  };


  // Find the box to which a node belongs
  function box_of(node) {
    for (; node && !(node.classList && node.classList.contains("box"));
        node = node.parentNode) {}
    return node;
  }

  // Determine whether a link can be created for this selection.
  function linkable(selection) {
    if (!selection || selection.anchorNode !== selection.focusNode) {
      return;
    }
    for (var node = selection.anchorNode;
        node && !(node.dataset && node.dataset.editable);
        node = node.parentNode);
    return node && node.dataset.editable === "linkable";
  }

  // Link the selected range.
  function link_range(selection) {
    var node = selection.anchorNode;
    node.parentNode.insertBefore(document.createTextNode(node
          .textContent.substr(selection.focusOffset)), node.nextSibling);
    var span = node.parentNode.insertBefore(flexo.$span({ "class": "link" },
          node.textContent.substring(selection.anchorOffset,
            selection.focusOffset)), node.nextSibling);
    node.textContent = node.textContent.substr(0, selection.anchorOffset);
    flexo.notify(box_of(node), "link", { span: span });
  }

  // Start a link while editing.
  function start_link(selection) {
    var node = flexo.split_text_node(selection.anchorNode,
        selection.anchorOffset);
    if (/\S$/.test(selection.anchorNode.textContent)) {
      selection.anchorNode.textContent += " ";
    }
    if (/^\S/.test(node.textContent)) {
      node.textContent = " " + node.textContent;
    }
    var span = node.parentNode.insertBefore(flexo.$span({ "class": "link" },
          flexo.ui.l.new_link), node);
    var range = document.createRange();
    range.selectNodeContents(span);
    selection.removeAllRanges();
    selection.addRange(range);
    flexo.notify(box_of(node), "link", { span: span });
  }

}());
