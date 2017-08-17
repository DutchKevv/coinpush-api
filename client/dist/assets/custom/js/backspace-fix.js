module.exports = {

    attachBackspaceFix(element) {
       element.onKeyUp = function() {
           this.simulateBackspace(element);
       }
    },

    simulateBackspace: function (element) {
        var start = element.selectionStart, end = element.selectionEnd, event;

        if (!element.setRangeText) {
            return;
        }
        if (start >= end) {
            if (start <= 0 || !element.setSelectionRange) {
                return;
            }
            element.setSelectionRange(start - 1, start);
        }

        element.setRangeText("");
        event = document.createEvent("HTMLEvents");
        event.initEvent("input", true, false);
        element.dispatchEvent(event);
    }
}