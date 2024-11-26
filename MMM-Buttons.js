/* global Module */

/* MagicMirror²
 * Module: Buttons
 *
 * By Joseph Bethge
 * MIT Licensed.
 */

Module.register("MMM-Buttons", {

    // Default module config.
    defaults: {
        buttons: [
            {
                pin: 24,
                activeLow: false,
                name: "Button",
                shortPress: [
                    {
                        title: "",
                        message: "",
                        imageFA: "",
                        notification: "",
                        payload: ""
                    }
                ],
                longPress: [
                    {
                        title: "",
                        message: "",
                        imageFA: "",
                        notification: "",
                        payload: ""
                    }
                ],
            }
        ],
        minShortPressTime: 0,
        maxShortPressTime: 500,
        minLongPressTime: 3000,
        bounceTimeout: 300
    },

    // Define start sequence.
    start () {
        Log.info("Starting module: " + this.name);

        this.sendConfig();

        this.intervals = [];
        this.alerts = [];
        for (var i = 0; i < this.config.buttons.length; i++)
        {
            this.intervals.push(undefined);
            this.alerts.push(false);
        }
    },

    // Override dom generator.
    getDom () {
        var wrapper = document.createElement("div");

        return wrapper;
    },

    /* sendConfig()
   * intialize backend
   */
    sendConfig () {
        this.sendSocketNotification("BUTTON_CONFIG", {
            config: this.config
        });
    },

    buttonUp (index, duration) {
        if (this.alerts[index]) {
            // alert already shown, clear interval to update it and hide it
            if (this.intervals[index] !== undefined) {
                clearInterval(this.intervals[index]);
            }
            this.alerts[index] = false;
            this.sendNotification("HIDE_ALERT");
        } else {
            // no alert shown, clear time out for showing it
            if (this.intervals[index] !== undefined) {
                clearTimeout(this.intervals[index]);
            }
        }
        this.intervals[index] = undefined;

        var min = this.config.minShortPressTime;
        var max = this.config.maxShortPressTime;
        var shortPress = this.config.buttons[index].shortPress
        var longPress = this.config.buttons[index].longPress

        if (shortPress && min <= duration && duration <= max)
        {
            this.sendAction(shortPress);
        }

        min = this.config.minLongPressTime;
        if (longPress && min <= duration)
        {
            this.sendAction(longPress);
        }
    },

    sendAction (description) {
        for (var i = 0; i < description.length; i++) {
            this.sendNotification(description[i].notification, description[i].payload);
        }
    },

    buttonDown (index) {
        var self = this;

        if (self.config.buttons[index].longPress && self.config.buttons[index].longPress.title)
        {
            this.intervals[index] = setTimeout(function () {
                self.startAlert(index);
            }, this.config.maxShortPressTime);
        }
    },

    showAlert (index) {
    // display the message
        this.sendNotification("SHOW_ALERT", {
            title: this.config.buttons[index].longPress.title,
            message: this.config.buttons[index].longPress.message,
            imageFA: this.config.buttons[index].longPress.imageFA
        });
    },

    startAlert (index) {
        this.alerts[index] = true;
        this.showAlert(index);
    },

    // Override socket notification handler.
    socketNotificationReceived (notification, payload) {
        if (notification === "BUTTON_UP")
        {
            this.buttonUp(payload.index, payload.duration);
        }
        if (notification === "BUTTON_DOWN")
        {
            this.buttonDown(payload.index);
        }
    },
});
