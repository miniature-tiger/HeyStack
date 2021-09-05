// STACKS PAGE
// -----------

let stacks = {

    // Current coin pair
    currentPair: {baseAsset: '', quoteAsset: '', textNode: '', pathNode: '', stroke: '', set: false},

    // Page setup
    section: {parent: '', id: 'stacks', widthPerc: 100, heightPerc: 50, content: '', cssScheme: 'transparent'},

    panels: [
        {parent: 'stacks', id: 'a', widthPerc: 16, heightPerc: 98, content: '', cssScheme: 'transparent'},
        {parent: 'stacks', id: 'b', widthPerc: 40, heightPerc: 98, content: '', cssScheme: 'transparent'},
        {parent: 'stacks', id: 'c', widthPerc: 40, heightPerc: 98, content: '', cssScheme: 'transparent'},
    ],

    boxes: [
        {parent: 'a', id: 'a1', widthPerc: 100, heightPerc: 23, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a2', widthPerc: 100, heightPerc: 23, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a3', widthPerc: 100, heightPerc: 23, cssScheme: 'whiteBox'},
        {parent: 'a', id: 'a4', widthPerc: 100, heightPerc: 23, cssScheme: 'whiteBox'},
        {parent: 'b', id: 'b1', widthPerc: 100, heightPerc: 48, cssScheme: 'whiteBox'},
        {parent: 'b', id: 'b2', widthPerc: 100, heightPerc: 48, cssScheme: 'whiteBox'},
        {parent: 'c', id: 'c1', widthPerc: 100, heightPerc: 48, cssScheme: 'whiteBox'},
        {parent: 'c', id: 'c2', widthPerc: 100, heightPerc: 48, cssScheme: 'whiteBox'},

    ],

    buttonRanges: [],
    page: '',

    // Memory for stacks, prices and histories
    figures: {
        userCoins: {},

        coinOverrides: {
            'VEN': {coingeckoId: false},
            'ATD': {coingeckoId: false},
            'EXP': {coingeckoId: 'expanse'},
            'YOYO': {coingeckoId: 'yoyow'},
            'BTR': {coingeckoId: 'bitrue-token'},
            'FTT': {coingeckoId: 'ftx-token'},
            'GBP': {coingeckoId: 'upper-pound'},
            'RUNE': {coingeckoId: 'thorchain'},
            'ADA': {coingeckoId: 'cardano'},
            'EOS': {coingeckoId: 'eos'},
            'CUB': {coingeckoId: "cub-finance"},
        },

        stackCollection: new StackCollection(),

        dayHistoriesByCoin: {},
        totalDayHistory: {},

        userCoinPriceHistories: new HistoryCollection('1d', []),
    },

    // List of exchanges from stackCollection
    get exchanges() {
        let exchangeList = Array.from(new Set(this.figures.stackCollection.stacks.map(x => x.source)));
        console.log(exchangeList)
        exchangeList.unshift('ALL');
        return exchangeList;
    },

    get filteredStackCollection() {
        let text = stacks.page.boxes.a2.buttonRanges.filters.buttons.exchanges.text.toUpperCase();
        console.log(text)
        if (text === 'ALL') {
            return this.figures.stackCollection;
        } else {
            let filteredStacks = this.figures.stackCollection.stacks.filter(x => x.source.toUpperCase() === text);
            return new StackCollection(filteredStacks);
        }
    },

    setup: function() {
        // Set up page - needs to be before buttons for button handlers defined on page
        this.page = new HeyPage(this.section, this.panels, this.boxes);

        // Define buttons - has to be here for handler functions
        this.buttonRanges = [
            {box: 'a1', id: 'controls', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'refresh', type: 'simple', target: this, className: 'dataIcon', text: 'REFRESH', widthPerc: 100, heightToWidth: 18, buttonHandler: stacks.refresh, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'exportTax', type: 'safety', target: tax, className: 'dataIcon', text: 'EXPORT TAX', widthPerc: 100, heightToWidth: 18, buttonHandler: tax.exportStatements, onParameters: false, offParameters: false, subHandler: false, label: false},
                ]
            },

            {box: 'a2', id: 'filters', type: 'simple', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'exchanges', type: 'scroll', target: stacks, className: 'scrollButton', text: ['ALL'], widthPerc: 100, heightToWidth: 18, buttonHandler: stacks.filterByExchange, onParameters: false, offParameters: false, subHandler: false, label: 'EXCHANGES:'},

                ]
            },
        ];
        this.page.addButtonRanges(this.buttonRanges);

        // Create central table of blockchain wallets
        this.createPortfolioTable();
    },

    // Run opening tasks (fast only, no fetch, no aggregation)
    runOpeningTasks: async function() {
    },

    // Run starting tasks (slow tasks)
    runTasks: async function() {
        // Aggregate wallet transactions nad exchange trades data into stacks (by coin, source, staked)
        if (status.summary.state === 'setup') {
            communication.message('Reworking data and prices. Please wait.')
        }
        await this.aggregateTradesAndTransactions();

        // Add prices and drawa charts/tables
        if (this.figures.stackCollection.stacks.length > 0) {
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('Data updated...')
            }
            await this.repriceAndRedraw();
            console.log(this.figures.stackCollection)
            await this.setUpFilters();
        } else {
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('No portfolio data.');
                communication.addLineToMessage('Process complete.');
            }
        }
    },

    // Run tasks on switching to this page
    switchTasks: async function() {
        if (status.summary.state === 'setup') {
            //
        } else {
            this.checkProcessUpdates();
        }
    },

    // Run taks on switching away from this page
    closeSwitchTasks: async function() {
        communication.messageOff();
    },

    // Check for updated trades and transactions for recalcuation of stacks
    checkProcessUpdates: async function() {
        let tradesProcessed = await this.checkProcessTradeUpdates();
        let transactionsProcessed = await wallets.checkProcessTransactionUpdates();
        if (tradesProcessed === true || transactionsProcessed === true) {
            await this.repriceAndRedraw();
        }
    },

    createPortfolioTable: function() {
        let headerSpec = {heightPerc: 8};

        let columnSpec = [
            {key: 'coin', label: 'SYMBOL', textFormat: 'string', widthPerc: '22%', columnFormat: 'tableDivLeft'},
            {key: 'coinAmount', label: 'STACK', textFormat: 'comma-4', widthPerc: '26%', columnFormat: 'tableDivRight'},
            {key: 'priceFiat', label: 'PRICE', textFormat: 'currency'+settings.summary.currency, widthPerc: '26%', columnFormat: 'tableDivRight'},
            {key: 'valueFiat', label: 'VALUE', textFormat: 'currency'+settings.summary.currency, widthPerc: '26%', columnFormat: 'tableDivRight'}
        ]

        let tableData = [];
        let handlerSpec = {target: stacks, tableHandler: stacks.createCharts};
        this.page.boxes.c2.addTable(headerSpec, columnSpec, 'coin', tableData, handlerSpec);
    },

    createGainsTable: function() {
        let headerSpec = {heightPerc: 8};

        let columnSpec = [
            {key: 'coin', label: 'SYMBOL', textFormat: 'string', widthPerc: '22%', columnFormat: 'tableDivLeft'},
            {key: 'poolCost', label: 'COST', textFormat: 'currency'+settings.summary.currency, widthPerc: '19.5%', columnFormat: 'tableDivRight'},
            {key: 'realised', label: 'REALISED', textFormat: 'currency'+settings.summary.currency, widthPerc: '19.5%', columnFormat: 'tableDivRight'},
            {key: 'unrealised', label: 'UNREALISED', textFormat: 'currency'+settings.summary.currency, widthPerc: '19.5%', columnFormat: 'tableDivRight'},
            {key: 'valueFiat', label: 'VALUE', textFormat: 'currency'+settings.summary.currency, widthPerc: '19.5%', columnFormat: 'tableDivRight'}
        ]

        let tableData = [];
        //let handlerSpec = {target: stacks, tableHandler: stacks.createCharts};
        let handlerSpec = {};
        this.page.boxes.c1.addTable(headerSpec, columnSpec, 'coin', tableData, handlerSpec);
    },

    updatePortfolioTable: function(tableData) {
        this.page.boxes.c2.table.updateTableData(tableData);
    },

    updateGainsTable: function(tableData) {
        this.page.boxes.c1.table.updateTableData(tableData);
    },

    aggregateTradesAndTransactions: async function() {
        // Aggregate trades into stacks and store in stackCollection
        let tradesStackCollection = await this.aggregateTradesIntoStacks();
        if (tradesStackCollection !== false) {
            this.figures.stackCollection.addStacks(tradesStackCollection.stacks);
        }
        // Aggregate wallet transactions into stacks and store in memory
        let transactionsStackCollection = await wallets.aggregateTransactionsIntoStacks();
        this.figures.stackCollection.addStacks(transactionsStackCollection.stacks);
    },

    // Update prices, recalcuate stacks and redraw
    repriceAndRedraw: async function() {
        if (this.figures.stackCollection.stacks.length !== 0) {
            communication.message('Processing prices...');
            await this.processPrices(this.figures.stackCollection);
            await this.updatePricesInStackCollection();
            await this.createHistories();
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('Prices updated...')
            } else if (status.summary.state !== 'new') {
                communication.message('Prices updated.');
            }
            this.createChartsAndTable();
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('Process complete.')
                console.log(this.figures.stackCollection)
            }
        } else {
            this.resetAllDisplays();
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('Process complete.')
            }
        }
    },

    // Clear all boxes
    resetAllDisplays: function() {
        this.page.boxes.b1.clear();
        this.page.boxes.b2.clear();
        this.createPortfolioTable();
    },

    createChartsAndTable: function() {
        this.resetAllDisplays();
        this.fillTable();
        this.createCharts({coin: 'TOTAL'});
    },

    // Update prices
    processPrices: async function(stackCollection) {
        await this.updateCoinIdsFromCoinList(stackCollection);
        // Update coin price histories
        await this.updatePriceHistories(stackCollection);
        console.log(this.figures.userCoinPriceHistories);
        // Update current prices, add these prices
        await this.updateCurrentPrices(settings.summary.currency);
    },

    // Apply prices to stack collection
    updatePricesInStackCollection: async function() {
        // Add prices in Fiat
        this.figures.stackCollection.addPricesFiat('1d', this.figures.userCoinPriceHistories, settings.summary.currency);
        this.figures.stackCollection.addCurrentPricesFiat('1d', this.figures.userCoins);
        //Add values in fiat
        this.figures.stackCollection.addValuesFiat('1d', settings.summary.currency);
    },

    // Create histories and totals
    createHistories: function() {
        //let dayHistoryCollection = this.figures.stackCollection.createHistoryCollection('1d');
        let dayHistoryCollection = this.filteredStackCollection.createHistoryCollection('1d');
        console.log(dayHistoryCollection);
        this.figures.dayHistoriesByCoin = dayHistoryCollection.aggregateByKey('coin', ['coinAmount', 'valueFiat'], false);
        // Total across all histories
        this.figures.totalDayHistory = dayHistoryCollection.totalAcrossHistories(dayHistoryCollection.histories, {}, ['valueFiat'], false);
        console.log(this.figures.totalDayHistory)
    },

    // Fill portfolio table
    fillTable: function() {
        let tableData = this.figures.dayHistoriesByCoin.histories.map(x => ({
            coin: x.coin,
            coinAmount: x.lastMoment.checkedValue('coinAmount'),
            valueFiat: x.lastMoment.checkedValue('valueFiat')
        }));
        tableData = tableData.filter(x => (Math.abs(x.valueFiat) > 0.001 || Math.abs(x.coinAmount) > 0.1));
        if (tableData.length > 0) {
            tableData.forEach(x => x['priceFiat'] = (x.valueFiat / x.coinAmount).toFixed(2));
            tableData.push({coin: 'TOTAL', coinAmount: '', priceFiat: '', valueFiat: this.figures.totalDayHistory.lastMoment.checkedValue('valueFiat')});

            tableData.sort((a, b) => b.valueFiat - a.valueFiat);

            this.updatePortfolioTable(tableData);
            this.page.boxes.c2.table.tableListenersOn();
        } else {
            this.updatePortfolioTable([]);
        }
    },

    // Create charts
    createCharts: function(coinObject) {
        let chosenCoinHistory = this.figures.totalDayHistory;
        if (coinObject.coin !== 'TOTAL') {
            chosenCoinHistory = this.figures.dayHistoriesByCoin.findHistory({coin: coinObject.coin});
        }

        let fromDate = new DateHelper(new Date()).moveUTCDateByDays(-365);
        Number(new Date('2020-01-01T00:00:00.000Z'));
        let lineChartData = [chosenCoinHistory.chartDataRange('valueFiat', fromDate, false, 'total', 'rgb(78, 136, 177)', '1.5px')];
        this.page.boxes.b2.addLineChart(lineChartData);

        fromDate = new DateHelper(new Date()).moveUTCDateByDays(-30);
        let chosenCoinChangeInValuesHistory = chosenCoinHistory.changeInValuesHistory(['valueFiat']);
        let toDate = chosenCoinChangeInValuesHistory.timePeriod.mostRecentDateForTimePeriod;
        let chosenCoinChangeChartData = [chosenCoinChangeInValuesHistory.chartDataRange('valueFiat', fromDate, toDate, 'change', 'rgb(78, 136, 177)', '1.5px')];
        this.page.boxes.b1.addBarChart(chosenCoinChangeChartData);
    },

    // Refresh prices
    refresh: async function() {
        if (this.figures.stackCollection.stacks.length > 0) {
            communication.message('Refreshing prices. Please wait.');
            // Update current prices, add these prices
            await this.updateCurrentPrices(settings.summary.currency);
            this.figures.stackCollection.addCurrentPricesFiat('1d', this.figures.userCoins);

            //Add values in fiat
            this.figures.stackCollection.addValuesFiat('1d', settings.summary.currency);
            await this.createHistories();

            this.createChartsAndTable();
            communication.addLineToMessage('Complete.');
        } else {
            this.resetAllDisplays();
        }
    },

    // Aggregate all exchange operations into stacks
    aggregateTradesIntoStacks: async function() {
        // Get list of all coins in database
        let coins = await tradeModel.getAllCoinsInDatabase();
        let tradeStacks = await tradeModel.aggregate(coins);
        if (tradeStacks !== false) {
            this.createStackHistories(tradeStacks);
        }
        return tradeStacks;
    },

    // Check for update to exchange operations
    checkProcessTradeUpdates: async function() {
        if (dataInput.coinsUpdateList.size > 0) {
            communication.message('Updating trades...');
            let tradeStacks = await tradeModel.aggregate(Array.from(dataInput.coinsUpdateList));
            if (tradeStacks !== false) {
                this.createStackHistories(tradeStacks);
                this.figures.stackCollection.updateStacks(tradeStacks.stacks);
                dataInput.resetCoinsUpdateList();
            }
            return true;
        } else {
            return false;
        }
    },

    // Create histories of longer time periods for stacks
    createStackHistories: function(stackCollection) {
        // Daily history - no min or max date
        let timePeriodForHistory = new TimePeriod('1d');
        stackCollection.createStackHistoriesForLongerTimePeriod(timePeriodForHistory.label, false, timePeriodForHistory.mostRecentDateForTimePeriodPlusOne);
    },

    // Fetch coin list from API or storage
    updateCoinIdsFromCoinList: async function(stackCollection) {
        // Fetch coin list from API or storage
        let coinList = await this.fetchCoinList(false);
        console.log(coinList)
        // Update coingecko ids in coinStacks if list obtained
        // - necessary even if list not updated incase of trades of new coins
        this.updateCoinGeckoIds(stackCollection, coinList);
    },

    // Fetch coin list from coingecko
    // - once per day limit, user can override
    fetchCoinList: async function(force) {
        // Get date of last coin list update
        let lastCoinListUpdate = storage.getFromStorage('heystack_lastCoinListUpdate', 0);
        // Get coin list from storage to check if it exists (not stored in memory)
        let coinList = storage.getFromStorage('heystack_coinList', []);

        // Only update every day, otherwise load from local storage
        // - user can also force override
        if (Date.now() - lastCoinListUpdate > (24*60*60*1000) || coinList.length === 0 || force == true) {
            // Fetch and store coin list
            // - update time of last coin list update
            coinList = await coingecko.fetchCoinList();
            storage.setInStorage('heystack_coinList', coinList);
            storage.setInStorage('heystack_lastCoinListUpdate', Date.now());
        }

        return coinList;
    },

    // Update coingecko ids in stackCollection stacks
    updateCoinGeckoIds: function(stackCollection, coinList) {
        for (let stack of stackCollection.stacks) {
            if (!stack.hasOwnProperty('coingeckoId')) {
                // Overrides for awkward coins
                if (this.figures.coinOverrides.hasOwnProperty(stack.coin)) {
                    stack.setCoinGeckoId(this.figures.coinOverrides[stack.coin].coingeckoId);
                    this.setUserCoinInfo(stack.coin, this.figures.coinOverrides[stack.coin].coingeckoId);
                // Set setCoinGeckoIds in stacks
                } else {
                    let index = coinList.findIndex(x => x.symbol === stack.coin.toLowerCase());
                    if (index === -1) {
                        index = coinList.findIndex(x => x.symbol === stack.coin);
                    }
                    if (index !== -1) {
                        stack.setCoinGeckoId(coinList[index].id);
                        this.setUserCoinInfo(stack.coin, coinList[index].id);
                    } else {
                        stack.setCoinGeckoId(false);
                        this.setUserCoinInfo(stack.coin, false);
                    }
                }
            }

        }
    },

    // Set coin info if has not already been set for coin
    setUserCoinInfo: function(coin, coingeckoId) {
        if (!this.figures.userCoins.hasOwnProperty(coin)) {
            this.figures.userCoins[coin] = {coin: coin, coingeckoId: coingeckoId};
        }
    },

    updateCurrentPrices: async function(fiat) {
        // Map to userCoinIds
        ////let userCoinIds = Object.values(this.figures.userCoins).map(x => x.coingeckoId);
        let stacksWithValue = this.figures.stackCollection.stacks.filter(x => x.dayHistory.lastMoment.coinAmount > 0);
        let userCoinIds = Array.from(new Set(stacksWithValue.map(x => x.coingeckoId)));
        // Get the user coin prices
        let coinPriceData = await coingecko.fetchMarketPrices(250, 1, userCoinIds, fiat);
        // Extract prices
        for (let coin in this.figures.userCoins) {
            console.log(coin)
            let userCoin = this.figures.userCoins[coin];
            console.log(userCoin)
            if (userCoin.coingeckoId !== false) {
                const coinPriceDatum = coinPriceData.find(x => x.id === userCoin.coingeckoId);
                console.log(coinPriceDatum)
                if (coinPriceDatum !== undefined) {
                    userCoin.currentPrice = coinPriceDatum.current_price;
                    userCoin.currentPriceDate = coinPriceDatum.last_updated;
                }
            }
        }
    },

    updatePriceHistories: async function(stackCollection) {
        for (let stack of stackCollection.stacks) {
            if (stacks.figures.userCoinPriceHistories.findHistory({base: stack.coin, quote: settings.summary.currency}) === false) {
                let coinPriceHistory;
                // If no coingeckoId set up false price history
                if (stack.coingeckoId === false) {
                    coinPriceHistory = new PriceHistory('1d', false, ['base', 'quote', 'price'], false, false, false, {base: stack.coin, quote: settings.summary.currency});
                // Otherwise check report to see if fetch required and update as necessary
                } else {
                    let dailyReportAndData = await this.getReportForPair('dailyPrices', stack.coin, settings.summary.currency, true);
                    let dailyReport = dailyReportAndData.report;
                    coinPriceHistory = new PriceHistory('1d', dailyReportAndData.data, ['base', 'quote', 'price'], false, false, false, {base: stack.coin, quote: settings.summary.currency});
                    let daysSinceLastPrice = 3650;
                    if (dailyReport !== false) {
                        daysSinceLastPrice = this.numberOfPeriodsSinceDate('1d', dailyReport.latestDate);
                    }
                    //console.log(stack.coingeckoId, daysSinceLastPrice)
                    //console.log(stack)
                    if (daysSinceLastPrice >= 1) {
                        // Fetch daily prices
                        let dailyPrices = await coingecko.fetchHistoricPrices(stack.coingeckoId, settings.summary.currency, '1d', daysSinceLastPrice);
                        if (dailyPrices !== false) {
                            // Remove current price
                            let currentPrice = dailyPrices.pop();
                            // Extract pricesand calibrate dates to match time period
                            let dailyPriceHistory = this.extractPriceHistory(dailyPrices, stack.coin, settings.summary.currency, '1d');
                            dailyPriceHistory.calibrateDates();
                            // Add ids

                            // Store daily prices
                            let addedOperations = await databases.cryptoPrices.putData(dailyPriceHistory.moments, 'dailyPrices');
                            coinPriceHistory.addMoments(dailyPriceHistory.moments, ['base', 'quote', 'price']);
                        }
                    }
                }
                coinPriceHistory.changeKey('price', 'priceFiat');
                this.figures.userCoinPriceHistories.addHistory(coinPriceHistory);
            }
        }
    },

    // Number of days (or periods) since a given date
    numberOfPeriodsSinceDate: function(timePeriodLabel, date) {
        let timePeriod = new TimePeriod(timePeriodLabel);
        return timePeriod.numberOfPeriodsBetweenDates(date, timePeriod.mostRecentDateForTimePeriod);
    },

    // Convert prices from API to desired format
    extractPriceHistory: function(coinHistoryPrices, base, quote, timePeriod) {
        let extractedHistory = [];
        for (let datum of coinHistoryPrices) {
            let date = new Date(datum[0]);
            let dataPoint = {date: date, base: base, quote: quote, price: Number(datum[1].toPrecision(8)), id: base + quote + Number(date/1000)};
            extractedHistory.push(dataPoint)
        }
        return new PriceHistory(timePeriod, extractedHistory, ['id', 'base', 'quote', 'price'], false, false, false, {base: base, quote: quote});
    },

    // Check status of prices stored in database
    getReportForPair: async function(objectStoreName, base, quote, returnData) {
          // Get all data for pair
          let dataForPair = await databases.cryptoPrices.getAllElementsOfIndexType(objectStoreName, 'baseQuote', [base, quote])

          if (dataForPair.length === 0) {
              return {report: false, data: []};
          } else {
              // Find earliest dated record
              let earliest = this.earliestRecord(dataForPair);
              // Find latest dated record
              let latest = this.latestRecord(dataForPair);
              // Create report
              let report = {
                  objectStoreName: objectStoreName,
                  base: base,
                  quote: quote,
                  earliestDate: earliest.date,
                  latestDate: latest.date,
              }

              if (returnData == true) {
                  return {report: report, data: dataForPair};
              } else {
                  return {report: report, data: []};
              }
          }
      },

      earliestRecord: function(data) {
          let earliest = data.reduce((a, c) => c.date < a.date ? c : a);
          return earliest;
      },

      latestRecord: function(data) {
          let latest = data.reduce((a, c) => c.date > a.date ? c : a);
          return latest;
      },

      // Debugging tools
      setStartTime: function() {
          this.startTime = Date.now();
          this.lastNotedTime = Date.now();
          this.register = [];
      },

      registerTime: function(text) {
          let currentTime = Date.now();
          this.register.push(text + ': ' + ((currentTime - this.lastNotedTime)/1000).toFixed(2) );
          this.lastNotedTime = currentTime;
      },

      reportTime: function() {
          for (const note of this.register) {
              console.log(note)
          }
      },

      // EXCHANGES WORK
      // Button dates

      setUpFilters: async function() {
          this.setExchangeButtonValues();
      },

      setExchangeButtonValues: function() {
          let exchangesButton = stacks.page.boxes.a2.buttonRanges.filters.buttons.exchanges;
          console.log(this.exchanges)
          exchangesButton.setValues(this.exchanges);
      },

      filterByExchange: async function() {
          if (this.figures.stackCollection.stacks.length > 0) {
              communication.message('Filtering. Please wait.');
              // Update histories
              await this.createHistories();
              this.createChartsAndTable();
              communication.addLineToMessage('Complete.');
          }
      }

}
