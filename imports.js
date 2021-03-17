// DATA IMPORTS FROM EXCHANGES
// ---------------------------

let imports = {

    // Data source
    currentSource: {name: 'noSource'},

    // Data sources list
    sources: {
        binanceTrade: {
            name: 'binanceTrade',
            type: 'trade',
            exchange: 'Binance',
            acceptedFileTypes: ['excel'],
            fileNameWord: 'trade',
            setupMessage: "BINANCE TRADES<br>" +
                "<br>" +
                "Export 'Export complete trade history.xlsx' file from Binance.<br>" +
                "<br>" +
                "Drag and drop in this box.<br>"
        },
        binanceDeposit: {
            name: 'binanceDeposit',
            type: 'deposit',
            exchange: 'Binance',
            acceptedFileTypes: ['excel'],
            fileNameWord: 'deposit',
            setupMessage: "BINANCE DEPOSITS<br>" +
                "<br>" +
                "Export 'deposit_history.xlsx' file from Binance.<br>" +
                "<br>" +
                "Drag and drop in this box.<br>"
        },
        binanceWithdrawal: {
            name: 'binanceWithdrawal',
            type: 'withdrawal',
            exchange: 'Binance',
            acceptedFileTypes: ['excel'],
            fileNameWord: 'withdrawal',
            setupMessage: "BINANCE WITHDRAWALS<br>" +
                "<br>" +
                "Export 'withdrawal_history.xlsx' file from Binance.<br>" +
                "<br>" +
                "Drag and drop in this box.<br>"
        },
        binanceDistribution: {
            name: 'binanceDistribution',
            type: 'distribution',
            exchange: 'Binance',
            acceptedFileTypes: ['excel'],
            fileNameWord: false,
            setupMessage: "BINANCE DISTRIBUTIONS<br>" +
                "<br>" +
                "Export 'Generate all statements' report from Binance.<br>" +
                "Manipulate in Excel.<br>" +
                "<br>" +
                "Drag and drop in this box.<br>"
        },
        bittrexTrade: {
            name: 'bittrexTrade',
            type: 'trade',
            exchange: 'Bittrex',
            acceptedFileTypes: ['text'],
            fileNameWord: false,
            setupMessage: "BITTREX TRADES<br>" +
                "<br>" +
                "Export 'BittrexOrderHistory_XXXX.csv' files from Bittrex.<br>" +
                "<br>" +
                "Drag and drop in this box.<br>"
        },
        bittrexDeposit: {
            name: 'bittrexDeposit',
            type: 'deposit',
            exchange: 'Bittrex',
            acceptedFileTypes: ['paste'],
            fileNameWord: false,
            setupMessage: "BITTREX DEPOSITS<br>" +
                "<br>" +
                "There are no withdrawal or deposit file exports from Bittrex unfortunately.<br>" +
                "<br>" +
                "Copy and paste from Bittrex deposits history in this box.<br>"
        },
        bittrexWithdrawal: {
            name: 'bittrexWithdrawal',
            type: 'withdrawal',
            exchange: 'Bittrex',
            acceptedFileTypes: ['paste'],
            fileNameWord: false,
            setupMessage: "BITTREX WITHDRAWALS<br>" +
                "<br>" +
                "There are no withdrawal or deposit file exports from Bittrex unfortunately.<br>" +
                "<br>" +
                "Copy and paste from Bittrex withdrawals history in this box.<br>"
        },
        heystackImport: {
            name: 'heystackImport',
            type: 'all',
            exchange: 'all',
            acceptedFileTypes: ['excel', 'text'],
            fileNameWord: false,
            setupMessage: "HEYSTACK<br>" +
                "<br>" +
                "Previously exported exchange data can be imported here.<br>" +
                "<br>" +
                "Drag and drop in this box.<br>"
        },
        heystackExport: {
            name: 'heystackExport',
            type: 'all',
            exchange: 'all',
            acceptedFileTypes: false,
            fileNameWord: false,
            setupMessage: "HEYSTACK<br>" +
                "<br>" +
                "Export all exchange data (but not wallet data).<br>" +
                "<br>" +
                "Click button to proceed.<br><br>"
        },
    },

    // Page setup
    section: {parent: '', id: 'imports', widthPerc: 100, heightPerc: 50, cssScheme: 'transparent'},

    panels: [
        {parent: 'imports', id: 'a', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'imports', id: 'b', widthPerc: 66, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'imports', id: 'c', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
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
        // Set up page - needs to be before buttons for button handlers defined on page
        this.page = new HeyPage(this.section, this.panels, this.boxes);

        // Box shortcuts
        this.dragAndDrop = this.page.boxes.b1;
        this.dragAndDrop.addTextBox('dragDropText', 'transparentAndBorder');
        this.dropReport = this.page.boxes.b2;
        this.dropReport.addTextBox('dropReportText', 'transparent');

        // Define buttons - has to be here for handler functions
        this.buttonRanges = [
            {box: 'a1', id: 'sources', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'binance', type: 'menuHeader', target: dataInput, className: 'dataIcon', text: 'BINANCE', widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'SOURCE:'},
                    {id: 'bittrex', type: 'menuHeader', target: dataInput, className: 'dataIcon', text: 'BITTREX', widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'heystack', type: 'menuHeader', target: dataInput, className: 'dataIcon', text: 'HEYSTACK', widthPerc: 100, heightToWidth: 18, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: false},
                    // Date issue to correct
                    //{id: 'cointracking', type: 'menuHeader', target: dataInput, className: 'dataIcon', text: 'COINTRACKING', widthPerc: 100, heightPerc: 12, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false},
                ]
            },

            {box: 'a1', id: 'binance', type: 'menu', parentRange: 'sources', visible: false, buttonSpecs:
                [
                    {id: 'binanceTrade', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'TRADES', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'binanceTrade', offParameters: 'noSource', subHandler: false, label: false},
                    {id: 'binanceDeposit', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'DEPOSITS', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'binanceDeposit', offParameters: 'noSource', subHandler: false, label: false},
                    {id: 'binanceWithdrawal', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'WITHDRAWALS', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'binanceWithdrawal', offParameters: 'noSource', subHandler: false, label: false},
                    {id: 'binanceDistribution', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'DISTRIBUTION', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'binanceDistribution', offParameters: 'noSource', subHandler: false, label: false},
                ]
            },

            {box: 'a1', id: 'bittrex', type: 'menu', parentRange: 'sources', visible: false, buttonSpecs:
                [
                    {id: 'bittrexTrade', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'TRADES', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'bittrexTrade', offParameters: 'noSource', subHandler: false, label: false},
                    {id: 'bittrexDeposit', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'DEPOSITS', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'bittrexDeposit', offParameters: 'noSource', subHandler: false, label: false},
                    {id: 'bittrexWithdrawal', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'WITHDRAWALS', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'bittrexWithdrawal', offParameters: 'noSource', subHandler: false, label: false},
                ]
            },

            {box: 'a1', id: 'heystack', type: 'menu', parentRange: 'sources', visible: false, buttonSpecs:
                [
                    {id: 'heystackImport', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'IMPORT', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'heystackImport', offParameters: 'noSource', subHandler: false, label: false},
                    {id: 'heystackExport', type: 'menuSelector', target: dataInput, className: 'dataIcon', text: 'EXPORT', widthPerc: 94, heightToWidth: 18, buttonHandler: dataInput.switchSource, onParameters: 'heystackExport', offParameters: 'noSource', subHandler: false, label: false},
                ]
            },

            {box: 'a2', id: 'clear', type: 'simple', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'clearImports', type: 'safety', target: imports, className: 'dataIcon', text: 'CLEAR IMPORTS', widthPerc: 100, heightToWidth: 18, buttonHandler: imports.clearImportsStore, onParameters: false, offParameters: false, subHandler: false, label: 'LOCKED'},
                ]
            },
        ]

        // Add blockchain buttons
        this.page.addButtonRanges(this.buttonRanges);

        // Create data sources
        this.createDataSources();

        // Setup
        dataInput.switchSource(this.currentSource.name);
        this.resetImportReport();
        this.dragOverListenerOn();
    },

    // Run tasks on switching to this page
    switchTasks: async function() {
    },

    // Run taks on switching away from this page
    closeSwitchTasks: async function() {
        communication.messageOff();
    },

    createDataSources: function() {
        // Set up default no source
        this.sources['noSource'] = {name: 'noSource'};
        // Set up exchange sources
        for (const sourceName in this.sources) {
            let source = this.sources[sourceName];
            if (source.exchange === 'Binance') {
                this.sources[sourceName] = new BinanceSource(source.name, source.type, source.exchange, source.acceptedFileTypes, source.fileNameWord, source.setupMessage);
            } else if (source.exchange === 'Bittrex') {
                this.sources[sourceName] = new BittrexSource(source.name, source.type, source.exchange, source.acceptedFileTypes, source.fileNameWord, source.setupMessage);
            } else if (source.exchange === 'all') { // 'all' is used for Heystack import and export which can be all exchange and operation types
                this.sources[sourceName] = new HeystackSource(source.name, source.type, source.exchange, source.acceptedFileTypes, source.fileNameWord, source.setupMessage);
            }
        }
    },


    // Report trades added
    reportOnImport: function(addedOperations) {
        this.resetImportReport();
        imports.dropReport.textBox.changeText(addedOperations + " operations succesfully imported.<br><br>" + imports.dropReport.textBox.node.innerHTML);
    },

    // Reset report
    resetImportReport: function() {
        imports.dropReport.textBox.changeText("<i>Imported transactions will be displayed here.<br>Functionality to be added.</i>");
    },

    // Listener for file drag
    dragOverListenerOn: function() {
        imports.dragAndDrop.textBox.node.addEventListener('dragover', this.dragOverHandler);
    },

    // Handler for file drag
    dragOverHandler: function(e) {
        // Prevent default behavior (Prevent file from being opened)
        e.preventDefault();
    },

    // Remove all imports
    clearImportsStore: async function(e) {
        // Delete stacks from stackCollection
        await this.clearImportsFromStacks();
        // Clear database store
        databases.heyStack.clearObjectStore('trade_imports');
    },

    // Delete stacks from stackCollection for each exchange in trades imports store
    clearImportsFromStacks: async function() {
        let exchanges = await databases.heyStack.getListOfIndex('trade_imports', 'exchange');
        // For each source in trades delete by key values
        for (const exchange of exchanges) {
            stacks.figures.stackCollection.deleteStacksByKeyValues({source: exchange});
        }
        stacks.refresh();
    },
}


