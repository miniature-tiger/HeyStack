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
            'BTR': {coingeckoId: 'bitrue-token'},
            'HBD': {coingeckoId: 'hive_dollar'},
            'VEN': {coingeckoId: false},
            'YOYO': {coingeckoId: 'yoyow'},
            'ATD': {coingeckoId: false},
        },

        stackCollection: new StackCollection(),

        dayHistoriesByCoin: {},
        totalDayHistory: {},

        userCoinPriceHistories: new HistoryCollection('1d', []),
        conversionHistory: false,
    },

    // List of exchanges from stackCollection
    get exchanges() {
        let exchangeList = Array.from(new Set(this.figures.stackCollection.stacks.map(x => x.source)));
        exchangeList.unshift('ALL');
        return exchangeList;
    },

    get filteredStackCollection() {
        let text = stacks.page.boxes.a2.buttonRanges.filters.buttons.exchanges.text.toUpperCase();
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
                    {id: 'exchanges', type: 'scroll', target: stacks, className: 'scrollButton', text: 'ALL', values: ['ALL'], widthPerc: 100, heightToWidth: 18, buttonHandler: stacks.filterByExchange, onParameters: false, offParameters: false, subHandler: false, label: 'EXCHANGES:'},

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
            {key: 'price', label: 'PRICE', textFormat: 'currency'+settings.summary.displayCurrency, widthPerc: '26%', columnFormat: 'tableDivRight'},
            {key: 'valueFiat', label: 'VALUE', textFormat: 'currency'+settings.summary.displayCurrency, widthPerc: '26%', columnFormat: 'tableDivRight'}
        ]

        let tableData = [];
        let handlerSpec = {target: stacks, tableHandler: stacks.createCharts};
        this.page.boxes.c2.addTable(headerSpec, columnSpec, 'coin', tableData, handlerSpec);
    },

    createGainsTable: function() {
        let headerSpec = {heightPerc: 8};

        let columnSpec = [
            {key: 'coin', label: 'SYMBOL', textFormat: 'string', widthPerc: '22%', columnFormat: 'tableDivLeft'},
            {key: 'poolCost', label: 'COST', textFormat: 'currency'+settings.summary.displayCurrency, widthPerc: '19.5%', columnFormat: 'tableDivRight'},
            {key: 'realised', label: 'REALISED', textFormat: 'currency'+settings.summary.displayCurrency, widthPerc: '19.5%', columnFormat: 'tableDivRight'},
            {key: 'unrealised', label: 'UNREALISED', textFormat: 'currency'+settings.summary.displayCurrency, widthPerc: '19.5%', columnFormat: 'tableDivRight'},
            {key: 'valueFiat', label: 'VALUE', textFormat: 'currency'+settings.summary.displayCurrency, widthPerc: '19.5%', columnFormat: 'tableDivRight'}
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
                communication.addLineToMessage('Prices updated...');
            } else if (status.summary.state !== 'new') {
                communication.message('Prices updated.');
            }
            this.createChartsAndTable();
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('Process complete.');
            }
        } else {
            this.resetAllDisplays();
            if (status.summary.state === 'setup') {
                communication.addLineToMessage('Process complete.');
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
        // Set user coins data from storage
        this.getSetUserCoins();
        // Update coin list from coinGecko
        await this.updateCoinIdsFromCoinList(stackCollection);
        if (settings.summary.displayCurrency !== settings.summary.mainCurrency) {
            await this.updateConversionPriceHistories();
        } else {
            this.figures.conversionHistory = false;
        }
        lastTime = nowTime
        // Update coin price histories
        await this.updatePriceHistories(stackCollection.coins, settings.summary.mainCurrency, settings.summary.displayCurrency);
        // Update current prices, add these prices
        await this.updateCurrentPrices(settings.summary.displayCurrency);
        // Store user coins with ids and current prices
        this.storeUserCoins();
    },

    // Store user coins with ids and current prices
    storeUserCoins: function() {
        storage.setInStorage('heystack_userCoins', this.figures.userCoins);
    },

    getSetUserCoins: function() {
        this.figures.userCoins = storage.getFromStorage('heystack_userCoins', this.figures.userCoins);
    },

    // Apply prices to stack collection
    updatePricesInStackCollection: async function() {
        // Add prices in Fiat
        this.figures.stackCollection.addPricesFiat('1d', this.figures.userCoinPriceHistories, settings.summary.displayCurrency);
        this.figures.stackCollection.addCurrentPricesFiat('1d', this.figures.userCoins);
        //Add values in fiat
        this.figures.stackCollection.addValuesFiat('1d', settings.summary.displayCurrency);
    },

    // Create histories and totals
    createHistories: function() {
        //let dayHistoryCollection = this.figures.stackCollection.createHistoryCollection('1d');
        let dayHistoryCollection = this.filteredStackCollection.createHistoryCollection('1d');
        this.figures.dayHistoriesByCoin = dayHistoryCollection.aggregateByKey('coin', ['coinAmount', 'valueFiat'], false);
        // Total across all histories
        this.figures.totalDayHistory = dayHistoryCollection.totalAcrossHistories(dayHistoryCollection.histories, {}, ['valueFiat'], false);
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
            tableData.forEach(x => x['price'] = (x.valueFiat / x.coinAmount).toFixed(2));
            tableData.push({coin: 'TOTAL', coinAmount: '', price: '', valueFiat: this.figures.totalDayHistory.lastMoment.checkedValue('valueFiat')});

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
            // Update current prices, store the user cion data, and add these prices
            await this.updateCurrentPrices(settings.summary.displayCurrency);
            this.storeUserCoins();
            this.figures.stackCollection.addCurrentPricesFiat('1d', this.figures.userCoins);
            //Add values in fiat
            this.figures.stackCollection.addValuesFiat('1d', settings.summary.displayCurrency);
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

    // On change of main currency: Remove all data from prices store (data is stored in main currency only)
    resetForMainCurrencyChange: async function() {
        await this.clearPricesStore();
    },

    // On change of display currency
    resetForDisplayCurrencyChange: async function() {
        // Nothing so far - leave price histories in case of switch back to old display currency
    },

    // Clear prices database object stores
    clearPricesStore: async function() {
        databases.cryptoPrices.clearObjectStore('dailyPrices');
        databases.cryptoPrices.clearObjectStore('latestPrices');
    },

    // Fetch coin list from API or storage
    updateCoinIdsFromCoinList: async function(stackCollection) {
        // Fetch coin list from API or storage
        let coinList = await this.fetchCoinList(false);
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
            coinList = await coingecko.fetchCoinList(false);
            storage.setInStorage('heystack_coinList', coinList);
            storage.setInStorage('heystack_lastCoinListUpdate', Date.now());
        }

        return coinList;
    },

    coingeckoIdFromCoin: function(coin) {
        if (this.figures.userCoins.hasOwnProperty(coin)) {
            return this.figures.userCoins[coin].coingeckoId;
        } else {
            return false;
        }
    },

    // Update coingecko ids in stackCollection stacks
    updateCoinGeckoIds: async function(stackCollection, coinList) {
        for (let stack of stackCollection.stacks) {
            if (!stack.hasOwnProperty('coingeckoId')) {
                if (this.figures.userCoins.hasOwnProperty(stack.coin)) {
                    stack.setCoinGeckoId(this.figures.userCoins[stack.coin].coingeckoId);
                } else if (this.figures.coinOverrides.hasOwnProperty(stack.coin)) {
                    stack.setCoinGeckoId(this.figures.coinOverrides[stack.coin].coingeckoId);
                    this.setUserCoinInfo(stack.coin, this.figures.coinOverrides[stack.coin].coingeckoId);
                // Set setCoinGeckoIds in stacks
                } else {
                    let entriesMatchingCoinSymbol = coinList.filter(x => x.symbol === stack.coin.toLowerCase());
                    if (entriesMatchingCoinSymbol.length === 0) {
                        stack.setCoinGeckoId(false);
                        this.setUserCoinInfo(stack.coin, false);
                    } else if (entriesMatchingCoinSymbol.length === 1) {
                        stack.setCoinGeckoId(entriesMatchingCoinSymbol[0].id);
                        this.setUserCoinInfo(stack.coin, entriesMatchingCoinSymbol[0].id);
                    } else {
                        let chosenEntry = await this.chooseBetweenCoinGeckoEntries(entriesMatchingCoinSymbol);
                        stack.setCoinGeckoId(chosenEntry.id);
                        this.setUserCoinInfo(stack.coin, chosenEntry.id);
                    }
                }
            }
        }
    },

    // Choose between coingecko list entries - based on market cap
    chooseBetweenCoinGeckoEntries: async function(entriesMatchingCoinSymbol) {
        let coinGeckoIds = entriesMatchingCoinSymbol.map(x => x.id);
        let coinPriceData = await coingecko.fetchMarketPrices(coinGeckoIds, 'usd');
        if (coinPriceData.length > 0) {
            const maxMarketCapId = coinPriceData.reduce((a, c) => (a.market_cap > c.market_cap) ? a : c, {market_cap: null});
            return maxMarketCapId;
        } else {
            return false;
        }
    },

    // Update coingecko ids in stackCollection stacks
    updateCoinGeckoIdsOld: function(stackCollection, coinList) {
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

    // Current prices always in display currency.
    // - They are stored as part of userCoins in local storage not in the database.
    // - No need for conversion between main and display currencies.
    updateCurrentPrices: async function(displayCurrency) {
        let stacksWithCoinGeckoId = this.figures.stackCollection.stacks.filter(x => x.coingeckoId !== false);
        let stacksWithValue = stacksWithCoinGeckoId.filter(x => x.dayHistory.lastMoment.coinAmount > 0);
        let userCoinIds = Array.from(new Set(stacksWithValue.map(x => x.coingeckoId)));
        // Get the user coin prices
        let coinPriceData = await coingecko.fetchMarketPrices(userCoinIds, displayCurrency);
        // Extract prices
        for (let coin in this.figures.userCoins) {
            let userCoin = this.figures.userCoins[coin];
            if (userCoin.coingeckoId !== false) {
                const coinPriceDatum = coinPriceData.find(x => x.id === userCoin.coingeckoId);
                if (coinPriceDatum !== undefined) {
                    userCoin.currentPrice = coinPriceDatum.current_price;
                    userCoin.currentPriceDate = coinPriceDatum.last_updated;
                }
            }
        }
    },

    updateConversionPriceHistories: async function() {
        let mainPriceHistory = await this.createUpdatePriceHistory('BTC', settings.summary.mainCurrency);
        this.figures.userCoinPriceHistories.addHistory(mainPriceHistory);
        let displayPriceHistory = await this.createUpdatePriceHistory('BTC', settings.summary.displayCurrency);
        this.figures.userCoinPriceHistories.addHistory(displayPriceHistory);
        this.figures.conversionHistory = mainPriceHistory.baseConversion(displayPriceHistory);
    },

    updatePriceHistories: async function(coins, mainCurrency, displayCurrency) {
        for (let coin of coins) {
            if (stacks.figures.userCoinPriceHistories.findHistory({base: coin, quote: displayCurrency}) === false) {
                let coinPriceHistory;
                // If no coingeckoId set up false price history
                let coingeckoId = this.coingeckoIdFromCoin(coin);
                if (coingeckoId === false) {
                    coinPriceHistory = new PriceHistory('1d', false, ['price'], false, false, false, {base: coin, quote: displayCurrency});
                // Otherwise check report to see if fetch required and update as necessary
                } else {
                    coinPriceHistory = await this.createUpdatePriceHistory(coin, mainCurrency);
                    if (this.figures.conversionHistory !== false) {
                        coinPriceHistory = coinPriceHistory.quoteConversion(this.figures.conversionHistory);
                    }
                }
                this.figures.userCoinPriceHistories.addHistory(coinPriceHistory);
            }
        }
    },

    createUpdatePriceHistory: async function(coin, fiatCurrency) {
        // Get report of price data from database
        let dailyReportAndData = await this.getReportForPair('dailyPrices', coin, fiatCurrency, true);
        let dailyReport = dailyReportAndData.report;
        // Create price history based on previously stored data
        let coinPriceHistory = new PriceHistory('1d', dailyReportAndData.data, ['price'], false, false, false, {base: coin, quote: fiatCurrency});
        // Update price history with new data
        let daysSinceLastPrice = this.numberOfDaysSinceLastPriceFromReport(dailyReport);
        if (daysSinceLastPrice >= 1) {
            await this.updatePriceHistory(coinPriceHistory, daysSinceLastPrice);
        }
        return coinPriceHistory;
    },

    updatePriceHistory: async function(coinPriceHistory, daysSinceLastPrice) {
        // Fetch daily prices
        let coingeckoId = this.coingeckoIdFromCoin(coinPriceHistory.labels.base);
        let dailyPrices = await coingecko.fetchHistoricPrices(coingeckoId, coinPriceHistory.labels.quote, '1d', daysSinceLastPrice);
        if (dailyPrices !== false) {
            // Remove current price
            let currentPrice = dailyPrices.pop();
            // Extract pricesand calibrate dates to match time period
            let dailyPriceHistory = this.extractPriceHistory(dailyPrices, coinPriceHistory.labels.base, coinPriceHistory.labels.quote, '1d');
            dailyPriceHistory.calibrateDates();
            // Store daily prices
            let addedOperations = await databases.cryptoPrices.putData(dailyPriceHistory.moments, 'dailyPrices');
            coinPriceHistory.addMoments(dailyPriceHistory.moments, ['price']);
        }
    },

    // Number of days since last price according to price report
    numberOfDaysSinceLastPriceFromReport: function(dailyReport) {
        if (dailyReport !== false) {
            return this.numberOfPeriodsSinceDate('1d', dailyReport.latestDate);
        } else {
            return 3650;
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

}
