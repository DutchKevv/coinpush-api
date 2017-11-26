self.helpers = {
    tyype: 'backtest',
    candles: [],

    getCandles() {
        self.postMessage(['get-candles', { count: 500 }]);
    },

    addCandles(candles) {
        this.candles = candles;
    },

    placeOrder(options) {

    }
}

function init(e) {
    self.symbol = e.data[0];
  
    let data = e.data[1];
    
    // console.log(workerResult);
    self.postMessage(undefined);
}

var onTick = function() {
    console.log('fade!!!!');
}

function runBacktest(from, until) {
    helpers.getCandles();

    setTimeout(() => {
        for (let i = 0; i < helpers.candles.length; i += 10) {
            onTick(helpers.candles[i]);
        }
    }, 1000);
}

let first = true;
onmessage = function (e) {
    if (first) {
        console.log(e.data[1]);
        let workerResult = eval.call(self, e.data[1]);
        init.call(self, e);
        first = false;
        return;
    }

    switch (e.data[0]) {
        case 'get-candles':
            helpers.addCandles(e.data[1]);
            break;
        case 'run':
            runBacktest(e.data[1]);
            break;
    }
}

