window.Module = window.Module || {};

window.Module.custom = (function () {
    "use strict";

    var unique = 0,
        focused = null,
        charts = [],
        ready = false,
        initResolve = function() {},
        queue = new Promise(function(resolve) {
            initResolve = resolve;
        });

    var resizeCallback = function() {
        charts.forEach(function(chart) {
            if (chart.fitParent) {
                var currentWidth = parseInt(chart.el.getAttribute('width'), 10);
                    // currentHeight = parseInt(chart.el.getAttribute('height'));

                chart.el.style.display = 'none';

                var parentWidth = parseInt(chart.el.parentNode.clientWidth, 10) - 2,
                    dirty = false;

                chart.el.style.display = 'block';

                if (currentWidth !== parentWidth) {
                    dirty = true;
                    chart.el.setAttribute('width', parentWidth.toString());
                }

                if (dirty)
                    Engine.renderChart(chart.id);
            }
        });
    };

    window.addEventListener('resize', resizeCallback, false);

    var Engine = {
        run: function (/*options*/) {
            Module.addOnInit(function () {
                Module.callMain();

                setTimeout(function() {
                    Module.__init();
                    ready = true;
                    initResolve();
                }, 400);
            });
        },

        addInstrument: function (options) {
            queue = queue.then(function() {
                if (typeof options.id !== 'number')
                    throw new Error('a valid [id] is required');

                Module.__addInstrument(options.id);

                Module.__
            });

            return queue;
        },

        updateInstrument: function(id, data) {
            queue = queue.then(function() {
                return Module.ccall('_updateInstrumentData', // name of C function
                    'number', // return type
                    ['number', 'string'], // argument types
                    [id, JSON.stringify(data)]); // arguments
            });
        },

        addChart: function(instrumentId, el, type) {
            queue = queue.then(function() {
                if (typeof type === 'undefined') {
                    type = 1;
                }

                var id = Module.__addChart(instrumentId, type);

                if (id < 0) {
                    throw new Error('Error creating wasm chart');
                }

                charts.push({
                    id: id,
                    instrumentId: instrumentId,
                    el: el,
                    fitParent: true
                });

                el.onclick = function() {
                    Engine.setFocused(id);
                };

                focused = id;

                return id;
            });

            return queue;
        },

        renderChart: function(id) {
            queue = queue.then(function() {
                var chart = Engine.findChartById(id);

                if (!chart)
                    throw Error('No chart with id : ' + id);

                return Module.ccall('_renderChart', // name of C function
                    'number', // return type
                    ['number', 'number', 'number', 'number'], // argument types
                    [id, chart.el.clientWidth, chart.el.clientHeight, 1]); // arguments
            });
        },

        // Must be sync to var openGL continue its render loop
        updateClientCanvas: function(id) {
            var chart = Engine.findChartById(id);

            if (!chart) {
                window.console.warn('instrument nog found (webassembly) : ' + id);
                return;
            }

            var width = chart.el.clientWidth;
            var height = chart.el.clientHeight;

            chart.el.getContext('2d').drawImage(Module.canvas, 0, 0, width, height, 0, 0, width, height);
        },

        destroyChart: function(id) {
            var chart = Engine.findChartById(id);
        },

        findChartsByInstrumentId: function(id) {
            return charts.filter(function(chart) {
                return chart.instrumentId === id;
            });
        },

        findChartById: function(id) {
            return charts.find(function(chart) {
                return chart.id === id;
            });
        },

        destroyInstrument: function(id) {
            delete charts[id];
        },

        getFocused: function() {
            return Engine.findChartById(focused);
        },

        setFocused: function(id) {
            var currentFocus = Engine.findChartById(focused);

            if (currentFocus) {
                currentFocus.el.classList.remove('focused');
            }

            focused = id;

            Engine.findChartById(id).el.classList.add('focused');
            //
            var result = Module.ccall('_setFocus', // name of C function
                'void', // return type
                ['number'], // argument types
                [id]); // arguments
        },

        destroy: function() {
            window.removeEventListener('resize', resizeCallback, false);
        }
    };

    return Engine;
})();

if (typeof module !== 'undefined') {
    module.exports = Module;
} else {
    window.Module = Module;
}