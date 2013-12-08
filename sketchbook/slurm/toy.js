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

Cell.toString.number = function () {
  return this.fst.toString();
};

Cell.toString.primitive = function () {
  return this.fst;
};

function cell(tag, fst, snd) {
  var c = Object.create(Cell);
  c.tag = tag;
  c.fst = fst;
  c.snd = snd;
  return c;
}

function primitive_cell(name, f, arity) {
  var c = cell("primitive", name, f);
  c.arity = arity;
  return c;
}

function overwrite_cell(old_cell, new_cell) {
  var before = old_cell.toString();
  Object.keys(new_cell).forEach(function (key) {
    old_cell[key] = new_cell[key];
  });
  console.log("  ! rewrote %0 -> %1".fmt(before, old_cell.toString()));
}

function instantiate(c, arg, val) {
  if (typeof c === "string") {
    return c === arg ? val : c;
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

instantiate.number = instantiate.primitive = flexo.id;


// Unwind the spine until a non-application cell is reached, pushing application
// nodes encountered into the stack
function unwind(stack, c) {
  if (c.tag === "application") {
    stack.push(c);
    return unwind(stack, c.fst);
  }
  return c;
}

// Reduce the expression at the given root, and return the (possibly
// overwritten) root
function reduce(root) {
  console.log("  > reduce %0".fmt(root));
  while (root.tag === "application") {
    var stack = [];
    var tip = unwind(stack, root);
    var n = stack.length;
    console.log("  - reduce %0 [%1]".fmt(tip, stack.map(function (x) {
      return x.snd.toString();
    }).join(", ")));
    if (typeof tip === "string" || tip.tag === "cons" || tip.tag === "number") {
      if (n > 0) {
        throw "reduction error: unexpected arguments to data object %0".fmt(tip);
      }
    } else if (Array.isArray(tip.arity)) {
      var a = tip.arity.length;
      if (n < a) {
        break;
      }
      var new_root = tip.snd.apply(null, tip.arity.map(function (p, i) {
        var arg = stack[n - (i + 1)].snd;
        return p ? reduce(arg) : arg;
      }));
      overwrite_cell(stack[n - a], new_root);
    } else {
      if (stack.length === 0) {
        break;
      }
      var arg = stack[n - 1].snd;
      new_root = instantiate(tip.snd, tip.fst, arg);
      overwrite_cell(stack[n - 1], new_root);
    }
  }
  return root;
}


// Primitives
var _add = primitive_cell("+", function (x, y) {
  return cell("number", x.fst + y.fst);
}, [true, true]);
var _mul = primitive_cell("*", function (x, y) {
  return cell("number", x.fst * y.fst);
}, [true, true]);
var _true = primitive_cell("TRUE", flexo.self, []);
var _false = primitive_cell("FALSE", flexo.self, []);
var _not = primitive_cell("NOT", function (x) {
  return x === _true ? _false : _true;
}, [true]);
var _and = primitive_cell("AND", function (x, y) {
  return x === _true ? y : x;
}, [true, false]);
var _or = primitive_cell("OR", function (x, y) {
  return x === _true ? x : y;
}, [true, false]);
var _fail = primitive_cell("FAIL", function () {
  throw "FAIL";
}, [false]);

var lambda = cell("lambda", "x",
    cell("application",
      cell("application", _add, "x"),
      cell("number", 1)));
console.log(lambda.toString());

var seven = cell("application", lambda, cell("number", 6));
console.log(reduce(seven).toString());
console.log(reduce(lambda).toString());
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
          cell("application", _add, "x")), cell("number", 42))).toString());
console.log(reduce(cell("application",
        cell("application",
          cell("lambda", "x",
            cell("application", _add, "x")), cell("number", 42)),
        cell("number", 27))).toString());
console.log(reduce(cell("application",
        cell("application", _add, cell("number", 6)),
        cell("application",
          cell("application", _mul, cell("number", 3)),
          cell("number", 4)))).toString());
