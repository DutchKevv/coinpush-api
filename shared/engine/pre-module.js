(function() {
    "use strict";

    var Module = window.Module || {};

    Module.noImageDecoding = true;
    Module.noAudioDecoding = true;
    Module.noInitialRun = false;
    Module.noExitRuntime = false;
    Module.filePackagePrefixURL = '/engine/';
    Module.locateFile = function(fileName) {
        return './engine/' + fileName;
    };

    Module.canvas = document.createElement('canvas');

// Module.canvas.style.position = 'absolute';
// Module.canvas.style.top = 0;
// Module.canvas.style.left = 0;
// Module.canvas.style.zIndex = 500;
// document.body.appendChild(Module.canvas);

    Module.custom = Module.custom || {};

    window.Module = Module;
})();
