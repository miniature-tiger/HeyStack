// BLOCKCHAIN DATA AND CLASS
// -------------------------

// Blockchain data
let blockchains = {

    currentBlockchain: 'noSource',

    data: {
        hive: { name: 'hive',
                stores: {
                    walletStore: 'hive_wallet',
                    transactionsRangeStore: 'hive_transactionsRange',
                    vestsStore: 'hive_vests'
                },
                coins:
                    [ {coin: 'HIVE', label: 'HIVE'},
                      {coin: 'HBD', label: 'HBD'},
                      {coin: 'HIVEVESTS', label: 'HIVE POWER'}
                    ],
                airdropsAndHardforks: [
                    {name: 'steem', date: '2020-03-20T14:00:00.000Z', coins: [
                        {generatorCoin: 'STEEM', producedCoin: 'HIVE'},
                        {generatorCoin: 'SBD', producedCoin: 'HBD'},
                        {generatorCoin: 'STEEMVESTS', producedCoin: 'HIVEVESTS'}
                    ]}
                ],
                parameters: {
                    transactionCountOffset: 0,
                    vestPricesData: []
                }
        },
        steem: {name: 'steem',
                stores: {
                    walletStore: 'steem_wallet',
                    transactionsRangeStore: 'steem_transactionsRange',
                    vestsStore: 'steem_vests'
                },
                coins:
                    [ {coin: 'STEEM', label: 'STEEM'},
                      {coin: 'SBD', label: 'SBD'},
                      {coin: 'STEEMVESTS', label: 'STEEM POWER'}
                    ],
                airdropsAndHardforks: [],
                parameters: {
                    transactionCountOffset: -1,
                    vestPricesData: []
                }
        }
    }
}

// Blockchain class
class Blockchain {
    // Initialisation
    constructor(name, stores, coins, airdropsAndHardforks, parameters) {
        this.name = name;
        this.walletStore = stores.walletStore;
        this.transactionsRangeStore = stores.transactionsRangeStore;
        this.vestsStore = stores.vestsStore;
        this.coins = coins;
        this.airdropsAndHardforks = airdropsAndHardforks;
        this.parameters = parameters;
    }

    // Buttons appear when blockchain is selected
    buttonRanges = {
        inputControls: {box: 'c2', id: 'inputControls', type: 'simple', parentRange: false, visible: false, buttonSpecs:
            [
                {id: 'addressInput', type: 'input', target: this, className: 'dataIcon', text: '...wallet address', widthPerc: 100, heightToWidth: 24, buttonHandler: false, onParameters: false, offParameters: false, subHandler: false, label: 'INPUTS:'},
                {id: 'addWallet', type: 'simple', target: this, className: 'dataIcon', text: 'ADD WALLET', widthPerc: 100, heightToWidth: 18, buttonHandler: this.addWallet, onParameters: false, offParameters: false, subHandler: false, label: false},
            ]
        }
    }

    // List of aggregated transactions
    static transactionsToAggregate = [
        'curation_reward',
        'producer_reward'
    ];

    // Change buttons on selection of blockchain
    setup() {
        // Remove buttons and nodes for current wallet (no close function)
        if (wallets.currentWallet !== false) {
            wallets.page.boxes.c2.buttonRanges.walletControls.removeButtons();
        }
        // Add button range including button nodes (which are hidden)
        wallets.page.addButtonRanges([this.buttonRanges.inputControls]);
        // Show buttons (hidden class removed)
        wallets.page.boxes.c2.buttonRanges.inputControls.showButtons();
        // Shortcut to address input
        this.addressInput = wallets.page.boxes.c2.buttonRanges.inputControls.buttons.addressInput;
    }

    // Remove buttons on non-selection of blockchain
    close() {
        // Remove blockchain buttons and nodes - full reset
        wallets.page.boxes.c2.buttonRanges.inputControls.removeButtons();
    }

    // Validate the form of the address
    validateAddress() {
        // Remove white space from start and end
        let newAddress = this.addressInput.node.textContent.trim();
        // Remove initial @ sign if necessary
        const atStringNumber = newAddress.search("@");
        if (atStringNumber === 0) {
            newAddress = newAddress.substring(1);
        }
        return newAddress;
    }

    // Validate and create new wallet
    async addWallet() {
        // Validate and format address
        let newAddress = this.validateAddress();
        // Deactivate addressInput button
        this.addressInput.changeToDeactive();
        // Check if wallet already exists in list of wallets
        if (wallets.findWallet(this.name, newAddress) !== undefined) {
            communication.message('Address already included in database for this blockchain. Please try again.');
        } else {
            // Get financial data to check existence of account
            let walletFinancialData = await this.getWalletsFinancialData(this.name, [newAddress]);
            // Invalid address for blockchain
            if (walletFinancialData[newAddress].valid === false) {
                communication.message("Not a valid address on " + this.name + " blockchain. Please try again.");
            // Valid address
            } else {
                communication.message('Verified.<br> Generating new wallet info for ' + this.name + ' blockchain.');
                // Generate a new Wallet instance based on the new address
                // - saves in wallets and also stores the summaryRange in the database
                await wallets.generateNewWallet(this, newAddress, true);
                // Set current wallet to new wallet
                wallets.processWalletSelection(this.name, newAddress);
                // Update wallets table
                wallets.updateWalletsTable();
                wallets.scrollToBottomOfTable();
                communication.message('Verified.<br> Click on LOAD DATA to obtain transactions from ' + this.name + ' blockchain.');
            }
        }
    }