let dataInput = {

    coinsUpdateList: new Set(),

    addCoinsToUpdateListFor: function(operations) {
        for (const operation of operations) {
            this.coinsUpdateList.add(operation.coinIn).add(operation.coinOut).add(operation.coinFee);
        }
        this.coinsUpdateList.delete(undefined);
    },

    resetCoinsUpdateList: function() {
        this.coinsUpdateList = new Set();
    },

    sourceList: ['binanceMain', 'binanceDistribution', 'cointracking', 'bittrexTrade', 'bittrexDeposit', 'bittrexWithdrawal', 'importHeystack', 'exportHeystack'],

    switchSource: function(newSource) {
        // Close current source
        if (imports.currentSource.name !== 'noSource') {
            imports.currentSource.close();
        }

        // Close current source
        if (newSource === 'noSource') {
            this.noSourceSetup();
        } else {
            imports.sources[newSource].setup();
        }

        // Reset imports report
        imports.resetImportReport();
    },

    noSourceSetup: function() {
        imports.currentSource = {name: 'noSource'};

        imports.dragAndDrop.textBox.changeText(
            "<i>Select source from menu.</i>"
        );
    },

    // READING DATA
    // ------------

    readFileXLSX: async function(file) {
        console.log('readFileXLSX')
        return new Promise((resolve, reject) => {
            let rawData = [];

            let reader = new FileReader();
            reader.readAsBinaryString(file);

            reader.onload = function(e) {
                let workbook = XLSX.read(e.target.result, {type: 'binary'});

                let newData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
                rawData = rawData.concat(newData);
            }

            reader.onloadend = function(e) {
                console.log(rawData);
                resolve(rawData);
            }

            reader.onerror = function(e) {
                console.log(e);
                reject(e);
            }
        });
    },

    readFileCSV: async function(file, options) {
        console.log('readFileCSV')
        return new Promise((resolve, reject) => {
            let rawData = [];

            let reader = new FileReader();
            reader.readAsText(file);

            reader.onload = function(e) {

                let rows = [];
                // Option for different row split
                if (options.hasOwnProperty('split')) {
                    rows = e.target.result.split("\n");
                // Default
                } else {
                    rows = e.target.result.split("\r\n");
                }

                let headers = [];
                if (options.hasOwnProperty('headers')) {
                    headers = options.headers;
                    rows.shift();
                // Default
                } else {
                    headers = rows.shift().split(",");
                }

                if (options.removeLastRow === true) {
                    let discard = rows.pop();
                }

                for (let row of rows) {
                    if (options.hasOwnProperty('regex')) {
                        row = row.replace(options.regex, '');
                    }
                    let rawDatum = {};
                    let items = row.split(",");
                    for (let [i, header] of headers.entries()) {
                        rawDatum[header] = items[i];
                    }
                    rawData.push(rawDatum);
                }
            }

            reader.onloadend = function(e) {
                console.log(rawData);
                resolve(rawData);
            }

            reader.onerror = function(e) {
                console.log(e);
                reject(e);
            }
        });
    },

    // CHECK FOR PRIOR LOADED DATA
    // ---------------------------

    // Check for operations previously loaded into database
    checkForPriorLoadedOperations: async function(formattedData, filters) {
        let validData = [];
        let duplicateData = [];
        // Calculate min/max date range of operations
        let dateNumberRange = formattedData.map(x => Number(x.date));
        let fromDate = new Date(Math.min(...dateNumberRange));
        let toDate = new Date(Math.max(...dateNumberRange));

        // Get all database elements matching this date index range
        let existingData = await databases.heyStack.getAllElementsMatchingIndexRange('trade_imports', 'date', fromDate, toDate);

        // Filter by type, exchange to give possible operations
        for (const filterKey of Object.keys(filters)) {
            if (filters[filterKey] !== 'all') {
                existingData = existingData.filter(x => x[filterKey] === filters[filterKey]);
            }
        }

        // For each operation
        for (const datum of formattedData) {
            // Filter possible operations by date number
            const potentialDuplicateData = existingData.filter(x => Number(x.date) === Number(datum.date));
            if (potentialDuplicateData.length > 0) {
                // Check operation against remaining possibles
                const foundDuplicates = this.checkDuplicates(datum, potentialDuplicateData);
                // Exclude duplicates from operations to be added to database
                if (foundDuplicates.length === 0) {
                    validData.push(datum);
                } else {
                    duplicateData.push({rejectedData: datum, databaseData: foundDuplicates});
                }
            } else {
                validData.push(datum);
            }
        }
        return {validData: validData, duplicateData: duplicateData};
    },

    // Check operation against array of potential duplicates
    checkDuplicates: function(datum, potentialDuplicateData) {
        let foundDuplicates = [];
        for (const potentialDuplicate of potentialDuplicateData) {
            let checkDuplicate = this.checkEqual(datum, potentialDuplicate);
            if (checkDuplicate === true) {
                foundDuplicates.push(potentialDuplicate);
            }
        }
        return foundDuplicates;
    },

    // Check if two operation objects are equal
    checkEqual: function(datum, duplicate) {
        let keys = ['type', 'buy', 'coinIn', 'sell', 'coinOut', 'fee', 'coinFee', 'exchange'];
        let result = true;
        if (Number(datum.date) === Number(duplicate.date)) {
            for (const key of keys) {
                if (typeof datum[key] === 'number') {
                    if (Math.abs(datum[key] / duplicate[key] - 1) > 0.000001) {
                        result = false;
                    }
                } else {
                    if (datum[key] !== duplicate[key]) {
                        result = false;
                    }
                }
            }
        } else {
            result = false;
        }
        return result;
    },
}


