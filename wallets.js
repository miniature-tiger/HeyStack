// WALLET PAGE AND WALLET CLASS
// ----------------------------

let wallets = {

    // Array of Wallet instances (blockchain / address combination)
    wallets: [],

    // Wallet highlighted in table - actions can be applied to this wallet
    currentWallet: false,

    // Sources (name + addressNumber) for deleted wallets stored here until Stacks updated
    deletedWallets: [],

    // Data for wallets table
    walletsForTable: function() {
        return this.wallets.map(x => ({
            blockchain: x.blockchain.name,
            address: x.address,
            joinDate: x.joinDate,
            lastTransactionDate: x.lastTransactionDate,
            nativeTransactions: x.nativeTransactions,
            nativeTransactionsToLoad: x.nativeTransactionsToLoad,
            priorTransactions: x.priorTransactions,
            priorTransactionsToLoad: x.priorTransactionsToLoad,
            includeInStacks: x.summaryRange.includeInStacks
        }));
    },

    get toIncludeInStacks() {
        return this.wallets.filter(x => x.summaryRange.includeInStacks === true);
    },

    // Page setup
    section: {parent: '', id: 'wallets', widthPerc: 100, heightPerc: 50, cssScheme: 'transparent'},

    panels: [
        {parent: 'wallets', id: 'a', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'wallets', id: 'b', widthPerc: 66, heightPerc: 98, cssScheme: 'transparent'},
        {parent: 'wallets', id: 'c', widthPerc: 15, heightPerc: 98, cssScheme: 'transparent'},
    ],

    boxes: [
        {parent: 'a', id: 'a1', widthPerc: 100, heightPerc: 7, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'a', id: 'a3', widthPerc: 100, heightPerc: 39, cssScheme: 'transparent justifyTop'},
        {parent: 'b', id: 'b1', widthPerc: 100, heightPerc: 76, cssScheme: 'whiteBox'},
        {parent: 'c', id: 'c1', widthPerc: 100, heightPerc: 7, cssScheme: 'transparent justifyTop'},
        {parent: 'c', id: 'c2', widthPerc: 100, heightPerc: 48, cssScheme: 'transparent justifyTop'},
        {parent: 'c', id: 'c3', widthPerc: 100, heightPerc: 39, cssScheme: 'transparent justifyTop'},

    ],

    buttonRanges: {},
    buttonRangesAsArray: function() {
        return Object.keys(this.buttonRanges).map(x => this.buttonRanges[x]);
    },

    page: '',

    setup: function() {
        // Set up page - needs to be before buttons for button handlers defined on page
        this.page = new HeyPage(this.section, this.panels, this.boxes);

        // Define buttons - has to be here for handler functions
        this.buttonRanges = {
            blockchains: {box: 'a2', id: 'blockchains', type: 'menu', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'hive', type: 'menuSelector', target: wallets, className: 'dataIcon', text: 'HIVE', widthPerc: 100, heightToWidth: 18, buttonHandler: wallets.switchSource, onParameters: 'hive', offParameters: 'noSource', subHandler: false, label: 'BLOCKCHAINS:'},
                    {id: 'steem', type: 'menuSelector', target: wallets, className: 'dataIcon', text: 'STEEM', widthPerc: 100, heightToWidth: 18, buttonHandler: wallets.switchSource, onParameters: 'steem', offParameters: 'noSource', subHandler: false, label: false},
                ]
            },

            updates: {box: 'a3', id: 'updates', type: 'simple', parentRange: false, visible: true, buttonSpecs:
                [
                    {id: 'updateWallets', type: 'simple', target: wallets, className: 'dataIcon', text: 'UPDATE INFO', widthPerc: 100, heightToWidth: 18, buttonHandler: wallets.updateWalletsInfoFromAPI, onParameters: false, offParameters: false, subHandler: false, label: 'APPLY ALL:'},
                    {id: 'deleteAllWallets', type: 'safety', target: wallets, className: 'dataIcon', text: 'DELETE ALL', widthPerc: 100, heightToWidth: 18, buttonHandler: wallets.deleteAllWallets, onParameters: false, offParameters: false, subHandler: false, label: false},
                    // Reserved for admin
                    //{id: 'deleteDatabase', type: 'safety', target: wallets, className: 'dataIcon', text: 'DELETE DATABASE AND PRICES', widthPerc: 100, heightToWidth: 18, buttonHandler: wallets.closeAndDeleteDB, onParameters: false, offParameters: false, subHandler: false, label: false},
                ]
            },

            walletControls: {box: 'c2', id: 'walletControls', type: 'simple', parentRange: false, visible: false, buttonSpecs:
                [
                    {id: 'updateInfo', type: 'simple', target: this, className: 'dataIcon', text: 'UPDATE INFO', widthPerc: 100, heightToWidth: 18, buttonHandler: this.updateCurrentWalletInfoFromAPI, onParameters: false, offParameters: false, subHandler: false, label: 'WALLET:'},
                    {id: 'loadData', type: 'simple', target: this, className: 'dataIcon', text: 'LOAD DATA', widthPerc: 100, heightToWidth: 18, buttonHandler: this.loadDataCurrentWallet, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'includeInStacks', type: 'simple', target: this, className: 'dataIcon', text: 'INCLUDE IN STACKS', widthPerc: 100, heightToWidth: 18, buttonHandler: this.includeWalletInStacks, onParameters: false, offParameters: false, subHandler: false, label: false},
                    {id: 'exportWalletData', type: 'safety', target: this, className: 'dataIcon', text: 'EXPORT WALLET', widthPerc: 100, heightToWidth: 18, buttonHandler: this.exportCurrentWallet, onParameters: false, offParameters: false, subHandler: false, label: 'LOCKED:'},
                    {id: 'deleteWallet', type: 'safety', target: this, className: 'dataIcon', text: 'DELETE WALLET', widthPerc: 100, heightToWidth: 18, buttonHandler: this.deleteCurrentWallet, onParameters: false, offParameters: false, subHandler: false, label: false},
                ]
            },
        }

        // Add blockchain buttons
        this.page.addButtonRanges(this.buttonRangesAsArray());

        // Create central table of blockchain wallets
        this.createWalletsTable();
    },

    // Run opening tasks (fast only, no fetch, no aggregation)
    runOpeningTasks: async function() {
        // Create blockchains object
        this.createBlockchains();
        // Generate wallets data from database
        await this.generateWalletsData();
    },

    // Run starting tasks (slow tasks)
    runTasks: async function() {
        // Create fx between Vests and Liquid/Power for existing wallet blockchains
        await this.checkCreateBlockchainVestPrices();
        // Turn on table listeners
        wallets.page.boxes.b1.table.tableListenersOn();
    },

    // Run tasks on switching to this page
    switchTasks: async function() {
        if (status.summary.state !== 'setup') {
            if (this.wallets.length === 0) {
                communication.message('To add blockchain wallet:<br>(1) Click on blockchain name (top left).<br>(2) Enter wallet address (top right).<br>(3) Click ADD WALLET (top right).');
            }
        }
    },

    // Run taks on switching away from this page
    closeSwitchTasks: async function() {
        communication.messageOff();
    },

    // Fx between Vests and Liquid/Power
    checkCreateBlockchainVestPrices: async function() {
        let blockchainsForExistingWallets = Array.from(new Set(this.wallets.map(x => x.blockchain.name)));
        for (let blockchainName of blockchainsForExistingWallets) {
            await grapheneTools.checkCreateBlockchainVestPrices(blockchains.data[blockchainName]);
        }
    },

    // Check for update processed
    checkProcessTransactionUpdates: async function() {
        let updatesProcessed = false;
        for (const wallet of this.wallets) {
            // Wallets with transactions updated or newly included in stacks
            if (wallet.summaryRange.includeInStacks === true && (wallet.processStatus === 'updated' || wallet.processStatus === 'included')) {
                communication.message('Updating wallet transactions...');
                let walletStackCollection = await wallet.createBalanceStacks();
                stacks.createStackHistories(walletStackCollection);
                stacks.figures.stackCollection.updateStacks(walletStackCollection.stacks);
                wallet.processStatus = false;
                updatesProcessed = true;
            // Wallets newly excluded from stacks
            } else if (wallet.summaryRange.includeInStacks === false && wallet.processStatus === 'excluded') {
                stacks.figures.stackCollection.deleteStacksByKeyValues({source: wallet.blockchain.name + '_' + wallet.summaryRange.addressNumber});
                wallet.processStatus = false;
                updatesProcessed = true;
            }
        }
        // Deleted wallets
        for (const walletSource of this.deletedWallets) {
            stacks.figures.stackCollection.deleteStacksByKeyValues({source: walletSource});
            updatesProcessed = true;
        }
        this.deletedWallets = [];
        return updatesProcessed;
    },

    // Aggregate transactions for all wallets into stacks
    aggregateTransactionsIntoStacks: async function() {
        let transactionsStackCollection = new StackCollection();
        for (const wallet of this.wallets) {
            if (wallet.summaryRange.includeInStacks === true) {
                let walletStackCollection = await wallet.createBalanceStacks();
                stacks.createStackHistories(walletStackCollection);
                transactionsStackCollection.addStacks(walletStackCollection.stacks);
            }
        }
        return transactionsStackCollection;
    },

    // Wallets table
    createWalletsTable: function() {
        let headerSpec = {heightPerc: 16};

        let columnSpec = [
            {key: 'blockchain', label: 'BLOCKCHAIN', textFormat: 'string', widthPerc: '13%', columnFormat: 'tableDivLeft'},
            {key: 'address', label: 'ADDRESS', textFormat: 'string', widthPerc: '23%', columnFormat: 'tableDivLeft'},
            {key: 'joinDate', label: 'JOIN DATE', textFormat: 'dateToText', widthPerc: '13%', columnFormat: 'tableDivLeft'},
            {key: 'lastTransactionDate', label: 'LAST OP', textFormat: 'dateToText', widthPerc: '13%', columnFormat: 'tableDivLeft'},
            {key: 'priorTransactionsToLoad', label: 'PRIOR OPS TO LOAD', textFormat: 'comma-0', widthPerc: '13%', columnFormat: 'tableDivRight'},
            {key: 'nativeTransactionsToLoad', label: 'NATIVE OPS TO LOAD', textFormat: 'comma-0', widthPerc: '13%', columnFormat: 'tableDivRight'},
            {key: 'includeInStacks', label: 'INCLUDE IN STACKS', textFormat: 'string', widthPerc: '12%', columnFormat: 'tableDivRight'},
        ]

        let tableData = [];
        let handlerSpec = {target: wallets, tableHandler: wallets.handleTableClick};
        wallets.page.boxes.b1.addTable(headerSpec, columnSpec, '', tableData, handlerSpec);
    },

    updateWalletsTable: function() {
        wallets.page.boxes.b1.table.updateTableData(this.walletsForTable());
        if (this.currentWallet !== false) {
            wallets.page.boxes.b1.table.highlightRowByData({blockchain: this.currentWallet.blockchain.name, address: this.currentWallet.address});
        }
    },

    scrollToBottomOfTable: function() {
        wallets.page.boxes.b1.table.scrollToBottom();
    },

    // Generate wallets data for addresses in database
    generateWalletsData: async function() {
        //console.log('generateWalletsData');
        for (let blockchainName in blockchains.data) {
            let blockchain = blockchains.data[blockchainName];
            let addressesInDatabaseRanges = await databases.heyStack.getListOfIndex(blockchain.transactionsRangeStore, "address");
            for (let address of addressesInDatabaseRanges) {
                await this.generateExistingWallet(blockchain, address);
            }
        }
        this.updateWalletsTable();
    },

    // Create new wallet and store the summary range from the blockchain in the database
    generateExistingWallet: async function(blockchain, address) {
        let wallet = new Wallet(blockchain, address);
        await wallet.getWalletData();
        this.wallets.push(wallet);
    },

    // Create new wallet and store the summary range from the blockchain in the database
    generateNewWallet: async function(blockchain, address, showStatus) {
        let wallet = new Wallet(blockchain, address);
        // Create summary range for wallet with show status as true
        await wallet.createSummaryRange(showStatus);
        await wallet.storeInTransactionsRangeStore([wallet.summaryRange]);
        await wallet.generateAndStoreWalletPairs();
        // Create summary range for wallet with show status as true
        await wallet.fetchgetWalletData('both');
        // Create fx between Vests and Liquid/Power for new wallet
        await grapheneTools.checkCreateBlockchainVestPrices(blockchain);
        this.wallets.push(wallet);
    },

    // Get all address numbers
    getAllAddressNumbersForBlockchains: async function() {
        let addressNumbersIndex = [];
        for (let blockchain in blockchains.data) {
            let addressNumbersForBlockchain = await databases.heyStack.getListOfIndex(blockchains.data[blockchain].transactionsRangeStore, "addressNumber");
            addressNumbersIndex = addressNumbersIndex.concat(addressNumbersForBlockchain);
        }
        return addressNumbersIndex;
    },

    // Update wallets data from API
    updateWalletsInfoFromAPI: async function() {
        for (const wallet of this.wallets) {
            await this.updateWalletInfoFromAPI(wallet, false);
        }
        communication.message("Information update complete. </i>");
    },

    updateCurrentWalletInfoFromAPI: async function() {
        await this.updateWalletInfoFromAPI(this.currentWallet, true);
    },

    // Update single wallet data from API
    updateWalletInfoFromAPI: async function(wallet, communicateComplete) {
        communication.message("Updating wallet information for @" + wallet.address + ". Please wait.");
        await wallet.fetchWalletData('last');
        this.updateWalletsTable();
        if (communicateComplete === true) {
            communication.message("@" + wallet.address + " information update complete.");
        }
    },

    // Reserved for admin
    closeAndDeleteDB: async function() {
        await databases.heyStack.closeAndDeleteDB();
        await databases.vestPrices.closeAndDeleteDB();
    },

    // Delete all wallets from storage and memory
    deleteAllWallets: async function() {
        // Add all wallets with stacks to deletedWallets
        for (const wallet of this.wallets) {
            if (wallet.summaryRange.includeInStacks === true) {
                this.deletedWallets.push(wallet.blockchain.name + '_' + wallet.summaryRange.addressNumber);
            }
        }
        // Clear wallets from wallets.wallets
        this.wallets = [];
        // Update current wallet
        this.currentWallet = false;
        // Update wallets table
        wallets.updateWalletsTable();
        // Hide wallet buttons
        wallets.page.boxes.c2.buttonRanges.walletControls.hideButtons();
        // Clear all wallet transactions and ranges in storage
        await this.clearAllWalletStores();
    },

    // Clear all wallet stores in database
    clearAllWalletStores: async function() {
        await databases.heyStack.clearObjectStore('hive_wallet');
        await databases.heyStack.clearObjectStore('hive_transactionsRange');
        await databases.heyStack.clearObjectStore('steem_wallet');
        await databases.heyStack.clearObjectStore('steem_transactionsRange');
    },

    // Create blockchains
    createBlockchains: function() {
        for (const blockchainName in blockchains.data) {
            let blockchain = blockchains.data[blockchainName];
            blockchains.data[blockchainName] = new Blockchain(blockchain.name, blockchain.stores, blockchain.coins, blockchain.airdropsAndHardforks, blockchain.parameters);
        }

    },

    // Change blockchain source
    switchSource: function(newSourceName) {
        // Close current blockchain
        if (blockchains.currentBlockchain !== 'noSource') {
            blockchains.data[blockchains.currentBlockchain].close();
        }
        // Set current blockchain to new source
        blockchains.currentBlockchain = newSourceName;
        // Setup new blockchain
        if (newSourceName !== 'noSource') {
            blockchains.data[newSourceName].setup();
            // Dehighlight all rows in table
            wallets.page.boxes.b1.table.dehighlightAllRows();
            // Set current wallet to false
            this.currentWallet = false;
        }
    },

    // Handler for click on wallet in table
    handleTableClick: function(rowData) {
        this.processWalletSelection(rowData.blockchain, rowData.address);
    },

    processWalletSelection: function(blockchainName, address) {
        // Change current wallet based on clicked table row
        this.changeCurrentWallet(blockchainName, address);
        // Set current blockchain to noSource
        this.switchSource('noSource');
        // Remove buttons and nodes - full reset
        wallets.page.boxes.c2.buttonRanges.walletControls.removeButtons();
        // Add button range including button nodes (which are hidden)
        wallets.page.addButtonRanges([this.buttonRanges.walletControls]);
        // Show buttons (hidden class removed)
        wallets.page.boxes.c2.buttonRanges.walletControls.showButtons();
        // Deactivate any active blockchain button
        wallets.page.boxes.a2.buttonRanges.blockchains.deactivateAllButtons();
    },

    changeCurrentWallet: function(blockchainName, address) {
        this.currentWallet = this.findWallet(blockchainName, address);
    },

    findWallet: function(blockchainName, address) {
        return this.wallets.find(x => x.blockchain.name === blockchainName && x.address === address);
    },

    findWalletIndex: function(blockchainName, address) {
        return this.wallets.findIndex(x => x.blockchain.name === blockchainName && x.address === address);
    },

    findWalletsWithSameAddress: function(address) {
        return this.wallets.filter(x => x.address === address);
    },

    // Delete an existing wallet (blockchain / address combination)
    // - remove records from indexedDB and data from wallets.data and local storage
    deleteWallet: async function(wallet) {
        // Get count of
        let count = await databases.heyStack.countAllElementsOfIndexType(wallet.blockchain.walletStore, 'addressNumber', wallet.summaryRange.addressNumber);

        // Delete records from wallet object store
        await databases.heyStack.deleteAllElementsMatchingIndexValues(wallet.blockchain.walletStore, 'addressNumber', wallet.summaryRange.addressNumber);
        // Delete records from transaction range object store
        await databases.heyStack.deleteAllElementsMatchingIndexValues(wallet.blockchain.transactionsRangeStore, 'address', wallet.address);
        // Add to list of wallets to remove from stacks
        if (wallet.summaryRange.includeInStacks === true) {
            this.deletedWallets.push(wallet.blockchain.name + '_' + wallet.summaryRange.addressNumber);
        }
        // Delete wallet from wallet array
        this.deleteWalletFromMemory(wallet.blockchain, wallet.address);
        // Update current wallet
        this.currentWallet = false;
        // Update wallets table
        wallets.updateWalletsTable();
        // Hide wallet buttons
        wallets.page.boxes.c2.buttonRanges.walletControls.hideButtons();
    },

    deleteWalletFromMemory: function(blockchain, address) {
        let index = this.findWalletIndex(blockchain.name, address);
        this.wallets.splice(index, 1);
    },

    deleteCurrentWallet: async function() {
        await this.deleteWallet(this.currentWallet);
    },

    loadDataCurrentWallet: async function() {
        await this.currentWallet.blockchain.loadData(this.currentWallet);
    },

    exportCurrentWallet: async function() {
        // Get data from database
        let data = await this.currentWallet.getAllTransactions();
        // Convert data to transactions in trasnactions group
        let transactionsGroup = new TransactionGroup('database', data, this.currentWallet.blockchain.name);
        let dataToExport = transactionsGroup.dataToExport;
        if (this.currentWallet.blockchain.name === 'hive') {
            grapheneTools.convertVestsMomentsToLiquid(this.currentWallet.blockchain.name, dataToExport, 'HIVEVESTS');
        } else if (this.currentWallet.blockchain.name === 'steem') {
            grapheneTools.convertVestsMomentsToLiquid(this.currentWallet.blockchain.name, dataToExport, 'STEEMVESTS');
        }

        let coins = this.currentWallet.blockchain.coins.map(x => x.coin);
        let exportHeaders = Transaction.prototype.nonCoinHeadersToExport.concat(coins);
        // Create export helper using data in export format
        let exportHelper = new ExportHelper(dataToExport, exportHeaders, this.currentWallet.blockchain.name + '_' + this.currentWallet.address);
        await exportHelper.exportData();
    },

    includeWalletInStacks: async function() {
        // Include wallet in stacks
        if (this.currentWallet.summaryRange.includeInStacks === true) {
            // Change and store summary range
            await this.currentWallet.updateIncludeInStacks(false);
            // Update wallets table
            wallets.updateWalletsTable();
        // Exclude wallet from stacks
        } else {
            // Change and store summary range
            await this.currentWallet.updateIncludeInStacks(true);
            // Update wallets table
            wallets.updateWalletsTable();
        }
    },
}



