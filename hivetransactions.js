// TRANSACTION CLASS - FOR HIVE / STEEM TRANSACTIONS
// -------------------------------------------------

// A single financial transaction from the Hive or Steem blockchain - extensions below cover specifics
class Transaction {
    // Initialisation
    constructor(datum, address, addressNumber, detail, source) {
        // Translate single account_history operation into transaction
        if (source === 'blockchain') {
            this.constructFromBlockchain(datum, address, addressNumber, detail);
        // Recreate transaction from stored data
        } else if (source === 'database') {
            this.constructFromDatabase(datum);
        }
    }

    // Translate single account_history operation into transaction
    constructFromBlockchain(datum, address, addressNumber, detail) {
        // Type
        this.type = datum[1].op[0];
        // Date
        this.date = this.transactionDate(datum);
        // Set currencies - based on date for Hive
        if (detail === true) {
            this.setCurrenciesAndStorage();
        }
        // Transaction numbers
        this.blockNumber = Number(datum[1].block);
        this.virtualTransactionNumber = Number(datum[1].virtual_op);
        if (this.virtualTransactionNumber > 0 && this.type !== 'fill_order' && this.type !== 'interest') {
            this.transactionNumber = 0; // Virtual operation - fill_order and interest are virtual but needs transaction numbers too
        } else {
            this.transactionNumber = Number(datum[1].trx_in_block); // Chain operation
        }
        this.subTransactionNumber = 0;
        this.addressNumber = addressNumber;
        this.id = this.blockNumber + '_' + this.transactionNumber + '_' + this.virtualTransactionNumber + '_' + this.subTransactionNumber + '_' + this.addressNumber;
        // Rewards
        this.rewarded = {};
        this.claimed = {};
        // Transfer
        this.from = '';
        this.to = '';
        this.memo = '';
        // Transaction specific
        this.address = address;
        if (detail === true) {
            this.transactionSpecific(datum);
        }
        // Count
        this.numberOfTransactions = 1;
        this.historyId = Number(datum[0]);
    }

    // Recreate transaction from stored data
    constructFromDatabase(datum) {
        this.id = datum.id;
        this.blockNumber = datum.blockNumber;
        this.transactionNumber = datum.transactionNumber;
        this.virtualTransactionNumber = datum.virtualTransactionNumber;
        this.subTransactionNumber = datum.subTransactionNumber;
        this.date = datum.date;
        this.rewarded = datum.rewarded;
        this.claimed = datum.claimed;
        this.from = datum.from;
        this.to = datum.to;
        this.memo = datum.memo;
        this.type = datum.type;
        this.addressNumber = datum.addressNumber;
        this.numberOfTransactions = datum.numberOfTransactions;
        this.historyId = datum.historyId;
    }

    // Transaction Date
    transactionDate(datum) {
        return new Date(datum[1].timestamp + '.000Z');
    }

    // Data from transaction to store in database
    get dataToStore() {
        return {
            id: this.id,
            blockNumber: this.blockNumber,
            transactionNumber: this.transactionNumber,
            virtualTransactionNumber: this.virtualTransactionNumber,
            subTransactionNumber: this.subTransactionNumber,
            date: this.date,
            rewarded: this.rewarded,
            claimed: this.claimed,
            from: this.from,
            to: this.to,
            memo: this.memo,
            type: this.type,
            addressNumber: this.addressNumber,
            numberOfTransactions: this.numberOfTransactions,
            historyId: this.historyId
        }
    }

    // Data from transaction to create full range transaction
    get dataForFullRange() {
        return {number: this.historyId, date: this.date, id: this.id};
    }

    // Data from transaction to create range transaction
    get dataForRange() {
        return {number: this.historyId, id: this.id};
    }

    // Split id into elements (used to create transaction data from id)
    get idBreakdown() {
        let split = this.id.split("_");
        return {
            id: this.id,
            blockNumber: Number(split[0]),
            transactionNumber: Number(split[1]),
            virtualTransactionNumber: Number(split[2]),
            subTransactionNumber: Number(split[3]),
            addressNumber: Number(split[4])
        }
    }