    // Fetch wallet data for array of addresses of blockchain
    // - Return array of objects with valid flag and result;
    async getWalletsFinancialData(blockchain, addresses) {
        let walletsData = await grapheneAPI.fetchAccounts(blockchain, addresses);
        let walletsDataResult = {};
        for (const address of addresses) {
            let index = walletsData.result.findIndex(entry => entry.name == address);
            if (index === -1) {
                walletsDataResult[address] = {valid: false, result: {}};
            } else {
                walletsDataResult[address] = {valid: true, result: walletsData.result[index]};
            }
        }
        return walletsDataResult;
    }

    // Load data for wallet
    async loadData(wallet) {
        // Update loaded / unloaded ranges for wallet
        await wallet.fetchgetWalletData('last');
        wallets.updateWalletsTable();
        // Detemine if load data should be restricted due to overlapping prior loaded data from another blockchain
        let latestIdToFetch = this.determineLatestIdToFetch(wallet);
        if (latestIdToFetch === 'load') {
            communication.message("Please complete loading of Hive data for wallet first. </i>");
        } else {
            communication.message("Wallet data loading for " + wallet.address + ".<br>Please wait.");
            // Load data in loop - different processes per blockchain
            let storageNames;
            if (wallet.blockchain.name === 'hive') {
                // Load data
                storageNames = await this.getAccountHistoryFullHive(wallet, 0, latestIdToFetch);
                // Process airdrops once all data loaded
                await this.checkProcessAirdrops(wallet);

                await this.processPendingTransactions(wallet);

                // Update process status in wallet (and paired wallet) for stacks update
                wallet.updateProcessStatus(storageNames, 'updated');
            } else {
                // Load data
                storageNames = await this.getAccountHistoryFullSteem(wallet, 0, latestIdToFetch);
                // Update process status in wallet (and paired wallet) for stacks update
                wallet.updateProcessStatus(storageNames, 'updated');
            }
        }
    }

    // Process temporary transactions
    async processPendingTransactions(wallet) {
        await this.processPendingConversions(wallet);
        //await this.processOpenOrders(wallet);
    }

    // Any ongoing Liquid -> Stable (HIVE -> HBD) transactions for the wallet are grouped and stored as into one temporary transaction
    async processPendingConversions(wallet) {
        let collateralizedConversions = await grapheneAPI.listCollateralizedConversionRequests(this.name, wallet.address);
        collateralizedConversions = collateralizedConversions.result.requests.filter(x => x.owner === wallet.address);
        if (collateralizedConversions.length > 0) {
            let totals = {collateral: 0, converted: 0};
            collateralizedConversions.forEach(x => {
                totals.converted += Number(x.converted_amount.amount);
            })
            totals.converted = Number((totals.converted/1000).toFixed(3));
            let groupedTransaction = this.createTemporaryCollateralizedConvertTransaction(totals.converted, wallet.summaryRange.addressNumber)
            // Put method updates the manual collateralizedConvert entry for the address number
            await this.storeManualTransactions([groupedTransaction], wallet.blockchain.name);
        } else {
            // Delete any existing temporary transaction once all ongoing conversions have completed
            await this.deleteTemporaryCollateralizedConvertTransaction(wallet.blockchain.name, wallet.summaryRange.addressNumber);
        }
    }

    // Create the temporary CollateralizedConvert transaction
    createTemporaryCollateralizedConvertTransaction(hbdAmount, addressNumber) {
        let datum = {
            id: 'temporary_collateralized_convert_' + addressNumber,
            addressNumber: addressNumber,
            type: 'collateralized_convert',
            date: new Date(),
            claimed: {HBD: hbdAmount}
        }
        return new HiveTransaction(datum, false, false, false, 'manual');
    }

    // Delete the temporary CollateralizedConvert transaction
    async deleteTemporaryCollateralizedConvertTransaction(blockchainName, addressNumber) {
        let walletStore = blockchains.data[blockchainName].walletStore;
        let key = 'temporary_collateralized_convert_' + addressNumber;
        await databases.heyStack.deleteElement(walletStore, key);
    }

    // Open orders - not currently used
    async processOpenOrders(wallet) {
        let orders = await grapheneAPI.fetchOpenOrders(this.name, wallet.address);
    }

    // Detemine if load data should be restricted due to overlapping prior loaded data from another blockchain
    determineLatestIdToFetch(wallet) {
        let latestIdToFetch = false;
        let priorWallet = this.checkForWalletWithPriorLoadedData(wallet);
        if (priorWallet !== false) {
            if (priorWallet.hasAllDataLoaded('steem')) {
                latestIdToFetch = priorWallet.latestTransactionIdLoaded('steem');
            } else {
                latestIdToFetch = 'load';
            }
        }
        return latestIdToFetch;
    }

    // For steem wallets check if data already loaded from paired hive wallet
    checkForWalletWithPriorLoadedData(wallet) {
        if (this.name === 'steem') {
            if (wallet.summaryRange.pairs.hasOwnProperty('hive')) {
                return wallets.findWallet('hive', wallet.address);
            }
        }
        return false;
    }