// Class for each wallet (defined by blockchain / address combination)
class Wallet {
    // Initialisation
    constructor(blockchain, address) {
        this.blockchain = blockchain; // Blockchain class
        this.address = address;
        this.fullRanges = {};
        this.loadedRanges = {};
        this.loadedRangesCount = {};
        this.unloadedRanges = {};
        this.unloadedRangesCount = {};
        this.processStatus = false;
        // this.addressNumber;
        // this.summaryRange;
    }

    // Update process status in wallet (and paired wallet - since loading from one wallet can affect the pair)
    updateProcessStatus(blockchainNames, status) {
        for (const blockchainName of blockchainNames) {
            if (blockchainName === this.blockchain.name) {
                this.processStatus = status;
            } else {
                let pairedWallet = this.findPairedWallet(blockchainName);
                pairedWallet.processStatus = status;
            }
        }
    }

    // Fetch first and last transactions from API, get loaded / unloaded ranges from database
    async fetchgetWalletData(scope) {
        // Get wallet data from database
        await this.getWalletRangesFromDatabase();
        // Create range holders
        this.checkCreateRangeHolders();
        // Update the full summary range from the blockchain and store in database
        await this.fetchAndStoreFullRange(scope);
        // Calculate all unloaded ranges
        await this.calculateUnloadedRanges();
        // Calculate counts for loaded / unloaded ranges
        this.calculateRangesCounts();
        this.calculateTransactionStats();
    }

