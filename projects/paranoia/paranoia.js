(function () {
  "use strict";

  if (typeof window === "object") {
    window.paranoia = {};
  } else {
    global.flexo = require("flexo");
    global.paranoia = exports;
  }

  var flags = {
    no_location: true,
  };


  // Base object
  var Base = paranoia.Base = {

    // Initialize the object and return self.
    init: flexo.self,

    // Create an object (this), initialize it with the given arguments, and
    // return it.
    create: function () {
      var object =  Object.create(this);
      return object.init.apply(object, arguments);
    }
  };


  // Named item with an optional description.
  var Named = paranoia.Named = flexo._ext(Base, {
    init: function (name, desc) {
      this.name = name;
      this.desc = desc || name;
      return Base.init.call(this);
    }
  });


  // Location
  var Location = paranoia.Location = flexo._ext(Named, {

    // Keep track of all locations in the world.
    locations: {},

    // Initialize a location with a name, an optional description, and no item.
    init: function (name, desc) {
      this._items = [];
      this.locations[name] = this;
      return Named.init.call(this, name, desc);
    },

    // Add an item to the location.
    item: function (item) {
      if (item.location && item.location !== this) {
        item.location.unitem(item);
      }
      this._items.push(item);
      item.location = this;
      return item;
    },

    // Remove the item from the location and return it. If it was not there in
    // the first place, return nothing.
    unitem: function (item) {
      if (item.location === this) {
        delete item.location;
        var i = this._items.indexOf(item);
        if (i >= 0) {
          this._items.splice(i, 1);
          return item;
        }
      }
    },

    // Add all items to the location and return this location.
    items: function () {
      if (arguments.length === 0) {
        return this._items;
      }
      flexo.foreach(arguments, this.item, this);
      return this;
    },

    // Match an item in the current location.
    match_item: function (item, name, tags, untags) {
      return item.location === this && item.match(name, tags, untags);
    },

    toString: function () {
      var items = this.items();
      return "Location " + this.name +
        (items.length > 0 ? ": " + this.items().map(function (item) {
            return item.toString(flags.no_location);
          }).join(", ") : "") +
        (this.desc !== this.name ? "; " + flexo.quote(this.desc) : "") + ".";
    }
  });


  // Item
  paranoia.Item = flexo._ext(paranoia.Named, {

    // Keep track of all items in the world.
    items: {},

    // Initialize an item with a name and an optional description.
    init: function (name, desc) {
      this._tags = {};
      if (!this.items.hasOwnProperty(name)) {
        this.items[name] = [];
      }
      this.items[name].push(this);
      return paranoia.Named.init.call(this, name, desc);
    },

    // Add a tag to the item and return it.
    tag: function (tag) {
      this._tags[tag] = true;
      return tag;
    },

    // Return the list of tags, or add tags if parameters are given.
    tags: function () {
      if (arguments.length === 0) {
        return Object.keys(this._tags);
      }
      flexo.foreach(arguments, this.tag, this);
      return this;
    },

    // Remove a tag and return the tag if it was removed, or false if not.
    untag: function (tag) {
      if (!tag in this._tags) {
        return false;
      }
      delete this._tags[tag];
      return tag;
    },

    // Predicate to match this item with a name, a list of required tags, and a
    // list of forbidden tags.
    match: function (name, tags, untags) {
      return (!name || this.name === name) &&
        !flexo.find_first(tags || [], function (tag) {
          return !(tag in this._tags);
        }, this) &&
        !flexo.find_first(untags || [], function (tag) {
          return tag in this._tags;
        }, this);
    },

    // String version of an item with its tags.
    toString: function (no_location) {
      return this.name + this.tags().map(function (tag) {
        return "+" + tag;
      }).join("") +
      (!no_location && this.location ? "@" + this.location.name : "");
    }
  });


  var Rule = paranoia.Rule = flexo._ext(Base, {

    // Keep track of all rules
    rules: [],

    init: function (effect) {
      this.effect = effect;
      this.rules.push(this);
      return Base.init.call(this);
    },

    toString: function () {
      return " -> (some effect).";
    }
  });


  // An action rule is a rule with a single item on the left-hand side
  var ActionRule = paranoia.ActionRule = flexo._ext(Rule, {

    init: function (name, tags, untags, effect) {
      this.name = name;
      this.tags = tags || [];
      this.untags = untags || [];
      return Rule.init.call(this, effect);
    },

    toString: function () {
      return this.name + this.tags.map(function (tag) {
        return "+" + tag;
      }).join("") + this.untags.map(function (tag) {
        return "-" + tag;
      }).join("") + Rule.toString.call(this);
    }

  });

}());
