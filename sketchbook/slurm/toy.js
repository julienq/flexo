// Toy implementation of graph reduction from [Peyton-Jones, 1987]

var flexo = require("../../flexo.js");

var Cell = {
  toString: function () {
    return this.toString[this.tag].call(this);
  }
};

Cell.toString.application = function () {
  return "(%0 %1)".fmt(this.fst, this.snd);
};

Cell.toString.lambda = function () {
  return "(λ%0.%1)".fmt(this.fst, this.snd);
};

Cell.toString.cons = function () {
  return "(%0:%1)".fmt(this.fst, this.snd);
};

Cell.toString.indirection = function () {
  return "▽ %0".fmt(this.fst);
};

function cell(tag, fst, snd) {
  var c = Object.create(Cell);
  c.tag = tag;
  c.fst = fst;
  c.snd = snd;
  return c;
}

// Overwrite old cell with new cell. If new_cell is not a cell but an unboxed
// type, create a new indirection cell instead.
function overwrite_cell(old_cell, new_cell) {
  var before = old_cell.toString();
  if (typeof new_cell === "number" || typeof new_cell === "function") {
    old_cell.tag = "indirection";
    old_cell.fst = new_cell;
  } else {
    Object.keys(new_cell).forEach(function (key) {
      old_cell[key] = new_cell[key];
    });
  }
  console.log("  ! rewrote %0 -> %1".fmt(before, old_cell));
}

function instantiate(c, arg, val) {
  if (typeof c === "string") {
    return c === arg ? val : c;
  } else if (typeof c === "number" || typeof c === "function") {
    return c;
  }
  return instantiate[c.tag](c, arg, val);
}

instantiate.application = instantiate.cons = function (c, arg, val) {
  return cell(c.tag, instantiate(c.fst, arg, val),
      instantiate(c.snd, arg, val));
};

instantiate.lambda = function (c, arg, val) {
  return arg === c.fst ? c.snd :
    cell(c.tag, c.fst, instantiate(c.snd, arg, val));
};

instantiate.indirection = function (c, arg, val) {
  return cell(c.tag, instantiate(c.fst, arg, val));
};


// Reduce the expression at the given root, and return the (possibly
// overwritten) root
function reduce(root) {
  console.log("  > reduce %0".fmt(root));
  while (root.tag === "application") {
    var stack = [];
    for (var tip = root, stack = []; tip.tag === "application"; tip = tip.fst) {
      stack.push(tip);
    }
    var n = stack.length;
    console.log("  - reduce %0 [%1]".fmt(tip, stack.map(function (x) {
      return x.snd.toString();
    }).join(", ")));
    if (typeof tip === "string" || typeof tip === "number" ||
        tip.tag === "cons") {
      if (n > 0) {
        throw "reduction error: unexpected arguments to data object %0".fmt(tip);
      }
    } else if (Array.isArray(tip.arity)) {
      var a = tip.arity.length;
      if (n < a) {
        break;
      }
      var new_root = tip.apply(null, tip.arity.map(function (p, i) {
        var arg = follow(stack[n - (i + 1)].snd);
        return p ? follow(reduce(arg)) : arg;
      }));
      overwrite_cell(stack[n - a], new_root);
    } else {
      if (stack.length === 0) {
        break;
      }
      var arg = follow(stack[n - 1].snd);
      new_root = instantiate(tip.snd, tip.fst, arg);
      overwrite_cell(stack[n - 1], new_root);
    }
  }
  return root;
}

function follow(cell) {
  for (; cell.tag === "indirection"; cell = cell.fst) {}
  return cell;
}


// Primitives

function primitive(name, f, arity) {
  f.arity = arity;
  f.toString = function () {
    return name;
  }
  return f;
}

var _add = primitive("+", function (x, y) {
  return x + y;
}, [true, true]);
var _mul = primitive("*", function (x, y) {
  return x * y;
}, [true, true]);

var _fst = primitive("FST", function (x) {
  return x.fst;
}, [true]);

var _snd = primitive("SND", function (x) {
  return x.snd;
}, [true]);

var _true = primitive("TRUE", flexo.self, []);
var _false = primitive("FALSE", flexo.self, []);
var _not = primitive("NOT", function (x) {
  return x === _true ? _false : _true;
}, [true]);
var _and = primitive("AND", function (x, y) {
  return x === _true ? y : x;
}, [true, false]);
var _or = primitive("OR", function (x, y) {
  return x === _true ? x : y;
}, [true, false]);

var _fail = primitive("FAIL", function () {
  throw "FAIL";
}, [false]);

var lambda = cell("lambda", "x",
    cell("application",
      cell("application", _add, "x"), 1));

console.log(reduce(lambda).toString());
console.log(reduce(cell("application", lambda, 6)).toString());
console.log(reduce(_true).toString());
console.log(reduce(_false).toString());
console.log(reduce(cell("application", _not, _true)).toString());
console.log(reduce(cell("application", _not, _false)).toString());
console.log(reduce(cell("application",
        cell("lambda", "x",
          cell("application",
            cell("application", _and, "x"),
            // cell("application", _fail, "x"))),
            "x")),
        cell("application", _not, _true))).toString());
console.log(reduce(cell("application",
        cell("lambda", "x",
          cell("application", _add, "x")), 42)).toString());
console.log(reduce(cell("application",
        cell("application",
          cell("lambda", "x",
            cell("application", _add, "x")), 42), 27)).toString());
console.log(reduce(cell("application",
        cell("application", _add, 6),
        cell("application",
          cell("application", _mul, 3), 4))).toString());
console.log(reduce(cell("application", _fst, cell("cons", 1, 2))).toString());
console.log(reduce(cell("application",
        cell("lambda", "x", "x"), 23)).toString());
console.log(reduce(cell("application",
        cell("lambda", "x", "x"),
        cell("application", _mul, 2))).toString());
