var bootCanvas = document.createElement('canvas');
var unique = 0;
var Module = {
    canvas: document.createElement('canvas'),
    wasmBinaryFile: './chart/index.wasm',
    noInitialRun: false
};

document.body.appendChild(bootCanvas);

module.exports = {
    run: function(options) {
        "use strict";
    },

    createInstrument: function(options) {
        "use strict";

        if (!options.id)
            throw new Error('[id] is required');

        Object.assign(Module, {
            arguments: [
                options.canvas.clientWidth.toString(),
                options.canvas.clientHeight.toString()
            ]
        }, options);

        console.log('MODULE: ', Module);

        if (!options.canvas.id) {
            options.canvas.id = 'wasm_canvas_' + unique++;
        }

        Module.createInstrument(options.id, options.canvas.id);
    }
};