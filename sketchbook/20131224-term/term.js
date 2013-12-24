(function (ui) {
  "use strict";

  ui.Term = {
    init: function (div) {
      this.div = div;
      this.input = div.querySelector("input");
      this.last = this.input.parentNode;
      this.pspan = this.last.querySelector("span");
      this.input.addEventListener("keyup", this);
      this.history = [];
      return this;
    },

    focus: function () {
      this.input.focus();
      return this;
    },

    handleEvent: function (e) {
      if (e.type === "keyup") {
        if (e.keyCode === 13) {
          var val = this.input.value;
          if (val !== "" && val !== this.history[this.history.length - 1]) {
            this.history.push(val);
          }
          this.i = this.history.length;
          this.div.insertBefore(flexo.$p(val), this.last);
          this.input.value = "";
          this.input.scrollIntoView();
        } else if (e.keyCode === 38) {
          // up, go back in history
          this.i = Math.max(this.i - 1, 0);
          if (this.history[this.i]) {
            this.input.value = this.history[this.i];
            e.preventDefault();
          }
        } else if (e.keyCode === 40) {
          // down, go forward in history
          this.i = Math.min(this.i + 1, this.history.length);
          if (this.history[this.i]) {
            this.input.value = this.history[this.i];
            e.preventDefault();
          }
        }
      }
    }
  };

  Object.defineProperty(ui.Term, "prompt", {
    enumerable: true,
    get: function () {
      return this.pspan.innerHTML;
    },
    set: function (p) {
      this.pspan.innerHTML = p;
    }
  });

}(flexo.ui));