    // Loop to fetch and store account history transactions and associated ranges
    // - specific to Hive blockchain
    async getAccountHistoryFullHive(wallet, delayBetweenFetches, latestIdToFetch) {
        let maxTransactions = 1000 + wallet.blockchain.parameters.transactionCountOffset; // Maximum number of transactions is 1000 - need -1 adjustment for Steem
        let latestIdToFetchReached = false; // Stops loop when prior transactions loaded through other blockchain are reached
        let currentStorage = {name: wallet.blockchain.name, earliestRangeTransaction: false}; // Transactions stored in current storage
        let storageNames = new Set([wallet.blockchain.name]); // Set of all storages used
        // Loop for each unloaded range
        for (const transactionsCurrency in wallet.unloadedRanges) {
            // Loop for each unloaded range for blockchain
            for (let range of wallet.unloadedRanges[transactionsCurrency].reverse()) {
                let minTransactions = this.setMinTransactions(range.type); // Force at least a minimum number of transactions to be obtained (for situation where numbers misbehave)
                let expectedRangeComplete = false; // True when transactions to be fetched is less than maximum
                // Set load state
                let loadState = 'normal'; // Load state typically starts as normal
                if (range.lastTransaction.id === false) {
                    loadState = 'empty'; // Load state initially set to empty if fetch of latest transaction returns empty
                }
                let rangeEndsHit = {first: false, last: true}; // Allows adjustment of transaction range and removal of overlapping transactions
                let lastTransactionToObtain = range.lastTransaction; // Marker for end of segment
                // Loop until all data obtained, error arises, or prior data reached
                let rangeComplete = false;
                let errorInFetch = false;
                let validityOfLastTransactionInSegment = true;
                while (rangeComplete === false && errorInFetch === false && latestIdToFetchReached === false) {
                  // Transactions to obtain is inclusive (i.e. includes both first and last, so should be +1)
                  // - however Steem API obtains one more transaction than transactionsToObtain, so +1 removed with transactionCountOffset (corrected in Hive in HF24)
                    let transactionsRemainingInRange = lastTransactionToObtain.number - range.firstTransaction.number + 1 + wallet.blockchain.parameters.transactionCountOffset;
                    if (transactionsRemainingInRange <= maxTransactions) {
                        expectedRangeComplete = true;
                    }
                    let transactionsToObtain = Math.min(Math.max(Math.min(maxTransactions, transactionsRemainingInRange), minTransactions), lastTransactionToObtain.number + 1 + wallet.blockchain.parameters.transactionCountOffset);
                    let firstRequestedNumber = lastTransactionToObtain.number - transactionsToObtain + 1 + wallet.blockchain.parameters.transactionCountOffset;
                    // Fetch history segment
                    let historySegment = await grapheneAPI.fetchAccountHistorySegment(this.name, wallet.address, lastTransactionToObtain.number, transactionsToObtain);
                    // Error handling for fetch
                    if (historySegment.hasOwnProperty('error')) {
                        errorInFetch = true;
                    // Fetch OK
                    } else {
                        // Extract last and first transactions
                        let lastTransactionInSegment = true;
                        let firstTransactionInSegment;
                        if (loadState === 'normal') {
                            // Extract last and first transactions obtained - check validity of last against expected last transaction
                            lastTransactionInSegment = this.extractLastTransaction(historySegment.result, wallet.address, wallet.summaryRange.addressNumber, lastTransactionToObtain);
                            validityOfLastTransactionInSegment = this.checkValidLastTransaction(lastTransactionInSegment, lastTransactionToObtain);
                            firstTransactionInSegment = this.extractFirstTransaction(historySegment.result, wallet.address, wallet.summaryRange.addressNumber, 2, firstRequestedNumber);
                        } else if (loadState === 'empty') {
                            // Extract first transactions obtained - set last as expected last transaction (no other data available)
                            lastTransactionInSegment = lastTransactionToObtain;
                            firstTransactionInSegment = this.extractFirstTransaction(historySegment.result, wallet.address, wallet.summaryRange.addressNumber, 1, firstRequestedNumber);
                        }
                        // Break if last transaction check shows error
                        if (validityOfLastTransactionInSegment === false) {
                            communication.message("Issue with inconsistent account history numbers. Please try again later.");
                            let checkTrans = await grapheneAPI.fetchAccountHistory(this.name, wallet.address, lastTransactionToObtain.number, 1, false, false);
                            let checkSegment = await grapheneAPI.fetchAccountHistorySegment(this.name, wallet.address, lastTransactionToObtain.number+200, transactionsToObtain);
                            break;
                        }
                        // Check if range is completed by this segment
                        rangeComplete = this.checkRangeComplete(firstRequestedNumber, firstTransactionInSegment, range.firstTransaction, expectedRangeComplete);
                        if (rangeComplete === true) {
                            rangeEndsHit.first = true;
                        }
                        // Check if latest id to fetch (due to paired wallet loading) is reached by this segment
                        if (latestIdToFetch !== false) {
                            latestIdToFetchReached = this.checkIdReached(latestIdToFetch, firstTransactionInSegment.id);
                        }
                        // Broad filter of segment by block number
                        let filteredTransactions = this.broadFilterTransactions(historySegment.result, range.firstTransaction.id, range.lastTransaction.id);
                        // Create object of processed transactions for account history segment
                        let processedTransactions = this.processHistoryDataSegment(filteredTransactions, wallet.address, wallet.summaryRange.addressNumber);
                        // Complete filtering
                        let fineFilteredTransactions;
                        if (latestIdToFetchReached === false) {
                            fineFilteredTransactions = this.fineFilterTransactions(processedTransactions, range.firstTransaction.id, range.lastTransaction.id);
                        } else {
                            fineFilteredTransactions = this.fineFilterTransactions(processedTransactions, latestIdToFetch, range.lastTransaction.id);
                            fineFilteredTransactions = this.fineFilterOutSingleId(fineFilteredTransactions, latestIdToFetch);
                        }

                        // Process data if transactions to store
                        if (fineFilteredTransactions.length > 0) {
                            // Split transactions by blockchain storage
                            let storageInfo = this.splitTransactionsAndRangeByStorage(fineFilteredTransactions, rangeEndsHit, range, firstTransactionInSegment, lastTransactionInSegment, loadState);
                            //if (this.checkTransactionsInStorageInfo(storageInfo) === true) {
                                // Create new wallet if necessary
                                for (let storageName in storageInfo) {
                                    if (!storageNames.has(storageName)) {
                                        storageNames.add(storageName);
                                        if (wallets.findWallet(storageName, wallet.address) === undefined) {
                                            // Generate a new Wallet instance based on the new address - saves wallet in wallets and also stores the summaryRange in the database
                                            await wallets.generateNewWallet(blockchains.data[storageName], wallet.address, true);
                                            let splitResults = await wallet.splitFullRange(storageName, storageInfo, currentStorage);
                                            currentStorage.name = storageName;
                                            wallet.rangesCountAdjust(splitResults.prior.transactionsCurrency, splitResults.prior.firstTransaction.number);
                                            wallet.rangesCountAdjust(splitResults.new.transactionsCurrency, -splitResults.new.lastTransaction.number-1);
                                            wallets.updateWalletsTable();
                                        } else {
                                            console.log('ISSUE HERE')
                                        }
                                    }
                                }
                                // Aggregate transaction across day for frequent transaction types
                                for (let storageName in storageInfo) {
                                    storageInfo[storageName].transactions = this.aggregateHistoryDataSegment(storageInfo[storageName].transactions);
                                }
                                // Store transactions and transaction ranges in indexedDB
                                for (let storageName in storageInfo) {
                                    let inclusiveTransactionRange = wallet.createInclusiveTransactionRange('loaded', false, storageName, storageInfo[storageName].firstTransaction, storageInfo[storageName].lastTransaction);
                                    await this.storeTransactions(storageInfo[storageName].transactions, storageName, inclusiveTransactionRange, wallet.blockchain.name);
                                    wallet.rangesCountAdjust(storageName, inclusiveTransactionRange.lastTransaction.number - inclusiveTransactionRange.firstTransaction.number); //+ this.overlapCount(overlap));
                                }

                            //}
                        // Store range searched if no transactions to store
                        } else {
                            let emptyFirst = {number: firstRequestedNumber, id: false};
                            if (rangeComplete === true) {
                                emptyFirst = range.firstTransaction;
                            }
                            let inclusiveTransactionRange = wallet.createInclusiveTransactionRange('loaded', false, currentStorage.name, emptyFirst, lastTransactionToObtain);
                            await this.storeTransactions([], currentStorage.name, inclusiveTransactionRange, wallet.blockchain.name);
                            wallet.rangesCountAdjust(currentStorage.name, inclusiveTransactionRange.lastTransaction.number - inclusiveTransactionRange.firstTransaction.number); // + this.overlapCount(overlap));
                        }
                        // Add prior operations loaded range
                        if (latestIdToFetchReached === true) {
                            let inclusiveTransactionRange = wallet.createInclusiveTransactionRange('loaded', false, currentStorage.name, range.firstTransaction, firstTransactionObtained);
                            await this.storeTransactions([], currentStorage.name, inclusiveTransactionRange, wallet.blockchain.name);
                            wallet.rangesCountAdjust(currentStorage.name, inclusiveTransactionRange.lastTransaction.number - inclusiveTransactionRange.firstTransaction.number); // + this.overlapCount(overlap));
                        }
                        // Update wallets table
                        wallets.updateWalletsTable();
                        // Reset for next loop
                        if (rangeComplete === false) {
                            lastTransactionToObtain = firstTransactionInSegment;
                            currentStorage.earliestRangeTransaction = firstTransactionInSegment;
                            if (firstTransactionInSegment.id === false) {
                                loadState = 'empty';
                            } else {
                                loadState = 'normal';
                            }
                            rangeEndsHit.last = false;
                        }
                        // Delay
                        await logistics.delayInMs(delayBetweenFetches);
                    }
                }
                // After range loop ends
                if (errorInFetch === true) {
                    // Communicate error, update wallet, update wallets table
                    communication.message("Error in fetching account history data. Please check connection or wait and retry.");
                } else if (validityOfLastTransactionInSegment === true) {
                    // Communicate completion, update wallet, update wallets table
                    communication.message("Loading complete.");
                    await wallet.fetchgetWalletData('last');
                    wallets.updateWalletsTable();
                }
            }
        }
        return storageNames;
    }


