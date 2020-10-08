var settings = require("Storage").readJSON("keysense.json", 1) || {};

function update_settings() {
  require("Storage").write("keysense.json", settings);
}

function pair_device() {

  var device_menu = {
    "": {"title": "KS - Pair"},
    "< Back": () => {
      NRF.setScan();
      show_main_menu();
    }
  };

  NRF.setScan(function(dev) {

    if (!dev.name || (dev.name in device_menu))
      return;

    /* only show unknown devices */
    for (var known_dev of settings.devices) {
      if ((known_dev.name == dev.name) && (known_dev.id == dev.id))
        return;
    }

    device_menu[dev.name] = () => {
      /* append device to known devices */
      devs = settings.devices || [];
      devs.push({name: dev.name, id: dev.id});
      settings.devices = devs;

      /* stop scanning */
      NRF.setScan();

      /* update settings */
      update_settings();
      show_main_menu();
    };

    E.showMenu(device_menu);
  }, {active: true});

  E.showMenu(device_menu);
}

function show_devices() {

  var device_menu = {
    "": {"title": "KS - Devices"}
  };

  var devs = settings.devices || [];

  devs.forEach(dev => {
    device_menu[dev.name] = () => {
      devs.splice(devs.indexOf(dev), 1);
      update_settings();
      show_main_menu();
    };
  });

  device_menu["< Back"] = () => show_main_menu();

  E.showMenu(device_menu);
}

function show_settings() {

  const settings_menu = {
    "": {"title": "KS - Settings"},
    "Scan Interval (S)": {
      value: settings.scan_interval||0,
      min: 1,
      max: 60,
      step: 1,
      onchange: v => {
        settings.scan_interval = v;
        update_settings();
      }
    },
    "TO-Intevals": {
      value: settings.to_intervals||0,
      min: 1,
      max: 10,
      step: 1,
      onchange: v => {
        settings.to_intervals = v;
        update_settings();
      }
    },
    "< Back": () => show_main_menu()
  };

  E.showMenu(settings_menu);
}

function show_main_menu() {

  const main_menu = {
    "": {"title": "KeySense"},
    "+ Pair": () => pair_device(),
    "+ Devices": () => show_devices(),
    "+ Settings": () => show_settings(),
    "< Back": () => {load();}
  };

  E.showMenu(main_menu);
}

show_main_menu();