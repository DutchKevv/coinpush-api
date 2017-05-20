[![Build Status](https://travis-ci.org/DutchKevv/TradeJS.svg?branch=master)](https://travis-ci.org/DutchKevv/TradeJS)

![Alt text](doc/logo/TradeJS-medium.png?raw=true "Title")

#Under heavy development! (14 05 2017))

## A full featured stock trading client + server that includes a full IDE and backtest environment. But can be you used with your preferred IDE also! (unlike MetaTrader/cloud9 etc) 

Features
- Create or own EA / Indicators!
- MultiWindow
- Runs on Windows, Mac, Linux, Web (Android, IOS coming up)
- Backtesting

Can be run as
- Desktop client (electron)
- (public)Website
- Standalone client connected to the cloud (with a custom server)
- Standalone server running elastic in the cloud (with a custom client)

## Installation
```
npm install TradeJS
```
## Running (remember, alpha)
Make sure you have a **practise** account on Oanda (https://www.oanda.com/).

###### index.js
```js
const TradeJS = require('TradeJS').default;
const app = new TradeJS();

app.init().catch(console.log);
```
Go to localhost:3000 in chrome (only newest versions of chrome are supported)

 ## Dashboard
 ![Alt text](doc/screenshot/charts.png?raw=true "Title")
 
 ## Build in Editor
 ![Alt text](doc/screenshot/editor.png?raw=true "Title")
 
 ## Mobile
 ![Alt text](doc/screenshot/mobile-chart.png?raw=true "Title") &nbsp; ![Alt text](doc/screenshot/mobile-editor.png?raw=true "Title") &nbsp; ![Alt text](doc/screenshot/mobile-editor2.png?raw=true "Title")
 
  #### How to start (temp, this will be normalized in the future)
 