    // Loop to fetch and store account history transactions and associated ranges
    // - specific to Steem blockchain
    async getAccountHistoryFullSteem(wallet, delayBetweenFetches, latestIdToFetch) {
        let maxTransactions = 1000 + wallet.blockchain.parameters.transactionCountOffset; // Maximum number of transactions is 1000 - need -1 adjustment for Steem
        let latestIdToFetchReached = false; // Stops loop when prior transactions loaded through other blockchain are reached
        // Loop for each blockchain in wallet
        for (const transactionsCurrency in wallet.unloadedRanges) {
            // Loop for each unloaded range for blockchain
            for (let range of wallet.unloadedRanges[transactionsCurrency].reverse()) {
                let minTransactions = this.setMinTransactions(range.type); // Force at least a minimum number of transactions to be obtained (for situation where numbers misbehave)
                let expectedRangeComplete = false; // True when transactions to be fetched is less than maximum
                let rangeEndsHit = {first: false, last: true}; // Allows removal of overlapping transactions
                let lastTransactionToObtain = range.lastTransaction; // Marker for end of segment
                // Loop until all data obtained, error arises, or prior data reached
                let rangeComplete = false;
                let errorInFetch = false;
                let validityOfLastTransactionInSegment = true;
                while (rangeComplete === false && errorInFetch === false && latestIdToFetchReached === false) {
                    // Transactions to obtaim is inclusive (i.e. includes both first and last, so should be +1)
                    // - however Steem API obtains one more transaction than transactionsToObtain, so +1 removed with transactionCountOffset (corrected in Hive in HF24)
                    let transactionsRemainingInRange = lastTransactionToObtain.number - range.firstTransaction.number + 1 + wallet.blockchain.parameters.transactionCountOffset;
                    if (transactionsRemainingInRange <= maxTransactions) {
                        expectedRangeComplete = true;
                    }
                    let transactionsToObtain = Math.min(Math.max(Math.min(maxTransactions, transactionsRemainingInRange), minTransactions), lastTransactionToObtain.number + 1 + wallet.blockchain.parameters.transactionCountOffset);
                    let firstRequestedNumber = lastTransactionToObtain.number - transactionsToObtain + 1 + wallet.blockchain.parameters.transactionCountOffset;
                    // Fetch history segment
                    let historySegment = await grapheneAPI.fetchAccountHistorySegment(this.name, wallet.address, lastTransactionToObtain.number, transactionsToObtain);
                    // Error handling for fetch
                    if (historySegment.hasOwnProperty('error')) {
                        errorInFetch = true;
                    // Fetch OK
                    } else {
                        // Extract last and first transactions obtained - check validity of last against expcted last transaction
                        let lastTransactionInSegment = this.extractLastTransaction(historySegment.result, wallet.address, wallet.summaryRange.addressNumber, lastTransactionToObtain);
                        validityOfLastTransactionInSegment = this.checkValidLastTransaction(lastTransactionInSegment, lastTransactionToObtain);
                        let firstTransactionInSegment = this.extractFirstTransaction(historySegment.result, wallet.address, wallet.summaryRange.addressNumber, 1, firstRequestedNumber);
                        // Break if last transaction check shows error
                        if (validityOfLastTransactionInSegment === false) {
                            communication.message("Issue with inconsistent account history numbers. Please try again later.");
                            break;
                        }
                        // Check if range is completed by this segment
                        rangeComplete = this.checkRangeComplete(firstRequestedNumber, firstTransactionInSegment, range.firstTransaction, expectedRangeComplete);
                        // Check if latest id to fetch (due to paired wallet loading) is reached by this segment
                        if (latestIdToFetch !== false) {
                            latestIdToFetchReached = this.checkIdReached(latestIdToFetch, firstTransactionInSegment.id);
                        }
                        // Broad filter of segment by block number
                        let filteredTransactions = this.broadFilterTransactions(historySegment.result, range.firstTransaction.id, range.lastTransaction.id);
                        // Create object of processed transactions for account history segment
                        let processedTransactions = this.processHistoryDataSegment(filteredTransactions, wallet.address, wallet.summaryRange.addressNumber);
                        // Complete filtering
                        let fineFilteredTransactions;
                        if (latestIdToFetchReached === false) {
                            fineFilteredTransactions = this.fineFilterTransactions(processedTransactions, range.firstTransaction.id, range.lastTransaction.id);
                        } else {
                            fineFilteredTransactions = this.fineFilterTransactions(processedTransactions, latestIdToFetch, range.lastTransaction.id);
                            fineFilteredTransactions = this.fineFilterOutSingleId(fineFilteredTransactions, latestIdToFetch);
                        }
                        // Adjust transaction range  if range complete (minimum number of transactions can result in over-fetch)
                        if (rangeComplete === true) {
                            firstTransactionInSegment = range.firstTransaction;
                            rangeEndsHit.first = true;
                        }

                        // Process data if transactions to store
                        if (fineFilteredTransactions.length > 0) {
                            // Remove overlapping transactions to prevent doubling
                            this.removeOverlapTransactionsSteem(fineFilteredTransactions, rangeEndsHit, range.type, range.firstTransaction, lastTransactionToObtain);
                            // Aggregate transaction across day for frequent transaction types
                            let aggregatedTransactions = this.aggregateHistoryDataSegment(fineFilteredTransactions);
                            // Store transactions and transaction ranges in indexedDB
                            let inclusiveTransactionRange = wallet.createInclusiveTransactionRange('loaded', false, wallet.blockchain.name, firstTransactionInSegment, lastTransactionInSegment);
                            await this.storeTransactions(aggregatedTransactions, wallet.blockchain.name, inclusiveTransactionRange, wallet.blockchain.name);
                            wallet.rangesCountAdjust(wallet.blockchain.name, inclusiveTransactionRange.lastTransaction.number - inclusiveTransactionRange.firstTransaction.number);
                        // Store range searched if no transactions to store
                        } else {
                            let inclusiveTransactionRange = wallet.createInclusiveTransactionRange('loaded', false, wallet.blockchain.name, firstTransactionInSegment, lastTransactionInSegment);
                            await this.storeTransactions([], wallet.blockchain.name, inclusiveTransactionRange, wallet.blockchain.name);
                            wallet.rangesCountAdjust(wallet.blockchain.name, inclusiveTransactionRange.lastTransaction.number - inclusiveTransactionRange.firstTransaction.number);
                        }
                        // Add prior operations loaded range
                        if (latestIdToFetchReached === true) {
                            let inclusiveTransactionRange = wallet.createInclusiveTransactionRange('loaded', false, wallet.blockchain.name, range.firstTransaction, firstTransactionInSegment);
                            await this.storeTransactions([], wallet.blockchain.name, inclusiveTransactionRange, wallet.blockchain.name);
                            wallet.rangesCountAdjust(wallet.blockchain.name, inclusiveTransactionRange.lastTransaction.number - inclusiveTransactionRange.firstTransaction.number);
                        }

                        // Update wallets table
                        wallets.updateWalletsTable();
                        // Reset for next loop
                        if (rangeComplete === false) {
                            lastTransactionToObtain = firstTransactionInSegment;
                            rangeEndsHit.last = false;
                        }
                        // Delay
                        await logistics.delayInMs(delayBetweenFetches);
                    }
                }
                // After range loop ends
                if (errorInFetch === true) {
                    // Communicate error, update wallet, update wallets table
                    communication.message("Error in fetching account history data. Please check connection or wait and retry.");
                } else if (validityOfLastTransactionInSegment === true) {
                    // Communicate completion, update wallet, update wallets table
                    communication.message("Loading complete.");
                    await wallet.fetchgetWalletData('last');
                    wallets.updateWalletsTable();
                }
            }
        }
        return [wallet.blockchain.name];
    }

