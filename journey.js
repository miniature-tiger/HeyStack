// JOURNEY PAGE
// ------------

let journey = {

    // Page setup
    section: {parent: '', id: 'journey', widthPerc: 100, heightPerc: 50, cssScheme: 'transparent'},

    panels: [
        {parent: 'journey', id: 'a', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'journey', id: 'b', widthPerc: 66, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'journey', id: 'c', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
    ],

    boxes: [
        {parent: 'a', id: 'a1', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'b', id: 'b1', widthPerc: 100, heightPerc: 48, cssScheme: 'whiteBox'},
        {parent: 'b', id: 'b2', widthPerc: 100, heightPerc: 48, cssScheme: 'whiteBox'},
        {parent: 'c', id: 'c1', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'c', id: 'c2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
    ],

    buttonRanges: [],
    page: '',


    setup: function() {
        // Set up page
        // - needs to be before buttons for button handlers defined on page
        this.page = new HeyPage(this.section, this.panels, this.boxes);

        // Define buttons - has to be here for handler functions
        this.buttonRanges = [
            {box: 'a1', id: 'wallets', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'blockchain', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: journey.setScrollButtonValuesFromBlockchain, onParameters: false, offParameters: false, subHandler: false, label: 'BLOCKCHAIN:'},
                    {id: 'address', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'ADDRESS:'},
                ]
            },

            {box: 'a2', id: 'dates', type: 'simple', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'dateStartYear', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: journey.setStartMonthValuesFromStartYear, onParameters: false, offParameters: false, subHandler: false, label: 'DATE START:'},
                    {id: 'dateStartMonth', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'dateEndYear', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: journey.setEndMonthValuesFromEndYear, onParameters: false, offParameters: false, subHandler: false, label: 'DATE END:'},
                    {id: 'dateEndMonth', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'period', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'PERIOD:'},
                ]
            },

            {box: 'c1', id: 'transactions', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'transactionCategory', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: journey.setTransactionValuesFromCatgeory, onParameters: false, offParameters: false, subHandler: false, label: 'TRANSACTIONS:'},
                    {id: 'transactionType', type: 'scroll', target: journey, className: 'scrollButton', text: '', widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'coins', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'COINS TO INCLUDE:'},
                    {id: 'valueCurrency', type: 'scroll', target: journey, className: 'scrollButton', text: false, widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'DISPLAY VALUES IN:'},
                ]
            },

            {box: 'c2', id: 'chartStyle', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    //{id: 'chartType', type: 'scroll', target: journey, className: 'scrollButton', text: ['stacked bar', 'line chart'], widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'CHART TYPE:'},
                    {id: 'chartLevel', type: 'scroll', target: journey, className: 'scrollButton', text: ['upper chart', 'lower chart'], widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'CHART LEVEL:'},
                ]
            },

            {box: 'c2', id: 'controls', type: 'simple', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'addToChart', type: 'simple', target: this, className: 'dataIcon', text: 'ADD TO CHART', widthPerc: 100, heightToWidth: 18, buttonHandler: journey.addToChart, onParameters: false, offParameters: false, subHandler: false, label: 'CONTROLS:'},
                    {id: 'exportChart', type: 'simple', target: this, className: 'dataIcon', text: 'EXPORT CHART', widthPerc: 100, heightToWidth: 18, buttonHandler: journey.exportChart, onParameters: false, offParameters: false, subHandler: false, label: false},
                ]
            },
        ]
        this.page.addButtonRanges(this.buttonRanges);
    },

    // Run tasks on switching to this page
    switchTasks: function() {
        this.setScrollButtonValues();
        this.checkUpdatePrices();
    },

    // Run taks on switching away from this page
    closeSwitchTasks: async function() {
        communication.messageOff();
    },

    // Update prices for blockchain coins (on switching to journey page)
    checkUpdatePrices: async function() {
        // Get set of blockchain names
        let blockchainsUsedNames = new Set(wallets.wallets.map(x => x.blockchain.name));
        // Create fake stacks
        let fakeStacks = new StackCollection();
        for (const blockchainName of blockchainsUsedNames) {
            const coins = blockchains.data[blockchainName].coins.map(x => x.coin);
            for (const coin of coins) {
                fakeStacks.addStack(new Stack(coin, false, false, '1d', []));
            }
        }
        // Update prices
        stacks.processPrices(fakeStacks);
    },

    // Blockchains in play sorted and used to set button values
    setScrollButtonValues: function() {
        let blockchainsAlphabet = Array.from(new Set(wallets.wallets.map(x => x.blockchain.name))).sort((a, b) => a.localeCompare(b));
        journey.page.boxes.a1.buttonRanges.wallets.buttons.blockchain.setValues(blockchainsAlphabet);
    },

    // Wallet addresses in play for bklockchain sorted and used to set button values - triggered by handler of blockchain button
    setScrollButtonValuesFromBlockchain: function(blockchainName) {
        let blockchainWallets = wallets.wallets.filter(x => x.blockchain.name === blockchainName);
        let addressAlphabet = Array.from(new Set(blockchainWallets.map(x => x.address))).sort((a, b) => a.localeCompare(b));
        journey.page.boxes.a1.buttonRanges.wallets.buttons.address.setValues(addressAlphabet);
        this.setScrollButtonValuesFromWallet();
    },

    // Set button values - only if a wallet exists
    setScrollButtonValuesFromWallet: function() {
        let buttonWallet = this.obtainWalletFromButtons();
        if (buttonWallet !== undefined) {
            // Dates
            journey.page.boxes.a2.buttonRanges.dates.buttons.dateStartYear.setValues(this.yearList());
            journey.page.boxes.a2.buttonRanges.dates.buttons.dateEndYear.setValues(this.yearList());
            journey.page.boxes.a2.buttonRanges.dates.buttons.period.setValues(['day', 'month']);
            // Transactions
            journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionCategory.setValues(['balances', 'rewards', 'other']);
            let blockchainCoinOptions = ['all'].concat(buttonWallet.blockchain.coins.map(x => x.label));
            journey.page.boxes.c1.buttonRanges.transactions.buttons.coins.setValues(blockchainCoinOptions);
            journey.page.boxes.c1.buttonRanges.transactions.buttons.valueCurrency.setValues([settings.summary.currency, 'COIN AMOUNT']);
            // Charts
            //journey.page.boxes.c2.buttonRanges.chartStyle.buttons.chartType.setValues(['stacked bar', 'line chart']);
            journey.page.boxes.c2.buttonRanges.chartStyle.buttons.chartLevel.setValues(['upper chart', 'lower chart']);
        } else {
            // Set empty button text if no wallet
            journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionCategory.setValues([]);
            //journey.page.boxes.c2.buttonRanges.chartStyle.buttons.chartType.setValues([]);
            journey.page.boxes.c2.buttonRanges.chartStyle.buttons.chartLevel.setValues([]);
        }
    },

    // Button dates
    setStartMonthValuesFromStartYear: function(year) {
        this.setMonthValuesFromYear(journey.page.boxes.a2.buttonRanges.dates.buttons.dateStartMonth, year);
    },

    setEndMonthValuesFromEndYear: function(year) {
        this.setMonthValuesFromYear(journey.page.boxes.a2.buttonRanges.dates.buttons.dateEndMonth, year);
    },

    setMonthValuesFromYear: function(button, year) {
        if (year === 'all') {
            button.setValues(['all']);
        } else {
            button.setValues(this.monthList());
        }
    },

    yearList: function() {
        let list = ['all'];
        let latestYear = new Date().getUTCFullYear();
        for (let i = 2016; i <= latestYear; i+=1) {
            list.push(String(i));
        }
        return list;
    },

    monthList: function() {
        return Object.keys(this.monthObject);
        //return ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    },

    monthObject: {
        'Jan' : '01',
        'Feb' : '02',
        'Mar' : '03',
        'Apr' : '04',
        'May' : '05',
        'Jun' : '06',
        'Jul' : '07',
        'Aug' : '08',
        'Sep' : '09',
        'Oct' : '10',
        'Nov' : '11',
        'Dec' : '12'
    },

    // Dictionary for transaction type vs readable text
    transactionTranslation: [
        {databaseName: 'author_reward', buttonText: 'hive', category: 'balances'},

        {databaseName: 'author_reward', buttonText: 'author', category: 'rewards'},
        {databaseName: 'comment_benefactor_reward', buttonText: 'benefactor', category: 'rewards'},
        {databaseName: 'curation_reward', buttonText: 'curation', category: 'rewards'},
        {databaseName: 'producer_reward', buttonText: 'producer', category: 'rewards'},
        {databaseName: 'proposal_pay', buttonText: 'proposal', category: 'rewards'},
        {databaseName: 'interest', buttonText: 'interest', category: 'rewards'},

        {databaseName: 'fill_convert_request', buttonText: 'conv to liquid', category: 'other'},
        {databaseName: 'collateralized_convert', buttonText: 'conv to stable', category: 'other'},
        {databaseName: 'fill_vesting_withdraw', buttonText: 'power down', category: 'other'},
        {databaseName: 'transfer_to_vesting', buttonText: 'power up', category: 'other'},
        {databaseName: 'fill_order', buttonText: 'trade', category: 'other'},
        {databaseName: 'transfer', buttonText: 'transfer', category: 'other'},
        {databaseName: 'fill_recurrent_transfer', buttonText: 'rec. transfer', category: 'other'},
    ],

    translateTransactionButtonToType: function(buttonText) {
        let translation = this.transactionTranslation.find(x => x.buttonText === buttonText);
        return translation.databaseName;
    },

    // Set transaction button text based on transactionCategory
    setTransactionValuesFromCatgeory: function(transactionCategory) {
        let buttonWallet = this.obtainWalletFromButtons();
        if (buttonWallet !== undefined) {
            if (transactionCategory === 'balances') {
                journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionType.setValues(['chart', 'check']);
            } else {
                let transactionValuesAlphabet = this.transactionTranslation.filter(x => x.category === transactionCategory).map(x => x.buttonText);
                journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionType.setValues(transactionValuesAlphabet);
            }
        } else {
            journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionType.setValues([]);
        }
    },

    // Add To Chart button handler
    addToChart: async function() {
        // Obtain wallet from button text
        let transactionsWallet = this.obtainWalletFromButtons();
        // Obtain transaction category from button text
        let transactionCategory = journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionCategory.text;
        // Obtain date range from button text
        let transactionDates = this.obtainDatesFromButtons();
        // Obtain chart type from button text
        //let chartType = journey.page.boxes.c2.buttonRanges.chartStyle.buttons.chartType.text;
        switch(transactionCategory) {
            case 'balances': // stack approach
                await this.addBalancesToBox(transactionsWallet, transactionDates);
                break;
            case 'rewards':
            case 'other':
                await this.addTransactionsToChart(transactionsWallet, transactionDates);
                break;
            default:
                // Should not happen
        }
    },

    // Export chart as csv file
    exportChart: async function() {
        let box = this.obtainBoxFromButtons();
        // Combine data ranges into export data
        let data;
        for (const [i, dataRange] of box.chart.dataRanges.entries()) {
            if (i === 0) {
                data = new History(dataRange.timePeriod, dataRange.dateValues, ['value'], false, false, false, {});
                data.changeKey('value', dataRange.label);
            } else {
                data.addNewDataRanges(dataRange.dateValues, ['value']);
                data.changeKey('value', dataRange.label);
            }
        }
        let exportHeaders = ['date'].concat(data.keys);
        // Create file name based on date
        let filename = 'chartExport';
        let exportHelper = new ExportHelper(data.moments, exportHeaders, filename);
        await exportHelper.exportData();
        communication.message('Chart exported.');
    },

    // Roll up balances - chart or check table
    addBalancesToBox: async function(transactionsWallet, transactionDates) {
        let transactionType = this.page.boxes.c1.buttonRanges.transactions.buttons.transactionType.text;

        switch(transactionType) {
            case 'chart':
                await this.addBalancesToChart(transactionsWallet, transactionDates);
                break;
            case 'check':
                await this.addBalancesToCheckTable(transactionsWallet);
                break;
            default:
                // Default
        }
    },

    // Roll up balances - check table
    addBalancesToCheckTable: async function(transactionsWallet) {
        // Create roll up stacks
        let coinsToInclude = this.obtainCoinsTypeFromButtons(transactionsWallet);
        let transactionsStacks = await transactionsWallet.createBalanceStacksForCoins(coinsToInclude, false);

        if (transactionsStacks.stacks.length > 0 === true) {
            transactionsStacks.createStackHistories(false, false);
            // Fetch actual balances
            let financialData = await this.fetchFinancialData(transactionsWallet);
            // Create table data
            let tableData = transactionsStacks.stacks.map(x => ({
                coin: x.dayHistory.coin,
                actual: financialData[x.dayHistory.coin],
                coinAmount: x.dayHistory.lastMoment.checkedValue('coinAmount'),
                difference: '0.0%'
            }));
            // Calculate errors
            for (let row of tableData) {
                if (row.actual !== 0) {
                    row.difference = (100*((row.coinAmount / row.actual)-1)).toFixed(1) + '%';
                }
            }
            // Create table
            this.createCheckTable(tableData);

        } else {
            communication.message('No balances generated by this request.')
        }
    },

    // Fetch account balances from API for check table
    fetchFinancialData: async function(transactionsWallet) {
        let financialDataAPI = await grapheneAPI.fetchAccounts(transactionsWallet.blockchain.name, [transactionsWallet.address]);
        let financialData = financialDataAPI.result[0];
        let result = {};
        if (transactionsWallet.blockchain.name === 'hive') {
            result['HIVE'] = Number(financialData.balance.split(' ')[0]) + Number(financialData.reward_hive_balance.split(' ')[0]) + Number(financialData.savings_balance.split(' ')[0]);
            result['HBD'] = Number(financialData.hbd_balance.split(' ')[0]) + Number(financialData.reward_hbd_balance.split(' ')[0]) + Number(financialData.savings_hbd_balance.split(' ')[0]);
            result['HIVEVESTS'] = Number(financialData.vesting_shares.split(' ')[0]) + Number(financialData.reward_vesting_balance.split(' ')[0]);
        } else {
            result['STEEM'] = Number(financialData.balance.split(' ')[0]) + Number(financialData.reward_steem_balance.split(' ')[0]) + Number(financialData.savings_balance.split(' ')[0]);
            result['SBD'] = Number(financialData.sbd_balance.split(' ')[0]) + Number(financialData.reward_sbd_balance.split(' ')[0]) + Number(financialData.savings_sbd_balance.split(' ')[0]);
            result['STEEMVESTS'] = Number(financialData.vesting_shares.split(' ')[0]) + Number(financialData.reward_vesting_balance.split(' ')[0]);
        }
        return result;
    },

    createCheckTable: function(tableData) {
        let headerSpec = {heightPerc: 8};
        let columnSpec = [
            {key: 'coin', label: 'COIN', textFormat: 'string', widthPerc: '25%', columnFormat: 'tableDivLeft'},
            {key: 'actual', label: 'ACTUAL', textFormat: 'comma-3', widthPerc: '25%', columnFormat: 'tableDivRight'},
            {key: 'coinAmount', label: 'ROLL UP', textFormat: 'comma-3', widthPerc: '25%', columnFormat: 'tableDivRight'},
            {key: 'difference', label: 'ERROR', textFormat: 'string', widthPerc: '25%', columnFormat: 'tableDivRight'}
        ]
        let handlerSpec = {};
        let boxToUse = this.obtainBoxFromButtons();
        boxToUse.addTable(headerSpec, columnSpec, 'coin', tableData, handlerSpec);
        boxToUse.table.tableListenersOn();
    },

    // Roll up balances - chart
    addBalancesToChart: async function(transactionsWallet, transactionDates) {
        // Select coins
        let coinsToInclude = this.obtainCoinsTypeFromButtons(transactionsWallet);
        let transactionsStacks = await transactionsWallet.createBalanceStacksForCoins(coinsToInclude, false);
        if (transactionsStacks.stacks.length > 0) {
            // Add staked stacks from vests stack
            this.createStakedStackFromVests(transactionsStacks);
            // Remove vests stacks
            transactionsStacks.deleteStacksByKeyValues({coin: ['STEEMVESTS', 'HIVEVESTS']});
            // Create stack histories - no alteration to time period
            //let timePeriodForHistory = new TimePeriod('1d');
            let timePeriodForHistory = this.obtainTimePeriodFromButton();
            transactionsStacks.createStackHistoriesForLongerTimePeriod(timePeriodForHistory.label, false, timePeriodForHistory.mostRecentDateForTimePeriodPlusOne);
            // Add prices and Fiat values
            let chartDataKey;
            let buttonCurrency = this.obtainValueCurrencyFromButtons();
            switch (buttonCurrency) {
                case 'GBP':
                case 'USD':
                    transactionsStacks.addPricesFiat(timePeriodForHistory.label, stacks.figures.userCoinPriceHistories, buttonCurrency);
                    transactionsStacks.addCurrentPricesFiat(timePeriodForHistory.label, stacks.figures.userCoins);
                    transactionsStacks.addValuesFiat(timePeriodForHistory.label, buttonCurrency);
                    chartDataKey = 'valueFiat';
                    break;
                case 'COIN AMOUNT':
                    chartDataKey = 'coinAmount';
                    break;
                default:
                    console.log("ValueCurrency error")
            }

            let dayHistoryCollection = transactionsStacks.createHistoryCollection(timePeriodForHistory.label);
            // Generate chart data
            let chartData = this.generateChartData(dayHistoryCollection, transactionDates, chartDataKey);
            let boxToUse = this.obtainBoxFromButtons();
            boxToUse.addLineChart(chartData);
        } else {
            communication.message('No balances generated by this request.')
        }
    },

    // Transactions chart
    addTransactionsToChart: async function(transactionsWallet, transactionDates) {
        // Obtain raw data
        let rawData = await this.obtainRawDataFromButtons(transactionsWallet);
        // Filter raw data by transactionDates
        let filteredData = await this.filterDataByDate(rawData, transactionDates);
        // Format data into transactions
        let transactionsGroup = new TransactionGroup('database', filteredData, transactionsWallet.blockchain.name);
        let coinsToInclude = this.obtainCoinsTypeFromButtons(transactionsWallet);
        // Create histories from transactions and enclose in collection
        let transactionHistoriesCollection = transactionsGroup.createCoinHistoryCollectionFromTransactions(transactionDates, coinsToInclude);

        if (transactionHistoriesCollection.histories.length !== 0) {
            // Add staked histories from vests histories
            transactionHistoriesCollection.createStakedHistoryFromVests();

            // Add prices and Fiat values
            let chartDataKey;
            let buttonCurrency = this.obtainValueCurrencyFromButtons();
            switch (buttonCurrency) {
                case 'GBP':
                case 'USD':
                    transactionHistoriesCollection.addPricesFiat(stacks.figures.userCoinPriceHistories, buttonCurrency);
                    transactionHistoriesCollection.addCurrentPricesFiat(stacks.figures.userCoins);
                    transactionHistoriesCollection.addValuesFiat(buttonCurrency);
                    chartDataKey = 'valueFiat';
                    break;
                case 'COIN AMOUNT':
                    chartDataKey = 'coinAmount';
                    break;
                default:
                    console.log("ValueCurrency error")
            }
            let timePeriodForHistory = this.obtainTimePeriodFromButton();
            if (timePeriodForHistory.label !== '1d') {
                transactionHistoriesCollection = transactionHistoriesCollection.createCollectionForLongerTimePeriod(timePeriodForHistory.label);
            }

            // Total across histories
            let totalHistoryPositive = transactionHistoriesCollection.totalAcrossHistories(transactionHistoriesCollection.histories, {}, [chartDataKey], 'positive');
            let totalHistoryNegative = transactionHistoriesCollection.totalAcrossHistories(transactionHistoriesCollection.histories, {}, [chartDataKey], 'negative');

            // Generate chart data
            let chartData = this.generateChartData(transactionHistoriesCollection, transactionDates, chartDataKey);

            let chartDataTotals = [
                totalHistoryPositive.chartDataRange(chartDataKey, false, false, 'total', false, false),
                totalHistoryNegative.chartDataRange(chartDataKey, false, false, 'total', false, false)
            ].filter(x => x !== false);

            // Format chart data
            let boxToUse = this.obtainBoxFromButtons();
            boxToUse.addStackedBarChart(chartData, chartDataTotals);
        } else {
            communication.message('No transactions in wallet for this request.')
        }
    },

    // Read buttons text
    obtainWalletFromButtons: function() {
        let blockchain = journey.page.boxes.a1.buttonRanges.wallets.buttons.blockchain.text;
        let address = journey.page.boxes.a1.buttonRanges.wallets.buttons.address.text;
        return wallets.findWallet(blockchain, address);
    },

    obtainDatesFromButtons: function() {
        let startDate = false;
        let startYear = journey.page.boxes.a2.buttonRanges.dates.buttons.dateStartYear.text;
        let startMonth = this.monthObject[journey.page.boxes.a2.buttonRanges.dates.buttons.dateStartMonth.text];
        if (startYear !== 'all') {
            startDate = new Date(startYear, startMonth-1, 1);
        }

        let endDate = false;
        let endYear = journey.page.boxes.a2.buttonRanges.dates.buttons.dateEndYear.text;
        let endMonth = this.monthObject[journey.page.boxes.a2.buttonRanges.dates.buttons.dateEndMonth.text];
        if (endYear !== 'all') {
            endDate = new Date(endYear, endMonth-1, 1);
        }
        return {startDate: startDate, endDate: endDate};
    },

    obtainTimePeriodFromButton: function() {
        switch (journey.page.boxes.a2.buttonRanges.dates.buttons.period.text) {
            case 'month':
                return new TimePeriod('1M');
                break;
            case 'day':
                return new TimePeriod('1d');
                break;
            default:
                console.log("time period issue")
        }
    },

    obtainRawDataFromButtons: async function(transactionsWallet) {
        let transactionType = this.translateTransactionButtonToType(journey.page.boxes.c1.buttonRanges.transactions.buttons.transactionType.text);
        let rawData = await transactionsWallet.getTransactions(transactionType);
        return rawData;
    },

    obtainCoinsTypeFromButtons: function(transactionsWallet) {
        let text = journey.page.boxes.c1.buttonRanges.transactions.buttons.coins.text;
        if (text === 'all') {
            return transactionsWallet.blockchain.coins.map(x => x.coin);
        } else {
            return transactionsWallet.blockchain.coins.filter(x => x.label === text).map(x => x.coin);
        }
    },

    obtainValueCurrencyFromButtons: function() {
        return(journey.page.boxes.c1.buttonRanges.transactions.buttons.valueCurrency.text);
    },

    obtainBoxFromButtons: function() {
        switch (journey.page.boxes.c2.buttonRanges.chartStyle.buttons.chartLevel.text) {
            case 'upper chart':
                return this.page.boxes.b1;
                break;
            case 'lower chart':
                return this.page.boxes.b2;
                break;
            default:
                console.log("Chart level error")
        }
    },

    // Filter data by date
    filterDataByDate: function(rawData, transactionDates) {
        let filteredData = rawData;
        if (transactionDates.startDate !== false) {
            filteredData = filteredData.filter(x => x.date >= transactionDates.startDate);
        }
        if (transactionDates.endDate !== false) {
            filteredData = filteredData.filter(x => x.date <= transactionDates.endDate);
        }
        return filteredData;
    },

    // Format data into transactions
    formatDataIntoTransactions: function(rawData, transactionsWallet) {
        let transactions;
        if (transactionsWallet.blockchain.name === 'hive') {
            transactions = rawData.map(x => new HiveTransaction(x, false, false, false, 'database'));
        } else if (transactionsWallet.blockchain.name === 'steem') {
            transactions = rawData.map(x => new SteemTransaction(x, false, false, false, 'database'));
        }
        return transactions;
    },

    // Convert vest stacks to power stacks
    createStakedStackFromVests: function(transactionsStacks) {
        for (const stack of transactionsStacks.stacks) {
            if (stack.coin === 'HIVEVESTS') {
                let stakedValues = grapheneTools.convertVestsMomentsToLiquid('hive', stack.changeRecord, 'value');
                let newStack = new Stack('HIVE', true, stack.source, stack.timePeriod.label, stakedValues);
                transactionsStacks.addStack(newStack);
                transactionsStacks.deleteStack('HIVEVESTS', false, stack.source);
            } else if (stack.coin === 'STEEMVESTS') {
                let stakedValues = grapheneTools.convertVestsMomentsToLiquid('steem' , stack.changeRecord, 'value');
                let newStack = new Stack('STEEM', true, stack.source, stack.timePeriod.label, stakedValues);
                transactionsStacks.addStack(newStack);
                transactionsStacks.deleteStack('STEEMVESTS', false, stack.source);
            }
        }
    },

    // Convert history data to chart data
    generateChartData: function(transactionHistoriesCollection, transactionDates, key) {
        let chartData = [];
        for (const history of transactionHistoriesCollection.histories) {
            if (history.keys.includes(key)) {
                let historyChartData = history.chartDataRange(key, transactionDates.startDate, transactionDates.endDate, history.coinLabel, this.assignColour(history.coinLabel), '1px');
                if (historyChartData !== false) {
                    chartData.push(historyChartData);
                }
            }
        }
        return chartData;
    },

    // Assigning colours for chart paths
    assignColour(coinLabel) {
        let chosenColours = [
            //{coin: 'HIVE', colour: 'rgb(215, 38, 56)'},
            {coin: 'HIVE', colour: 'rgb(188, 107, 103)'},
            {coin: 'HBD', colour: 'rgb(215, 187, 192)'},
            {coin: 'HIVE POWER', colour: 'rgb(191, 69, 96)'},
            {coin: 'BTC', colour: 'rgb(228, 87, 46)'},
            {coin: 'ETH', colour: 'rgb(205, 214, 208)'},
            {coin: 'STEEM', colour: 'rgb(102, 155, 188)'},
            {coin: 'SBD', colour: 'rgb(177, 184, 188)'},
            {coin: 'STEEM POWER', colour: 'rgb(90, 97, 143)'},
            {coin: 'BNB', colour: 'rgb(243, 167, 18)'},
            {coin: 'XRP', colour: 'rgb(168, 198, 134)'},
            {coin: 'EOS', colour: 'rgb(187, 176, 155)'},
            {coin: 'TOTAL', colour: 'rgb(215, 38, 56)'}

        ];

        let coinIndex = chosenColours.findIndex(x => x.coin === coinLabel);
        return chosenColours[coinIndex].colour;
    }
}
