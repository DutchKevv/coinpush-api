import { clearInterval } from "timers";

declare let Highcharts: any;

export class Chart {
    
    id: string = null;
    el: HTMLElement = null;
    type: string = null;

    private _chart: any = null;

    constructor(public options) {
        this.id = options.id;
        // this.el = document.getElementById(options.elementId);
        this.type = options.type;
    }

    async render() {
        this.el = await this._getElementWithTimeout(this.options.elementId);
       
        // create the chart
        this._chart = Highcharts.stockChart(this.el, {

            chart: {
                pinchType: 'x',
                marginLeft: 4,
                marginTop: 1,
                marginBottom: 25
            },

            xAxis: [{
                labels: {
                    step: 1, // Disable label rotating when there is not enough space
                    staggerLines: false,
                    y: 16
                },
                minorGridLineWidth: 0,
                lineColor: '#d2d2d5',
                lineWidth: 1,
                gridLineWidth: 1,
                gridLineDashStyle: 'dot',
                gridZIndex: -1,
                tickPixelInterval: 80,
                minorTickLength: 0,
                minPadding: 0,
                maxPadding: 0,

                // Fill empty time gaps (when there are no bars)
                ordinal: true
            },
            {
                lineWidth: 0,
                gridLineWidth: 1,
                gridLineDashStyle: 'dot',
                gridZIndex: -1,
                minPadding: 0,
                maxPadding: 0,

                // Fill empty time gaps (when there are no bars)
                ordinal: true
            }],

            yAxis: [{
                opposite: true,
                labels: {
                    align: 'left',
                    x: 6,
                    y: 8,
                    formatter: function () {
                        // return self._priceToFixed(this.value);
                    }
                },
                title: {
                    text: null
                },
                // offset: 10,
                height: '75%',
                lineWidth: 1,
                resize: {
                    enabled: true
                },
                plotLines: []
            }, {
                opposite: true,
                labels: {
                    align: 'left',
                    x: 6,
                    y: 8
                },
                title: {
                    text: null
                },
                top: '80%',
                height: '20%',
                // offset: 10,
                lineWidth: 1
            }],

            series: [
                {
                    id: 'main-series',
                    type: this.type,
                    name: this.options.name,
                    data: []
                },
                {
                    type: 'column',
                    name: 'Volume',
                    data: [],
                    yAxis: 1
                },
            ]
        }, false);
    }

    update(changes: any) {

        Object.keys(changes).forEach(changeKey => {
            switch (changeKey) {
                case 'candles':
                    this.updateCandles(changes[changeKey].candles, changes[changeKey].volume);
            }

        });
    }

    updateCandles(candles, volume) {
        this._chart.series[0].setData(candles, true);
        this._chart.series[1].setData(volume, true);

        this._updateCurrentPricePlot();
        // this._updateViewPort(0, true);
        // this._onPriceChange(true); // TODO renders 2 times
    }

    destroy() {

    }

    private _updateCurrentPricePlot(render: boolean = false) {
        const price = this._priceToFixed(1);

        const options = {
            id: 'cPrice',
            color: '#67C8FF',
            // color: '#FF0000',
            width: 1,
            dashStyle: 'dot',
            value: price,
            label: {
                text: '<div class="plot-label">' + price + '</div>',
                useHTML: true,
                align: 'right',
                x: (6 * price.toString().length),
                y: 4
            }
        };

        this._chart.yAxis[0].removePlotLine('cPrice', false, false);
        this._chart.yAxis[0].addPlotLine(options, render, false);
    }

    private _priceToFixed(number) {
		if (this.options.precision > 0)
			return number.toFixed(this.options.precision || 4);

		let n = Math.min(Math.max(number.toString().length, 2), 6);
		return number.toFixed(Math.max(number.toString().length, 4));
	}

    private _getElementWithTimeout(id: string, timeout: number = 5000): Promise<HTMLElement> {
        return new Promise((resolve, reject) => {
            let el = document.getElementById(id);

            if (el)
                return resolve(el);

            const i = setInterval(() => {
                el = document.getElementById(id);

                if (el) {
                    clearInterval(i);
                    resolve(el);
                }
            }, 100);
        });
    }
}

export class ChartRenderer {

    charts: Array<Chart> = [];

    constructor() {

    }

    create(options: any) {
        const chart = new Chart(options);
        chart.render();
        this.charts.push(chart);

        // TODO - Hack to set active symbol in scrollview
        setTimeout(() => {
            document.querySelector('chart-overview .instrument-list a.active').scrollIntoView();
        }, 0);
    }

    update(options) {
        const chart = this.charts.find(chart => chart.id === options.id);

        if (!chart)
            throw new Error('chart not found');

        chart.update(options.changes);
    }

    destroy(id: string) {
        const index = this.charts.findIndex(chart => chart.id === id);

        if (index > -1) {
            this.charts[index].destroy();
            this.charts.splice(index, 1);
        }
    }
}