    // Minimum transactions to be obtained (100 if first transaction of range is not at 0 - otherwise 1)
    setMinTransactions(type) {
        if (type === 'intermediate' || type === 'post') {
            return 100;
        } else { // (type === 'pre' || type === 'full')
            return 1;
        }
    }

    // Currently not used
    overlapCount(overlap) {
        let result = 1;
        if (overlap.last === true) {
            result-=1;
        }
        if (overlap.first === true) {
            result-=1;
        }
        return result;
    }

    // Extract first transaction from segment fetched
    extractFirstTransaction(historySegmentResult, address, addressNumber, minimumNumber, firstRequestedNumber) {
        if (historySegmentResult.length >= minimumNumber) {
            return new Transaction(historySegmentResult[0], address, addressNumber, false, 'blockchain').dataForRange;;
        } else {
            // Default if no first transaction
            return {number: firstRequestedNumber, id: false};
        }
    }

    // Extract last transaction from segment fetched
    extractLastTransaction(historySegmentResult, address, addressNumber, lastTransactionToObtain) {
        if (historySegmentResult.length > 0) {
            return new Transaction(historySegmentResult[historySegmentResult.length-1], address, addressNumber, false, 'blockchain').dataForRange;;
        } else {
            // Default if no last transaction
            return {number: lastTransactionToObtain.number, id: false};
        }
    }

