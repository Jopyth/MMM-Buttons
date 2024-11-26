/* MagicMirror²
 * Node Helper: Buttons
 *
 * By Joseph Bethge
 * MIT Licensed.
 */

const Gpio = require("onoff").Gpio;
const Log = require("logger");
const NodeHelper = require("node_helper");
const fs = require("fs");

module.exports = NodeHelper.create({
    // Subclass start method.
    start () {
        var self = this;
        
        Log.log("Starting node helper for: " + self.name);

        this.loaded = false;
    },

    // Subclass socketNotificationReceived received.
    socketNotificationReceived (notification, payload) {
        if (notification === "BUTTON_CONFIG") {     
            this.config = payload.config;

            this.intializeButtons();
        };
    },

    watchHandler (index) {
        var self = this;

        return function (err, value) {
            if (value == 1) {
                var start = new Date(Date.now()).getTime();
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
                var end = new Date(Date.now()).getTime();
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

    intializeButton (index) {
        const self = this;
        var pinOffset = 0;

        var model;
        try {
            model = fs.readFileSync("/proc/device-tree/model", { encoding: "utf8" });
        } catch (e) {  }

        Log.log(self.name + ": RPi model " + model);

        if (model.startsWith("Raspberry Pi 5")) {
            Log.log(self.name + ": RPi5 detected");
            pinOffset = 571; // RPi5 has diffent pin numbering
        }

        var options = { persistentWatch: true , activeLow: !!self.buttons[index].activeLow};

        var pir = new Gpio(parseInt(self.buttons[index].pin) + pinOffset, "in", "both", options);
        pir.watch(this.watchHandler(index));
    },

    intializeButtons () {
        const self = this;

        if (self.loaded) {
            return;
        }

        self.buttons = self.config.buttons;

        for (var i = 0; i < self.buttons.length; i++) {
            Log.log("Initialize button " + self.buttons[i].name + " on PIN " + self.buttons[i].pin);
            self.buttons[i].pressed = undefined;
            self.intializeButton(i);
        }

        self.loaded = true;
    }
});
