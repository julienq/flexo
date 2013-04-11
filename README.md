flexo
=====

A Javascript general-purpose library (used by Bender a.o.)

Use Mocha (`npm install mocha`) to run tests from the command line (`mocha
test/flexo.js`.) To run tests from a browser, also install Chai (`npm install
chai`) then open `test/flexo.html` in your browser. More documentation is
forthcoming; [run the test page](http://romulusetrem.us/flexo/test/flexo.html)
to get an idea of what you can do.


## TODO

* Write documentation
* Seq improvements: foreach, &c.
* Randomness: drunk, seeded generator, &c.


## Changes

### New in v0.1.5 (forthcoming)

* **quote** to quote a string;
* **make_property** takes an optional initial value;
* **urn** to pick random elements from an array while emptying the array;
* `Seq.flush()` can be called explicitely to start flushing without waiting for
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
