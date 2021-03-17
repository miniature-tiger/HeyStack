// HIVE / STEEM API TOOLS
// ----------------------

// Functions to fetch from Hive / Seetm blockchain API
let grapheneAPI = {

    urlHive: 'https://api.hive.blog',
    //urlHive: 'https://api.openhive.network',
    //urlHive: 'https://hive.roelandp.nl',
    urlSteem: 'https://api.steemit.com',

    // Switch url based on blockchain
    switchUrl: function(blockchain) {
        let url = '';
        switch (blockchain) {
            case 'hive':
                url = this.urlHive;
                break;
            case 'steem':
                url = this.urlSteem;
                break;
            default:
                console.log("blockchain choice error");
        }
        return url;
    },

    // Account history type filter parameters
    lowParam: false,
    highParam: false,

    // Account History fetch
    fetchAccountHistorySegment: async function(blockchainName, address, endTransaction, numberOfTransactions) {
        // Get low and high parameter numbers for Hive
        if (blockchainName === 'hive') {
            this.checkCalculateLowHighParams();
            return await this.fetchAccountHistory(blockchainName, address, endTransaction, numberOfTransactions, this.lowParam, this.highParam);
        } else if (blockchainName === 'steem') {
            return await this.fetchAccountHistory(blockchainName, address, endTransaction, numberOfTransactions, false, false);
        }
    },

    // Calculate low and high parameters to pre-filter transactions by type
    checkCalculateLowHighParams: function() {
        if (this.lowParam === false && this.highParam === false) {
            let paramNumbers = [3, 4, 10, 23, 40, 42, 45, 49, 50, 51, 54, 55, 56, 62, 63, 65];
            this.lowParam = paramNumbers.filter(x => x <= 64).reduce((total, amount) => total + (2n ** BigInt(amount-1)), 0n).toString();
            this.highParam = paramNumbers.filter(x => x > 64).reduce((total, amount) => total + (2n ** BigInt(amount-64-1)), 0n).toString();
        }
    },

    // Get historical transactions for account
    // - Array of numberOfTransactions in size obtained backwards in time from endTransaction
    // - numberOfTransactions cannot be greater than endTransaction
    // - Max numberOfTransactions is 10000 transactions (10001 will be obtained for Steem as inclusive at both ends)
    // - endTransaction of -1 will start with latest transaction
    fetchAccountHistory: async function(blockchain, address, endTransaction, numberOfTransactions, low, high) {
        let errorCount = 0;
        let maxErrors = 2;
        let complete = false;
        let data = {
            jsonrpc: '2.0',
            method: 'condenser_api.get_account_history',
            params: [address, endTransaction, numberOfTransactions],
            id: 1
        };
        if (low !== false && high !== false) {
            data.params = [address, endTransaction, numberOfTransactions, low, high];
        }
        const dataString = JSON.stringify(data);

        while (complete === false) {
            const response = await fetch(this.switchUrl(blockchain), {
                method: 'POST',
                body: dataString
            });

            let responseJson = await response.json();

            if (responseJson.hasOwnProperty('error')) {
                if (responseJson.error.message.substr(17, 28) === 'total_processed_items < 2000') {
                    //console.log("error handling for 2000 empty issue")
                    return {result: []};
                } else {
                    console.log("error handling")
                    errorCount += 1;
                    if (errorCount >= maxErrors) {
                        complete = true;
                        return responseJson;
                    } else {
                        await logistics.delayInMs(3000);
                    }
                }
            } else {
                complete = true;
                return responseJson;
            }
        }
    },

    // Fetch open trade orders for account
    fetchOpenOrders: async function(blockchain, address) {
        console.log('fetchOpenOrders')
        const data = {
            jsonrpc: '2.0',
            method: 'condenser_api.get_open_orders',
            params: [address],
            id: 1
        };
        const dataString = JSON.stringify(data);
        const response = await fetch(this.switchUrl(blockchain), {
            method: 'POST',
            body: dataString
        });
        return await response.json();
    },

    // Fetch open conversion requests for account
    fetchConversionRequests: async function(blockchain, address) {
        console.log('fetchConversionRequests')
        const data = {
            jsonrpc: '2.0',
            method: 'database_api.list_hbd_conversion_requests',
            params: {
                start: [address, 0],
                limit: 10,
                order: "by_account"
            },
            id: 1
        };
        const dataString = JSON.stringify(data);

        const response = await fetch(this.switchUrl(blockchain), {
            method: 'POST',
            body: dataString
        });
        return await response.json();
    },

    // Fetch account financial data - used to check account exists and to check balance roll up
    fetchAccounts: async function(blockchain, addresses) {
        const data = {
            jsonrpc: '2.0',
            method: 'condenser_api.get_accounts',
            params: [addresses],
            id: 1
        };
        const dataString = JSON.stringify(data);

        const response = await fetch(this.switchUrl(blockchain), {
            method: 'POST',
            body: dataString
        });
        return await response.json();
    },

    // Fetch blockchain global properties - used for liquid v vests comversion
    fetchGlobalProperties: async function(blockchain) {
        const data = {
            jsonrpc: '2.0',
            method: 'condenser_api.get_dynamic_global_properties',
            params: [],
            id: 1
        };
        const dataString = JSON.stringify(data);

        const response = await fetch(this.switchUrl(blockchain), {
            method: 'POST',
            body: dataString
        });
        return await response.json();
    },
}

