WIDGETS = {};

(() => {
  var settings = {}; /* settings in storage of bangle.js */
  var tracked_devs = {}; /* list of tracked devices with timestamps */
  var scan_interval = 0; /* interval tracked devs are checkd */
  var to_intervals = 0; /* to = not seen for scan_intervals * to_intervals */

  /* listens to passive beacon pings and updates tracked_devs */
  function nrf_scan(dev) {

    /* device has to be known */
    if (!(dev.id in tracked_devs))
      return;

    /* update last seen timestamp */
    tracked_devs[dev.id].last_seen = getTime();

    if (tracked_devs.active == false)
      tracked_devs.active = true;
  }

  /* checks if tracked device went missing */
  function check_tracked_devs() {
    var time_now = getTime();

    for (var dev of tracked_devs) {

      /* tag was not seen once */
      if (dev.last_seen == 0)
        continue;

      if ((time_now - dev.last_seen) >= (scan_interval * to_intervals)) {
        /* alarm */
        Bangle.buzz();
        E.showAlert("Lost Key\n" + dev.name);
        /* mark device as not seen */
        dev.last_seen = 0;
      }

    }
  }

  function reload() {
    settings = require("Storage").readJSON("keysense.json", 1) || {};
    tracked_devs = {};
    scan_interval = settings.scan_interval || 5;
    to_intervals = settings.to_intervals || 2;

    /* insert marker if initial dev was found */
    tracked_devs.active = false;
    /* load tracked devices */
    for (var dev of settings.devices) {
      tracked_devs[dev.id] = {name: dev.name, last_seen: 0};
    }

    /* set peridic check */
    setInterval(check_tracked_devs, scan_interval * 1000);
    /* passive scan to save battery power */
    NRF.setScan(nrf_scan, {active: false});
  }

  reload();
})();