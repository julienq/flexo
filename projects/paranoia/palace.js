(function () {
  "use strict";

  var frontdoor = paranoia.Item.create("Door", "Front door")
    .tags("Front", "Locked");
  var doormat = paranoia.Item.create("DoorMat", "Door mat").tags("Unturned");
  var frontkey = paranoia.Item.create("Key", "Big key")
    .tags("Front", "CanPickup");

  var loc = paranoia.Location.create("OutsideFront", "Outside of the house")
    .items(frontdoor, doormat);

  console.log(loc.toString());
  Object.keys(paranoia.Item.items).forEach(function (name) {
    paranoia.Item.items[name].forEach(function (item) {
      console.log(item.toString());
    });
  });

  console.log("%0 matches Key = %1".fmt(frontkey, frontkey.match("Key")));
  console.log("%0 matches +CanPickup = %1"
    .fmt(frontkey, frontkey.match("", ["CanPickup"])));
  console.log("%0 matches Key+Trunk = %1"
    .fmt(frontkey, frontkey.match("Key", ["Trunk"])));
  console.log("%0 matches DoorMat+Unturned = %1"
    .fmt(frontkey, frontkey.match("DoorMat", ["Unturned"])));
  console.log("%0 matches DoorMat+Unturned = %1"
    .fmt(doormat, doormat.match("DoorMat", ["Unturned"])));
  console.log("%0 matches DoorMat-Unturned = %1"
    .fmt(doormat, doormat.match("DoorMat", [], ["Unturned"])));

  paranoia.ActionRule.create("Door", [], ["Locked"]);
  paranoia.ActionRule.create("DoorMat", ["Unturned"]);

  paranoia.Rule.rules.forEach(function (rule) {
    console.log(rule.toString());
  });

}());