// Tools to convert between vests and coin (liquid)
let grapheneTools = {

    // Check if all uploaded
    // Upload as necessary
    // Upload latest - mark it as latest
    // Check if new entry needs to be created
    // If so create it

    // Check if blockchain vest/liquid exchange rates array already created and stored in memory
    checkCreateBlockchainVestPrices: async function(blockchain) {
        if (!blockchain.parameters.vestPricesData.length > 0) {
            await this.createBlockchainVestPrices(blockchain);
        }
    },

    // Create blockchain vest/liquid exchange rates array
    createBlockchainVestPrices: async function(blockchain) {
        // Get vestPrices from database
        let vestPricesData = await databases.vestPrices.getAllFromStore(blockchain.vestsStore);
        // Check if all past data stored
        let dataToLoad = this.checkIfPastVestPricesToLoad(vestPricesData, blockchain);
        if (dataToLoad.length > 0) {
            await this.storeVestPrices(dataToLoad, blockchain.vestsStore);
            vestPricesData = vestPricesData.concat(dataToLoad);
        }
        // Create currentVestsPerHive from global properties
        let globalProperties = await grapheneAPI.fetchGlobalProperties(blockchain.name);
        let currentVestsPerHive = await this.createVestsPerLiquidRecordFromGlobalProperties(globalProperties.result, blockchain.name);
        // Store current vestPrices - uses date as id so overwrites any vestPrice stored earlier in day
        await this.storeVestPrices([currentVestsPerHive], blockchain.vestsStore);
        // Get from database and store vestPrices exchange rates array in memory
        await this.storeVestPricesInMemory(blockchain);
    },

    // Checks whether vestPrices database store for blockchain is up to date
    checkIfPastVestPricesToLoad: function(vestPricesData, blockchain) {
        let vestPricesBlocks = vestPricesData.map(x => x.blockNumber);
        let startingVestData = this.getStartingVestData(blockchain.name);
        return startingVestData.filter(x => !(vestPricesBlocks.includes(x.blockNumber)));
    },

    // Get hardcoded vestPrices data
    getStartingVestData: function(blockchainName) {
        if (blockchainName === 'hive') {
            return vestsData.hive.concat(vestsData.both);
        } else if (blockchainName === 'steem') {
            return vestsData.steem.concat(vestsData.both);
        } else {
            return [];
        }
    },

    // Store vestPrices in database
    storeVestPrices: async function(vestPrices, vestsStore) {
        let timePeriod = new TimePeriod('1d');
        vestPrices.forEach(x => x.id = Number(timePeriod.startOfTimePeriodForDate(new Date(x.dateNumber))));
        await databases.vestPrices.putData(vestPrices, vestsStore);
    },

    // Get from database, sort, and store vestPrices exchange rates array in memory
    storeVestPricesInMemory: async function(blockchain) {
        let vestPricesData = await databases.vestPrices.getAllFromStore(blockchain.vestsStore);
        vestPricesData = vestPricesData.sort((a, b) => b.blockNumber - a.blockNumber);
        blockchain.parameters.vestPricesData = vestPricesData;
    },

    // Create vestsPrice exchange rate data from global properties
    createVestsPerLiquidRecordFromGlobalProperties: function(globalProperties, blockchainName) {
        let currentVestsPerLiquid = {blockNumber: 0, dateNumber: 0, vestsPerLiquid: 0};
        currentVestsPerLiquid.blockNumber = globalProperties.head_block_number;
        currentVestsPerLiquid.dateNumber = Number(new Date(globalProperties.time + '.000Z'));
        if (blockchainName === 'hive') {
            currentVestsPerLiquid.vestsPerLiquid = Number((globalProperties.total_vesting_shares.split(' ')[0] / globalProperties.total_vesting_fund_hive.split(' ')[0]).toFixed(3));
        } else if (blockchainName === 'steem') {
            currentVestsPerLiquid.vestsPerLiquid = Number((globalProperties.total_vesting_shares.split(' ')[0] / globalProperties.total_vesting_fund_steem.split(' ')[0]).toFixed(3));
        }
        return currentVestsPerLiquid;
    },

    // Calculation of vests per liquidCoin at given date
    vestsPerLiquidAtDate: function(date, blockchainName) {
        let dateNumber = Number(date);
        let vestPricesData = blockchains.data[blockchainName].parameters.vestPricesData;
        let vestsPerLiquid = 0;

        // Most recent vestPricesData is generated on loading from globalProperties.
        // - remains sufficient for any dateNumbers more recent.
        if (dateNumber > vestPricesData[0].dateNumber) {
            vestsPerLiquid = vestPricesData[0].vestsPerLiquid;

        // Extrapolate early (user with caution)
        } else if (dateNumber < vestPricesData[vestPricesData.length-1].dateNumber) {
            vestsPerLiquid = vestPricesData[vestPricesData.length-1].vestsPerLiquid;

        // Interpolate
        } else {
            for (let i=0; i<vestPricesData.length; i+=1) {
                if (dateNumber <= vestPricesData[i].dateNumber && dateNumber > vestPricesData[i+1].dateNumber) {
                    vestsPerLiquid = this.interpolateVests(dateNumber, vestPricesData[i+1], vestPricesData[i]);
                    break;
                }
            }
        }
        return vestsPerLiquid;
    },

    // Interpolation of
    interpolateVests: function(dateNumber, earlierBlock, laterBlock) {
        let proportion = (dateNumber - earlierBlock.dateNumber) / (laterBlock.dateNumber - earlierBlock.dateNumber);
        return (proportion * (laterBlock.vestsPerLiquid - earlierBlock.vestsPerLiquid) + earlierBlock.vestsPerLiquid);
    },

    // Conversion of vests to power
    convertVestsMomentsToLiquid: function(blockchainName, moments, key) {
        for (let moment of moments) {
            if (moment.hasOwnProperty(key) && moment[key] !== 0) {
                moment[key] = this.convertVestsToLiquid(moment.date, moment[key], blockchainName);
            }
        }
        return moments;
    },

    // Conversion of vests to liquid
    convertVestsToLiquid: function(date, value, blockchainName) {
        let vph = this.vestsPerLiquidAtDate(date, blockchainName);
        return Number((value / vph).toFixed(3));
    },

    // Conversion of liquid to vests
    convertLiquidToVests: function(date, value, blockchainName) {
        let vph = this.vestsPerLiquidAtDate(date, blockchainName);
        return Number((value * vph).toFixed(3));
    },

}