// Source class
class Source {
    // Initialisation
    constructor(name, type, exchange, acceptedFileTypes, fileNameWord, setupMessage) {
        this.name = name;
        this.type = type;
        this.exchange = exchange;
        this.acceptedFileTypes = acceptedFileTypes;
        this.fileNameWord = fileNameWord;
        this.setupMessage = setupMessage;
        //this.pasteHandlerRef
        //this.dropHandlerRef
    }

    // Set up on switch to this source
    setup() {
        // Change current source and text message
        imports.currentSource = this;
        imports.dragAndDrop.textBox.changeText(this.setupMessage);
        // Set handlers / buttons
        if (this.name === 'heystackExport') {
            let buttonSpec = {id: 'confirmExport', type: 'simple', target: this, className: 'dataIcon', text: 'CONFIRM EXPORT', widthPerc: 24, heightToWidth: 18, buttonHandler: this.onClick, label: false};
            let newButton = new Button(buttonSpec, true, false, imports.dragAndDrop, imports.dragAndDrop.widthPix, imports.dragAndDrop.heightPix);
            imports.dragAndDrop.textBox.node.appendChild(newButton.node);
        } else if (this.acceptedFileTypes.includes('paste')) {
            imports.dragAndDrop.textBox.node.setAttribute("contenteditable", true);
            imports.dragAndDrop.textBox.node.addEventListener('paste', this.pasteHandlerRef = this.onPaste.bind(this));
        } else {
            imports.dragAndDrop.textBox.node.addEventListener('drop', this.dropHandlerRef = this.onFileDrop.bind(this));
        }
    }