    // Get loaded ranges from database, calculate unloaded ranges and counts (used to generate wallet on site load)
    async getWalletData() {
        // Get wallet data from database
        await this.getWalletRangesFromDatabase();
        // Create range holders
        this.checkCreateRangeHolders();
        // Calculate all unloaded ranges
        await this.calculateUnloadedRanges();
        // Calculate counts for loaded / unloaded ranges
        this.calculateRangesCounts();
        this.calculateTransactionStats();
    }

    // Fetch but not get (used to update wallet info from API)
    async fetchWalletData(scope) {
        // Update the full summary range from the blockchain and store in database
        await this.fetchAndStoreFullRange(scope);
        // Calculate all unloaded ranges
        await this.calculateUnloadedRanges();
        // Calculate counts for loaded / unloaded ranges
        this.calculateRangesCounts();
        this.calculateTransactionStats();
    }


    async getWalletRangesFromDatabase() {
        // Get range data from database
        let rawRanges = await databases.heyStack.getAllElementsOfIndexType(this.blockchain.transactionsRangeStore, 'address', this.address);
        // Set summary range details (by filter of raw ranges)
        this.setSummaryRange(rawRanges);
        // Set full ranges (by filter of raw ranges)
        this.setFullRanges(rawRanges);
        // Set previously loaded ranges (by filter of raw ranges)
        this.setLoadedRanges(rawRanges);
    }