// Historic exchange rates between vests and coin (liquid)
let vestsData = {
    // Power down blocks provide a ratio between vests and liquidcoin
    // - transactions have been extracted every million blocks
    // - significant change in inflation at HF16

    // HardFork 16:
    // Block number 7,353,249
    // 2016-12-06 16:00:00 (UTC)

    // HardFork 23: HIVE LAUNCH
    // Block number 41,818,752
    // 2020-03-20 14:00:00 (UTC)

    // HardFork 24:
    // Block number 47,797,680
    // 2020-10-14 19:31:24 (UTC)
    hive: [
        {blockNumber: 51995677, dateNumber: 1615327269000, vestsPerLiquid: 1897.502}, // actual
        {blockNumber: 51000086, dateNumber: 1612334049000, vestsPerLiquid: 1903.376},
        {blockNumber: 50000014, dateNumber: 1609327554000, vestsPerLiquid: 1909.537},
        {blockNumber: 49000071, dateNumber: 1606321740000, vestsPerLiquid: 1916.332},
        {blockNumber: 48000043, dateNumber: 1603313208000, vestsPerLiquid: 1922.319},
        {blockNumber: 47000007, dateNumber: 1600304181000, vestsPerLiquid: 1928.300},
        {blockNumber: 46000162, dateNumber: 1597296411000, vestsPerLiquid: 1934.575},
        {blockNumber: 45000081, dateNumber: 1594289289000, vestsPerLiquid: 1940.646},
        {blockNumber: 44000089, dateNumber: 1591282185000, vestsPerLiquid: 1946.894},
        {blockNumber: 43000026, dateNumber: 1588272186000, vestsPerLiquid: 1952.359},
        {blockNumber: 42000094, dateNumber: 1585261341000, vestsPerLiquid: 1957.633},
    ],

    steem: [
        {blockNumber: 51922772, dateNumber: 1615498047000, vestsPerLiquid: 1892.413}, // actual
        {blockNumber: 51000105, dateNumber: 1612681026000, vestsPerLiquid: 1898.986},
        {blockNumber: 49999812, dateNumber: 1609645293000, vestsPerLiquid: 1906.447},
        {blockNumber: 48999904, dateNumber: 1606599447000, vestsPerLiquid: 1914.105},
        {blockNumber: 47999960, dateNumber: 1603543338000, vestsPerLiquid: 1922.144},
        {blockNumber: 47000098, dateNumber: 1600504137000, vestsPerLiquid: 1929.950},
        {blockNumber: 46000029, dateNumber: 1597465791000, vestsPerLiquid: 1937.457},
        {blockNumber: 44999998, dateNumber: 1594433400000, vestsPerLiquid: 1943.713},
        {blockNumber: 43999971, dateNumber: 1591399476000, vestsPerLiquid: 1949.412},
        {blockNumber: 42999995, dateNumber: 1588335750000, vestsPerLiquid: 1954.243},
        {blockNumber: 42000049, dateNumber: 1585265043000, vestsPerLiquid: 1958.001},
    ],

    both: [
        {blockNumber: 41000022, dateNumber: 1582248741000, vestsPerLiquid: 1961.384},
        {blockNumber: 40000279, dateNumber: 1579243362000, vestsPerLiquid: 1965.503},
        {blockNumber: 39000028, dateNumber: 1576237002000, vestsPerLiquid: 1969.828},
        {blockNumber: 38000057, dateNumber: 1573231431000, vestsPerLiquid: 1973.616},
        {blockNumber: 37000020, dateNumber: 1570225356000, vestsPerLiquid: 1977.752},
        {blockNumber: 36000042, dateNumber: 1567168602000, vestsPerLiquid: 1981.935},
        {blockNumber: 35000020, dateNumber: 1564145310000, vestsPerLiquid: 1986.187},
        {blockNumber: 34000010, dateNumber: 1561140528000, vestsPerLiquid: 1990.433},
        {blockNumber: 33000049, dateNumber: 1558136832000, vestsPerLiquid: 1994.292},
        {blockNumber: 32000005, dateNumber: 1555134252000, vestsPerLiquid: 1998.413},
        {blockNumber: 31000021, dateNumber: 1552128339000, vestsPerLiquid: 2002.324},
        {blockNumber: 30000031, dateNumber: 1549126098000, vestsPerLiquid: 2006.413},
        {blockNumber: 29000001, dateNumber: 1546123113000, vestsPerLiquid: 2010.277},
        {blockNumber: 28000063, dateNumber: 1543121712000, vestsPerLiquid: 2014.217},
        {blockNumber: 27000027, dateNumber: 1540119507000, vestsPerLiquid: 2018.021},
        {blockNumber: 26000031, dateNumber: 1537070151000, vestsPerLiquid: 2021.911},
        {blockNumber: 25000058, dateNumber: 1534068963000, vestsPerLiquid: 2025.634},
        {blockNumber: 24000049, dateNumber: 1531066086000, vestsPerLiquid: 2029.246},
        {blockNumber: 23000018, dateNumber: 1528033800000, vestsPerLiquid: 2032.961},
        {blockNumber: 22000011, dateNumber: 1525032030000, vestsPerLiquid: 2036.65},
        {blockNumber: 21000007, dateNumber: 1522029513000, vestsPerLiquid: 2040.37},
        {blockNumber: 20000081, dateNumber: 1519024857000, vestsPerLiquid: 2044.103},
        {blockNumber: 19000102, dateNumber: 1516021995000, vestsPerLiquid: 2047.797},
        {blockNumber: 18000050, dateNumber: 1513019568000, vestsPerLiquid: 2051.271},
        {blockNumber: 17000044, dateNumber: 1510018041000, vestsPerLiquid: 2054.89},
        {blockNumber: 16000026, dateNumber: 1507015485000, vestsPerLiquid: 2058.558},
        {blockNumber: 15000037, dateNumber: 1504013793000, vestsPerLiquid: 2062.323},
        {blockNumber: 14000008, dateNumber: 1501009119000, vestsPerLiquid: 2066.292},
        {blockNumber: 13000009, dateNumber: 1498004409000, vestsPerLiquid: 2070.33},
        {blockNumber: 12000052, dateNumber: 1495001412000, vestsPerLiquid: 2073.81},
        {blockNumber: 11000003, dateNumber: 1491999201000, vestsPerLiquid: 2077.591},
        {blockNumber: 10000112, dateNumber: 1488994800000, vestsPerLiquid: 2081.228},
        {blockNumber: 9000051, dateNumber: 1485992121000, vestsPerLiquid: 2084.71},
        {blockNumber: 8000091, dateNumber: 1482986274000, vestsPerLiquid: 2088.123},
        {blockNumber: 7353639, dateNumber: 1481041206000, vestsPerLiquid: 2090.791},
        {blockNumber: 7000135, dateNumber: 1479978924000, vestsPerLiquid: 2190.354},
        {blockNumber: 6000198, dateNumber: 1476975162000, vestsPerLiquid: 2534.443},
        {blockNumber: 5000183, dateNumber: 1473969417000, vestsPerLiquid: 3003.754},
        {blockNumber: 4000030, dateNumber: 1470952896000, vestsPerLiquid: 3683.229},
    ]
}