    // Close source on switch away
    close() {
        if (this.name === 'heystackExport') {
            // Heystack export - no action
        } else if (this.acceptedFileTypes.includes('paste')) {
            imports.dragAndDrop.textBox.node.setAttribute("contenteditable", false);
            imports.dragAndDrop.textBox.node.removeEventListener('paste', this.pasteHandlerRef);
        } else {
            imports.dragAndDrop.textBox.node.removeEventListener('drop', this.dropHandlerRef);
        }
    }

    async onFileDrop(e) {
        // Prevent the default action from doing anything
        e.preventDefault();
        // Clear any messages
        communication.messageOff();
        // Check dragged file is valid
        if (e.dataTransfer.items) {
            for (let file of [...e.dataTransfer.files]) {
                if (this.checkFileType(file.type) === false) {
                    communication.message('Incorrect file format. Please check you are dragging the correct file.');
                } else if (this.checkFileName(file.name) == false) {
                    communication.message('Incorrect file name. Please check you are dragging the correct file.');
                } else {
                    // Read, format and check data
                    let rawData = await this.readData(file);
                    let formattedData = await this.formatData(rawData);
                    let checkData = await dataInput.checkForPriorLoadedOperations(formattedData, {type: this.type, exchange: this.exchange});
                    // Store data
                    let addedOperations = await databases.heyStack.addData(checkData.validData, 'trade_imports');
                    imports.reportOnImport(addedOperations);
                    communication.message('Import complete.');
                    dataInput.addCoinsToUpdateListFor(checkData.validData);
                }
            }
        }
    }

