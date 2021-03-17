// PROCESSING EXCHANGE TRADES
// --------------------------

// Exchange transaction (trade, deposit, withdrawal etc)
class Trade {
    // Initialisation
    constructor(datum) {
        this.id = datum.id;
        this.type = datum.type;
        this.buy = datum.buy;
        this.coinIn = datum.coinIn;
        this.sell = datum.sell;
        this.coinOut = datum.coinOut;
        this.fee = datum.fee;
        this.coinFee = datum.coinFee;
        this.exchange = datum.exchange;
        this.comment = datum.comment;
        this.date = datum.date;
        this.priceStatus = datum.priceStatus;
        if (datum.hasOwnProperty('fiatValue')) {
            this.fiatValue = datum.fiatValue;
        }
    }

    get dateNumber() {
        return Number(this.date);
    }

    dateValue(key) {
        return new DateValue(this.date, this[key]);
    }

    dateValueForCoin(coin) {
        return new DateValue(this.date, this.valueForCoin(coin));
    }

    valueForCoin(coin) {
        let pairs = [['coinIn', 'buy'], ['coinOut', 'sell'], ['coinFee', 'fee']];
        let value = 0;
        for (let pair of pairs) {
            if (this[pair[0]] === coin) {
                value += this[pair[1]];
            }
        }
        return value;
    }
}

// A group of Trades for a coin
class TradeGroup {
    // Initialisation
    constructor(coin, source, dataSource, data) {
        this.coin = coin;
        this.source = source;
        this.trades = [];
        // Create TradeGroup from database info - restricts duplicates based on ID
        if (dataSource === "database") {
            this.createAndAddTrades(data);
        // Create TradeGroup from another TradeGroup - no restriction on duplicates (assumed already done)
        } else {
            this.trades = data;
        }
    }

    get tradeIds() {
        return this.trades.map(x => x.id);
    }

    tradeIndex(id) {
        return this.tradeIds.indexOf(id);
    }

    // Add new trades
    // - converts from database info to Trade instances
    // - excludes duplicates based on database ID
    createAndAddTrades(data) {
        for (const datum of data) {
            // No entry in this.trades for this id
            if (this.tradeIndex(datum.id) === -1) {
                this.trades.push(new Trade(datum));
            // Else previous entry in aggregatedOperations exists for this id - so reject
            }
        }
    }

    // Add Trades - no restriction on duplicates (assumed already done)
    addTrades(trades) {
        this.trades = this.trades.concat(trades);
    }

    // Convert TradeGroup to a stack
    stackForCoin(timePeriod) {
        let dateValues = this.trades.map(x => x.dateValueForCoin(this.coin));
        return new Stack(this.coin, false, this.source, timePeriod, dateValues);
    }

    filterNewGroupByDate(date) {
        let filteredTrades = this.trades.filter(x => x.date < date);
        return new TradeGroup(this.coin, this.source, 'trades', filteredTrades);
    }


    // Separate TradeGroup by exchange label
    get separateTradeGroupsByExchange() {
        let separateTradeGroups = [];
        for (const exchange of this.setOfExchanges) {
            let data = this.filterGroupByExchange(exchange);
            separateTradeGroups.push(new TradeGroup(this.coin, exchange, 'trades', data));
        }
        return separateTradeGroups;
    }

    get setOfExchanges() {
        return new Set(this.trades.map(x => x.exchange));
    }

    filterGroupByExchange(exchange) {
        return this.trades.filter(x => x.exchange === exchange);
    }

    // List other coins that are included in TradeGroup (except main coin)
    get setOfPairCoins() {
        let pairCoins = this.trades.map(x => x.coinIn);
        pairCoins = pairCoins.concat(this.trades.map(x => x.coinOut));
        let pairCoinsSet = new Set(pairCoins);
        pairCoinsSet.delete(this.coin);
        return pairCoinsSet;
    }
}

// A collection of TradeGroups
class TradeGroupCollection {
    // Initialisation
    constructor(tradeGroups) {
        this.tradeGroups = [];
        // Add tradeGroups to store
        this.addTradeGroups(tradeGroups);
    }

    addTradeGroups(tradeGroups) {
        for (const tradeGroup of tradeGroups) {
            this.tradeGroups.push(tradeGroup)
        }
    }

    separateTradeGroupsByExchange() {
        let newTradeGroups = [];
        for (let tradeGroup of this.tradeGroups) {
            // Create new trade groups
            newTradeGroups = newTradeGroups.concat(tradeGroup.separateTradeGroupsByExchange);
        }
        this.tradeGroups = newTradeGroups;
    }

    groupsFilteredByCoin(coin) {
        return this.tradeGroups.filter(x => x.coin === coin);
    }

    // Helper function to return object relating to coin from array of objects include a coin key
    findGroupbyCoinAndSource(coin, source) {
        let result = this.tradeGroups.find(x => x.coin === coin && x.source === source);
        if (result === undefined) {
            return false;
        } else {
            return result;
        }
    }

}