    // Set summary range details
    setSummaryRange(rawRanges) {
        // Save summary range
        this.summaryRange = rawRanges.find(x => x.summary === 'details');
    }

    // Set full ranges
    setFullRanges(rawRanges) {
        let fullRanges = rawRanges.filter(x => x.summary === 'full');
        for (let range of fullRanges) {
            this.fullRanges[range.transactionsCurrency] = {id: range.id, firstTransaction: range.firstTransaction, lastTransaction: range.lastTransaction};
        }
    }

    // Set loaded range transactions for wallet from database
    // - separate by currency and sort by number
    setLoadedRanges(rawRanges) {
        this.loadedRanges = {};
        // Sort and save loaded ranges
        let loadedRanges = rawRanges.filter(x => x.summary === 'loaded');
        for (const range of loadedRanges) {
            if (this.loadedRanges.hasOwnProperty(range.transactionsCurrency)) {
                this.loadedRanges[range.transactionsCurrency].push(range);
            } else {
                this.loadedRanges[range.transactionsCurrency] = [range];
            }
        }

        for (const transactionsCurrency in this.loadedRanges) {
            if (this.loadedRanges[transactionsCurrency].length > 0) {
                this.loadedRanges[transactionsCurrency].sort((a, b) => a.firstTransaction.number - b.firstTransaction.number);
                //this.loadedRanges[transactionsCurrency] = this.loadedRanges[transactionsCurrency].map(x => [x.firstTransaction.number, x.lastTransaction.number]);
                this.loadedRanges[transactionsCurrency] = this.loadedRanges[transactionsCurrency].map(x => ({firstTransaction: x.firstTransaction, lastTransaction: x.lastTransaction, id: x.id}));
            }
        }
    }

