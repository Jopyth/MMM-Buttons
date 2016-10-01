/* global Module */

/* Magic Mirror
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
                pin: 25,
                name: "ENTER"
            },
            {
                pin: 24,
                name: "POWER"
            },
            {
                pin: 23,
                name: "DOWN"
            },
            {
                pin: 22,
                name: "UP"
            }
        ],
        registerLongPress: true,
        minShortPressTime: 0,
        maxShortPressTime: 500,
        minLongPressTime: 3000,
        maxLongPressTime: 10000
    },

    // Define start sequence.
    start: function() {
        Log.info("Starting module: " + this.name);

        this.sendConfig();

        this.pause = false;
    },

    // Override dom generator.
    getDom: function() {
        var wrapper = document.createElement("div");

        return wrapper;
    },

    /* sendConfig()
     * intialize backend
     */
    sendConfig: function() {
        this.sendSocketNotification("BUTTON_CONFIG", {
            config: this.config
        });
    },

    // Override socket notification handler.
    socketNotificationReceived: function(notification, payload) {
        if (notification === "BUTTON_PRESSED"){
            this.sendNotification(notification, payload)
        }
    },
});