    // Check if this transaction is earlier than other transaction based on id info
    checkEarlierLaterEqual(otherTransaction) {
        if (this.id === otherTransaction.id) {
            return 'equal';
        }

        if (this.blockNumber < otherTransaction.blockNumber) {
            return 'earlier';
        } else if (this.blockNumber > otherTransaction.blockNumber) {
            return 'later';
        }

        // Equal blocknumbers
        console.log('------------------- EQUAL BLOCKNUMBERS -------------------', this.id, otherTransaction.id);
        console.log('----------------------------------------------------------');

        // Virtual operations are earlier than transactions in same block
        if (this.virtualTransactionNumber > 0 && otherTransaction.virtualTransactionNumber === 0) {
            return 'earlier';
            console.log('earlier')
        } else if (this.virtualTransactionNumber === 0 && otherTransaction.virtualTransactionNumber > 0) {
            return 'later';
            console.log('later')
        }

        if (this.virtualTransactionNumber > 0) { // Both virtual operations
            if (this.virtualTransactionNumber < otherTransaction.virtualTransactionNumber) {
                return 'earlier';
                console.log('earlier')
            } else if (this.virtualTransactionNumber > otherTransaction.virtualTransactionNumber) {
                return 'later';
                console.log('later')
            }
        } else { // Both transactions
            if (this.transactionNumber < otherTransaction.transactionNumber) {
                return 'earlier';
                console.log('earlier')
            } else {
                return 'later';
                console.log('later')
            }
        }

        if (this.subTransactionNumber < otherTransaction.subTransactionNumber) {
            return 'earlier';
            console.log('earlier')
        } else {
            return 'later';
            console.log('later')
        }
    }

    // Check if this transaction is earlier than other transaction id
    checkEarlierLaterEqualThanId(otherId) {
        let otherTransaction = this.transactionFromId(otherId);
        return this.checkEarlierLaterEqual(otherTransaction);
    }

    // Create transaction from id
    transactionFromId(id) {
        let idOnlyTransaction = new Transaction({id: id}, false, false, false, 'database');
        return new Transaction(idOnlyTransaction.idBreakdown, false, false, false, 'database');
    }

    get dataToExport() {
        // Copy nested transaction data
        let storeData = this.dataToStore;
        // Get coin keys
        let coinKeys = Array.from(new Set(Object.keys(storeData.rewarded).concat(Object.keys(storeData.claimed))));
        // Add value for each coin in coin keys
        for (const coin of coinKeys) {
            storeData[coin] = this.sumAcrossRewardedAndClaimed(coin);
        }
        // Delete rewarded and claimed and memo
        delete storeData.rewarded;
        delete storeData.claimed;
        delete storeData.memo;
        // Return
        return storeData;
    }

    get nonCoinHeadersToExport() {
        // Get dataToStore keys
        let storeHeaders = Object.keys(this.dataToStore);
        // Delete rewarded and claimed and memo
        storeHeaders = storeHeaders.filter(x => x !== 'rewarded' && x !== 'claimed' && x !== 'memo');
        return storeHeaders;
    }

    // Sum rewarded and claimed
    sumAcrossRewardedAndClaimedDateValue(coin) {
        let coinSum = this.sumAcrossRewardedAndClaimed(coin);
        if (coinSum === false) {
            return false;
        } else {
            return {date: this.date, value: coinSum};
        }
    }

    sumAcrossRewardedAndClaimed(coin) {
        let found = false;
        let result = 0;
        if (this.rewarded.hasOwnProperty(coin)) {
            result += this.rewarded[coin];
            found = true;
        }
        if (this.claimed.hasOwnProperty(coin)) {
            result += this.claimed[coin];
            found = true;
        }
        if (found === true) {
            return result;
        } else {
            return false;
        }
    }

    // Transaction specific calculations
    transactionSpecific(datum) {
        switch (this.type) {
            case 'author_reward':
                this.authorReward(datum);
                break;
            case 'curation_reward':
                this.curationReward(datum);
                break;
            case 'comment_benefactor_reward':
                if (datum[1].op[1].benefactor == this.address) {
                    this.benefactorReward(datum);
                }
                break;
            case 'producer_reward':
                this.producerReward(datum);
                break;
            case 'proposal_pay':
                this.proposalPay(datum);
                break;
            case 'interest':
                this.interest(datum);
                break;
            case 'claim_reward_balance':
                this.claimRewardBalance(datum);
                break;
            case 'transfer':
                this.transfer(datum);
                break;
            case 'fill_convert_request':
                this.fillConvertRequest(datum);
                break;
            case 'fill_vesting_withdraw':
                this.fillVestingWithdraw(datum);
                break;
            case 'transfer_to_vesting':
                this.transferToVesting(datum);
                break;
            case 'fill_order':
                this.fillOrder(datum);
                break;
            case 'account_create_with_delegation':
            case 'account_create':
            case 'claim_account':
                this.accountCreation(datum);
                break;
            case 'create_proposal':
                this.createProposal(datum);
            default:
                // No action
        }
    }