    // Calculate range counts from loaded / unloaded ranges
    calculateRangesCounts() {
        // Calculate loaded and unloaded ranges count
        for (const transactionsCurrency in this.fullRanges) {
            this.loadedRangesCount[transactionsCurrency] = this.countTransactionsInRanges(this.loadedRanges[transactionsCurrency]);
            this.unloadedRangesCount[transactionsCurrency] = this.countTransactionsInRanges(this.unloadedRanges[transactionsCurrency]);
        }
    }

    // Calculate native / prior transaction stats
    calculateTransactionStats() {
        this.nativeTransactions = this.calculateNativeTransactions();
        this.nativeTransactionsToLoad = this.nativeTransactions - this.calculateNativeTransactionsLoaded();
        this.priorTransactions = this.calculatePriorTransactions();
        this.priorTransactionsToLoad = this.priorTransactions - this.calculatePriorTransactionsLoaded();
    }


    // Split full range between blockchains - represents split of transactions between paired wallets
    async splitFullRange(transactionsCurrency, storageInfo, currentStorage) {
        let priorFind = Object.values(storageInfo).find(x => x.storageNumber === storageInfo[transactionsCurrency].storageNumber + 1);

        let priorCurrency = currentStorage.name;
        let priorFirst = currentStorage.earliestRangeTransaction;
        if (priorFind !== undefined) {
            priorCurrency = priorFind.name;
            priorFirst = priorFind.firstTransaction;
        }

        let transactionsCurrencyValues = storageInfo[transactionsCurrency];
        let fullRangePrior = this.createInclusiveTransactionRange('full', this.fullRanges[priorCurrency].id, priorCurrency, priorFirst, this.fullRanges[priorCurrency].lastTransaction);
        let fullRangeNew = this.createInclusiveTransactionRange('full', this.createFullRangeId(transactionsCurrency), transactionsCurrency, this.fullRanges[priorCurrency].firstTransaction, transactionsCurrencyValues.lastTransaction);
        await this.storeInTransactionsRangeStore([fullRangeNew, fullRangePrior]);
        return {new: fullRangeNew, prior: fullRangePrior};
    }

    // Calculate join date
    get joinDate() {
        let dateResult = false;
        for (let transactionsCurrency in this.fullRanges) {
            if (this.fullRanges[transactionsCurrency].firstTransaction.hasOwnProperty('date')) {
                if (dateResult === false) {
                    dateResult = this.fullRanges[transactionsCurrency].firstTransaction.date;
                } else {
                    let potentialDate = this.fullRanges[transactionsCurrency].firstTransaction.date;
                    if (potentialDate < dateResult) {
                        dateResult = potentialDate;
                    }
                }
            }
        }
        return dateResult;
    }

