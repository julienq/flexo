flexo
=====

A Javascript general-purpose library (used by Bender a.o.)

Use Mocha (`npm install mocha`) to run tests from the command line (`mocha
test/flexo.js`.) To run tests from a browser, also install Chai (`npm install
chai`) then open `test/flexo.html` in your browser. More documentation is
forthcoming; [run the test page](http://romulusetrem.us/flexo/test/flexo.html)
to get an idea of what you can do.


## Changes

### New in v0.1.3

* `values` to get values of a dictionary-like object.

### New in v0.1.2

* `listen`, `listen_once` and `unlisten` return the listener;
* new function `nop`: does nothing.

### New in v0.1.1

* separated `poly_points` to generate points for an existing element;
* added tests.
