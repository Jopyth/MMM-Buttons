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
        return function (err, value) {
            if (value == 1) {
                this.buttons[index].pressed = new Date().getTime();
                this.sendSocketNotification("BUTTON_DOWN", {
                    index: index
                });
                setTimeout(this.watchHandler, this.config.minLongPressTime, undefined, 0);
                return;
            }
            if (value == 0 && this.buttons[index].pressed !== undefined) {
                var start = this.buttons[index].pressed;
                var end = new Date().getTime(); 
                var time = end - start;

                this.buttons[index].pressed = undefined;

                this.sendSocketNotification("BUTTON_UP", {
                    index: index,
                    duration: time
                });
                return;
            }
        }
    },

    intializeButton: function(index) {
        const self = this;

        var options = { persistentWatch: true };

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