    // Calculate last transaction date
    get lastTransactionDate() {
        let dateResult = false;
        for (let transactionsCurrency in this.fullRanges) {
            if (this.fullRanges[transactionsCurrency].lastTransaction.hasOwnProperty('date')) {
                if (dateResult === false) {
                    dateResult = this.fullRanges[transactionsCurrency].lastTransaction.date;
                } else {
                    let potentialDate = this.fullRanges[transactionsCurrency].lastTransaction.date;
                    if (potentialDate > dateResult) {
                        dateResult = potentialDate;
                    }
                }
            }
        }
        return dateResult;
    }

    calculateNativeTransactions() {
        let transactionsCurrency = this.blockchain.name;
        return this.fullRanges[transactionsCurrency].lastTransaction.number - this.fullRanges[transactionsCurrency].firstTransaction.number + 1;
    }

    calculatePriorTransactions() {
        let count = 0;
        for (let transactionsCurrency in this.fullRanges) {
            if (transactionsCurrency !== this.blockchain.name) {
                count += this.fullRanges[transactionsCurrency].lastTransaction.number - this.fullRanges[transactionsCurrency].firstTransaction.number + 1;
            }
        }
        return count;
    }

    calculateNativeTransactionsLoaded() {
        let transactionsCurrency = this.blockchain.name;
        return this.loadedRangesCount[transactionsCurrency];
    }

    calculatePriorTransactionsLoaded() {
        let count = 0;
        for (let transactionsCurrency in this.fullRanges) {
            if (transactionsCurrency !== this.blockchain.name) {
                count += this.loadedRangesCount[transactionsCurrency];
            }
        }
        return count;
    }

    // Create summary range including address number (for new wallet)
    async createSummaryRange(showStatus) {
        // For new wallet create new addressNumber
        let addressNumber = await this.createAddressNumber();
        this.summaryRange = {
            address: this.address,
            addressNumber: addressNumber,
            summary: 'details',
            showStatus: showStatus,
            includeInStacks: false,
            airdropsProcessed: false,
            pairs: {},
            id: addressNumber + '_' + 'details'
        }
    }

    // Paired are wallets with same name on different blockchains
    async generateAndStoreWalletPairs() {
        let pairedWallets = this.findPairedWallets();
        for (const pairedWallet of pairedWallets) {
            await this.addAndStoreWalletPair(pairedWallet);
            await pairedWallet.addAndStoreWalletPair(this);
        }
    }

    // Check wallets for Hive/Steem pairs (for use in streamlining data loading)
    findPairedWallets() {
        let pairedWallets = wallets.findWalletsWithSameAddress(this.address);
        return pairedWallets.filter(x => x.blockchain.name !== this.blockchain.name);
    }

    findPairedWallet(blockchainName) {
        let pairedWallets = wallets.findWalletsWithSameAddress(this.address);
        return pairedWallets.filter(x => x.blockchain.name === blockchainName);
    }

    async addAndStoreWalletPair(pairedWallet) {
        this.summaryRange.pairs[pairedWallet.blockchain.name] = pairedWallet.summaryRange.addressNumber;
        await this.storeInTransactionsRangeStore([this.summaryRange]);
    }

    createInclusiveTransactionRange(summary, id, transactionsCurrency, firstTransaction, lastTransaction) {
        let inclusiveTransactionRange = {
            address: this.address,
            summary: summary,
            transactionsCurrency: transactionsCurrency,
            firstTransaction: firstTransaction,
            lastTransaction: lastTransaction,
        };
        if (id !== false) {
            inclusiveTransactionRange.id = id;
        }
        return inclusiveTransactionRange;
    }

    // Use address number from paired wallet if exists
    async createAddressNumber() {
        let pairedWallets = this.findPairedWallets();
        if (pairedWallets.length > 0) {
            return pairedWallets[0].summaryRange.addressNumber;
        } else {
            return await this.createNewAddressNumber();
        }
    }

    // Create new addressNumber as maximum + 1 of existing addressNumbers for blockchain
    async createNewAddressNumber() {
        let addressNumbersIndex = await wallets.getAllAddressNumbersForBlockchains();
        if (addressNumbersIndex.length === 0) {
            return 0;
        } else {
            return Math.max(...addressNumbersIndex) + 1;
        }
    }

    // Fetch full range for wallet from API
    async fetchAndStoreFullRange(scope) {
        await this.fetchSetFirstTransaction(scope);
        await this.fetchSetLastTransaction(scope);
        this.fullRanges[this.blockchain.name].id = this.createFullRangeId(this.blockchain.name);
        let inclusiveTransactionRange = this.createInclusiveTransactionRange('full', this.fullRanges[this.blockchain.name].id, this.blockchain.name, this.fullRanges[this.blockchain.name].firstTransaction, this.fullRanges[this.blockchain.name].lastTransaction);
        await this.storeInTransactionsRangeStore([inclusiveTransactionRange]);
    }

    createFullRangeId(transactionsCurrency) {
        return this.summaryRange.addressNumber + '_' + 'full' + '_' + transactionsCurrency;
    }


    checkCreateRangeHolders() {
        // Check if FullRange holder exists for blockchain, otherwie create it
        this.checkCreateRangeHolderFor(this.fullRanges, this.blockchain.name);
        for (const transactionsCurrency in this.fullRanges) {
            this.checkCreateRangeHolderFor(this.loadedRanges, transactionsCurrency);
            this.checkCreateRangeHolderFor(this.unloadedRanges, transactionsCurrency);
        }
    }