let tradeModel = {

    airdropsAndHardforks: [
        {date: '2020-03-20T14:00:00.000Z', generatorCoin: 'STEEM', producedCoin: 'HIVE'},
        {date: '2020-03-20T14:00:00.000Z', generatorCoin: 'SBD', producedCoin: 'HBD'},
    ],

    // Aggregate all heystack trade operations
    // - produces stacks
    // - also deals with airdrops
    // - separated into parts as aidrops need to be processed outside of coin loops in date order
    aggregate: async function(coins) {
        // Get operations, simplify, zeroise other currencies
        let tradeGroupCollection = await this.getTradesForEachCoin(coins);

        if (tradeGroupCollection !== false) {
            // Separate TradeGroups by exchange
            tradeGroupCollection.separateTradeGroupsByExchange();
            // Process airdrops and hardforks in date order
            //let postAidropCollection = this.processAirdrops(tradeGroupCollection);
            // AggregateAndStore
            //let stackCollection = this.createDayStacks(postAidropCollection);
            let stackCollection = this.createDayStacks(tradeGroupCollection);
            return stackCollection;
        // No aggregation to process - return false
        } else {
            return false;
        }
    },

    // Create TradeGroup for each coin
    getTradesForEachCoin: async function(coins) {
        // Empty tradeGroupCollection
        let tradeGroupCollection = new TradeGroupCollection([]);
        // If there are coins in the database, proceed with aggregation
        if (coins.length > 0) {
            // Loop through each coin to aggregate
            for (let coin of coins) {
                // Get all operations for coin from database and merge into one list
                let newGroup = await this.getAllCoinTrades(coin);
                // Push into array for return
                tradeGroupCollection.addTradeGroups([newGroup]);
            }
            return tradeGroupCollection
        // If no coins in database, i.e. no trades, return false
        } else {
            return false;
        }
    },

    // Loop through airdrops / hard forks in date order
    // - generate operation based on sum of historic transactions up to airdrop date
    // - add to relevant coin
    // - need to do in date order! e.g. for BTC etc to make sure later airdrops include former ones
    processAirdrops: function(tradeGroupCollection) {
        for (let airdrop of this.airdropsAndHardforks) {
            // Get list of operations for coin
            let generatorGroups = tradeGroupCollection.groupsFilteredByCoin(airdrop.generatorCoin);
            // Check if any airdrop to calculate
            if (generatorGroups.length > 0) {
                for (const generatorGroup of generatorGroups) {
                    // Filter all transactions for generator coin to date of airdrop
                    let airdropDate = new Date(airdrop.date);
                    let preAirdropGroup = generatorGroup.filterNewGroupByDate(airdropDate);

                    // Aggregate
                    let stack = preAirdropGroup.stackForCoin('none');
                    let airdropTradeInfo = {
                        id: 'manual',
                        type: 'airdrop',
                        buy: stack.total,
                        coinIn: airdrop.producedCoin,
                        sell: 0,
                        coinOut: '',
                        fee: 0,
                        coinFee: '',
                        exchange: generatorGroup.source,
                        comment: '',
                        date: airdropDate
                    }
                    let airdropTrade = new Trade(airdropTradeInfo);
                    // Push Trade to producedCoin collection
                    let producedGroup = tradeGroupCollection.findGroupbyCoinAndSource(airdrop.producedCoin, generatorGroup.source);
                    if (producedGroup !== false) {
                        producedGroup.addTrades([airdropTrade]);
                    } else {
                        // Create a new collection for producedCoin if no other operations have previously generated this coin
                        tradeGroupCollection.addTradeGroups([new TradeGroup(airdrop.producedCoin, generatorGroup.source, 'trades', [airdropTrade])]);
                    }
                }
            }
        }
        return tradeGroupCollection;
    },

    createDayStacks: function(tradeGroupCollection) {
        let stackCollection = new StackCollection();
        // Loop through each coin object
        for (let group of tradeGroupCollection.tradeGroups) {
            if (group.trades.length > 0) {
                // Convert TradeGroup to Stack with 1s time period
                let stack = group.stackForCoin('1s');
                // Add stack to stack object
                stackCollection.addStack(stack);
            }
        }
        return stackCollection;
    },

    // Get list of all coins in trade_imports database store
    getAllCoinsInDatabase: async function() {
        let coinsBoughtList = await databases.heyStack.getListOfIndex('trade_imports', 'coinIn');
        let coinsSoldList = await databases.heyStack.getListOfIndex('trade_imports', 'coinOut');
        let allCoins = Array.from(new Set(coinsBoughtList.concat(coinsSoldList)));
        // Excludes '' coin, which exists from deposits and withdrawals
        allCoins = allCoins.filter(x => x.length> 0);
        return allCoins;
    },

    // Get all operations for a coin from database and convert to TradeGroups
    getAllCoinTrades: async function(coin) {
        let coinInOperations = await databases.heyStack.getAllElementsOfIndexType('trade_imports', 'coinIn', coin);
        let newGroup = new TradeGroup(coin, 'allExchanges', 'database', coinInOperations);
        let coinOutOperations = await databases.heyStack.getAllElementsOfIndexType('trade_imports', 'coinOut', coin);
        newGroup.createAndAddTrades(coinOutOperations);
        let coinFeeOperations = await databases.heyStack.getAllElementsOfIndexType('trade_imports', 'coinFee', coin);
        newGroup.createAndAddTrades(coinFeeOperations);
        return newGroup;
    },
}
