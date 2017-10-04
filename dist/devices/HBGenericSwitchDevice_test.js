"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var HBDevoloDevice_1 = require("../HBDevoloDevice");
var HBGenericSwitchDevice = (function (_super) {
    __extends(HBGenericSwitchDevice, _super);
    function HBGenericSwitchDevice(log, dAPI, dDevice) {
        var _this = _super.call(this, log, dAPI, dDevice) || this;
        var self = _this;
        self.dDevice.events.on('onStateChanged', function (state) {
            self.log.info('%s (%s / %s) > State > %s', self.constructor.name, self.dDevice.id, self.dDevice.name, state);
            self.switchService.getCharacteristic(self.Characteristic.On).updateValue(state, null);
        });
        return _this;
    }
    HBGenericSwitchDevice.prototype.getServices = function () {
        this.informationService = new this.Service.AccessoryInformation();
        this.informationService
            .setCharacteristic(this.Characteristic.Manufacturer, 'Generic')
            .setCharacteristic(this.Characteristic.Model, 'MultiSwitch');

        //#1
        this.switchService = new this.Service.Outlet(this.name, "#1");
        this.switchService.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));

        //#2
        this.switchService2 = this.addService(Service.Outlet, "#2");
        this.switchService2.getCharacteristic(this.Characteristic.On)
            .on('get', this.getSwitchState.bind(this))
            .on('set', this.setSwitchState.bind(this));
        this.dDevice.listen();

        return [this.informationService, this.switchService, , this.switchService2];
    };
    HBGenericSwitchDevice.prototype.getSwitchState = function (callback) {
        this.log.debug('%s (%s) > getSwitchState', this.constructor.name, this.dDevice.id);
        return callback(null, this.dDevice.getState() != 0);
    };
    HBGenericSwitchDevice.prototype.setSwitchState = function (value, callback) {
        this.log.debug('%s (%s) > setSwitchState to %s', this.constructor.name, this.dDevice.id, value);
        if (value == this.dDevice.getState()) {
            callback();
            return;
        }
        var self = this;
        if (value) {
            this.dDevice.turnOn(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        }
        else {
            this.dDevice.turnOff(function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        }
    };
    return HBGenericSwitchDevice;
}(HBDevoloDevice_1.HBDevoloDevice));
exports.HBGenericSwitchDevice = HBGenericSwitchDevice;