    // Create curation reward transaction object
    curationReward(datum) {
        this.rewarded[this.currencies.staked] = Number(Number(datum[1].op[1].reward.split(' ')[0]).toFixed(6));
    }

    // Witness block reward transaction object
    producerReward(datum) {
        this.rewarded[this.currencies.staked] = Number(Number(datum[1].op[1].vesting_shares.split(' ')[0]).toFixed(6));
    }

    // Payment from proposl funding transaction object
    proposalPay(datum) {
        let [amount, currency] = datum[1].op[1].payment.split(' ');
        switch (currency) {
            case 'HIVE':
            case 'STEEM':
                this.claimed[this.currencies.liquid] = Number(Number(amount).toFixed(3));
                break;
            case 'HBD':
            case 'SBD':
                this.claimed[this.currencies.stable] = Number(Number(amount).toFixed(3));
                break;
            case 'VESTS':
                this.claimed[this.currencies.staked] = Number(Number(amount).toFixed(6));
                break;
            default:
                console.log("currency error");
        }
    }

    // Stable coin interest
    interest(datum) {
        if (datum[1].op[1].owner === this.address) {
            this.claimed[this.currencies.stable] = Number(Number(datum[1].op[1].interest.split(' ')[0]).toFixed(3));
        }
    }

    // Create transfer transaction object
    transfer(datum) {
        // Direction (of transfer) handles +/- sign for transfer in/out respectively
        let direction = 1;
        if (datum[1].op[1].from === this.address) {
            direction = -1;
        }
        // Determine balance changes based on currency of transfer and direction of transfer
        let [amount, currency] = datum[1].op[1].amount.split(' ');
        switch (currency) {
            case 'HIVE':
            case 'STEEM':
                this.claimed[this.currencies.liquid] = Number(Number(amount * direction).toFixed(3));
                break;
            case 'HBD':
            case 'SBD':
                this.claimed[this.currencies.stable] = Number(Number(amount * direction).toFixed(3));
                break;
            default:
                console.log("transfer currency error");
        }
        // Other transaction elements
        this.from = datum[1].op[1].from;
        this.to = datum[1].op[1].to;
        this.memo = datum[1].op[1].memo;
    }

    // Create transaction object for 3.5 day conversion of backed dollars to liquid
    fillConvertRequest(datum) {
        this.claimed[this.currencies.liquid] = Number(Number(datum[1].op[1].amount_out.split(' ')[0]).toFixed(3));
        this.claimed[this.currencies.stable] = Number(Number(-1 * datum[1].op[1].amount_in.split(' ')[0]).toFixed(3));
    }

    // Create power down weekly payment transaction object
    fillVestingWithdraw(datum) {
        // Power down from own account: reduce vests. Other account: just record where from.
        this.from = datum[1].op[1].from_account;
        if (datum[1].op[1].from_account === this.address) {
            this.claimed[this.currencies.staked] = Number(Number(-1 * datum[1].op[1].withdrawn.split(' ')[0]).toFixed(6));
        }
        // Power down to own account: increase liquid. Other account: just record where to.
        // - Added vests for "power across"!
        this.to = datum[1].op[1].to_account;
        let [amount_deposited, currency_deposited] = datum[1].op[1].deposited.split(' ');
        if (datum[1].op[1].to_account === this.address) {
            switch (currency_deposited) {
                case 'HIVE':
                case 'STEEM':
                    this.claimed[this.currencies.liquid] = Number(Number(amount_deposited).toFixed(3));
                    break;
                case 'VESTS':
                    this.claimed[this.currencies.staked] = Number(Number(amount_deposited).toFixed(6));
                    break;
                default:
                    console.log("transfer currency error");
            }
        }
    }