    // Check last transaction is equal to expected last transaction
    // - if not suggests that account numbers are misbehaving
    checkValidLastTransaction(lastTransactionInSegment, lastTransactionToObtain) {
        if (lastTransactionToObtain.id === false || lastTransactionInSegment.id === false) {
            return 'noCheck';
        } else {
            let check = Transaction.prototype.transactionFromId(lastTransactionInSegment.id).checkEarlierLaterEqualThanId(lastTransactionToObtain.id);
            //if (check === 'equal' || check === 'later') {
            if (check === 'equal') {
                return true;
            } else {
                return false;
            }
        }
    }

    // Check if idObtained is equal or earlier than idToReach
    checkIdReached(idToReach, idObtained) {
        if (idObtained !== false) {
            let idToReachTransaction = Transaction.prototype.transactionFromId(idToReach);
            let earlierLaterEqual = idToReachTransaction.checkEarlierLaterEqualThanId(idObtained);
            if (earlierLaterEqual === 'equal' || earlierLaterEqual === 'later') {
                return true;
            }
        }
        return false;
    }

    // Check if range loop complete
    checkRangeComplete(firstRequestedNumber, firstTransactionObtained, rangeFirstTransaction, expectedRangeComplete) {
        // If the first requested number is 0 then the range is complete
        if (firstRequestedNumber === 0) {
            return true;
        } else {
            // Check that first transaction id in range has been reached
            if (rangeFirstTransaction.id !== false) {
                return this.checkIdReached(rangeFirstTransaction.id, firstTransactionObtained.id);
            // First transaction id in range cannot be checked - so use expectation based on numbers
            } else {
                return expectedRangeComplete;
            }
        }
    }

    // Separate transactions and ranges between blockchains
    splitTransactionsAndRangeByStorage(processedTransactions, rangeEndsHit, range, firstTransactionInSegment, lastTransactionInSegment, loadState) {
        // Allocation transactions into arrays by storage (storage is a key in each transaction)
        let storageInfo = this.splitTransactionsByStorage(processedTransactions);
        // Create ranges for each storage based on transactions obtained
        this.createRangesForSplitStorage(storageInfo, firstTransactionInSegment, lastTransactionInSegment);

        // Use range transactions rather than segment transactions if range ends hit
        this.implantRangeTransactions(storageInfo, rangeEndsHit, range);
        // Remove overlapping transactions
        this.removeOverlapTransactions(storageInfo, loadState, rangeEndsHit, range.type);

        return storageInfo;
    }

