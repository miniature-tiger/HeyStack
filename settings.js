// SETTINGS PAGE AND STATUS
// ------------------------

// Settings page
let settings = {

    // Settings in memory
    summary: {},

    summaryDefault: {
        mainCurrency: 'USD',
        displayCurrency: 'USD',
    },

    // Page setup
    section: {parent: '', id: 'settings', widthPerc: 100, heightPerc: 50, cssScheme: 'transparent'},

    panels: [
        {parent: 'settings', id: 'a', widthPerc: 5, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'settings', id: 'b', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'settings', id: 'c', widthPerc: 76, heightPerc: 98, cssScheme: 'transparent'},
    ],

    boxes: [
        {parent: 'a', id: 'a1', widthPerc: 100, heightPerc: 8, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a3', widthPerc: 100, heightPerc: 40, cssScheme: 'transparent justifyTop'},
        {parent: 'b', id: 'b1', widthPerc: 100, heightPerc: 8, cssScheme: 'transparent justifyTop'},
        {parent: 'b', id: 'b2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'b', id: 'b3', widthPerc: 100, heightPerc: 40, cssScheme: 'transparent justifyTop'},
        {parent: 'c', id: 'c1', widthPerc: 100, heightPerc: 8, cssScheme: 'transparent justifyTop'},
        {parent: 'c', id: 'c2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'c', id: 'c3', widthPerc: 100, heightPerc: 40, cssScheme: 'transparent justifyTop'},
    ],

    buttonRanges: [],
    page: '',

    setup: function() {
        // Get stored settings from storage
        this.summary = storage.getFromStorage('heystack_settings', this.summaryDefault);
        this.cleanSummary();

        // Set up page - needs to be before buttons for button handlers defined on page
        this.page = new HeyPage(this.section, this.panels, this.boxes);

        // Define buttons - has to be here for handler functions
        this.buttonRanges = [
            {box: 'b2', id: 'settings', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'mainCurrency', type: 'scroll', target: this, className: 'scrollButton', text: 'usd', values: ['usd', 'gbp', 'eur', 'jpy'], widthPerc: 100, heightToWidth: 18, buttonHandler: settings.changeInFiatCurrency, onParameters: false, offParameters: false, subHandler: false, label: 'MAIN CURRENCY:'},
                    {id: 'displayCurrency', type: 'scroll', target: this, className: 'scrollButton', text: 'usd', values: ['usd', 'gbp', 'eur', 'jpy'], widthPerc: 100, heightToWidth: 18, buttonHandler: settings.changeInFiatCurrency, onParameters: false, offParameters: false, subHandler: false, label: 'DISPLAY CURRENCY:'},
                ]
            },

            {box: 'b3', id: 'controls', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'save', type: 'simple', target: this, className: 'dataIcon', text: 'SAVE', widthPerc: 100, heightToWidth: 18, buttonHandler: settings.saveSettings, onParameters: false, offParameters: false, subHandler: false, label: false},
                ]
            },
        ]

        this.setScrollButtonText();
        this.page.addButtonRanges(this.buttonRanges);
    },

    // Tasks to run on switching to this page
    switchTasks: async function() {
    },

    closeSwitchTasks: async function() {
        communication.messageOff();
    },

    cleanSummary: function() {
        for (let key in this.summary) {
            if (!this.summaryDefault.hasOwnProperty(key)) {
                delete this.summary[key];
            }
        }

        for (let key in this.summaryDefault) {
            if (!this.summary.hasOwnProperty(key)) {
                this.summary[key] = this.summaryDefault[key];
            }
        }
    },

    setScrollButtonText: function() {
        this.findButton('settings', 'mainCurrency').text = this.summary.mainCurrency.toLowerCase();
        this.findButton('settings', 'displayCurrency').text = this.summary.displayCurrency.toLowerCase();
    },

    findButtonRange: function(id) {
        return this.buttonRanges.find(x => x.id === id);
    },

    findButton: function(rangeId, buttonId) {
        let buttonRange = this.findButtonRange(rangeId);
        return buttonRange.buttonSpecs.find(x => x.id === buttonId);
    },

    changeInFiatCurrency: async function(fiatCurrency) {
        // Add colour change?
    },

    // Saves settings and recalculates all prices
    saveSettings: async function() {
        let changedBaseCurrency = false;
        let changedDisplayCurrency = false;
        let text = '';
        let fiatCurrencies = this.obtainFiatCurrenciesFromButtons();
        if (this.summary.mainCurrency !== fiatCurrencies.mainCurrency) {
            this.summary.mainCurrency = fiatCurrencies.mainCurrency;
            text = 'New main currency: ' + this.summary.mainCurrency + '.<br>';
            changedBaseCurrency = true;
        }
        if (this.summary.displayCurrency !== fiatCurrencies.displayCurrency) {
            this.summary.displayCurrency = fiatCurrencies.displayCurrency;
            text = text + 'New display currency: ' + this.summary.displayCurrency + '.<br>';
            changedDisplayCurrency = true;
        }
        // Communicate message
        text = text + 'Settings saved. Please wait for reprice.';
        communication.message(text);
        // Save currenices in storage
        storage.setInStorage('heystack_settings', this.summary);
        // Apply refresh
        if (changedBaseCurrency == true) {
            await stacks.resetForMainCurrencyChange();
            clearPricesStore();
            await stacks.repriceAndRedraw();
            console.log('changedBaseCurrency')
        }

        if (changedDisplayCurrency == true) {
            await stacks.resetForDisplayCurrencyChange();
            await stacks.repriceAndRedraw();
            console.log('changedDisplayCurrency')
        }

        //await stacks.repriceAndRedraw();
    },

    // Read fiat currency from button text
    obtainFiatCurrenciesFromButtons: function() {
        return {
            mainCurrency: settings.page.boxes.b2.buttonRanges.settings.buttons.mainCurrency.text.toUpperCase(),
            displayCurrency: settings.page.boxes.b2.buttonRanges.settings.buttons.displayCurrency.text.toUpperCase()
        }
    },

    // Run opening tasks (fast only, no fetch, no aggregation)
    runOpeningTasks: async function() {
        // Create blockchains object
        this.checkCreateManualPrices();
    },

    // Create manual prices and add to prices database
    checkCreateManualPrices: async function() {
        let data = [];
        let rawData = [
            {base: 'HIVE', quote: 'GBP', data:
                [ {date: 1584662400000, price: 0.1488},
                  {date: 1584748800000, price: 0.1488},
                  {date: 1584835200000, price: 0.1488}
                ]
            },
        ];
        for (let dataGroup of rawData) {
            for (let datum of dataGroup.data) {
                let date = new Date(datum.date);
                let dataPoint = {date: date, base: dataGroup.base, quote: dataGroup.quote, price: Number(datum.price), id: dataGroup.base + dataGroup.quote + Number(date/1000)};
                data.push(dataPoint)
            }
            let history = new PriceHistory('1d', data, ['id', 'base', 'quote', 'price'], false, false, false, {base: dataGroup.base, quote: dataGroup.quote});
            let addedOperations = await databases.cryptoPrices.putData(history.moments, 'dailyPrices');
        }
    },

}

// Site status
let status = {

    summary: {
        state: 'new',
        update: {},
    },

    summaryDefault: {
        state: 'new',
        update: {
            wallets: false,
            imports: false,
            settings: false
        },
    },

    // Set up summary
    setup: async function() {
        // Retrieve last saved summary
        this.summary = storage.getFromStorage('heystack_status', this.summaryDefault);
    },

    // Set state to newState and store in local storage
    setState: async function(newState) {
        // Set and store state
        this.summary.state = newState;
        await this.store();
    },

    // Set state to newState and store in local storage
    setUpdate: async function(key, value) {
        // Set and store state
        this.summary.update[key] = value;
        await this.store();
    },

    // Store in local storage
    store: async function() {
        // Save in storage
        storage.setInStorage('heystack_status', this.summary);
    },
}