    // Create exchange transaction object
    fillOrder(datum) {
        // Setup
        let [currentAmount, currentCurrency] = datum[1].op[1].current_pays.split(' ');
        let [openAmount, openCurrency] = datum[1].op[1].open_pays.split(' ');
        openAmount = Number(openAmount);
        currentAmount = Number(currentAmount);
        this.claimed[this.currencies.liquid] = 0;
        this.claimed[this.currencies.stable] = 0;

        // Address is current owner (no need to capture other participant)
        if (datum[1].op[1].current_owner == this.address) {
            switch (currentCurrency) {
                // Pay liquidCoin for backedDollar
                case 'HIVE':
                case 'STEEM':
                    this.claimed[this.currencies.liquid] = Number((-1 * currentAmount).toFixed(3));
                    this.claimed[this.currencies.stable] = Number(openAmount.toFixed(3));
                    break;
                // Pay backedDollar for liquidCoin
                case 'HBD':
                case 'SBD':
                    this.claimed[this.currencies.stable] = Number((-1 * currentAmount).toFixed(3));
                    this.claimed[this.currencies.liquid] = Number(openAmount.toFixed(3));
                    break;
                default:
                    console.log("exchange currency error");
            }
        }
        // Address is open owner (no need to capture other participant)
        if (datum[1].op[1].open_owner === this.address) {
            switch (openCurrency) {
                // Pay liquidCoin for backedDollar
                case 'HIVE':
                case 'STEEM':
                    this.claimed[this.currencies.liquid] += Number((-1 * openAmount).toFixed(3));
                    this.claimed[this.currencies.stable] += Number(currentAmount.toFixed(3));
                    break;
                // Pay backedDollar for liquidCoin
                case 'HBD':
                case 'SBD':
                    this.claimed[this.currencies.stable] += Number((-1 * openAmount).toFixed(3));
                    this.claimed[this.currencies.liquid] += Number(currentAmount.toFixed(3));
                    break;
                default:
                    console.log("exchange currency error");
            }
        }
    }

    // Account creation transaction object
    accountCreation(datum) {
        if (datum[1].op[1].creator === this.address) {
            let [amount, currency] = datum[1].op[1].fee.split(' ');
            switch (currency) {
                case 'HIVE':
                case 'STEEM':
                    this.claimed[this.currencies.liquid] = Number(Number(-1 * amount).toFixed(3));
                    break;
                case 'HBD':
                case 'SBD':
                    this.claimed[this.currencies.stable] = Number(Number(-1 * amount).toFixed(3));
                    break;
                default:
                    console.log("transfer currency error");
            }
        }
    }

    // List of handled transactions (including virtual operations)
    static transactionsList() {
        return [
            'author_reward',
            'curation_reward',
            'comment_benefactor_reward',
            'producer_reward',
            'claim_reward_balance',
            'transfer',
            'fill_convert_request',
            'fill_vesting_withdraw',
            'transfer_to_vesting',
            'fill_order',
            'account_create',
            'account_create_with_delegation',
            'claim_account',
            'proposal_pay',
            'create_proposal',
            'interest'
        ]
    }

}

// Create transaction from DATA OBTAINED FROM HIVE BLOCKCHAIN
// - but resulting transaction WILL BE DENOMINATED IN STEEM and stored in Steem wallet if before airdrop
// - transaction will be denominated in Hive and stored in Hive wallet if after airdrop
// - extension mainly dealing with the words hive and hbd in data from blockchain
class HiveTransaction extends Transaction {
    setCurrenciesAndStorage() {
        let airdropDate = new Date('2020-03-20T14:00:00.000Z');
        if (this.date < airdropDate) { // STEEM era
            this.currencies = {liquid: 'STEEM', stable: 'SBD', staked: 'STEEMVESTS'};
            this.storage = 'steem';
        } else { // HIVE era
            this.currencies = {liquid: 'HIVE', stable: 'HBD', staked: 'HIVEVESTS'};
            this.storage = 'hive';
        }
    }

