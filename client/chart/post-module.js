Module = Module || {};

window.Module = Module;

Module.custom = (function() {
    "use strict";

    var unique = 0;
    var ready = false;

    return {
        run: function (options) {
            Module.addOnInit(function () {
                Module.callMain();
                ready = true;

                Module.run();
            });
        },

        createInstrument: function (options) {
            if (!ready)
                throw new Error('Not ready!!!');

            if (!options.id)
                throw new Error('[id] is required');

            Object.assign(Module, {
                arguments: [
                    options.canvas.clientWidth.toString(),
                    options.canvas.clientHeight.toString()
                ]
            }, options);

            if (!options.canvas.id)
                options.canvas.id = 'wasm_canvas_' + unique++;


            var canvas = options.canvas,
                width = canvas.clientWidth,
                height = canvas.clientHeight,
                parent = canvas.parentNode;

            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            var result = Module.ccall('createInstrument', // name of C function
                null, // return type
                ['string', 'string', 'number', 'number'], // argument types
                [options.id, options.canvas.id, width, height]); // arguments

            // console.log()
            // Module.createInstrument();
            parent.appendChild(canvas);
            canvas.style.display = 'block';
        }
    }
})();

module.exports = Module;