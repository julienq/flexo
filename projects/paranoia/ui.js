(function (ui) {
  "use strict";

  var status = document.getElementById("status");

  ui.status = function(msg) {
    status.textContent = msg;
  };

  var locations = {
    element: document.getElementById("locations"),
    locations: []
  };

  document.addEventListener("mousemove", function (e) {
    if (locations.select) {
      locations.moving = true;
      locations.current = flexo.event_client_pos(e);
      locations.select.style.transform =
      locations.select.style.webkitTransform = "";
      flexo.foreach(document.querySelectorAll(".target"), function (elem) {
        elem.classList.remove("target");
      });
      var target = window.document.elementFromPoint(locations.current.x,
        locations.current.y);
      if (target && target.__item && target !== locations.select) {
        target.classList.add("target");
      }
      locations.select.style.transform =
      locations.select.style.webkitTransform = "translate(%0px, %1px)"
        .fmt(locations.current.x - locations.origin.x,
          locations.current.y - locations.origin.y);
    }
  });

  document.addEventListener("mouseup", function (e) {
    if (locations.origin) {
      locations.select.classList.remove("moving");
      if (locations.moving) {
        locations.select.style.transform =
        locations.select.style.webkitTransform = "";
        delete locations.moving;
        var target = window.document.elementFromPoint(locations.current.x,
          locations.current.y);
        if (target && target.__item) {
          locations.select.__item.apply_rules(target.__item);
        }
        flexo.foreach(document.querySelectorAll(".target"), function (elem) {
          elem.classList.remove("target");
        });
        delete locations.current;
      } else {
        locations.select.__item.apply_rules();
      }
      delete locations.select;
      delete locations.origin;
    }
  });

  ui.enter_location = function (location) {
    locations.locations.push(location);
    var items = location.items();
    if (items.length > 0) {
      var ul = flexo.$("ul.items");
      items.forEach(function (item) {
        var li = ul.appendChild(flexo.$li({ "class" : item.tags().join(" ") },
            item.desc));
        li.__item = item;
        li.addEventListener("mousedown", function (e) {
          e.preventDefault();
          if (/* item.can_move */ true) {
            li.classList.add("moving");
            locations.select = li;
            locations.origin = flexo.event_client_pos(e);
          }
        });
      });
    }
    location.__element =
      locations.element.appendChild(flexo.$("div.location", location.desc, ul));
  };

  ui.leave_location = function (location) {
    location = flexo.remove_from_array(locations.locations, location);
    if (location) {
      flexo.safe_remove(location.__element);
      delete location.__element;
    }
  };

  flexo.listen(paranoia.Location, "enter", function (e) {
    ui.enter_location(e.source.current);
  });

  flexo.listen(paranoia.Location, "leave", function (e) {
    ui.leave_location(e.source.current);
  });

}(window.ui = {}));
