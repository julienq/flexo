(function () {
  "use strict";

  var assert = typeof require == "function" && require("chai").assert ||
    window.chai.assert;
  var flexo = typeof require == "function" && require("../flexo.js") ||
    window.flexo;

  describe("Flexo", function () {
    it("is defined", function () {
      assert.isObject(flexo);
    });
    it("is up to version %0".fmt(flexo.VERSION), function () {
      assert.isString(flexo.VERSION);
    });
    it("defines π to Math.PI too", function () {
      assert.strictEqual(π, Math.PI);
    });
  });

  describe("Function.prototype.bind", function () {
    it("is defined", function () {
      assert.isFunction(Function.prototype.bind, "bind is a function");
    });
  });

  describe("Objects", function () {

    describe("flexo.instance_of(x, y)", function () {
      var a = {};
      var b = Object.create(a);
      var c = Object.create(b);
      var d = {};
      it("tests whether x is an instance of y (simplest case: y is the prototype of x)", function () {
        assert.strictEqual(Object.getPrototypeOf(b), a,
          "a is the prototype of b (Object.getPrototypeOf)");
        assert.isTrue(flexo.instance_of(b, a),
          "a is the prototype of b (instance_of)");
      });
      it("general case: x and y are further apart in the prototype chain", function () {
        assert.notStrictEqual(Object.getPrototypeOf(c), a,
          "a is not the prototype of c");
        assert.isTrue(flexo.instance_of(c, a),
          "c is an instance of a (instance_of)");
      });
      it("fails when x and y are not in the same prototype chain", function () {
        assert.isFalse(flexo.instance_of(c, d), "c is not an instance of d");
      });
    });

    describe("flexo.make_readonly(obj, name, get)", function () {
      var x = {};
      it("defines a property named name on object obj with the custom getter get", function () {
        flexo.make_readonly(x, "foo", flexo.funcify("bar"));
        assert.ok(x.hasOwnProperty("foo"), "x has property \"foo\"");
      });
      it("if get is a function, then it is the getter for the property", function () {
        assert.strictEqual(x.foo, "bar");
      });
      it("otherwise, get is the value of the property", function () {
        flexo.make_readonly(x, "baz", "fum");
        assert.strictEqual(x.baz, "fum");
      });
    });

    describe("flexo.make_property(obj, name, set)", function () {
      var x = {};
      it("defines a property named name on object obj with the custom setter set", function () {
        flexo.make_property(x, "foo", function (v, cancel) {
          cancel(v == this.foo);
          return v + "!";
        });
        assert.ok(x.hasOwnProperty("foo"), "x has property \"foo\"");
      });
      it("the setter gets two parameters (<value>, <cancel>) and returns the new value to be set", function () {
        x.foo = "bar";
        assert.strictEqual(x.foo, "bar!", "x.foo = \"bar!\"");
      });
      it("the setter may call cancel with no value or a truthy value to cancel setting the value", function () {
        x.foo = "bar!";
        assert.strictEqual(x.foo, "bar!", "x.foo was not updated");
      });
    });

  });

  describe("Strings", function () {

    describe("String.fmt(string, ...)", function () {
      it("replaces occurrences of %0, %1, &c. in the string with the corresponding arguments", function () {
        assert.strictEqual("foo = 1", "foo = %0".fmt(1));
        assert.strictEqual("foo = 1, bar = 2",
          "foo = %0, bar = %1".fmt(1, 2));
        assert.strictEqual("bar = 2", "bar = %1".fmt(1, 2, 3));
        assert.strictEqual("2012年8月30日", "%2年%1月%0日".fmt(30, 8, 2012));
      });
      it("returns an empty string for null and undefined values", function () {
        assert.strictEqual("foo = ", "foo = %0".fmt());
        assert.strictEqual("foo = ", "foo = %0".fmt(undefined));
        assert.strictEqual("foo = ", "foo = %0".fmt(null));
      });
      it("replaces %% with %", function () {
        assert.strictEqual("%%0 = %foo", "%%%%0 = %%%0".fmt("foo"));
      });
      it("accepts parens to disambiguate input, e.g. \"x * 10 = %(0)0\".fmt(x)", function () {
        assert.strictEqual("x * 10 = %(0)0".fmt(12), "x * 10 = 120");
      });
      it("parses the pattern number as a base-10 integer, so that %03 is the same as %3", function () {
        assert.strictEqual("%03".fmt(0, 1, 2, 3, 4, 5, 6, 7), "3");
      });
    });

    describe("flexo.chomp(string)", function () {
      it("chops the last character of a string if and only if it is a newline (\\n)", function () {
        assert.strictEqual(flexo.chomp("Test\n"), "Test");
        assert.strictEqual(flexo.chomp(flexo.chomp("Test\n")), "Test");
      });
    });

    describe("flexo.is_true(string)", function () {
      it("returns true for strings that equal \"true\", regardless of trailing and leading whitespace, and case", function () {
        assert.strictEqual(true, flexo.is_true("true"));
        assert.strictEqual(true, flexo.is_true("TRUE"));
        assert.strictEqual(true, flexo.is_true("True"));
        assert.strictEqual(true, flexo.is_true("    true"));
        assert.strictEqual(true, flexo.is_true("TRUE     "));
        assert.strictEqual(true, flexo.is_true("     tRuE     "));
        assert.strictEqual(false, flexo.is_true("false"));
        assert.strictEqual(false, flexo.is_true("yes"));
        assert.strictEqual(false, flexo.is_true(""));
        assert.strictEqual(false, flexo.is_true(""));
      });
      it("returns false if the argument is not a string", function () {
        assert.strictEqual(false, flexo.is_true());
        assert.strictEqual(false, flexo.is_true(true));
      });
    });

    describe("flexo.pad(string, length, padding=\"0\")", function () {
      it("pads a string to the given length with `padding`, assuming the padding string is one character long", function () {
        assert.strictEqual(flexo.pad("2", 2), "02");
        assert.strictEqual(flexo.pad("right-aligned", 16, " "),
          "   right-aligned");
      });
      it("converts the first argument to a string (useful for numbers)",
        function () {
          assert.strictEqual(flexo.pad(2, 2), "02");
        });
      it("is useful to create strings with a repeated pattern", function () {
        assert.strictEqual(flexo.pad("", 10, "*"), "**********");
        assert.strictEqual(flexo.pad("", 8, "xo"), "xoxoxoxoxoxoxoxo");
      });
    });

    describe("flexo.quote(string, [quotes='\"'])", function () {
      it("Quotes a string, escaping quotes inside the string", function () {
        assert.strictEqual(flexo.quote("Hello, \"World!\""),
          "\"Hello, \\\"World!\\\"\"");
      });
      it("Uses double-quotes by default, but can be passed single quote as a second argument", function () {
        assert.strictEqual(flexo.quote("Hello, \"World!\"", "'"),
          "'Hello, \"World!\"'");
      });
    });

    describe("flexo.to_roman(n)", function () {
      it("returns `n` in roman numerals (in lowercase)", function () {
        assert.strictEqual(flexo.to_roman(1), "i");
        assert.strictEqual(flexo.to_roman(2), "ii");
        assert.strictEqual(flexo.to_roman(3), "iii");
        assert.strictEqual(flexo.to_roman(4), "iv");
        assert.strictEqual(flexo.to_roman(5), "v");
        assert.strictEqual(flexo.to_roman(6), "vi");
        assert.strictEqual(flexo.to_roman(7), "vii");
        assert.strictEqual(flexo.to_roman(8), "viii");
        assert.strictEqual(flexo.to_roman(9), "ix");
        assert.strictEqual(flexo.to_roman(10), "x");
        assert.strictEqual(flexo.to_roman(50), "l");
        assert.strictEqual(flexo.to_roman(100), "c");
        assert.strictEqual(flexo.to_roman(500), "d");
        assert.strictEqual(flexo.to_roman(1000), "m");
        assert.strictEqual(flexo.to_roman(1888), "mdccclxxxviii");
        assert.strictEqual(flexo.to_roman(1999), "mcmxcix");
        assert.strictEqual(flexo.to_roman(2012), "mmxii");
        assert.strictEqual(flexo.to_roman(10000), "mmmmmmmmmm");
      });
      it("considers the integer part of `n` only", function () {
        assert.strictEqual(flexo.to_roman(123.45), "cxxiii");
        assert.strictEqual(flexo.to_roman(Math.E), "ii");
        assert.strictEqual(flexo.to_roman(Math.PI), "iii");
      });
      it("returns \"nulla\" for zero", function () {
        assert.strictEqual(flexo.to_roman(0), "nulla");
      });
      it("returns nothing if `n` is not a positive number", function () {
        assert.strictEqual(flexo.to_roman(-1));
        assert.strictEqual(flexo.to_roman(true));
        assert.strictEqual(flexo.to_roman("mmxii"));
        assert.strictEqual(flexo.to_roman());
        assert.strictEqual(flexo.to_roman(null));
        assert.strictEqual(flexo.to_roman({ n: 123 }));
      });
    });

    describe("flexo.undash(s)", function () {
      it("removes dashes from a string and converts any lowercase letter following a dash to upper case; e.g. foo-bar becomes fooBar", function () {
        assert.strictEqual(flexo.undash("foo-bar"), "fooBar");
      });
      it("a string starting with a - will be capitalized", function () {
        assert.strictEqual(flexo.undash("-moz-transform"), "MozTransform");
      });
      it("leaves non-lowercase letters alone ", function () {
        assert.strictEqual(flexo.undash("foo-3bar"), "foo3bar");
      });
      it("removes consecutive dashes", function () {
        assert.strictEqual(flexo.undash("foo----bar"), "fooBar");
      });
      it("removes trailing dashes", function () {
        assert.strictEqual(flexo.undash("foo-bar----"), "fooBar");
      });
    });

  });

  
  describe("Numbers", function () {

    describe("flexo.clamp(n, min, max)", function () {
      it("clamps the value of n between min and max, assuming min <= max",
        function () {
          assert.strictEqual(flexo.clamp(0, 1, 1), 1);
          assert.strictEqual(flexo.clamp(1, 1, 1), 1);
          assert.strictEqual(flexo.clamp(1, 1, 10), 1);
          assert.strictEqual(flexo.clamp(10, 1, 10), 10);
          assert.strictEqual(flexo.clamp(0, 1, 10), 1);
          assert.strictEqual(flexo.clamp(100, 1, 10), 10);
          assert.strictEqual(flexo.clamp(1, -Infinity, +Infinity), 1);
        });
      it("treats NaN as 0 for the n parameter", function () {
        assert.strictEqual(flexo.clamp("Not a number!", -10, 10), 0);
        assert.strictEqual(flexo.clamp("Not a number!", 1, 10), 1);
      });
    });

    describe("flexo.lerp(from, to, ratio)", function () {
      it("returns the linear interpolation between `from` and `to` for `ratio`", function () {
        assert.strictEqual(flexo.lerp(0, 1, 0), 0);
        assert.strictEqual(flexo.lerp(0, 1, 1), 1);
        assert.strictEqual(flexo.lerp(0, 1, 0.5), 0.5);
        assert.strictEqual(flexo.lerp(0, 1, 2), 2);
        assert.strictEqual(flexo.lerp(10, -10, 0), 10);
        assert.strictEqual(flexo.lerp(10, -10, 0.25), 5);
        assert.strictEqual(flexo.lerp(10, -10, 1), -10);
      });
    });

    describe("flexo.random_int(min=0, max)", function () {
      it("returns an integer in the [min, max] range, assuming min <= max",
        function () {
          for (var i = 0; i < 100; ++i) {
            var r = flexo.random_int(-10, 10);
            assert.ok(r >= -10 && r <= 10 && Math.round(r) === r);
          }
        });
      it("defaults to 0 for min if only `max` is given", function () {
        for (var i = 0; i < 100; ++i) {
          var r = flexo.random_int(10);
          assert.ok(r >= 0 && r <= 10 && Math.round(r) === r);
        }
      });
    });

    describe("flexo.remap(value, istart, istop, ostart, ostop)", function () {
      it("remaps a value from an input range to an output range", function () {
        assert.strictEqual(flexo.remap(5, 0, 10, 10, 20), 15);
        assert.strictEqual(flexo.remap(5, 0, 10, 0, 20), 10);
        assert.strictEqual(flexo.remap(60, 0, 360, 0, 2 * Math.PI),
          Math.PI / 3);
      });
    });
  });


  describe("Arrays", function () {

    describe("flexo.array_without(array, item)", function () {
      it("returns a copy of the array without the given item", function () {
        var a = [1, 2, 3, 4, 5];
        assert.deepEqual([1, 2, 3, 5], flexo.array_without(a, 4));
        assert.deepEqual([1, 2, 3, 4, 5], flexo.array_without(a, 0));
      });
    });

    describe("flexo.drop_while(array, p, [this])", function () {
      it("drops elements from the array while p is true", function () {
        var a = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
        assert.deepEqual([3, 4, 0, 1, 2, 3, 4],
          flexo.drop_while(a, function (x) { return x < 3; }),
          "dropped first elements x | x < 3")
      });
    });

    describe("flexo.find_first(array, p)", function () {
      it("finds the first item x in array such that p(x) is true", function () {
        var a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        assert.strictEqual(flexo.find_first(a, function (x) {
          return x > 3;
        }), 4, "First x > 3");
      });
      it("predicate takes three parameters: the item, the index of the item in array, and the array itself", function () {
        var a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        assert.strictEqual(flexo.find_first(a, function (x, i, a) {
          return x > 4 && (a.length - i) < 4;
        }), 8, "First x > 4 less than 4 items from the end");
      });
    });

    describe("flexo.intersperse(array, sep)", function () {
      it("intersperses the separator between the elements of the array", function () {
        assert.deepEqual(flexo.intersperse([], "empty"), []);
        assert.deepEqual(flexo.intersperse([0], "singleton"), [0]);
        assert.deepEqual(flexo.intersperse([0, 1], "+"), [0, "+", 1]);
        assert.deepEqual(flexo.intersperse([0, 1, 2], "+"), [0, "+", 1, "+", 2]);
        assert.deepEqual(flexo.intersperse([0, 1, 2, 3, 4, 5, 6, 7,8], "+"),
          [0, "+", 1, "+", 2, "+", 3, "+", 4, "+", 5, "+", 6, "+", 7, "+", 8]);
      });
    });

    describe("flexo.partition(array, p)", function () {
      it("partitions array in two arrays according to predicate p; first array is the one for which p(x) is true", function () {
        var partition = flexo.partition([0, 1, 2, 3, 4, 5, 6, 7, 8],
          function (x) {
            return x % 2 === 0;
          });
        assert.deepEqual([0, 2, 4, 6, 8], partition[0]);
        assert.deepEqual([1, 3, 5, 7], partition[1]);
      });
    });

    describe("flexo.random_element(array)", function () {
      it("returns a random element from an array", function () {
        var a = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        for (var i = 0; i < 100; ++i) {
          var r = flexo.random_element(a);
          assert.ok(a.indexOf(r) >= 0);
        }
      });
    });

    describe("flexo.remove_first_from_array(array, p, that)", function () {
      it("removes the first occurrence of the item from the array that matches predicate p (called with that as this), and returns it",
        function () {
          var a = [1, 2, 3, 4, 2];
          assert.strictEqual(flexo.remove_first_from_array(a,
              function (x) { return x === 1; }), 1);
          assert.deepEqual(a, [2, 3, 4, 2]);
          assert.strictEqual(flexo.remove_first_from_array(a,
              function (x) { return x === 2; }), 2);
          assert.deepEqual(a, [3, 4, 2]);
          assert.strictEqual(flexo.remove_first_from_array(a,
              function (x) { return x === 5; }));
          assert.deepEqual(a, [3, 4, 2]);
          assert.strictEqual(flexo.remove_first_from_array(null,
              function (x) { return x === 5; }));
        });
    });

    describe("flexo.remove_from_array(array, item)", function () {
      it("removes the first occurrence of the item from the array, if present and returns it",
        function () {
          var a = [1, 2, 3, 4, 2];
          assert.strictEqual(flexo.remove_from_array(a, 1), 1);
          assert.deepEqual(a, [2, 3, 4, 2]);
          assert.strictEqual(flexo.remove_from_array(a, 2), 2);
          assert.deepEqual(a, [3, 4, 2]);
          assert.strictEqual(flexo.remove_from_array(a, 5));
          assert.deepEqual(a, [3, 4, 2]);
          assert.strictEqual(flexo.remove_from_array(null, 5));
        });
    });

    describe("flexo.replace_in_array(array, old_item, new_item)", function () {
      it("replaces the first instance of old_item in the array with new_item, and return old_item if it was present");
    });

    describe("new flexo.Urn(items)", function () {
      var items = [1, 2, 3, 4, 5];
      var urn = new flexo.Urn(items);
      it("creates a new urn from a given array of items", function () {
        assert.deepEqual(urn.items, items);
      });
      it("picks an element with urn.pick(), refilling the urn with the original array once it becomes empty", function () {
        var picked = [];
        for (var i = 0; i < items.length; ++i) {
          picked.push(urn.pick());
        }
        assert.deepEqual(picked.sort(), items);
        var pick = urn.pick();
        assert.ok(items.indexOf(pick) >= 0);
      });
      it("picks n elements with urn.picks(n)", function () {
        var picked = urn.picks(items.length);
        assert.deepEqual(picked.sort(), items);
      });
      it("the next value after refilling the urn will be different from the last pick (provided that the urn has at least two items to pick from)", function () {
        var last = urn._last_pick;
        for (var i = 0; i < 100; ++i) {
          var picks = urn.picks(urn.items.length);
          assert.ok(picks[0] != last,
            "picked %0 twice in a row? (%1)".fmt(picks[picks.length - 1], i));
          last = picks[picks.length - 1];
        }
      });
    });

    describe("flexo.values(dictionary)", function () {
      it("returns the values of a dictionary-like object (in some order)", function () {
        var dict = { foo: 1, bar: 2, fum: 3, quux: 4, quuux: 4, baz: 2 };
        assert.deepEqual(flexo.values(dict).sort(), [1, 2, 2, 3, 4, 4]);
      });
    });
  });


  describe("URIs", function () {
    var test_uris = [{
      unparsed: "foo://example.com:8042/over/there?name=ferret#nose",
      parsed: {
        scheme: "foo",
        authority: "example.com:8042",
        path: "/over/there",
        query: "name=ferret",
        fragment: "nose"
      }
    }, {
      unparsed: "urn:example:animal:ferret:nose",
      parsed: {
        scheme: "urn",
        authority: undefined,
        path: "example:animal:ferret:nose",
        query: undefined,
        fragment: undefined
      }
    }, {
      unparsed: "http://www.ics.uci.edu/pub/ietf/uri/#Related",
      parsed: {
        scheme: "http",
        authority: "www.ics.uci.edu",
        path: "/pub/ietf/uri/",
        query: undefined,
        fragment: "Related"
      }
    }];

    describe("flexo.split_uri(uri)", function () {
      it("splits an URI into its base components", function () {
        test_uris.forEach(function (uri) {
          assert.deepEqual(uri.parsed, flexo.split_uri(uri.unparsed));
        });
      });
      it("returns an object with properties scheme, authority, path, query and fragment", function () {
        var uri = flexo.split_uri(flexo.random_element(test_uris).unparsed);
        assert.ok(uri.hasOwnProperty("scheme"));
        assert.ok(uri.hasOwnProperty("authority"));
        assert.ok(uri.hasOwnProperty("path"));
        assert.ok(uri.hasOwnProperty("query"));
        assert.ok(uri.hasOwnProperty("fragment"));
      });
    });

    describe("flexo.unsplit_uri(uri_object)", function () {
      it("outputs a URI from its base components", function () {
        test_uris.forEach(function (uri) {
          assert.strictEqual(uri.unparsed, flexo.unsplit_uri(uri.parsed));
        });
      });
    });

    describe("flexo.absolute_uri(base, ref)", function () {
      var base = "http://a/b/c/d;p?q";
      it("works for normal examples from RFC3986", function () {
        assert.strictEqual("g:h", flexo.absolute_uri(base, "g:h"));
        assert.strictEqual("http://a/b/c/g", flexo.absolute_uri(base, "g"));
        assert.strictEqual("http://a/b/c/g", flexo.absolute_uri(base, "./g"));
        assert.strictEqual("http://a/b/c/g/", flexo.absolute_uri(base, "g/"));
        assert.strictEqual("http://a/g", flexo.absolute_uri(base, "/g"));
        assert.strictEqual("http://g", flexo.absolute_uri(base, "//g"));
        assert.strictEqual("http://a/b/c/d;p?y",
          flexo.absolute_uri(base, "?y"));
        assert.strictEqual("http://a/b/c/g?y", flexo.absolute_uri(base, "g?y"));
        assert.strictEqual("http://a/b/c/d;p?q#s",
          flexo.absolute_uri(base, "#s"));
        assert.strictEqual("http://a/b/c/g#s", flexo.absolute_uri(base, "g#s"));
        assert.strictEqual("http://a/b/c/g?y#s",
          flexo.absolute_uri(base, "g?y#s"));
        assert.strictEqual("http://a/b/c/;x", flexo.absolute_uri(base, ";x"));
        assert.strictEqual("http://a/b/c/g;x", flexo.absolute_uri(base, "g;x"));
        assert.strictEqual("http://a/b/c/g;x?y#s",
          flexo.absolute_uri(base, "g;x?y#s"));
        assert.strictEqual("http://a/b/c/d;p?q", flexo.absolute_uri(base, ""));
        assert.strictEqual("http://a/b/c/", flexo.absolute_uri(base, "."));
        assert.strictEqual("http://a/b/c/", flexo.absolute_uri(base, "./"));
        assert.strictEqual("http://a/b/", flexo.absolute_uri(base, ".."));
        assert.strictEqual("http://a/b/", flexo.absolute_uri(base, "../"));
        assert.strictEqual("http://a/b/g", flexo.absolute_uri(base, "../g"));
        assert.strictEqual("http://a/", flexo.absolute_uri(base, "../.."));
        assert.strictEqual("http://a/", flexo.absolute_uri(base, "../../"));
        assert.strictEqual("http://a/g", flexo.absolute_uri(base, "../../g"));
      });
      it("works for abnormal examples from RFC3986", function () {
        assert.strictEqual("http://a/g",
          flexo.absolute_uri(base, "../../../g"));
        assert.strictEqual("http://a/g",
          flexo.absolute_uri(base, "../../../../g"));
        assert.strictEqual("http://a/g", flexo.absolute_uri(base, "/./g"));
        assert.strictEqual("http://a/g", flexo.absolute_uri(base, "/../g"));
        assert.strictEqual("http://a/b/c/g.", flexo.absolute_uri(base, "g."));
        assert.strictEqual("http://a/b/c/.g", flexo.absolute_uri(base, ".g"));
        assert.strictEqual("http://a/b/c/g..", flexo.absolute_uri(base, "g.."));
        assert.strictEqual("http://a/b/c/..g", flexo.absolute_uri(base, "..g"));
        assert.strictEqual("http://a/b/g", flexo.absolute_uri(base, "./../g"));
        assert.strictEqual("http://a/b/c/g/",
          flexo.absolute_uri(base, "./g/."));
        assert.strictEqual("http://a/b/c/g/h",
          flexo.absolute_uri(base, "g/./h"));
        assert.strictEqual("http://a/b/c/h",
          flexo.absolute_uri(base, "g/../h"));
        assert.strictEqual("http://a/b/c/g;x=1/y",
          flexo.absolute_uri(base, "g;x=1/./y"));
        assert.strictEqual("http://a/b/c/y",
          flexo.absolute_uri(base, "g;x=1/../y"));
        assert.strictEqual("http://a/b/c/g?y/./x",
            flexo.absolute_uri(base, "g?y/./x"));
        assert.strictEqual("http://a/b/c/g?y/../x",
          flexo.absolute_uri(base, "g?y/../x"));
        assert.strictEqual("http://a/b/c/g#s/./x",
            flexo.absolute_uri(base, "g#s/./x"));
        assert.strictEqual("http://a/b/c/g#s/../x",
          flexo.absolute_uri(base, "g#s/../x"));
      });
    });

    describe("flexo.normalize_uri(base, ref)", function () {
      var base = "http://a/b/c/d;p?q";
      it("converts scheme and host to lowercase", function () {
        assert.strictEqual("http://a/b/c/d",
          flexo.normalize_uri(base, "HTTP://A/b/c/d"));
      });
      it("converts escape sequences to uppercase", function () {
        assert.strictEqual("http://a/b/c/a%C2%B1b",
          flexo.normalize_uri(base, "a%c2%b1b"));
      });
      it("unescapes letters, digits, hypen, period, underscore, tilde", function () {
        assert.strictEqual("http://a/b/c/~a%C2%B1z09-._",
          flexo.normalize_uri(base, "%7e%61%c2%b1%7a%30%39%2d%2e%5f"));
      });
      it("removes the default port", function () {
        assert.strictEqual("http://a/b/c/d",
          flexo.normalize_uri(base, "HTTP://A:80/b/c/d"));
        assert.strictEqual("http://a:8910/b/c/d",
          flexo.normalize_uri(base, "HTTP://A:8910/b/c/d"));
      });
    });

    describe("flexo.get_args(defaults={}, argstr=window.location.search.substr(1))", function () {
      it("parses the given argument string", function () {
        var argstr = "href=../apps/logo.xml&x=1";
        var args = flexo.get_args({}, argstr);
        assert.strictEqual("../apps/logo.xml", args.href);
        assert.strictEqual("1", args.x);
      });
      it("replaces defaults with values from the arg string", function () {
        var argstr = "href=../apps/logo.xml&x=2&y=4";
        var args = flexo.get_args({ x: 1, z: 6 }, argstr);
        assert.strictEqual("../apps/logo.xml", args.href);
        assert.strictEqual(2, args.x);
        assert.strictEqual("4", args.y);
        assert.strictEqual(6, args.z);
      });
      if (typeof window === "object") {
        it("uses the location search value by default", function () {
          assert.ok(flexo.get_args());
        });
      }
    });

    /*
       Test along with Morbo for params
    describe("flexo.ez_xhr(uri, params={}, f)", function () {
      it("makes an XMLHttpRequest to `uri` parametrized by the `params` object and calls `f` on completion", function () {
        
      });
    });
    */

  });


  describe("Custom events", function () {
    var source = {};

    describe("flexo.listen(target, type, listener)", function () {
      it("listens to events of `type` from `target` and executes the listener function", function (done) {
        var tests = 0;
        flexo.listen(source, "test-listen", function () {
          ++tests;
        });
        flexo.notify(source, "test-listen");
        flexo.notify(source, "test-listen");
        flexo.asap(function () {
          assert.strictEqual(tests, 2);
          done();
        });
      });
      it("accepts an object as the listener parameter, whose `handleEvent` method is invoked on notifications", function (done) {
        var listener = {
          tests: 0,
          handleEvent: function () {
            ++this.tests;
          }
        };
        flexo.listen(source, "test-handleEvent", listener);
        flexo.notify(source, "test-handleEvent");
        flexo.notify(source, "test-handleEvent");
        flexo.asap(function () {
          assert.strictEqual(listener.tests, 2);
          done();
        });
      });
      it("delays the handling of the notification so that a listener can be added after the notification (if control was not yielded in the meantime)", function (done) {
        var handled = false;
        flexo.notify(source, "test-listen-after-notify");
        flexo.notify(source, "test-listen-after-notify");
        flexo.listen_once(source, "test-listen-after-notify", function () {
          assert(!handled);
          handled = true;
        });
        flexo.asap(function () {
          assert.strictEqual(handled, true);
          done();
        });
      });
      it("can listen to null for notifications from all sources", function (done) {
        var x = {};
        var y = {};
        var z = {};
        var heard = [];
        var heard_from = function (e) {
          heard.push(e.source);
        };
        flexo.listen(x, "test-listen-all", heard_from);
        flexo.listen(null, "test-listen-all", heard_from);
        flexo.notify(x, "test-listen-all");
        flexo.notify(y, "test-listen-all");
        flexo.notify(z, "test-listen-all");
        flexo.asap(function () {
          assert.ok(heard.indexOf(x) >= 0);
          assert.ok(heard.indexOf(y) >= 0);
          assert.ok(heard.indexOf(z) >= 0);
          done();
        });
      });
    });

    describe("flexo.listen_once(target, type, listener)", function () {
      it("listens to events of `type` from `target` and executes the listener, then immediately stops listening", function (done) {
        var tests = 0;
        flexo.listen_once(source, "test-once", function () {
          ++tests;
        });
        flexo.notify(source, "test-once");
        flexo.notify(source, "test-once");
        flexo.asap(function () {
          assert.strictEqual(tests, 1);
          done();
        });
      });
    });

    describe("flexo.notify(source, type, arguments={})", function () {
      it("sends an event notification of `type` on behalf of `source`", function (done) {
        flexo.listen(source, "test-notify", flexo.discard(done));
        flexo.notify(source, "test-notify");
      });
      it("sends additional arguments through the `arguments` object", function (done) {
        flexo.listen(source, "test-args", function (e) {
          assert.strictEqual(e.source, source);
          assert.strictEqual(e.type, "test-args");
          assert.strictEqual(e.foo, 1);
          assert.strictEqual(e.bar, 2);
        });
        flexo.notify(source, "test-args", { foo: 1, bar: 2 });
        flexo.asap(flexo.discard(done));
      });
    });

    describe("flexo.notify(e)", function () {
      it("sends an event notification of `e.type` on behalf of `e.source` with additional arguments from `e`", function (done) {
        flexo.listen(source, "test-e", function (e) {
          assert.strictEqual(e.source, source);
          assert.strictEqual(e.type, "test-e");
          assert.strictEqual(e.foo, 1);
          assert.strictEqual(e.bar, 2);
        });
        flexo.notify({ source: source, type: "test-e", foo: 1, bar: 2 });
        flexo.asap(flexo.discard(done));
      });
    });

    describe("flexo.unlisten(target, type, listener)", function () {
      it("removes `listener` for events of `type` from `target`", function (done) {
        var tests = 0;
        var h = function () {
          ++tests;
        };
        flexo.listen(source, "test-unlisten", h);
        flexo.notify(source, "test-unlisten");
        var h_ = flexo.unlisten(source, "test-unlisten", h);
        assert.strictEqual(h, h_);
        flexo.asap(function () {
          assert.strictEqual(tests, 0);
          done();
        });
      });
    });
  });

  describe("Functions and Asynchronicity", function () {

    describe("flexo.asap(f)", function () {
      it("runs f as soon as possible, using setImmediate or window.postMessage where available", function (done) {
        var count = 100;
        var decr = function () {
          if (count-- > 0) {
            flexo.asap(decr);
          } else {
            done();
          }
        }
        decr();
      });
      it("(compare with setTimeout which may generate a warning for taking too long)", function (done) {
        var count = 100;
        var decr = function () {
          if (count-- > 0) {
            setTimeout(decr, 0);
          } else {
            done();
          }
        }
        decr();
      });
    });

    describe("flexo.discard(f, [n=0])", function () {
      it("returns a function that discards its arguments", function (done) {
        flexo.discard(done)("augh!");
      });
      it("keeps at most n arguments if n is specified", function () {
        assert.deepEqual("0 1 2 3".split(" ").map(flexo.discard(parseInt, 1)),
          [0, 1, 2, 3]);
      });
    });

    describe("flexo.fail([p])", function () {
      it("throws a \"fail\" exception when p is truthy (defaults to true)", function () {
        try {
          flexo.fail();
        } catch (e) {
          assert.strictEqual(e, "fail");
        }
        try {
          flexo.fail(true);
        } catch (e) {
          assert.strictEqual(e, "fail");
        }
        try {
          flexo.fail("true-ish");
        } catch (e) {
          assert.strictEqual(e, "fail");
        }
        flexo.fail(undefined);
        assert.ok(true);
      });
      it("returns false otherwise", function () {
        assert.strictEqual(flexo.fail(false) || "ok", "ok");
      });
    });

    describe("flexo.id", function () {
      it("returns its first argument unchanged", function () {
        assert.strictEqual(flexo.id(1), 1);
        assert.strictEqual(flexo.id("test"), "test");
      });
    });

    describe("flexo.nop", function () {
      it("does nothing.", function () {
        assert.ok(typeof flexo.nop === "function");
      });
    });

    describe("Promises", function () {
      it("follow the Promises/A+ spec; see separate test suite", flexo.nop);
      var promise = new flexo.Promise;
      it("create a new promise with: new flexo.Promise", function () {
        assert.ok(promise instanceof flexo.Promise);
        assert.ok(typeof promise.then == "function");
      });
      it("is fulfilled with promise.fulfill(value)", function (done) {
        promise.fulfill(true).then(function (v) {
          assert.strictEqual(v, true);
          done();
        }, done);
      });
      it("is rejected with promise.reject(reason)", function (done) {
        new flexo.Promise().reject(false).then(done, function (r) {
          assert.strictEqual(r, false);
          done();
        });
      });
      it("can be rejected automatically after a timeout with promise.timeout(ms)", function (done) {
        new flexo.Promise().timeout(20).then(done, function (r) {
          assert.strictEqual(r, "Timeout");
          var p = new flexo.Promise().timeout(20);
          p.then(function (v) {
            assert.strictEqual(v, true);
            done();
          }, done);
          p.fulfill(true);
        });
      });
      it("a list of promises can be executed in sequence with promise.each");
    });

    describe("Trampoline calls", function () {
      it("todo");
    });

    if (typeof window === "object") {
      describe("requestAnimationFrame", function () {
        it("binds the prefixed requestAnimationFrame or uses setTimeout as fallback", function () {
          assert.ok(typeof window.requestAnimationFrame == "function");
        });
        it("also cancelAnimationFrame", function () {
          assert.ok(typeof window.cancelAnimationFrame == "function");
        });
      });
    }

  });


  if (typeof window === "object") {
    describe("DOM", function () {

      describe("flexo.create_element(description, attrs={}, [contents...])",
        function () {
          it("is called with the target document as `this` for new elements",
            function () {
              var e = document.createElementNS("http://www.w3.org/1999/xhtml",
                "p");
              var e_ = flexo.create_element.call(document, "p");
              assert.deepEqual(e, e_);
            });
          it("allows namespace prefixes (e.g., \"svg:g\")", function () {
            // Introduce a custom namespace
            flexo.ns.bender = "http://bender.igel.co.jp";
            [
              [document.createElementNS("http://www.w3.org/1999/xhtml", "p"),
              flexo.create_element.call(document, "p")],
              [document.createElementNS("http://www.w3.org/1999/xhtml", "p"),
              flexo.create_element.call(document, "html:p")],
              [document.createElementNS("http://www.w3.org/1999/xhtml", "p"),
              flexo.create_element.call(document, "xhtml:p")],
              [document.createElementNS("http://www.w3.org/2000/svg", "g"),
              flexo.create_element.call(document, "svg:g")],
              [document.createElementNS("http://bender.igel.co.jp",
                "component"),
              flexo.create_element.call(document, "bender:component")],
            ].forEach(function (pair) {
              ["namespaceURI", "localName"].forEach(function (property) {
                assert.strictEqual(pair[0][property], pair[1][property]);
              });
            });
          });
          it("allows the inline definition of id and classes with # and .",
            function () {
              var foo = flexo.create_element.call(document, "p#foo");
              assert.strictEqual("foo", foo.id);
              var bar = flexo.create_element.call(document, "p#bar.baz");
              assert.strictEqual("bar", bar.id);
              assert.strictEqual("baz", bar.className);
              var p = flexo.create_element.call(document, "p.a.b.c");
              assert.ok(p.classList.contains("a"));
              assert.ok(p.classList.contains("b"));
              assert.ok(p.classList.contains("c"));
              assert.ok(!p.classList.contains("a.b.c"));
              var q = flexo.create_element.call(document, "html:p#x.y.z");
              assert.strictEqual("http://www.w3.org/1999/xhtml", q.namespaceURI);
              assert.strictEqual("p", q.tagName.toLowerCase());
              assert.strictEqual("x", q.id);
              assert.ok(q.classList.contains("y"));
              assert.ok(q.classList.contains("z"));
              var r = flexo.create_element.call(document, "p.a#b.c")
              assert.strictEqual("b", r.id);
              assert.ok(r.classList.contains("a"));
              assert.ok(r.classList.contains("c"));
            });
          it("allows namespace-prefixed attribute names just like tag names",
            function () {
              var use = flexo.create_element.call(document, "svg:use",
                { "xlink:href": "#t" });
              assert.strictEqual("#t",
                use.getAttributeNS("http://www.w3.org/1999/xlink", "href"));
            });
          it("takes an object as a second argument for attribute definitions", function () {
            var p = flexo.create_element.call(document, "p", { id: "b.a.r",
              "class": "baz", contenteditable: "" });
            assert.strictEqual("b.a.r", p.id);
            assert.strictEqual("baz", p.className);
            assert.ok(true, !!p.contentEditable);
          });
          it("skips undefined, null, and false-valued attributes", function () {
            var p = flexo.create_element.call(document, "p", { x: null,
              y: undefined, z: false, t: 0 });
            assert.strictEqual(null, p.getAttribute("x"));
            assert.strictEqual(null, p.getAttribute("y"));
            assert.strictEqual(null, p.getAttribute("z"));
            assert.equal(0, p.getAttribute("t"));
          });
          it("allows the use of namespace prefixes for attributes", function () {
            var u = flexo.create_element.call(document, "svg:use",
              { "xlink:href": "#foo" });
            assert.strictEqual(u.href.baseVal, "#foo");
          });
          it("adds the value of `class` to class names given in the description, but does not replace `id` if it was given in the description", function () {
            var p = flexo.create_element.call(document, "p#x.y.z",
              { "class": "t u", id: "v" });
            assert.ok(p.classList.contains("y"));
            assert.ok(p.classList.contains("z"));
            assert.ok(p.classList.contains("t"));
            assert.ok(p.classList.contains("u"));
            assert.strictEqual(p.id, "x");
          });
          it("adds DOM nodes, strings (creating a text node) and arrays of contents, skipping all other types of values", function () {
            var lorem = "Lorem ipsum dolor...";
            var p = flexo.create_element.call(document, "p", lorem);
            assert.strictEqual(p.textContent, lorem);
            assert.strictEqual(p.childNodes.length, 1);
            assert.strictEqual(p.childNodes[0].nodeType, Node.TEXT_NODE);
            assert.strictEqual(p.childNodes[0].textContent, lorem);
            // Using shorthand here for convenience (also tested below)
            var ol = flexo.$ol(flexo.$li("one"), flexo.$li("two"));
            assert.strictEqual(ol.childNodes.length, 2);
            assert.strictEqual(ol.childNodes[0].textContent, "one");
            assert.strictEqual(ol.childNodes[1].textContent, "two");
            var predicate = false;
            var ul2 = flexo.$ul(flexo.$li("definitely"),
              predicate && [flexo.$li("maybe"), flexo.$li("perhaps")],
              flexo.$li("assuredly"));
            assert.strictEqual(ul2.childNodes.length, 2);
            assert.strictEqual(ul2.childNodes[0].textContent, "definitely");
            assert.strictEqual(ul2.childNodes[1].textContent, "assuredly");
            predicate = true;
            var ul4 = flexo.$ul(flexo.$li("definitely"),
              predicate && [flexo.$li("maybe"), flexo.$li("perhaps")],
              flexo.$li("assuredly"));
            assert.strictEqual(ul4.childNodes.length, 4);
            assert.strictEqual(ul4.childNodes[0].textContent, "definitely");
            assert.strictEqual(ul4.childNodes[1].textContent, "maybe");
            assert.strictEqual(ul4.childNodes[2].textContent, "perhaps");
            assert.strictEqual(ul4.childNodes[3].textContent, "assuredly");
            var ul5 = flexo.$ul([flexo.$li("one"), flexo.$li("two")]);
            assert.strictEqual(ul5.childNodes.length, 2);
            assert.strictEqual(ul5.childNodes[0].textContent, "one");
            assert.strictEqual(ul5.childNodes[1].textContent, "two");
          });
        });

      describe("flexo.$(description, attrs={}, [contents])", function () {
        it("is a shorthand bound to window.document", function () {
          var foo = flexo.$("p#bar.baz");
          var bar = flexo.create_element.call(document, "p#bar.baz");
          assert.strictEqual(foo.ownerDocument, bar.ownerDocument);
          assert.strictEqual(foo.tagName, bar.tagName);
          assert.strictEqual(foo.id, bar.id);
          assert.strictEqual(foo.className, bar.className);
        });
      });

      describe("flexo.$<tagname>(attrs={}, [contents])", function () {
        it("is a shorthand for HTML and (most) SVG and MathML elements, such as flexo.$div(), flexo.$rect(), flexo.$matrix(), &c. ", function () {
          var div = flexo.$div();
          var rect = flexo.$rect();
          var matrix = flexo.$matrix();
          assert.strictEqual(div.localName, "div");
          assert.strictEqual(rect.localName, "rect");
          assert.strictEqual(rect.namespaceURI, flexo.ns.svg);
          assert.strictEqual(matrix.localName, "matrix");
          assert.strictEqual(matrix.namespaceURI, flexo.ns.m);
        });
        it("uses a camelcase conversion for elements names with a dash (e.g. flexo.$fontFace for SVG <font-face>)", function () {
          var ff = flexo.$fontFace();
          assert.strictEqual(ff.namespaceURI, flexo.ns.svg);
          assert.strictEqual(ff.localName, "font-face");
        });
      });

      describe("flexo.$$(contents)", function () {
        it("creates a document fragment in `window.document`, handling contents in the same way as flexo.$()", function () {
          var fragment = flexo.$$("lorem ", [flexo.$strong("ipsum"), " dolor"]);
          assert.strictEqual(fragment.childNodes.length, 3);
          assert.strictEqual(fragment.childNodes[1].textContent, "ipsum");
        });
      });

      describe("flexo.append_child(node, ch)", function() {
        it("appends a child node to a node if ch is a node");
        it("appends a text node to a node if ch is a string");
        it("appends all elements of ch if ch is an array");
        it("ignores any other content");
      });


      describe("flexo.event_client_pos(e)", function () {
        it("returns an { x: e.clientX, y: e.clientY } object for a mouse event", function (done) {
          var div = document.createElement("div");
          div.addEventListener("mousedown", function (e) {
            var p = flexo.event_client_pos(e);
            assert.equal(p.x, 10);
            assert.equal(p.y, 20);
            done();
          }, false);
          var e = document.createEvent("MouseEvent");
          e.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 10, 20,
            false, false, false, false, 0, null);
          div.dispatchEvent(e);
        });

        // TODO: Test touch event
      });

      describe("flexo.remove_children(node)", function () {
        it("removes all child nodes of `node`", function () {
          var p = flexo.$p(
            "This is a paragraph ",
            flexo.$("strong", "with mixed content"),
            " which will be removed.");
          assert.strictEqual(p.childNodes.length, 3);
          assert.strictEqual(p.textContent,
            "This is a paragraph with mixed content which will be removed.");
          flexo.remove_children(p);
          assert.strictEqual(p.childNodes.length, 0);
        });
      });

      var p = flexo.$p();

      describe("flexo.root(node)", function () {
        it("finds the furthest ancestor of `node` in the DOM tree, returning `node` if it has no parent", function () {
          assert.strictEqual(flexo.root(p), p);
          var span = p.appendChild(flexo.$span());
          assert.strictEqual(flexo.root(span), p);
        });
        it("returns `document` if the node is in the main document", function () {
          document.body.appendChild(p);
          assert.strictEqual(flexo.root(p), document);
        });
        it("is safe to use with null or undefined values", function () {
          assert.strictEqual(flexo.root());
          assert.strictEqual(flexo.root(null), null);
        });
      });

      describe("flexo.safe_remove(node)", function () {
        it("removes a node from its parent", function () {
          flexo.safe_remove(p);
          assert.equal(flexo.parentNode, null);
        });
        it("is safe to use when the node is null or undefined, or has no parent", function () {
          flexo.safe_remove();
          flexo.safe_remove(null);
          flexo.safe_remove(p);
          assert.equal(flexo.parentNode, null);
        });
      });

      describe("flexo.set_class_iff(element, class, p)", function () {
        it("sets `class` on `element` if `p` is true, and removes it otherwise", function () {
          var div = flexo.$("div.test");
          assert.ok(div.classList.contains("test"));
          flexo.set_class_iff(div, "addl", true);
          assert.ok(div.classList.contains("addl"));
          flexo.set_class_iff(div, "test", false);
          assert.ok(!div.classList.contains("test"));
        });
      });

    });
  }

  describe("Color", function () {

    describe("flexo.hsv_to_rgb(h, s, v)", function () {
      it("converts a color in HSV (hue in radian, saturation and value/brightness between 0 and 1) to RGB (array of three integer values in the [0, 256[ interval)", function () {
        assert.deepEqual(flexo.hsv_to_rgb(Math.random(), 0, 1),
          [255, 255, 255]);
        assert.deepEqual(flexo.hsv_to_rgb(Math.random(), 0, 0.5),
          [128, 128, 128]);
        assert.deepEqual(flexo.hsv_to_rgb(Math.random(), Math.random(), 0),
          [0, 0, 0]);
        assert.deepEqual(flexo.hsv_to_rgb(0, 1, 1), [255, 0, 0]);
        assert.deepEqual(flexo.hsv_to_rgb(Math.PI / 3, 1, 0.75), [191, 191, 0]);
        assert.deepEqual(flexo.hsv_to_rgb(2 * Math.PI / 3, 1, 0.5), [0, 128, 0]);
        assert.deepEqual(flexo.hsv_to_rgb(Math.PI, 0.5, 1), [128, 255, 255]);
      });
    });

    describe("flexo.hsv_to_hex(h, s, v)", function () {
      it("converts a color in HSV (hue in radian, saturation and value/brightness between 0 and 1) to hex (#rrggbb)", function () {
        assert.strictEqual(flexo.hsv_to_hex(Math.random(), 0, 1), "#ffffff");
        assert.strictEqual(flexo.hsv_to_hex(Math.random(), 0, 0.5), "#808080");
        assert.strictEqual(flexo.hsv_to_hex(Math.random(), Math.random(), 0),
          "#000000");
        assert.strictEqual(flexo.hsv_to_hex(0, 1, 1), "#ff0000");
        assert.strictEqual(flexo.hsv_to_hex(Math.PI / 3, 1, 0.75), "#bfbf00");
        assert.strictEqual(flexo.hsv_to_hex(2 * Math.PI / 3, 1, 0.5),
          "#008000");
        assert.strictEqual(flexo.hsv_to_hex(Math.PI, 0.5, 1), "#80ffff");
      });
    });

    describe("flexo.rgb_to_hex(r, g, b)", function () {
      it("formats an array of RGB values (clamped to the [0, 256[ interval) to a hex value (#rrggbb)", function () {
        assert.strictEqual(flexo.rgb_to_hex(255, 255, 255), "#ffffff");
        assert.strictEqual(flexo.rgb_to_hex(128, 128, 128), "#808080");
        assert.strictEqual(flexo.rgb_to_hex(0, 0, 0), "#000000");
        assert.strictEqual(flexo.rgb_to_hex(255, 0, 0), "#ff0000");
        assert.strictEqual(flexo.rgb_to_hex(191, 191, 0), "#bfbf00");
        assert.strictEqual(flexo.rgb_to_hex(0, 128, 0), "#008000");
        assert.strictEqual(flexo.rgb_to_hex(128, 255, 255), "#80ffff");
      });
    });

    describe("flexo.num_to_hex(n)", function () {
      it("formats a number as a 6-digit hex color, using only the lowest 24 bit of the integral part", function () {
        assert.strictEqual(flexo.num_to_hex(0xfef8f0), "#fef8f0");
        assert.strictEqual(flexo.num_to_hex(0x1234), "#001234");
        assert.strictEqual(flexo.num_to_hex(0x12345678), "#345678");
        assert.strictEqual(flexo.num_to_hex(-1), "#ffffff");
        assert.strictEqual(flexo.num_to_hex("black"), "#000000");
      });
    });

  });

}());
