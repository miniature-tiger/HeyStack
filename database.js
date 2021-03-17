// IDB DATABASE AND LOCAL STORAGE
// ------------------------------
// Still to tidy - processOneTransaction

// List of indexedDB databases to be created
let databases = {
    heyStack: {dbName: 'HeyStack', latestVersion: 2},
    cryptoPrices: {dbName: 'CryptoPrices', latestVersion: 1},
    vestPrices: {dbName: 'VestPrices', latestVersion: 1},
}

// Indices for indexedDB stores
let indices = {
    // List of indices for wallet stores
    walletIndices: [
        {name: 'addressNumber', path: 'addressNumber'},
        {name: 'type', path: 'type'},
        {name: 'date', path: 'date'},
        {name: 'blockNumber', path: 'blockNumber'},
        {name: 'addressNumberType', path: ['addressNumber', 'type']},
    ],
    // List of indices for range stores
    rangeIndices: [
        {name: 'address', path: 'address'},
        {name: 'addressNumber', path: 'addressNumber'},
    ],
    // List of indices for trade_imports object store
    tradeImportsIndices: [
        {name: 'type', path: 'type'},
        {name: 'coinIn', path: 'coinIn'},
        {name: 'coinOut', path: 'coinOut'},
        {name: 'coinFee', path: 'coinFee'},
        {name: 'exchange', path: 'exchange'},
        {name: 'date', path: 'date'},
        {name: 'priceStatus', path: 'priceStatus'},
    ],
    // List of indices for crypto prices stores
    cryptoIndices: [
        {name: 'base', path: 'base'},
        {name: 'quote', path: 'quote'},
        {name: 'baseQuote', path: ['base', 'quote']},
        {name: 'date', path: 'date'},
    ],
    // List of indices for vests object store
    vestIndices: [
        {name: 'blockNumber', path: 'blockNumber'},
        {name: 'dateNumber', path: 'dateNumber'},
    ],
}


// Generic indexedDB database class
class Database {
    // Initialisation
    constructor(info) {
        this.dB;
        this.dbName = info.dbName
        this.latestVersion = info.latestVersion;
        this.oldVersion;
    }

    // OPEN / UPDATE / CLOSE DATABASE METHODS
    // --------------------------------------
    openDB() {
        return new Promise((resolve, reject) => {
            // Store this
            let thisDatabase = this;
            // Create / open database
            var request = window.indexedDB.open(this.dbName, this.latestVersion);

            // Handle errors
            request.onerror = function(event) {
                console.error("openDB: ", event.target.errorCode);
            };

            // Handle success
            request.onsuccess = function(event) {
                thisDatabase.dB = this.result;
                resolve("openDb successful");
            };

            // Create an object store
            function createStore(event, storeName, keyPath, autoIncrement, indices) {
                let store = event.currentTarget.result.createObjectStore(
                    storeName,
                    { keyPath: keyPath, autoIncrement: autoIncrement }
                );
                for (let index of indices) {
                    store.createIndex(index.name, index.path, { unique: false });
                }
            }

            // Delete an object store
            function deleteStore(event, storeName) {
                event.currentTarget.result.deleteObjectStore(storeName);
            }

            // Delete all stores
            function deleteAllStores(event) {
                console.log(request.result.objectStoreNames)
                for (let storeName of request.result.objectStoreNames) {
                    deleteStore(event, storeName)
                }
            }

            // Change an object store name
            function changeStoreName(event, oldName, newName) {
                let objectStore = event.target.transaction.objectStore(oldName);
                objectStore.name = newName;
            }

            // Handle upgrade
            request.onupgradeneeded = function(event) {
                console.log('onupgradeneeded');
                let dbName = request.result.name;

                if (dbName === 'HeyStack') {
                    // Store the old version of the database
                    thisDatabase.oldVersion = event.oldVersion;
                    // Delete previous database stores - create new ones
                    if (event.oldVersion < 2) {
                        deleteAllStores(event);
                        createStore(event, "hive_wallet", "id", false, indices.walletIndices);
                        createStore(event, "hive_transactionsRange", "id", true, indices.rangeIndices);
                        createStore(event, "steem_wallet", "id", false, indices.walletIndices);
                        createStore(event, "steem_transactionsRange", "id", true, indices.rangeIndices);
                        createStore(event, "trade_imports", "id", true, indices.tradeImportsIndices);
                    }
                } else if (dbName === 'CryptoPrices') {
                    // Store the old version of the database
                    thisDatabase.oldVersion = event.oldVersion;
                    // No previous database - create all object stores
                    if (event.oldVersion < 1) {
                        createStore(event, "dailyPrices", "id", false, indices.cryptoIndices);
                        createStore(event, "hourlyPrices", "id", false, indices.cryptoIndices);
                        createStore(event, "latestPrices", "id", false, indices.cryptoIndices);
                    }
                } else if (dbName === 'VestPrices') {
                    thisDatabase.oldVersion = event.oldVersion;
                    // No previous database - create all object stores
                    if (event.oldVersion < 1) {
                        createStore(event, "hive_vests", "id", false, indices.vestIndices);
                        createStore(event, "steem_vests", "id", false, indices.vestIndices);
                    }
                }
            };

        });
    }

