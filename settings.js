// SETTINGS PAGE AND STATUS
// ------------------------

// Settings page
let settings = {

    // Settings in memory
    summary: {},

    summaryDefault: {
        currency: 'USD',
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

        // Set up page - needs to be before buttons for button handlers defined on page
        this.page = new HeyPage(this.section, this.panels, this.boxes);

        // Define buttons - has to be here for handler functions
        this.buttonRanges = [
            {box: 'b2', id: 'settings', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'currency', type: 'scroll', target: journey, className: 'scrollButton', text: ['usd', 'gbp', 'eur', 'jpy'], widthPerc: 100, heightToWidth: 18, buttonHandler: settings.changeInFiatCurrency, onParameters: false, offParameters: false, subHandler: false, label: 'FIAT CURRENCY:'},
                ]
            },

            {box: 'b3', id: 'controls', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'save', type: 'simple', target: this, className: 'dataIcon', text: 'SAVE', widthPerc: 100, heightToWidth: 18, buttonHandler: settings.saveSettings, onParameters: false, offParameters: false, subHandler: false, label: false},
                ]
            },
        ]
        this.page.addButtonRanges(this.buttonRanges);
    },

    // Tasks to run on switching to this page
    switchTasks: async function() {
    },

    closeSwitchTasks: async function() {
        communication.messageOff();
    },

    changeInFiatCurrency: async function(fiatCurrency) {
        // Add colour change?
    },

    // Saves settings and recalculates all prices
    saveSettings: async function() {
        let text = 'Settings saved. Please wait for reprice.';
        let fiatCurrency = this.obtainFiatCurrencyFromButton();
        if (this.summary.currency !== fiatCurrency) {
            this.summary.currency = fiatCurrency;
            text = 'New fiat currency: ' + fiatCurrency + '. ' + text;
        }
        communication.message(text);
        // Save it in storage
        storage.setInStorage('heystack_settings', this.summary);
        // Apply refresh
        await stacks.repriceAndRedraw();
    },

    // Read fiat currency from button text
    obtainFiatCurrencyFromButton: function() {
        return settings.page.boxes.b2.buttonRanges.settings.buttons.currency.text.toUpperCase();
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
