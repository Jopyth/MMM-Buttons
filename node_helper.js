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

    watchHandler: function(index) {
        var self = this;

        return function (err, value) {
            if (value == 1) {
                var start = new Date().getTime();
                if (self.buttons[index].downBounceTimeoutEnd > start) {
                    // We're bouncing!
                    return;
                }

                self.buttons[index].pressed = start;
                self.buttons[index].downBounceTimeoutEnd = start + self.config.bounceTimeout;
                self.sendSocketNotification("BUTTON_DOWN", {
                    index: index
                });
                return;
            }
            if (value == 0 && self.buttons[index].pressed !== undefined) {
                var start = self.buttons[index].pressed;
                var end = new Date().getTime();
                if (self.buttons[index].upBounceTimeoutEnd > end) {
                    // We're bouncing!
                    return;
                }

                self.buttons[index].pressed = undefined;
                self.buttons[index].upBounceTimeoutEnd = end + self.config.bounceTimeout;

                var time = end - start;
                self.sendSocketNotification("BUTTON_UP", {
                    index: index,
                    duration: time
                });
                return;
            }
        }
    },

    intializeButton: function(index) {
        const self = this;

        var options = { persistentWatch: true , activeLow: !!self.buttons[index].activeLow};

        var pir = new Gpio(self.buttons[index].pin, 'in', 'both', options);
        pir.watch(this.watchHandler(index));
    },

    intializeButtons: function() {
        const self = this;

        if (self.loaded) {
            return;
        }

        self.buttons = self.config.buttons;

        for (var i = 0; i < self.buttons.length; i++) {
            console.log("Initialize button " + self.buttons[i].name + " on PIN " + self.buttons[i].pin);
            self.buttons[i].pressed = undefined;
            self.intializeButton(i);
        }

        self.loaded = true;
    }
});