    // Close and delete database
    async closeAndDeleteDB() {
        await this.closeDB();
        await Database.deleteDB(this.dbName);
    }

    // Delete closed database
    // - static function allows old database to be deleted without creating a new database instance
    static async deleteDB(dbName) {
        window.indexedDB.deleteDatabase(dbName);
    }

    // Close database
    async closeDB() {
        await this.dB.close();
    }

    // ADD DATA METHODS
    // ------------------

    // Add data (insert only, not update) into an object store
    addData(data, storeName) {
        return new Promise((resolve, reject) => {
            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readwrite");
            let objectStore = transactionIDB.objectStore(storeName);

            // On completion
            transactionIDB.oncomplete = function(event) {
                resolve(recordCount);
            };

            // Error handling
            transactionIDB.onerror = function(event) {
                reject(false);
            };

            // Add data
            let recordCount = 0;
            for (let datum of data) {
                let addRequest = objectStore.add(datum);
                addRequest.onsuccess = function(event) {
                    recordCount+=1;
                }

                addRequest.onerror = function(event) {
                    console.log(datum)
                    console.log(event);
                }
            }
        });
    }

    // Put data (update / insert) into an object store
    putData(data, storeName) {
        return new Promise((resolve, reject) => {
            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readwrite");
            let objectStore = transactionIDB.objectStore(storeName);

            // On completion
            transactionIDB.oncomplete = function(event) {
                resolve(recordCount);
            };

            // Error handling
            transactionIDB.onerror = function(event) {
                console.error(storeName + ": " + event.target.errorCode);
                reject(event.target.errorCode);
            };

            // Add data
            let recordCount = 0;
            for (let datum of data) {
                let putRequest = objectStore.put(datum);
                putRequest.onsuccess = function(event) {
                    recordCount+=1;
                }
            }
        });
    }

