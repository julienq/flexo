flexo
=====

A Javascript general-purpose library (used by
[Bender](http://bender.igel.co.jp/) a.o.)

Use Mocha (`npm install mocha`) to run tests from the command line (`mocha
test/flexo.js`.) To run tests from a browser, also install Chai (`npm install
chai`) then open `test/flexo.html` in your browser. More documentation is
forthcoming; [run the test page](http://romulusetrem.us/flexo/test/flexo.html)
to get an idea of what you can do.


## Samples

* An [SVG clock](http://www.romulusetrem.us/flexo/samples/clock.svg)
* [Random gradients](http://www.romulusetrem.us/flexo/samples/gradients.svg)
* Random portraits, loading the images using promises either [in parallel](http://www.romulusetrem.us/flexo/samples/portraits.html) or [in sequence](http://www.romulusetrem.us/flexo/samples/portraits.html?par=false).

## TODO

* Write documentation
* Missing tests (fix unlisten)
* Randomness: noise, drunk, seeded generator, &c.


## Changes

### New in v0.2.2

* Simplified **make_property** setter API (no need for previous value);
* **Urn.picks** to pick n items at once; **remaining** property; avoid repeats
  by default (so no extra flag/parameter);
* reviewed custom events so that they are not stored on objects themselves;
  this also allows to listen to all notifications of a given type.

### New in v0.2.1

* **intersperse** for arrays;
* **remove** for urn;
* **timeout** for promises;
* **asap** as a faster way to delay execution than setTimeout, using
  setImmediate where available, or window.postMessage otherwise;
* **promise_img** takes an attributes object as argument which should contain a
  src property (or simply a src string.)

### New in v0.2.0

* Removed **Seq** and implemented [**Promise**](http://promises-aplus.github.io/promises-spec/), with separate tests.
* **promise_img** to create a promise for an img element;
* **Par** to manage a list of promises;
* **quote** escapes newlines;
* **ez_xhr** returns a promise and fulfills it with the response of the request;
  ottherwise, rejects it with an object containing the request and an additional
  reason.
* **safe_string** to allow toString() to be called safely or null or undefined
  values (TODO: test)
* **funcify** to turn a value into a 0-ary function returning that value (TODO:
  test)
* renamed **cancel** to **fail**;
* **remove_first_from_array** removes the first element that matches a
  predicate;
* Global **π** is set to Math.PI;
* **hcaErof** is forEach in reverse (TODO: test);
* **Function.discard** returns a function that discards its arguments;
* **String.fmt** converts %n to an integer (so %03 is the same as %3);
* **String.fmt** accepts the form %(n) to avoid ambiguites (e.g. "%(0)0".)

### New in v0.1.5

* **Function.trampoline** and **Function.get_thunk** (require tests)
* **quote** to quote a string;
* **make_property** takes an optional initial value;
* **urn** to pick random elements from an array while emptying the array;
* **Seq.flush()** can be called explicitly to start flushing without waiting for
  timeout.

### New in v0.1.4

* fixed false-negative in Firefox;
* **array_without** returns a copy of the input array without the given item;
* **cancel** throws a ”cancel” exception when called with a true value, or no
  value at all;
* **make_property** makes use of cancel to cancel setting a property instead of
  the ambiguous ”undefined” value (the setter receives a third parameter);
* **num_to_hex** converts a number into a hex-formatted color.

### New in v0.1.3

* **values** to get values of a dictionary-like object.

### New in v0.1.2

* **listen**, **listen_once** and **unlisten** return the listener;
* new function **nop**: does nothing.

### New in v0.1.1

* separated **poly_points** to generate points for an existing element;
* added tests.


## Links

Trampoline calls are adapted from 
[http://github.com/spencertipping/js-in-ten-minutes](http://github.com/spencertipping/js-in-ten-minutes).
Asap is inspired by [https://github.com/NobleJS/setImmediate](https://github.com/NobleJS/setImmediate).
Promises follow the [Promises/A+ spec](http://promises-aplus.github.io/promises-spec/).
