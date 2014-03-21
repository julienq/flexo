(function () {
  "use strict";

  var pc = paranoia.Item.create("Dave").tags("PC");
  var frontdoor = paranoia.Item.create("Door", "Front door")
    .tags("Front", "Locked");
  var doormat = paranoia.Item.create("DoorMat", "Door mat").tags("Unturned");
  var frontkey = paranoia.Item.create("Key", "Big key")
    .tags("Front", "CanPickup");

  var loc = paranoia.Location.create("OutsideFront", "Outside of the house")
    .items(pc, frontdoor, doormat);

  ui.status("Paranoia Palace");
  paranoia.Location.current = loc;

}());