    // Add transactions to a wallet object store
    addTransactionsAndRange(allTransactions, walletStore, inclusiveTransactionRange, transactionsRangeStore) {
        let duplicateTransactions = [];
        let duplicateTransactionCount = 0;
        let transactionsAddedCount = 0;
        let rangesAddedCount = 0;

        // Start transaction, get object store
        let transactionIDB = this.dB.transaction([walletStore, transactionsRangeStore], "readwrite");
        let objectStoreWallet = transactionIDB.objectStore(walletStore);
        let objectStoreRange = transactionIDB.objectStore(transactionsRangeStore);


        // Do something when all the data is added to the database.
        transactionIDB.oncomplete = function(event) {
            return {transactionsAddedCount: transactionsAddedCount, rangesAddedCount: rangesAddedCount, duplicateTransactions: duplicateTransactions};
        };

        // Error handling
        transactionIDB.onerror = function(event) {
            console.log(event)
        };

        // Each transaction id is searched for in database and, if not a duplicate, the transaction is added
        // - run as callback loop so that each transaction is processed in full in turn, in case duplicates are consecutive transactions
        // - i.e. get(1), add(1), get(2), add(2) rather than get(1), get(2), add(1), add(2)
        if (allTransactions.length > 0) {
            processOneTransaction(allTransactions[transactionsAddedCount]);
        } else {
            endLoopProcess();
        }


        function processOneTransaction(transaction) {
            let getRequestWallet = objectStoreWallet.get(transaction.id);

            getRequestWallet.onsuccess = function(event) {
                // Record key not found in database - add record
                if (getRequestWallet.result === undefined) {
                    let addRequestWallet = objectStoreWallet.add(transaction);

                    addRequestWallet.onsuccess = function(event) {
                        transactionsAddedCount+=1;
                        // If transactions still to process, loop
                        endLoopProcess()
                    }

                    addRequestWallet.onerror = function(event) {
                        console.error(event)
                        console.error(transaction)
                    }

                // Record key found - return as duplicate
                } else {
                    let objectHelper = new ObjectHelper(transaction);
                    if (objectHelper.checkEquality(getRequestWallet.result, ['historyId']) === false) {
                        transaction.subTransactionNumber += 1;
                        transaction.id = transaction.blockNumber + '_' + transaction.transactionNumber + '_' + transaction.virtualTransactionNumber + '_' + transaction.subTransactionNumber + '_' + transaction.addressNumber;
                        processOneTransaction(transaction);
                    } else {
                        duplicateTransactions.push({loaded: getRequestWallet.result, duplicate: transaction});
                        duplicateTransactionCount += 1;
                        // If transactions still to process, loop
                        endLoopProcess();
                    }
                }
            }

            getRequestWallet.onerror = function(event) {
                console.error(getRequestWallet.result)
            }
        }

        function endLoopProcess() {
            if ((transactionsAddedCount + duplicateTransactionCount) < allTransactions.length) {
                processOneTransaction(allTransactions[transactionsAddedCount + duplicateTransactionCount]);
            // Once all blockchain transactions are added, process range
            // - aim to keep all within the same IDBTransaction to allow roll back of error across both blockchain transactions and ranges
            } else {
                let addRequestRange = objectStoreRange.add(inclusiveTransactionRange);

                addRequestRange.onsuccess = function(event) {
                    rangesAddedCount+=1;
                }

                addRequestRange.onerror = function(event) {
                    console.error(event)
                }
            }
        }
    }

    // CLEAR DATA METHODS
    // ------------------