    checkCreateRangeHolderFor(range, transactionsCurrency) {
        if (!range.hasOwnProperty(transactionsCurrency)) {
            range[transactionsCurrency] = [];
        }
    }

    // Fetch first transaction from address history transactions API - update full range
    async fetchSetFirstTransaction(scope) {
        if (scope !== 'last') {
            let transactionFull = await grapheneAPI.fetchAccountHistory(this.blockchain.name, this.address, 0, 1 + this.blockchain.parameters.transactionCountOffset, false, false);
            this.fullRanges[this.blockchain.name].firstTransaction = new Transaction(transactionFull.result[0], this.address, this.summaryRange.addressNumber, false, 'blockchain').dataForFullRange;
        }
    }

    // Fetch last transaction from address history transactions API - update full range
    async fetchSetLastTransaction(scope) {
        if (scope !== 'first') {
            // For Hive will find last financial transaction (according to pre-filter list) - for Steem finds last transaction as no pre-filter
            let transactionFull = await grapheneAPI.fetchAccountHistorySegment(this.blockchain.name, this.address, -1, 1 + this.blockchain.parameters.transactionCountOffset);
            if (transactionFull.result.length > 0) {
                this.fullRanges[this.blockchain.name].lastTransaction = new Transaction(transactionFull.result[0], this.address, this.summaryRange.addressNumber, false, 'blockchain').dataForFullRange;
            } else {
                // If no financial transaction for Hive (will search 2000 transactions back) then simply take last transaction
                transactionFull = await grapheneAPI.fetchAccountHistory(this.blockchain.name, this.address, -1, 1 + this.blockchain.parameters.transactionCountOffset, false, false);
                this.fullRanges[this.blockchain.name].lastTransaction =  new Transaction(transactionFull.result[0], this.address, this.summaryRange.addressNumber, false, 'blockchain').dataForFullRange;
                // Id set to false otherwise causes validation issues when full segment loaded (since this transaction won't appear in full pre-filtered segment)
                this.fullRanges[this.blockchain.name].lastTransaction.id = false;
            }
        }
    }

    async storeInTransactionsRangeStore(rangeArray) {
        await databases.heyStack.putData(rangeArray, this.blockchain.transactionsRangeStore);
    }

    // Calculate unloaded ranges
    async calculateUnloadedRanges() {
        this.unloadedRanges = {}
        for (const transactionsCurrency in this.fullRanges) {
            await this.calculateUnloadedRangesFor(transactionsCurrency);
        }
    }

    async calculateUnloadedRangesFor(transactionsCurrency) {
        if (this.loadedRanges.hasOwnProperty(transactionsCurrency)) {
            let unloadedRanges = [];
            if (this.loadedRanges[transactionsCurrency].length > 0) {
                let lowerEnd = this.fullRanges[transactionsCurrency].firstTransaction;
                // Add an unloaded range prior to each loaded range
                for (let [i, range] of this.loadedRanges[transactionsCurrency].entries()) {
                    if (i === 0) {
                        if (lowerEnd.number < range.firstTransaction.number) {
                            unloadedRanges.push({firstTransaction: lowerEnd, lastTransaction: range.firstTransaction, type: 'pre'});
                        }
                    } else {
                        if (lowerEnd.number + 1 < range.firstTransaction.number) {
                            unloadedRanges.push({firstTransaction: lowerEnd, lastTransaction: range.firstTransaction, type: 'intermediate'});
                        }
                    }
                    lowerEnd = range.lastTransaction;
                }
                // Add last unloaded range after last loaded range
                let lastLoadedRange = this.loadedRanges[transactionsCurrency][this.loadedRanges[transactionsCurrency].length-1];
                if (lastLoadedRange.lastTransaction.number < this.fullRanges[transactionsCurrency].lastTransaction.number) {
                    unloadedRanges.push({firstTransaction: lastLoadedRange.lastTransaction, lastTransaction: this.fullRanges[transactionsCurrency].lastTransaction, type: 'post'});
                }
            } else {
                //unloadedRanges = [[this.fullRanges[transactionsCurrency].firstTransaction.number, this.fullRanges[transactionsCurrency].lastTransaction.number]];
                unloadedRanges = [{firstTransaction: this.fullRanges[transactionsCurrency].firstTransaction, lastTransaction: this.fullRanges[transactionsCurrency].lastTransaction, type: 'full'}];
            }
            this.unloadedRanges[transactionsCurrency] = unloadedRanges;
        }
    }

    // Count transactions in a set of ranges
    countTransactionsInRanges(ranges) {
        if (ranges.length === 0) {
            return 0;
        } else {
            let count = 1;
            for (let range of ranges) {
                if (range.hasOwnProperty('lastTransaction') && range.hasOwnProperty('firstTransaction')) {
                    count += (range.lastTransaction.number - range.firstTransaction.number);
                } else {
                    console.log(range)
                    return 0;
                }
            }
            return count;
        }
    }

    // Temporary adjust to wallet count data  - for use while data loading and database busy
    rangesCountAdjust(transactionsCurrency, loadedAmount) {
        if (transactionsCurrency === this.blockchain.name) {
            this.nativeTransactionsToLoad -= loadedAmount;
        } else {
            this.priorTransactionsToLoad -= loadedAmount;
        }
    }

    // Process include in stacks
    async updateIncludeInStacks(include) {
        // Change includeInStacks and store
        this.summaryRange.includeInStacks = include;
        if (include === true) {
            this.updateProcessStatus([this.blockchain.name], 'included');
        } else {
            this.updateProcessStatus([this.blockchain.name], 'excluded');
        }
        await this.storeInTransactionsRangeStore([this.summaryRange]);
    }