    // Allocation transactions into arrays by storage (storage is a key in each transaction)
    splitTransactionsByStorage(processedTransactions) {
        let storageInfo = {};
        let storageNumber = 0;
        for (const processedTransaction of processedTransactions) {
            if (storageInfo.hasOwnProperty(processedTransaction.storage)) {
                storageInfo[processedTransaction.storage].transactions.push(processedTransaction);
            } else {
                storageInfo[processedTransaction.storage] = {transactions: [processedTransaction], storageNumber: storageNumber, name: processedTransaction.storage};
                storageNumber+=1; // next storage found will have this number
            }
        }
        return storageInfo;
    }

    // Create ranges for each storage based on transactions obtained
    createRangesForSplitStorage(storageInfo, firstTransactionInSegment, lastTransactionInSegment) {
        let earliestStorage = this.findEarliestStorage(storageInfo);
        let lastStorage = this.findLastStorage(storageInfo);

        for (const storage in storageInfo) {
            let storageObject = storageInfo[storage];

            if (storage === earliestStorage) {
                storageObject.firstTransaction = firstTransactionInSegment;
            } else {
                storageObject.firstTransaction = storageObject.transactions[0].dataForRange;
            }

            if (storage === lastStorage) {
                storageObject.lastTransaction = lastTransactionInSegment;
            } else {
                storageObject.lastTransaction = storageObject.transactions[storageObject.transactions.length-1].dataForRange;
            }
        }
    }

    // Find blockchain storage 0
    findEarliestStorage(storageInfo) {
        for (let storageName in storageInfo) {
            if (storageInfo[storageName].storageNumber === 0) {
                return storageName;
            }
        }
    }

    // Find blockchain storage with count max
    findLastStorage(storageInfo) {
        let countMaxStorageNumber = -1;
        let countMaxStorageName;
        for (let storageName in storageInfo) {
            if (storageInfo[storageName].storageNumber > countMaxStorageNumber) {
                countMaxStorageNumber = storageInfo[storageName].storageNumber;
                countMaxStorageName = storageName;
            }
        }
        return countMaxStorageName;
    }

    // Use range transactions rather than segment transactions if range ends hit
    implantRangeTransactions(storageInfo, rangeEndsHit, range) {
        if (rangeEndsHit.last === true) {
            let storage = this.findLastStorage(storageInfo);
            storageInfo[storage].lastTransaction = {number: range.lastTransaction.number, id: range.lastTransaction.id};
        }

        if (rangeEndsHit.first === true) {
            let storage = this.findEarliestStorage(storageInfo);
            storageInfo[storage].firstTransaction = {number: range.firstTransaction.number, id: range.firstTransaction.id};
        }
    }

    // Hive
    // Always want to remove last transaction
    // Unless it's the first fetch in a range: rangeEndsHit.last = true and type = post or full
    // Or the first in a new wallet - but this is never first in a segment
    // Or 'empty'

    // Never want to remove the first transaction
    // Unless rangeEndsHit.first = true and 'type' = post / intermediate

    // Steem
    // Always want to remove last transaction
    // Unless it's the first fetch in a range: rangeEndsHit.last = true and type = post or full
    // No such thing as empty

    // Never want to remove the first transaction
    // Unless rangeEndsHit.first = true and 'type' = post / intermediate


    removeOverlapTransactionsSteem(transactions, rangeEndsHit, rangeType, rangeFirstTransaction, lastTransactionToObtain) {

        // Always want to remove last transaction - unless previous fetch was empty or first fetch of post/full type
        if (rangeEndsHit.last === true && (rangeType === 'post' || rangeType === 'full')) {
            // Do nothing
        } else {
            transactions = this.fineFilterOutSingleId(transactions, lastTransactionToObtain.id);
        }

        // Never want to remove the first transaction - unless last fetch of post/intermediate type
        if (rangeEndsHit.first = true && (rangeType === 'post' || rangeType === 'intermediate')) {
            transactions = this.fineFilterOutSingleId(transactions, rangeFirstTransaction.id);
        }
    }

    removeOverlapTransactions(storageInfo, loadState, rangeEndsHit, rangeType) {
        // Always want to remove last transaction - unless previous fetch was empty or first fetch of post/full type
        if (loadState === 'empty' || (rangeEndsHit.last === true && (rangeType === 'post' || rangeType === 'full'))) {
            // Do nothing
        } else {
            this.removeLastOverlapTransaction(storageInfo);
        }

        // Never want to remove the first transaction - unless last fetch of post/intermediate type
        if (rangeEndsHit.first = true && (rangeType === 'post' || rangeType === 'intermediate')) {
            this.removeFirstOverlapTransaction(storageInfo);
        }
    }

    removeFirstOverlapTransaction(storageInfo) {
        let storage = this.findEarliestStorage(storageInfo);
        storageInfo[storage].transactions.shift();
    }

    removeLastOverlapTransaction(storageInfo) {
        let storage = this.findLastStorage(storageInfo);
        storageInfo[storage].transactions.pop();
    }

    // Check there are some transactions in storage to store
    checkTransactionsInStorageInfo(storageInfo) {
        for (let storageName in storageInfo) {
            if (storageInfo[storageName].transactions.length > 0) {
                return true;
            }
        }
        return false;
    }

