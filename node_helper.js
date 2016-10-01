/* Magic Mirror
 * Node Helper: Buttons
 *
 * By Joseph Bethge
 * MIT Licensed.
 */

const Gpio = require('onoff').Gpio;
const NodeHelper = require("node_helper");

module.exports = NodeHelper.create({
    // Subclass start method.
    start: function() {
        var self = this;
        
        console.log("Starting node helper for: " + self.name);

        this.loaded = false;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived: function(notification, payload) {
        if (notification === 'BUTTON_CONFIG') {     
            this.config = payload.config;

            this.intializeButtons();
        };
    },

    constructPayload: function(name, time) {
        var self = this;

        var payload = {};

        if (self.config.minShortPressTime <= time && time <= self.config.maxShortPressTime)
        {
            // short button press
            payload.name = name;
            payload.time = time;
            payload.longPress = false;
        }

        var min = self.config.minLongPressTime;
        var max = self.config.maxLongPressTime;

        if (self.config.registerLongPress && min <= time && time <= max)
        {
            // long button press
            payload.name = name;
            payload.time = time;
            payload.longPress = true;
        }

        return payload;
    },

    intializeButton: function(index) {
        const self = this;

        var options = { persistentWatch: true };

        var pir = new Gpio(self.buttons[index].pin, 'in', 'both', options);
        pir.watch(function(err, value) {
            if (value == 1) {
                self.buttons[index].pressed = new Date().getTime();
                return;
            }
            if (value == 0 && self.buttons[index].pressed !== undefined) {
                var start = self.buttons[index].pressed;
                var end = new Date().getTime(); 
                var time = end - start;

                self.buttons[index].pressed = undefined;

                var payload = self.constructPayload(self.buttons[index].name, time);

                if (payload !== {}) {
                    self.sendSocketNotification("BUTTON_PRESSED", payload);
                }
                return;
            }
        });
    },

    intializeButtons: function() {
        const self = this;

        if (self.loaded) {
            return;
        }

        self.buttons = self.config.buttons;

        for (var i = 0; i < self.buttons.length; i++) {
            console.log("Initialize " + self.buttons[i].name + " on PIN " + self.buttons[i].pin);
            self.buttons[i].pressed = undefined;
            self.intializeButton(i);
        }

        self.loaded = true;
    }
});