    // Get all transactions data for type from database
    async getAllTransactions() {
        let rawRanges = await databases.heyStack.getAllElementsOfIndexType(this.blockchain.walletStore, 'addressNumber', this.summaryRange.addressNumber);
        return rawRanges;
    }

    // Get transactions data for type from database
    async getTransactions(type) {
        let rawRanges = await databases.heyStack.getAllElementsOfIndexType(this.blockchain.walletStore, 'addressNumberType', [this.summaryRange.addressNumber, type]);
        return rawRanges;
    }

    // Get data from database for array of transactions
    async getTransactionsIncludes(transactionTypes) {
        let rawRanges = await this.getAllTransactions();
        let filteredTransactions = rawRanges.filter(x => transactionTypes.includes(x.type));
        return filteredTransactions;
    }

    async getAllTransactionsForPairedWallet(transactionsCurrency) {
        let walletStore = blockchains.data[transactionsCurrency].walletStore;
        let rawRanges = await databases.heyStack.getAllElementsOfIndexType(walletStore, 'addressNumber', this.summaryRange.pairs[transactionsCurrency]);
        return rawRanges;
    }

    // Create stacks for each coin in wallet with roll up of all transactions into account balance
    async createBalanceStacks() {
        let coinsToInclude = this.blockchain.coins.map(x => x.coin);
        return await this.createBalanceStacksForCoins(coinsToInclude, true);
    }

    async createBalanceStacksForCoins(coinsToInclude, convertVests) {
        // Obtain all raw data
        let rawData = await this.getAllTransactions();
        // Format data into transactions
        let transactionsGroup = new TransactionGroup('database', rawData, this.blockchain.name);
        // Create stacks from transactions
        let transactionsStackCollection = transactionsGroup.createStackCollectionFromTransactions(coinsToInclude, this.blockchain.name + '_' + this.summaryRange.addressNumber);
        // Convert vests to power
        if (convertVests === true) {
            // Convert staked stack from vests stack
            journey.createStakedStackFromVests(transactionsStackCollection);
        }
        return transactionsStackCollection;
    }

    // Process airdrop for wallet (roll up of all pre-airdrop transactions)
    async processAirdrop(airdrop) {
        let results = [];
        // Obtain all raw data
        let airdropDate = new Date(airdrop.date);
        let transactionsCurrency = airdrop.name;
        let rawData = await this.getAllTransactionsForPairedWallet(transactionsCurrency);
        let airdropTransactions = rawData.filter(x => x.date <= airdropDate);

        // Format data into Transactions of type for transactionsCurrency
        let transactionsGroup = new TransactionGroup('database', airdropTransactions, transactionsCurrency);

        for (const airdropCoin of airdrop.coins) {
            let newStack = transactionsGroup.createStackFromTransactions(transactionsGroup.transactions, airdropCoin.generatorCoin);
            if (newStack !== false) {
                let datum = {
                    id: 'manual' + '_' + this.summaryRange.addressNumber + '_' + airdrop.name + '_' + airdropCoin.producedCoin,
                    blockNumber: '',
                    transactionNumber: '',
                    virtualTransactionNumber: '',
                    subTransactionNumber: '',
                    date: airdropDate,
                    rewarded: {},
                    claimed: {},
                    from: '',
                    to: '',
                    memo: '',
                    type: 'airdrop',
                    addressNumber: this.summaryRange.addressNumber,
                    numberOfTransactions: 1,
                    historyId: ''
                }
                datum.claimed[airdropCoin.producedCoin] = newStack.total;
                results.push(new Transaction(datum, false, false, false, 'database'));
            }
        }
        return results;
    }

    // NOT USED
    // Find the number of the latest block present in loadedRanges - relies on loadedRanges being sorted
    latestBlockLoaded(transactionsCurrency) {
        if (this.loadedRanges.hasOwnProperty(transactionsCurrency)) {
            for (let i=this.loadedRanges[transactionsCurrency].length; i>0; i-=1) {
                if (this.loadedRanges[transactionsCurrency][i-1].lastTransaction.id !== false) {
                    return new Transaction({id: this.loadedRanges[transactionsCurrency][i-1].lastTransaction.id}, this.address, this.summaryRange.addressNumber, false, 'database').idBreakdown.blockNumber;
                } else if (this.loadedRanges[transactionsCurrency][i-1].firstTransaction.id !== false) {
                    return new Transaction({id: this.loadedRanges[transactionsCurrency][i-1].firstTransaction.id}, this.address, this.summaryRange.addressNumber, false, 'database').idBreakdown.blockNumber;
                }
            }
        }
        return false;
    }

    // Find the id of the latest transaction present in loadedRanges
    latestTransactionIdLoaded(transactionsCurrency) {
        if (this.loadedRanges.hasOwnProperty(transactionsCurrency)) {
            for (let i=this.loadedRanges[transactionsCurrency].length; i>0; i-=1) {
                if (this.loadedRanges[transactionsCurrency][i-1].lastTransaction.id !== false) {
                    return this.loadedRanges[transactionsCurrency][i-1].lastTransaction.id;
                } else if (this.loadedRanges[transactionsCurrency][i-1].firstTransaction.id !== false) {
                    return this.loadedRanges[transactionsCurrency][i-1].firstTransaction.id;
                }
            }
        }
        return false;
    }

    // Check all data has been loaded for a wallet
    hasAllDataLoaded(transactionsCurrency) {
        if (this.fullRanges.hasOwnProperty(transactionsCurrency)) {
            if (this.unloadedRanges[transactionsCurrency].length === 0) {
                return true;
            }
        }
        return false;
    }
}