    // Create author reward transaction object
    authorReward(datum) {
        this.rewarded[this.currencies.liquid] = Number(Number(datum[1].op[1].hive_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.stable] = Number(Number(datum[1].op[1].hbd_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.staked] = Number(Number(datum[1].op[1].vesting_payout.split(' ')[0]).toFixed(6));
    }

    // Create benefactor reward transaction object
    benefactorReward(datum) {
        this.rewarded[this.currencies.liquid] = Number(Number(datum[1].op[1].hive_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.stable] = Number(Number(datum[1].op[1].hbd_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.staked] = Number(Number(datum[1].op[1].vesting_payout.split(' ')[0]).toFixed(6));
    }

    // Create claim rewards transaction object
    claimRewardBalance(datum) {
        this.claimed[this.currencies.liquid] = Number(Number(datum[1].op[1].reward_hive.split(' ')[0]).toFixed(3));
        this.claimed[this.currencies.stable] = Number(Number(datum[1].op[1].reward_hbd.split(' ')[0]).toFixed(3));
        this.claimed[this.currencies.staked] = Number(Number(datum[1].op[1].reward_vests.split(' ')[0]).toFixed(6));
        this.rewarded[this.currencies.liquid] = -this.claimed[this.currencies.liquid];
        this.rewarded[this.currencies.stable] = -this.claimed[this.currencies.stable];
        this.rewarded[this.currencies.staked] = -this.claimed[this.currencies.staked];
    }

    // Create power up transaction object
    transferToVesting(datum) {
        let amount = Number(datum[1].op[1].amount.split(' ')[0]);
        // Power up from own account: decrease liquid. Other account: just record where from.
        this.from = datum[1].op[1].from;
        if (datum[1].op[1].from === this.address) {
            this.claimed[this.currencies.liquid] = Number(Number(-1 * amount).toFixed(3));
        }
        // Power up to own account: increase vests.
        // - No vests available!!! So calcuate.
        // - Other account: just record where to.
        this.to = datum[1].op[1].to;
        if (datum[1].op[1].to === this.address) {
            this.claimed[this.currencies.staked] = Number(grapheneTools.convertLiquidToVests(this.date, amount, this.storage).toFixed(3));
        }
    }

    // Fees for creating a DAO proposal
    // - Introduced under HF21. Fees changed on Hive under HF24.
    // - Fees not included in blockchain data! Need to calculate!
    createProposal(datum) {
        // Only include cost if account is proposal creator who pays (not receiver who gets funds)
        if (datum[1].op[1].creator === this.address) {
            let hf24Block = 47797680;
            // Pre HF24 just a flat 10HBD cost
            if (this.blockNumber < hf24Block) {
                this.claimed[this.currencies.stable] = -10;
            // After HF24 a flat 10HBD cost plus 1HBD for every day over 60 days
            } else {
                let endDate = new Date(datum[1].op[1].end_date + '.000Z');
                let startDate = new Date(datum[1].op[1].start_date + '.000Z');
                let numberOfDays = Math.floor((endDate - startDate) / (60*60*24*1000));
                let extraNumberOfDays = Math.max(numberOfDays - 60, 0);
                this.claimed[this.currencies.stable] = -10 - (1 * extraNumberOfDays);
            }
        }
    }
}

// Create transaction from DATA OBTAINED FROM STEEM BLOCKCHAIN
// - resulting transaction will be denominated in Steem and stored in Steem wallet
// - extension mainly dealing with the words steem and sbd in data from blockchain
class SteemTransaction extends Transaction {
    setCurrenciesAndStorage() {
        this.currencies = {liquid: 'STEEM', stable: 'SBD', staked: 'STEEMVESTS'};
        this.storage = 'steem';
    }

    // Create author reward transaction object
    authorReward(datum) {
        this.rewarded[this.currencies.liquid] = Number(Number(datum[1].op[1].steem_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.stable] = Number(Number(datum[1].op[1].sbd_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.staked] = Number(Number(datum[1].op[1].vesting_payout.split(' ')[0]).toFixed(6));
    }

    // Create benefactor reward transaction object
    benefactorReward(datum) {
        this.rewarded[this.currencies.liquid] = Number(Number(datum[1].op[1].steem_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.stable] = Number(Number(datum[1].op[1].sbd_payout.split(' ')[0]).toFixed(3));
        this.rewarded[this.currencies.staked] = Number(Number(datum[1].op[1].vesting_payout.split(' ')[0]).toFixed(6));
    }

    // Create claim rewards transaction object
    claimRewardBalance(datum) {
        this.claimed[this.currencies.liquid] = Number(Number(datum[1].op[1].reward_steem.split(' ')[0]).toFixed(3));
        this.claimed[this.currencies.stable] = Number(Number(datum[1].op[1].reward_sbd.split(' ')[0]).toFixed(3));
        this.claimed[this.currencies.staked] = Number(Number(datum[1].op[1].reward_vests.split(' ')[0]).toFixed(6));
        this.rewarded[this.currencies.liquid] = -this.claimed[this.currencies.liquid];
        this.rewarded[this.currencies.stable] = -this.claimed[this.currencies.stable];
        this.rewarded[this.currencies.staked] = -this.claimed[this.currencies.staked];
    }

    transferToVesting(datum) {
        let amount = Number(datum[1].op[1].amount.split(' ')[0]);
        // Power up from own account: decrease liquid. Other account: just record where from.
        this.from = datum[1].op[1].from;
        if (datum[1].op[1].from === this.address) {
            this.claimed[this.currencies.liquid] = Number(Number(-1 * amount).toFixed(3));
        }
        // Power up to own account: increase vests.
        // - No vests available!!! So calcuate.
        // - Other account: just record where to.
        this.to = datum[1].op[1].to;
        if (datum[1].op[1].to === this.address) {
            this.claimed[this.currencies.staked] = Number(grapheneTools.convertLiquidToVests(this.date, amount, this.storage).toFixed(3));
        }
    }

    // Fees for creating a DAO proposal
    // - Introduced under HF21. Fees changed on Hive under HF24.
    // - Fees not included in blockchain data! Need to calculate!
    createProposal(datum) {
        // Only include cost if account is proposal creator who pays (not receiver who gets funds)
        if (datum[1].op[1].creator === this.address) {
            this.claimed[this.currencies.stable] = -10;
        }
    }


}

// A group of transactions (not a history as not a time series)
class TransactionGroup {
    // Initialisation
    constructor(dataSource, data, blockchainName) {
        //console.log(dataSource, data, blockchainName)
        this.blockchainName = blockchainName;
        // Create TransactionGroup from database info
        // - No restriction on duplicates
        this.transactions = [];
        this.addTransactions(dataSource, data);
    }

    addTransactions(dataSource, data) {
        if (dataSource === "database") {
            this.transactions = this.transactions.concat(this.formatDataIntoTransactions(data));
        // Create TransactionGroup from another TransactionGroup
        } else {
            this.transactions = this.transactions.concat(data);
        }
    }

    // Add new transactions - converts from database info to Transaction instances
    formatDataIntoTransactions(data) {
        if (this.blockchainName === 'hive') {
            return data.map(x => new HiveTransaction(x, false, false, false, 'database'));
        } else if (this.blockchainName === 'steem') {
            return data.map(x => new SteemTransaction(x, false, false, false, 'database'));
        }
    }

    get dataToExport() {
        return this.transactions.map(x => x.dataToExport);
    }

    // Create stacks from transactions in this group (used for balance roll ups and charts)
    createStackCollectionFromTransactions(coins, label) {
        // Create blank stack collection
        let transactionsStacks = new StackCollection();
        // Create new stack for each coin
        for (const coin of coins) {
            let newStack = this.createStackFromTransactions(this.transactions, coin, label);
            if (newStack !== false) {
                transactionsStacks.addStack(newStack);
            }
        }
        return transactionsStacks;
    }

    createStackFromTransactions(transactions, coin, label) {
        let coinDateValues = transactions.map(x => x.sumAcrossRewardedAndClaimedDateValue(coin));
        coinDateValues = coinDateValues.filter(x => x !== false);
        if (coinDateValues.length > 0) { // Only create stack if there are some transactions
            return new Stack(coin, false, label, '1d', coinDateValues);
        } else {
            return false;
        }
    }

    // Create coin history collection from transactions in this group (used for journey transaction charts)
    createCoinHistoryCollectionFromTransactions(transactionDates, coins) {
        let historiesToAdd = [];
        for (const coin of coins) {
            let newHistory = this.createCoinHistoryFromTransactions(this.transactions, transactionDates, coin);
            if (newHistory !== false) {
                historiesToAdd.push(newHistory);
            }
        }
        let transactionCollection = new CoinHistoryCollection('1d', historiesToAdd);
        return transactionCollection;
    }

    createCoinHistoryFromTransactions(transactions, transactionDates, coin) {
        let coinDateValues = transactions.map(x => x.sumAcrossRewardedAndClaimedDateValue(coin));
        coinDateValues = coinDateValues.filter(x => x !== false);
        if (coinDateValues.length > 0) {
            let coinAmounts = coinDateValues.map(x => ({date: x.date, coinAmount: x.value}));
            let labels = {coin: coin, staked: false, source: 'wallet'};
            let newHistory = new CoinHistory('1d', coinAmounts, ['coinAmount'], transactionDates.startDate, transactionDates.endDate, true, labels);
            return newHistory;
        } else {
            return false;
        }
    }

}
