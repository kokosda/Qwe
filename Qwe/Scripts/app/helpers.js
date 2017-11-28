(function ($, w) {
    $(function () {
        var helpersConstructor = function () {
            var self = this;

            self.range = function (start, count) {
                return Array.apply(0, Array(count))
                            .map(function (element, index) {
                                return index + start;
                            });
            };

            self.raiseEvent = function (name, args) {
                var event = new CustomEvent(name, {
                    "detail": {
                        args: args
                    }
                });

                document.dispatchEvent(event);
            };

            self.registerEventHandler = function (name, handler) {
                if (typeof handler == "function") {
                    document.addEventListener(name, handler);
                }
            }

            self.getRandom = function (min, max) {
                return Math.random() * (max - min) + min;
            };

            self.getRandomInt = function (min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }
        };

        w.helpers = new helpersConstructor();
    });
})(jQuery, window);