    // Store transactions and transaction ranges in indexedDB
    storeTransactions(transactions, transactionsStorageName, inclusiveTransactionRange, rangeStorageName) {
        // Determine blockchain stores from storageName
        let walletStore = blockchains.data[transactionsStorageName].walletStore;
        let transactionsRangeStore = blockchains.data[rangeStorageName].transactionsRangeStore;
        let transactionDataToStore = transactions.map(x => x.dataToStore);
        databases.heyStack.addTransactionsAndRange(transactionDataToStore, walletStore, inclusiveTransactionRange, transactionsRangeStore);
    }

    async storeManualTransactions(transactions, transactionsStorageName) {
        // Determine blockchain store from storageName
        let walletStore = blockchains.data[transactionsStorageName].walletStore;
        let transactionDataToStore = transactions.map(x => x.dataToStore);
        await databases.heyStack.putData(transactionDataToStore, walletStore);
    }

    // Process airdrops
    async checkProcessAirdrops(wallet) {
        if (wallet.summaryRange.airdropsProcessed === false) {
            let airdrops = wallet.blockchain.airdropsAndHardforks;
            for (const airdrop of airdrops) {
                if (wallet.summaryRange.pairs.hasOwnProperty(airdrop.name)) {
                    let airdropTransactions = await wallet.processAirdrop(airdrop);
                    await this.storeManualTransactions(airdropTransactions, wallet.blockchain.name);
                }
            }
            wallet.summaryRange.airdropsProcessed = true;
        }
    }


    // Broad filter by blockNumber
    broadFilterTransactions(segment, firstId, lastId) {
        let firstIdBreakdown = new Transaction({id: firstId}, false, false, false, 'database').idBreakdown;
        let lastIdBreakdown = new Transaction({id: lastId}, false, false, false, 'database').idBreakdown;
        return segment.filter(x => x[1].block >= firstIdBreakdown.blockNumber && x[1].block <= lastIdBreakdown.blockNumber);
    }

    // Fine filter by id
    fineFilterTransactions(transactions, firstId, lastId) {
        return transactions.filter(x => x.checkEarlierLaterEqualThanId(firstId) !== 'earlier' && x.checkEarlierLaterEqualThanId(lastId) !== 'later');
    }

    fineFilterOutSingleId(transactions, id) {
        return transactions.filter(x => x.id !== id);
    }

    // Create transactions based on source of data
    processHistoryDataSegment(segment, address, addressNumber) {
        let transactions = [];
        switch (this.name) {
            case 'hive':
                for (let datum of segment) {
                    let type = datum[1].op[0];
                    if (HiveTransaction.transactionsList.includes(type)) {
                        transactions.push(new HiveTransaction(datum, address, addressNumber, true, 'blockchain'));
                    }
                }
                break;
            case 'steem':
                for (let datum of segment) {
                    let type = datum[1].op[0];
                    if (SteemTransaction.transactionsList.includes(type)) {
                        transactions.push(new SteemTransaction(datum, address, addressNumber, true, 'blockchain'));
                    }
                }
                break;
            default:
        }
        return transactions;
    }

    // Aggregate individual transactions by date
    aggregateHistoryDataSegment(processedTransactions) {
        // Separate transaactions to aggregate
        let aggregated = [];
        let toAggregate = [];
        for (const transaction of processedTransactions) {
            if (Blockchain.transactionsToAggregate.includes(transaction.type)) {
                toAggregate.push(transaction); // For aggregation
            } else {
                aggregated.push(transaction); // No aggregation - straight to processed
            }
        }

        // Aggregate
        for (const type of Blockchain.transactionsToAggregate) {
            let individualTransactions = toAggregate.filter(x => x.type === type);
            if (individualTransactions.length > 0) {
                aggregated = aggregated.concat(this.aggregateTransactionsByDate(individualTransactions));
            }
        }
        return aggregated;
    }

    aggregateTransactionsByDate(individualTransactions) {
        let aggregatedTransactions = [];
        for (let transaction of individualTransactions) {
            let dateStartOfDayUTC = new DateHelper(transaction.date).dateWithTimeZeroUTC();
            let index = aggregatedTransactions.map(t => Number(t.dateStartOfDayUTC)).indexOf(Number(dateStartOfDayUTC));

            // No entry in aggregatedTransactions for this day
            if (index === -1) {
                aggregatedTransactions.push({dateStartOfDayUTC: dateStartOfDayUTC, data: transaction});
            // Previous entry in aggregatedTransactions exists for this day
            } else {
                aggregatedTransactions[index].data = this.weightedSumByVests(dateStartOfDayUTC, aggregatedTransactions[index].data, transaction);
            }
        }
        // Clean up - just return data in aggregated transactions (remove dateMidnightUTC)
        aggregatedTransactions = aggregatedTransactions.map(t => t.data);
        return aggregatedTransactions;
    }

    weightedSumByVests(dateStartOfDayUTC, tOne, tTwo) {
        let tOneWeight = tOne.rewarded[tOne.currencies.staked];
        let tTwoWeight = tTwo.rewarded[tTwo.currencies.staked];

        let weightedTimeInMilliseconds = Math.round(((tOne.date - dateStartOfDayUTC) * tOneWeight + (tTwo.date - dateStartOfDayUTC) * tTwoWeight) / (tOneWeight + tTwoWeight));

        tOne.date = new Date(dateStartOfDayUTC + weightedTimeInMilliseconds);
        tOne.rewarded[tOne.currencies.staked] = Number((tOneWeight + tTwoWeight).toFixed(6));
        tOne.numberOfTransactions += tTwo.numberOfTransactions;

        return tOne;
    }

}
