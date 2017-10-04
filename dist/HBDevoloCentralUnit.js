"use strict";
var HBDevoloSwitchMeterDevice_1 = require("./devices/HBDevoloSwitchMeterDevice");
var HBDevoloHumidityDevice_1 = require("./devices/HBDevoloHumidityDevice");
var HBDevoloDoorWindowDevice_1 = require("./devices/HBDevoloDoorWindowDevice");
var HBDevoloMotionDevice_1 = require("./devices/HBDevoloMotionDevice");
var HBDevoloFloodDevice_1 = require("./devices/HBDevoloFloodDevice");
var HBDevoloThermostatValveDevice_1 = require("./devices/HBDevoloThermostatValveDevice");
var HBDevoloSmokeDetectorDevice_1 = require("./devices/HBDevoloSmokeDetectorDevice");
var HBDevoloRoomThermostatDevice_1 = require("./devices/HBDevoloRoomThermostatDevice");
var HBQubinoShutterDevice_1 = require("./devices/HBQubinoShutterDevice");
var HBGenericSwitchDevice_1 = require("./devices/HBGenericSwitchDevice");
var HBDevoloRule_1 = require("./devices/HBDevoloRule");
var HBDevoloScene_1 = require("./devices/HBDevoloScene");
var DevoloDevice_1 = require("node-devolo/dist/DevoloDevice");
var Homebridge;
var Service;
var Characteristic;
var HBDevoloCentralUnit = (function () {
    function HBDevoloCentralUnit(log, config, dAPI) {
        this.accessoryList = [];
        this.deviceList = [];
        this.ruleList = [];
        this.sceneList = [];
        this.log = log;
        this.dAPI = dAPI;
        this.config = config;
        this.log.debug('%s > Initializing', this.constructor.name);
        this.name = 'Devolo Central Unit';
    }
    HBDevoloCentralUnit.prototype.setHomebridge = function (homebridge) {
        Homebridge = homebridge;
        Service = homebridge.hap.Service;
        Characteristic = homebridge.hap.Characteristic;
    };
    HBDevoloCentralUnit.prototype.accessories = function (callback) {
        var self = this;
        this.findAccessories(function (err) {
            if (err) {
                callback(err);
                return;
            }
            callback(null, self.accessoryList);
        });
    };
    HBDevoloCentralUnit.prototype.getServices = function () {
        this.informationService = new Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, 'Devolo')
            .setCharacteristic(Characteristic.Model, 'Central Unit');
        //.setCharacteristic(Characteristic.SerialNumber, 'ABCDEFGHI')
        return [this.informationService];
    };
    HBDevoloCentralUnit.prototype.findAccessories = function (callback) {
        //this.accessoryList.push(new HBDevoloDevice(this.log));
        var self = this;
        this.dAPI.getAllDevices(function (err, devices) {
            if (err) {
                callback(err);
                return;
            }
            //console.log(JSON.stringify(devices, null, 4));
            for (var i = 0; i < devices.length; i++) {
                var d = null;
                if (devices[i].constructor.name == DevoloDevice_1.SwitchMeterDevice.name) {
                    d = new HBDevoloSwitchMeterDevice_1.HBDevoloSwitchMeterDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.HumidityDevice.name) {
                    d = new HBDevoloHumidityDevice_1.HBDevoloHumidityDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.DoorWindowDevice.name) {
                    d = new HBDevoloDoorWindowDevice_1.HBDevoloDoorWindowDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.MotionDevice.name) {
                    d = new HBDevoloMotionDevice_1.HBDevoloMotionDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.FloodDevice.name) {
                    d = new HBDevoloFloodDevice_1.HBDevoloFloodDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.ThermostatValveDevice.name) {
                    d = new HBDevoloThermostatValveDevice_1.HBDevoloThermostatValveDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.SmokeDetectorDevice.name) {
                    d = new HBDevoloSmokeDetectorDevice_1.HBDevoloSmokeDetectorDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.RoomThermostatDevice.name) {
                    d = new HBDevoloRoomThermostatDevice_1.HBDevoloRoomThermostatDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.ShutterDevice.name) {
                    d = new HBQubinoShutterDevice_1.HBQubinoShutterDevice(self.log, self.dAPI, devices[i]);
                }
                else if (devices[i].constructor.name == DevoloDevice_1.GenericSwitchDevice.name) {
                    d = new HBGenericSwitchDevice_1.HBGenericSwitchDevice(self.log, self.dAPI, devices[i]);
                }
                else {
                    self.log.info("%s > Device \"%s\" is not supported (yet). Open an issue on github and ask for adding it.", self.constructor.name, devices[i].model);
                }
                if (d) {
                    d.setHomebridge(Homebridge);
                    self.accessoryList.push(d);
                    self.deviceList.push(d);
                }
            }
            self.dAPI.getRules(function (err, rules) {
                if (err) {
                    callback(err);
                    return;
                }
                for (var i = 0; i < rules.length; i++) {
                    if (self.config.ruleWhitelist && self._isInWhitelist(rules[i].name, self.config.ruleWhitelist)) {
                        var d = new HBDevoloRule_1.HBDevoloRule(self.log, self.dAPI, rules[i]);
                        d.setHomebridge(Homebridge);
                        self.accessoryList.push(d);
                        self.ruleList.push(d);
                    }
                }
                self.dAPI.getScenes(function (err, scenes) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    for (var i = 0; i < scenes.length; i++) {
                        if (self.config.sceneWhitelist && self._isInWhitelist(scenes[i].name, self.config.sceneWhitelist)) {
                            var d = new HBDevoloScene_1.HBDevoloScene(self.log, self.dAPI, scenes[i]);
                            d.setHomebridge(Homebridge);
                            self.accessoryList.push(d);
                            self.sceneList.push(d);
                        }
                    }
                    callback(null);
                });
            });
        });
    };
    HBDevoloCentralUnit.prototype.startHeartbeatHandler = function () {
        var self = this;
        var interval = setInterval(function ping() {
            self.dAPI.getZones(function (err, zones) {
                if (err) {
                    self.log.info('Fetching new session...');
                    clearInterval(interval);
                    self.dAPI.auth(function (err) {
                        if (err) {
                            self.log.error(err);
                            self.startHeartbeatHandler();
                            return;
                        }
                        self.startHeartbeatHandler();
                        self.log.info('Session successfully renewed.');
                    }, true);
                }
            });
        }, 30000);
    };
    HBDevoloCentralUnit.prototype._isInWhitelist = function (name, whitelist) {
        for (var i = 0; i < whitelist.length; i++) {
            if (name === whitelist[i])
                return true;
        }
        return false;
    };
    return HBDevoloCentralUnit;
}());
exports.HBDevoloCentralUnit = HBDevoloCentralUnit;
