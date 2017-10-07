/*
 * View model for OctoPrint-TPLinkSmartplug
 *
 * Author: jneilliii
 * License: AGPLv3
 */
$(function() {
    function tplinksmartplugViewModel(parameters) {
        var self = this;

        self.settings = parameters[0];
		self.loginState = parameters[1];
		
		self.currentState = ko.observable("unknown");
		self.ip = ko.observable();
		self.relayState = ko.observable("#808080");
		self.disconnectOnPowerOff = ko.observable();
		self.connectOnPowerOn = ko.observable();
		self.connectOnPowerOnDelay = ko.observable();
		self.enablePowerOffWarningDialog = ko.observable();
		self.gcodeprocessing = ko.observable();
		self.validIP = ko.observable();
		self.cmdOnPowerOn = ko.observable();
		self.cmdOnPowerOnCommand = ko.observable();
		self.cmdOnPowerOff = ko.observable();
		self.cmdOnPowerOffCommand = ko.observable();
		self.arrSmartplugs = ko.observableArray();
		
		self.onBeforeBinding = function() {
			self.ip(self.settings.settings.plugins.tplinksmartplug.ip());
			self.validIP(self.settings.settings.plugins.tplinksmartplug.validIP());
			self.disconnectOnPowerOff(self.settings.settings.plugins.tplinksmartplug.disconnectOnPowerOff());
			self.connectOnPowerOn(self.settings.settings.plugins.tplinksmartplug.connectOnPowerOn());
			self.connectOnPowerOnDelay(self.settings.settings.plugins.tplinksmartplug.connectOnPowerOnDelay());
			self.cmdOnPowerOn(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOn());
			self.cmdOnPowerOnCommand(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOnCommand());
			self.cmdOnPowerOff(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOff());
			self.cmdOnPowerOffCommand(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOffCommand());
			self.enablePowerOffWarningDialog(self.settings.settings.plugins.tplinksmartplug.enablePowerOffWarningDialog());
			self.gcodeprocessing(self.settings.settings.plugins.tplinksmartplug.gcodeprocessing());			
			self.arrSmartplugs(self.settings.settings.plugins.tplinksmartplug.arrSmartplugs());
        }
		
		self.onAfterBinding = function() {
			self.checkStatuses();
		}

        self.onEventSettingsUpdated = function (payload) {
			self.ip(self.settings.settings.plugins.tplinksmartplug.ip());			
			self.validIP(self.settings.settings.plugins.tplinksmartplug.validIP());
			self.disconnectOnPowerOff(self.settings.settings.plugins.tplinksmartplug.disconnectOnPowerOff());
			self.connectOnPowerOn(self.settings.settings.plugins.tplinksmartplug.connectOnPowerOn());
			self.connectOnPowerOnDelay(self.settings.settings.plugins.tplinksmartplug.connectOnPowerOnDelay());			
			self.cmdOnPowerOn(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOn());
			self.cmdOnPowerOnCommand(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOnCommand());
			self.cmdOnPowerOff(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOff());
			self.cmdOnPowerOffCommand(self.settings.settings.plugins.tplinksmartplug.cmdOnPowerOffCommand());
			self.enablePowerOffWarningDialog(self.settings.settings.plugins.tplinksmartplug.enablePowerOffWarningDialog());
			self.gcodeprocessing(self.settings.settings.plugins.tplinksmartplug.gcodeprocessing());
			self.arrSmartplugs(self.settings.settings.plugins.tplinksmartplug.arrSmartplugs());
		}
		
		self.addPlug = function() {
			self.settings.settings.plugins.tplinksmartplug.arrSmartplugs.push({'ip':'',
																				'displayWarning':true,
																				'gcodeEnabled':false,
																				'autoConnect':true,
																				'autoConnectDelay':10.0,
																				'autoDisconnect':true,
																				'autoDisconnectDelay':0,
																				'sysCmdOn':'',
																				'sysCmdOnDelay':0,
																				'sysCmdOff':'',
																				'sysCmdOffDelay':0,
																				'currentState':'unknown',
																				'btnColor':'#808080'});
		}
		
		self.removePlug = function(row) {
			self.settings.settings.plugins.tplinksmartplug.arrSmartplugs.remove(row);
		}
		
		self.onDataUpdaterPluginMessage = function(plugin, data) {
            if (plugin != "tplinksmartplug") {
                return;
            }
			
			//console.log("onDataUpdaterPluginMessage|" + ko.toJSON(data))
			
			plug = ko.utils.arrayFirst(self.settings.settings.plugins.tplinksmartplug.arrSmartplugs(),function(item){
				return item.ip() === data.ip;
				}) || {'ip':data.ip,'currentState':'unknown','btnColor':'#808080'};
				
			//console.log("onDataUpdaterPluginMessage|" + ko.toJSON(plug));
			
			if (plug.currentState != data.currentState) {
				plug.currentState(data.currentState)
				switch(data.currentState) {
					case "on":
						plug.btnColor("#00FF00");
						break;
					case "off":
						plug.btnColor("#FF0000");
						break;
					default:
						plug.btnColor("#808080");
						new PNotify({
							title: 'TP-Link Smartplug Error',
							text: 'Status ' + plug.currentState() + ' for ' + plug.ip() + '. Double check IP Address\\Hostname in TPLinkSmartplug Settings.',
							type: 'error',
							hide: true
							});
				}
				self.settings.saveData();
			}
        };
		
		self.toggleRelay = function(data) {
			console.log(data);
			switch(data.currentState()){
				case "on":
					self.turnOff(data);
					break;
				case "off":
					self.turnOn(data);
					break;
				default:
			}
		}
		
		self.turnOn = function(data) {
			if(data.autoConnect()){
				self.sendTurnOn(data);
				setTimeout(function(){self.connectPrinter()},data.autoConnectDelay()*1000);
			} else {
				self.sendTurnOn(data);
			}
		}
		
		self.sendTurnOn = function(data) {
            $.ajax({
                url: API_BASEURL + "plugin/tplinksmartplug",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "turnOn",
					ip: data.ip()
                }),
                contentType: "application/json; charset=UTF-8"
            });
        };

    	self.turnOff = function(data) {
			if(data.displayWarning()  && !$("#tplinksmartplug_poweroff_confirmation_dialog_" + data.ip()).is(':visible')){
				$("#tplinksmartplug_poweroff_confirmation_dialog_" + data.ip()).modal("show");
			} else {
				$("#tplinksmartplug_poweroff_confirmation_dialog_" + data.ip()).modal("hide");
				if(data.autoDisconnect()){
					self.disconnectPrinter();
					setTimeout(function(){self.sendTurnOff(data);},data.autoDisconnectDelay()*1000);
				} else {
					self.sendTurnOff(data);
				}
			}
        }; 
		
		self.sendTurnOff = function(data) {
			$.ajax({
			url: API_BASEURL + "plugin/tplinksmartplug",
			type: "POST",
			dataType: "json",
			data: JSON.stringify({
				command: "turnOff",
				ip: data.ip()
			}),
			contentType: "application/json; charset=UTF-8"
			});		
		}
		
		self.checkStatus = function(plugIP) {
            $.ajax({
                url: API_BASEURL + "plugin/tplinksmartplug",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "checkStatus",
					ip: plugIP
                }),
                contentType: "application/json; charset=UTF-8"
            });
        }; 
		
		self.disconnectPrinter = function() {
            $.ajax({
                url: API_BASEURL + "plugin/tplinksmartplug",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "disconnectPrinter"
                }),
                contentType: "application/json; charset=UTF-8"
            });			
		}
		
		self.connectPrinter = function() {
            $.ajax({
                url: API_BASEURL + "plugin/tplinksmartplug",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "connectPrinter"
                }),
                contentType: "application/json; charset=UTF-8"
            });			
		}
		
		self.sysCommand = function(sysCmd) {
            $.ajax({
                url: API_BASEURL + "plugin/tplinksmartplug",
                type: "POST",
                dataType: "json",
                data: JSON.stringify({
                    command: "sysCommand",
					cmd: sysCmd
                }),
                contentType: "application/json; charset=UTF-8"
            });			
		}
		
		self.checkStatuses = function() {
			ko.utils.arrayForEach(self.settings.settings.plugins.tplinksmartplug.arrSmartplugs(),function(item){
				console.log("checking " + item.ip())
				self.checkStatus(item.ip());
			});
        };
    }

    // view model class, parameters for constructor, container to bind to
    OCTOPRINT_VIEWMODELS.push([
        tplinksmartplugViewModel,

        // e.g. loginStateViewModel, settingsViewModel, ...
        ["settingsViewModel","loginStateViewModel"],

        // "#navbar_plugin_tplinksmartplug","#settings_plugin_tplinksmartplug"
        ["#navbar_plugin_tplinksmartplug","#settings_plugin_tplinksmartplug"]
    ]);
});
