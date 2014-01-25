(function () {
  "use strict";

  var parsec = window.parsec = {};

  var N_SLICES = 12;
  var M_SLICES = N_SLICES * 2;
  var N_STARS = 4;

  var svg = document.querySelector("svg");
  var bbox = svg.viewBox.baseVal;
  var W = bbox.width;
  var H = bbox.height;

  var defs = svg.querySelector("defs");
  var layers_g = document.getElementById("layers");

  parsec.Sliced = {
    width: W / N_SLICES,
    init: function (vx) {
      this.g = layers_g.appendChild(flexo.$g());
      this.x = 0;
      this.vx = vx;
      this.slices = flexo.times(M_SLICES, this.generate.bind(this));
      this.contents = flexo.times(N_SLICES + 1, this.use, this);
      return this;
    },
    generate: function () {
      return defs.appendChild(flexo.$g({ id: "s" + flexo.random_id(5) }));
      return defs.appendChild(flexo.$g({ id: "s" + flexo.random_id(5) },
            flexo.$rect({ width: this.width, height: H, fill: "none",
              stroke: "#f0f" })));
    },
    choose: function () {
      return flexo.random_element(this.slices);
    },
    use: function (i) {
      var slice = this.choose();
      return this.g.appendChild(flexo.$use({ x: i * this.width,
        "xlink:href": "#" + slice.getAttribute("id") }));
    },
    update: function (dt) {
      var dx = this.vx * dt;
      this.x -= dx;
      var i = 0;
      while (this.x < -this.width) {
        this.x += this.width;
        ++i;
        flexo.safe_remove(this.g.firstChild);
      }
      if (i > 0) {
        this.contents = this.contents.slice(i);
        $$push(this.contents, flexo.times(i, this.use, this));
        this.contents.forEach(function (slice, i) {
          slice.setAttribute("x", i * this.width);
        }, this);
      }
      this.g.setAttribute("transform", "translate(%0)".fmt(this.x));
    },
  };

  parsec.Stars = Object.create(parsec.Sliced);

  parsec.Stars.generate = function () {
    var g = parsec.Sliced.generate.call(this);
    g.setAttribute("fill", "white");
    for (var i = 0; i < N_STARS; ++i) {
      g.appendChild(flexo.$circle({ cx: flexo.random_int(this.width),
        cy: flexo.random_int(H), r: 1,
        "fill-opacity": flexo.random_number(0.5, 1) }));
    }
    return g;
  };

  parsec.Bars = Object.create(parsec.Sliced);

  parsec.Bars.generate = function () {
    var g = parsec.Sliced.generate.call(this);
    g.setAttribute("fill", "yellow");
    g.setAttribute("stroke", "yellow");
    var h = flexo.random_int(12, 48);
    g.appendChild(flexo.$rect({ y: H - h, width: this.width, height: h }));
    return g;
  };

  parsec.player_ship = {

    hitbox: { x: 6, y: 9, width: 30, height: 15, fill: "red",
      "fill-opacity": 0.5 },

    laser: { x: 54, y: 18 },

    v: 96,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,

    element: document.getElementById("player_ship"),

    show_hitbox: function () {
      this.element.appendChild(flexo.$rect(this.hitbox));
    },

    update_velocity: function (direction, p) {
      this[direction] = p;
      if (direction === "left") {
        this.vx = p ? -1 : this.right ? 1 : 0;
      } else if (direction === "right") {
        this.vx = p ? 1 : this.left ? -1 : 0;
      } else if (direction === "up") {
        this.vy = p ? -1 : this.down ? 1 : 0;
      } else {
        this.vy = p ? 1 : this.up ? -1 : 0;
      }
    },

    update: function (dt) {
      var dx = this.v * this.vx * dt;
      var dy = this.v * this.vy * dt;
      if (dx !== 0 && dy !== 0) {
        dx *= Math.SQRT1_2;
        dy *= Math.SQRT1_2;
      }
      this.x = flexo.clamp(this.x + dx, -this.hitbox.x,
          W - this.hitbox.x - this.hitbox.width);
      this.y = flexo.clamp(this.y + dy, -this.hitbox.y,
          H - this.hitbox.y - this.hitbox.height);
      this.element.setAttribute("transform",
          "translate(%0, %1)".fmt(this.x, this.y));
      if (this.fire) {
        var y = this.y + this.laser.y;
        var line = this.element.parentNode.insertBefore(flexo.$line({
          x1: this.x + this.laser.x, y1: y, x2: W, y2: y,
          stroke: "red", "stroke-linecap": "round",
          "stroke-width": 1 }), this.element);
        this.fire = false;
        setTimeout(function () {
          flexo.safe_remove(line);
        }, 240);
      }
    }
  };

  document.addEventListener("keydown", function (e) {
    switch (e.keyCode) {
      case 32:
      case 88:
      case 90:
        parsec.player_ship.fire = true;
        break;
      case 37:
        parsec.player_ship.update_velocity("left", true);
        break;
      case 38:
        parsec.player_ship.update_velocity("up", true);
        break;
      case 39:
        parsec.player_ship.update_velocity("right", true);
        break;
      case 40:
        parsec.player_ship.update_velocity("down", true);
    }
  });

  document.addEventListener("keyup", function (e) {
    switch (e.keyCode) {
      case 37:
        parsec.player_ship.update_velocity("left", false);
        break;
      case 38:
        parsec.player_ship.update_velocity("up", false);
        break;
      case 39:
        parsec.player_ship.update_velocity("right", false);
        break;
      case 40:
        parsec.player_ship.update_velocity("down", false);
        break;
      case 72:
        parsec.player_ship.show_hitbox();
    }
  });

  parsec.layers = [
    Object.create(parsec.Stars).init(4),
    Object.create(parsec.Stars).init(7),
    Object.create(parsec.Bars).init(128)
  ];

  (parsec.update = (function () {
    var t = Date.now();
    return function () {
      var t_ = Date.now();
      var dt = (t_ - t) / 1000;
      t = t_;
      parsec.layers.forEach(function (layer) {
        layer.update(dt);
      });
      parsec.player_ship.update(dt);
      requestAnimationFrame(parsec.update);
    };
  }()))();

}());