    async onPaste(e) {
        // Prevent the default action from doing anything
        e.preventDefault();
        // Clear any messages
        communication.messageOff();
        // Read, format and check data
        let rawData = (e.clipboardData || window.clipboardData).getData('text');
        let formattedData = await this.formatData(rawData);
        let checkData = await dataInput.checkForPriorLoadedOperations(formattedData, {type: this.type, exchange: this.exchange});
        // Store data
        let addedOperations = await databases.heyStack.addData(checkData.validData, 'trade_imports');
        imports.reportOnImport(addedOperations);
        communication.message('Import complete.');
        dataInput.addCoinsToUpdateListFor(checkData.validData);
    }

    async readData(file) {
        switch(file.type) {
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                return await dataInput.readFileXLSX(file);
                break;
            case 'text/csv':
                return await this.readTextFile(file);
                break;
            default:
                return false; // Should never happen
        }
        return false;
    }

    async formatData(rawData) {
        switch(this.type) {
            case 'trade':
                return await this.formatTrades(rawData);
                break;
            case 'deposit':
                return await this.formatDeposits(rawData);
                break;
            case 'withdrawal':
                return await this.formatWithdrawals(rawData);
                break;
            case 'distribution':
                return await this.formatDistribution(rawData);
                break;
            case 'all':
                return await this.formatAll(rawData);
                break;
            default:
                return false; // Should never happen
        }
    }

    // Check file type (excel / text) is accepted by source
    checkFileType(fileType) {
        switch(fileType) {
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                if (this.acceptedFileTypes.includes('excel')) {
                    return true;
                }
                break;
            case 'text/csv':
                if (this.acceptedFileTypes.includes('text')) {
                    return true;
                }
            default:
                return false;
        }
        return false;
    }

    // Check file type (excel / text) is accepted by source
    checkFileName(fileName) {
        // No check if no fileNameWord
        if (this.fileNameWord === false) {
            return true;
        } else if (fileName.toLowerCase().includes(this.fileNameWord)) {
            return true;
        } else {
            return false;
        }
    }
}

