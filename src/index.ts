var util = require('util');
import {HBDevoloCentralUnit} from './HBDevoloCentralUnit';
import {HBDevoloPlatformConfig,HBIDevoloDevice} from './HBDevoloMisc';
import {Devolo} from 'node-devolo/dist/Devolo';

let Homebridge;
let Service;
let Characteristic;

class HBDevoloPlatform {

    config: HBDevoloPlatformConfig;
    centralUnit: HBDevoloCentralUnit;
    log;
    version: string = '201702221607';

    constructor(log, config: HBDevoloPlatformConfig) {
        this.log = log;
        this.log.debug('%s > Initializing (Version: %s)', (this.constructor as any).name, this.version);

        this.config = config;
        this.config.platform = config.platform || 'Devolo';
        this.config.name = config.name || 'Devolo';
        this.config.heartrate = config.heartrate || 3;

        var debugconfig = JSON.parse(JSON.stringify(this.config));
        if(debugconfig.email) debugconfig.email = 'xxx';
        if(debugconfig.password) debugconfig.password = 'xxx';
        if(debugconfig.uuid) debugconfig.uuid = 'xxx';
        if(debugconfig.gateway) debugconfig.gateway = 'xxx';
        if(debugconfig.passkey) debugconfig.passkey = 'xxx';
        this.log.debug('%s > Configuration:\n%s', (this.constructor as any).name, util.inspect(debugconfig, false, null));
    }

    accessories(callback : (accessories: HBIDevoloDevice[]) => void) {

        if(!this.config.email || !this.config.password || !this.config.host) {
            this.log.error('%s > Email, password and/or host missing in config.json.', (this.constructor as any).name);
            return;
        }

        this.log.info('%s > Searching for Devolo Central Unit.', (this.constructor as any).name);
        var self = this;

        this.findCentralUnit(function(err, dOptions) {
            if(err) {
                self.log.error('%s > %s', (self.constructor as any).name, err); return;
            }
            self.log.info('%s > Central Unit found.', (self.constructor as any).name);

            if(!self.config.uuid || !self.config.gateway || !self.config.passkey) {
                let s = '\n';
                s += '  "platforms": [\n';
                s += '    {\n';
                s += '      "platform": "' + self.config.platform + '",\n';
                s += '      "name": "' + self.config.name + '",\n';
                s += '      "host": "' + self.config.host + '",\n';
                s += '      "email": "' + self.config.email + '",\n';
                s += '      "password": "' + self.config.password + '",\n';
                s += '      "uuid": "' + dOptions.uuid + '",\n';
                s += '      "gateway": "' + dOptions.gateway + '",\n';
                s += '      "passkey": "' + dOptions.passkey + '"\n';
                s += '    }\n';
                s += '  ]';
                self.log.info('%s > Please edit config.json and restart homebridge.%s', (self.constructor as any).name, s);
                return;
            }

            self.log.debug('%s > SessionID: %s', (self.constructor as any).name, dOptions.sessionid);

            let accessoryList = [];

            accessoryList.push(self.centralUnit);
            self.centralUnit.accessories(function(err, accessories) {
                if(err) {
                    throw err;
                }
                for(var i=0; i<accessories.length; i++) {
                    accessoryList.push(accessories[i]);
                }

                self.centralUnit.startHeartbeatHandler();

                callback(accessoryList);
            });

        });
    }

    private findCentralUnit(callback: (err:string, dOptions?) => void) : void {

        var self = this;
        let options = {
            email: self.config.email,
            password: self.config.password,
            centralHost: self.config.host, //fetch automatically????
            uuid: self.config.uuid,
            gateway: self.config.gateway,
            passkey: self.config.passkey,
            sessionid: ''
        };
        new Devolo(options, function(err, d) {
            if(err) {
                callback(err); return;
            }
            self.log.debug('%s > Devolo API Version: %s', (self.constructor as any).name, d.version);
            self.centralUnit = new HBDevoloCentralUnit(self.log, self.config, d);
            self.centralUnit.setHomebridge(Homebridge);
            callback(null, d._options);
        });

    }

}

export = function(homebridge) {
    Homebridge = homebridge;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    Characteristic.CurrentConsumption = function() {
        Characteristic.call(this, 'CurrentConsumption', '00000010-0000-0000-0000-199207310822');

        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'W',
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });

        this.value = 0;
    };
    util.inherits(Characteristic.CurrentConsumption, Characteristic);

    Characteristic.TotalConsumption = function() {
        Characteristic.call(this, 'TotalConsumption', '00000011-0000-0000-0000-199207310822');

        this.setProps({
            format: Characteristic.Formats.FLOAT,
            unit: 'kWh',
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });

        this.value = 0;
    };
    util.inherits(Characteristic.TotalConsumption, Characteristic);

    Characteristic.TotalConsumptionSince = function() {
        Characteristic.call(this, 'TotalConsumptionSince', '00000012-0000-0000-0000-199207310822');

        this.setProps({
            format: Characteristic.Formats.STRING,
            perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        });

        this.value = '';
    };
    util.inherits(Characteristic.TotalConsumptionSince, Characteristic);

    homebridge.registerPlatform("homebridge-devolo", "Devolo", HBDevoloPlatform, false);
};