(() => {
  var settings = {}; /* settings in storage of bangle.js */
  var tracked_devs = {}; /* list of tracked devices with timestamps */
  var scan_interval = 0; /* interval tracked devs are checkd */
  var to_intervals = 0; /* to = not seen for scan_intervals * to_intervals */
  var is_active = false; /* indicator if some key was found */
  var dev_lost = false; /* indicator if some device went missing */
  var timer_id = -1; /* id of setInterval to later stop interval */

  /* listens to passive beacon pings and updates tracked_devs */
  function nrf_scan(dev) {

    /* device has to be known */
    if (!(dev.id in tracked_devs))
      return;

    /* update last seen timestamp */
    tracked_devs[dev.id].last_seen = getTime();

    if (is_active == false) {
      is_active = true;
      Bangle.drawWidgets();
    }
  }

  /* checks if tracked device went missing */
  function check_tracked_devs() {
    var time_now = getTime();
    var lost = false;

    for (var dev of tracked_devs) {

      /* tag was not seen once */
      if (dev.last_seen == 0)
        continue;

      if ((time_now - dev.last_seen) >= (scan_interval * to_intervals)) {
        /* alarm */
        Bangle.buzz();
        //E.showAlert("Lost Key\n" + dev.name);
        /* mark device as not seen */
        dev.last_seen = 0;
        lost = true;
      }
    }

    /* change global lost status */
    if (lost != dev_lost) {
      dev_lost = lost;
      Bangle.drawWidgets();
    }
  }

  /* draws widget */
  function draw() {
    g.reset();

    if (is_active) {
      if (dev_lost)
        g.setColor("#FFFF00");
      else
        g.setColor("#00FF00");
    }
    else {
      g.setColor("#FF0000");
    }

    g.drawImage(require("Storage").read("keysense-icon.img"), this.x, this.y,
                {scale: 0.5});
    g.setFont("6x8").drawString("K", this.x, this.y);
  }

  function reload() {
    var config_has_devs = false;
    settings = require("Storage").readJSON("keysense.json", 1) || {};
    tracked_devs = {};
    scan_interval = settings.scan_interval || 5;
    to_intervals = settings.to_intervals || 2;

    /* stop scan and interval check */
    NRF.setScan();
    if (timer_id != -1)
      clearInterval(timer_id);

    /* marker if initial dev was found */
    is_active = false;
    dev_lost = false;
    /* load tracked devices */
    for (var dev of settings.devices) {
      tracked_devs[dev.id] = {name: dev.name, last_seen: 0};
      config_has_devs = true;
    }

    /* no devs here */
    if (!config_has_devs)
      return;

    /* set periodic check */
    timer_id = setInterval(check_tracked_devs, scan_interval * 1000);
    /* passive scan to save battery power */
    NRF.setScan(nrf_scan, {active: false});
  }

  /* add the widget */
  WIDGETS["keysense"]={area:"br",width:24,draw:draw,reload:function() {
    reload();
    Bangle.drawWidgets(); /* relayout all widgets */
  }};

  reload();
})();