// Binance source class
class BinanceSource extends Source {
    // Format trade data
    async formatTrades(rawData) {
        let formattedData = [];
        let exchangeInfo = await binance.exchangeInfo();

        for (let [i, rawDatum] of rawData.entries()) {
            let pairInfo = exchangeInfo.symbols.find(x => x.symbol === rawDatum.Market);

            if (pairInfo !== undefined) {
                let formatted = {};
                formatted['type'] = "trade";
                if (rawDatum.Type === "SELL") {
                    formatted['buy'] = Number(rawDatum.Total);
                    formatted['coinIn'] = pairInfo.quoteAsset;
                    formatted['sell'] = Number(-rawDatum.Amount);
                    formatted['coinOut'] = pairInfo.baseAsset;
                } else if (rawDatum.Type === "BUY") {
                    formatted['buy'] = Number(rawDatum.Amount);
                    formatted['coinIn'] = pairInfo.baseAsset;
                    formatted['sell'] = Number(-rawDatum.Total);
                    formatted['coinOut'] = pairInfo.quoteAsset;
                }
                formatted['fee'] = Number(-rawDatum.Fee);
                formatted['coinFee'] = rawDatum['Fee Coin'];
                formatted['exchange'] = 'Binance';
                formatted['comment'] = '';
                formatted['date'] = new Date(rawDatum['Date(UTC)'].replace(' ', 'T') + '.000Z');
                formatted['priceStatus'] = 'none';
                formattedData.push(formatted)
            } else {
                console.log(i, rawDatum)
                console.log('pair does not exist on Binance');
            }
        }
        return formattedData;
    }

    // Format deposit data
    formatDeposits(rawData) {
        let formattedData = [];

        for (let rawDatum of rawData) {
            let formatted = {};
            formatted['type'] = "deposit";
            formatted['buy'] = Number(rawDatum.Amount);
            formatted['coinIn'] = rawDatum.Coin;
            formatted['sell'] = 0;
            formatted['coinOut'] = '';
            formatted['fee'] = Number(-rawDatum.TransactionFee);
            formatted['coinFee'] = rawDatum.Coin;
            formatted['exchange'] = 'Binance';
            formatted['comment'] = '';
            formatted['date'] = new Date(rawDatum['Date(UTC)'].replace(' ', 'T') + '.000Z');
            formatted['priceStatus'] = 'none';
            formattedData.push(formatted)
        }
        return formattedData;
    }

    // Format withdrawal data
    formatWithdrawals(rawData) {
        let formattedData = [];

        for (let rawDatum of rawData) {
            let formatted = {};
            formatted['type'] = "withdrawal";
            formatted['buy'] = 0;
            formatted['coinIn'] = '';
            formatted['sell'] = Number(-rawDatum.Amount);
            formatted['coinOut'] = rawDatum.Coin;
            formatted['fee'] = Number(-rawDatum.TransactionFee);
            formatted['coinFee'] = rawDatum.Coin;
            formatted['exchange'] = 'Binance';
            formatted['comment'] = '';
            formatted['date'] = new Date(rawDatum['Date(UTC)'].replace(' ', 'T') + '.000Z');
            formatted['priceStatus'] = 'none';
            formattedData.push(formatted)
        }
        return formattedData;
    }

    // Format trade data
    formatDistribution(rawData) {
        let formattedData = [];
        for (let [i, rawDatum] of rawData.entries()) {
            let formatted = {};
            formatted['type'] = "distribution";
            formatted['buy'] = Number(rawDatum.Change);
            formatted['coinIn'] = rawDatum.Coin;
            formatted['exchange'] = 'Binance';
            formatted['date'] = new Date(rawDatum['UTC_Time'].replace(' ', 'T') + '.000Z');
            formatted['priceStatus'] = 'none';
            formattedData.push(formatted);
        }
        return formattedData;
    }
}


// Bittrex source class
class BittrexSource extends Source {

    // Extract raw data from text file
    async readTextFile(file) {
        return await dataInput.readFileCSV(file, {removeLastRow: true});
    }

    // Format trade data
    async formatTrades(rawData) {
        let formattedData = [];

        for (let rawDatum of rawData) {
            let formatted = {};
            formatted['type'] = "trade";
            let coins = rawDatum.Exchange.split('-');
            if (rawDatum.OrderType === "LIMIT_SELL") {
                formatted['buy'] = Number(rawDatum.Price);
                formatted['coinIn'] = coins[0];
                formatted['sell'] = Number(-rawDatum.Quantity) - Number(-rawDatum.QuantityRemaining);
                formatted['coinOut'] = coins[1];
            } else if (rawDatum.OrderType === "LIMIT_BUY") {
                formatted['buy'] = Number(rawDatum.Quantity) - Number(rawDatum.QuantityRemaining);
                formatted['coinIn'] = coins[1];
                formatted['sell'] = Number(-rawDatum.Price);
                formatted['coinOut'] = coins[0];
            } else {
                console.log('buy/sell type not recognised');
            }
            formatted['fee'] = Number(-rawDatum.Commission);
            formatted['coinFee'] = coins[0];
            formatted['exchange'] = 'Bittrex';
            formatted['comment'] = '';
            formatted['date'] = new Date(rawDatum.Closed);
            formatted['priceStatus'] = 'none';
            formattedData.push(formatted)
        }
        return formattedData;
    }