    // Delete all elements from a store matching an index value
    async deleteAllElementsMatchingIndexValues(storeName, indexName, indexValues) {
        return new Promise((resolve, reject) => {
            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readwrite");
            let objectStore = transactionIDB.objectStore(storeName);
            // Set index and range
            let index = objectStore.index(indexName);
            let range = IDBKeyRange.only(indexValues);

            // Requests
            let countRequest = index.count(range);
            let deleteRequest = index.openCursor(range);

            let countResult;
            countRequest.onsuccess = function(event) {
                countResult = countRequest.result;
                communication.message(0 + ' records of ' + countResult + ' deleted so far. Please wait.');
            }

            let recordCount = 0;
            deleteRequest.onsuccess = function(event) {
                let cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    recordCount += 1;
                    if (recordCount % 100 === 0) {
                        communication.changeText(recordCount + ' records of ' + countResult + ' deleted so far. Please wait.');
                    }
                    cursor.continue();
                } else {
                    communication.changeText('All records deleted.');
                    resolve(recordCount);
                }
            }
        });
    }

    // Clear an object store
    clearObjectStore(storeName) {
        return new Promise((resolve, reject) => {
            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readwrite");
            let objectStore = transactionIDB.objectStore(storeName);

            // Clear all the data from the object store but do not delete the store
            let request = objectStore.clear();

            transactionIDB.oncomplete = function(event) {
                resolve(storeName + ' cleared.');
            }

            request.onerror = function(event) {
                reject(event);
            }
        });
    }

    // GET FROM DATABASE METHODS
    // -------------------------

    // Get all entries from an object store
    getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            let transactions = [];

            // Start transaction, get object store, set index
            let transactionIDB = this.dB.transaction([storeName], "readonly");
            let objectStore = transactionIDB.objectStore(storeName);
            let request = objectStore.getAll();

            request.onsuccess = function(event) {
                resolve(event.target.result);
            };

            request.onerror = function(event) {
                reject(event)
            }
        });
    }

    // Generic method to return list of unique entries in an index (e.g. all coins in database)
    async getListOfIndex(storeName, indexName) {
        try {
            let indexList = await this.getListOfIndexDB(storeName, indexName);
            return indexList;
        } catch(error) {
            // Return empty array
            return [];
        }
    }

    // Works with above method
    getListOfIndexDB(storeName, indexName) {
        //console.log(storeName, indexName)
        return new Promise((resolve, reject) => {
            let list = [];

            // Start transaction, get object store, set index
            let transactionIDB = this.dB.transaction([storeName], "readonly");
            let objectStore = transactionIDB.objectStore(storeName);
            let index = objectStore.index(indexName);

            let request = index.openKeyCursor(null, "nextunique");

            request.onsuccess = function(event) {
                let cursor = event.target.result;
                if (cursor) {
                    list.push(cursor.key)
                    cursor.continue();
                } else {
                    resolve(list);
                }
            }

            request.onerror = function(event) {
                reject(event);
            }
        });
    }

    // Return all elements from a store matching an index value
    async getAllElementsOfIndexType(storeName, indexName, indexValue) {
        return new Promise((resolve, reject) => {
            let list = [];

            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readonly");
            let objectStore = transactionIDB.objectStore(storeName);
            // Set index and range
            let index = objectStore.index(indexName);
            let range = IDBKeyRange.only(indexValue);
            // Open cursor
            let request = index.openCursor(range);

            // Resolve promise once all transactions are pushed to list
            request.onsuccess = function(event) {
                let cursor = event.target.result;
                if (cursor) {
                    list.push(cursor.value)
                    cursor.continue();
                } else {
                    resolve(list);
                }
            }

            // Handle error
            request.onerror = function(event) {
                reject(event);
            }
        });
    }

    // Return all elements from a store matching an index value
    async countAllElementsOfIndexType(storeName, indexName, indexValue) {
        return new Promise((resolve, reject) => {
            let list = [];

            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readonly");
            let objectStore = transactionIDB.objectStore(storeName);
            // Set index and range
            let index = objectStore.index(indexName);
            let range = IDBKeyRange.only(indexValue);

            let request = index.count(range);

            request.onsuccess = function(event) {
                resolve(request.result);
            }

            // Handle error
            request.onerror = function(event) {
                reject(event);
            }
        });
    }

    // Return all elements from a store matching an index value
    getAllElementsMatchingIndexRange(storeName, indexName, indexRangeLower, indexRangeUpper) {
        return new Promise((resolve, reject) => {
            // Start transaction, get object store
            let transactionIDB = this.dB.transaction([storeName], "readonly");
            let objectStore = transactionIDB.objectStore(storeName);
            // Set index and range
            let index = objectStore.index(indexName);
            let range = IDBKeyRange.bound(indexRangeLower, indexRangeUpper);
            let getRequest = index.getAll(range);
            // Resolve result
            getRequest.onsuccess = function(event) {
                resolve(event.target.result);
            };
        });
    }

    async reportIndices(storeName) {
        // Start transaction, get object store
        let transactionIDB = this.dB.transaction([storeName], "readonly");
        let objectStore = transactionIDB.objectStore(storeName);
        console.log(objectStore)
        return objectStore.indexNames;
    }
}



// Local storage functions
let storage = {

    // Put in local storage
    setInStorage: function(item, value) {
        let stringValue = JSON.stringify(value);
        localStorage.setItem(item, stringValue);
    },

    // Get from local storage
    getFromStorage: function(item, existingValue) {
        const stringValue = localStorage.getItem(item);
        //const value = JSON.parse(stringValue);
        let restoredValue = JSON.parse(stringValue, function (key, value) {
            if (key === 'date') {
                return new Date(value);
            } else {
                return value;
            }
        });
        return (restoredValue !== null) ? restoredValue : existingValue;
    },

    // Remove item from storage completely
    removeFromStorage: function(item) {
        localStorage.removeItem(item);
    },

    // List of storage items - currently not used
    storageItems: [ 'heystack_settings',
                    'heystack_status',
                    'heystack_coinList',
                    'heystack_lastCoinListUpdate',
                  ],

    // Clears all local storage - currently not used
    clearLocalStorage: function() {
        for (let item of this.storageItems) {
            this.removeFromStorage(item);
        }
    },
}