    // Format deposit data
    formatDeposits(pasteData) {
        let formattedData = [];
        let rows = pasteData.split("\n\n");
        for (let row of rows) {
            let items = row.split("\n");

            let formatted = {};
            formatted['type'] = "deposit";
            formatted['buy'] = Number(items[2].replace(',', ''));
            formatted['coinIn'] = items[1];
            formatted['sell'] = 0;
            formatted['coinOut'] = '';
            formatted['fee'] = 0;
            formatted['coinFee'] = '';
            formatted['exchange'] = 'Bittrex';
            formatted['comment'] = '';
            formatted['date'] = new Date(items[0]);
            formatted['priceStatus'] = 'none';
            formattedData.push(formatted);
        }
        return formattedData;
    }

    // Format withdrawal data
    formatWithdrawals(pasteData) {
        let formattedData = [];
        let rows = pasteData.split("\n\n");
        for (let row of rows) {
            let items = row.split("\n");

            let formatted = {};
            formatted['type'] = "withdrawal";
            formatted['buy'] = 0;
            formatted['coinIn'] = '';
            formatted['sell'] = Number(-items[2].replace(',', ''));
            formatted['coinOut'] = items[1];
            formatted['fee'] = 0;
            formatted['coinFee'] = items[1];
            formatted['exchange'] = 'Bittrex';
            formatted['comment'] = '';
            formatted['date'] = new Date(items[0]);
            formatted['priceStatus'] = 'none';
            formattedData.push(formatted);
        }
        return formattedData;
    }


    // Format trade data
    formatDistribution(rawData) {
        //
    }
}

// HeyStack source class
class HeystackSource extends Source {

    // Extract raw data from text file
    async readTextFile(file) {
        return await dataInput.readFileCSV(file, {});
    }

    // Format all data
    async formatAll(rawData) {
        let formattedData = [];
        for (let rawDatum of rawData) {
            let formatted = {};
            formatted['type'] = rawDatum.type;
            formatted['buy'] = Number(rawDatum.buy);
            formatted['coinIn'] = rawDatum.coinIn;
            formatted['sell'] = Number(rawDatum.sell);
            formatted['coinOut'] = rawDatum.coinOut;
            formatted['fee'] = Number(rawDatum.fee);
            formatted['coinFee'] = rawDatum.coinFee;
            formatted['exchange'] = rawDatum.exchange;
            formatted['comment'] = rawDatum.comment;
            formatted['date'] = new Date(rawDatum.date);
            if (rawDatum.hasOwnProperty('priceStatus')) {
                formatted['priceStatus'] = rawDatum.priceStatus;
            } else {
                formatted['priceStatus'] = 'none';
            }
            if (rawDatum.hasOwnProperty('fiatValue')) {
                formatted['fiatValue'] = rawDatum.fiatValue;
            }
            formattedData.push(formatted)
        }
        return formattedData;
    }

    // Format deposit data
    formatDeposits(rawData) {
    }

    // Format withdrawal data
    formatWithdrawals(rawData) {
    }

    // Format trade data
    formatDistribution(rawData) {
    }

    async onClick(e) {
        await this.exportData();
    }

    // Export data to .csv file
    async exportData() {
        // Get all export operations from database
        let allExchangeOperations = await databases.heyStack.getAllFromStore('trade_imports');
        // Create filename and export using helper
        let filename = 'heystackExport';
        let exportHelper = new ExportHelper(allExchangeOperations, HeystackSource.dataHeaders, filename);
        await exportHelper.exportData();
    }

    static dataHeaders = [
        'type',
        'buy',
        'coinIn',
        'sell',
        'coinOut',
        'fee',
        'coinFee',
        'exchange',
        'comment',
        'date',
        'priceStatus',
        'fiatValue'
    ]

}
