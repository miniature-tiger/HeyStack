// STACK AND STACK COLLECTION CLASSES - FOR MANAGEMENT OF PORTFOLIO STACKS
// -----------------------------------------------------------------------

// Stack exists for single coin+staked+source combination - based around change record
class Stack {
    // Initialisation
    constructor(coin, staked, source, timePeriod, dateValues) {
        this.coin = coin;
        this.staked = staked;
        this.source = source;
        this.timePeriod = new TimePeriod(timePeriod);
        this.changeRecord = [];
        this.createChangeRecord(dateValues);
        //this.coingeckoId;
    }

    // Aggregate data into change record by time period
    createChangeRecord(dateValues) {
        switch (this.timePeriod.label) {
            case 'none':
                this.changeRecord = dateValues;
                break;
            case '1s':
            case '1h':
            case '1d':
            case '1M':
                for (const dateValue of dateValues) {
                    let newDate = this.timePeriod.startOfTimePeriodForDate(dateValue.date);
                    // Date does not previously exist
                    let index = this.dateIndex(Number(newDate));

                    if (index === -1) {
                        this.changeRecord.push(new DateValue(newDate, dateValue.value));
                    // Date exists - add to value
                    } else {
                        this.changeRecord[index].value += dateValue.value;
                    }
                }
                break;
            default:
                console.log('Time period issue.');
        }
    }

    // Aggregate change record values over time (at end of time period)
    get cumulativeChangeRecord() {
        // Sort prior to accumulating
        this.sortChangeRecordByDate()
        // Accumulate
        let cumulative = [];
        let cumulValue = 0;

        for (const dateValue of this.changeRecord) {
            let newDate;
            switch (this.timePeriod.label) {
                case 'none':
                    newDate = new Date(dateValue.date);
                    break;
                case '1s':
                case '1h':
                    // Move cumulative date to end of period
                    // - since it includes trades from throughout the period
                    newDate = this.timePeriod.forwardOneTimePeriodForDate(dateValue.date);
                    break;
                case '1d':
                    // Move cumulative date to start of next day (end of day)
                    // - since it includes trades from the date of dateValue
                    newDate = new DateHelper(dateValue.date).moveUTCDateByDays(1);
                    break;
                case '1M':
                    // Move cumulative date to start of next day (end of day)
                    // - since it includes trades from the date of dateValue
                    newDate = new DateHelper(dateValue.date).moveUTCDateByMonths(1);
                    break;
                default:
                console.log('Time period issue.');
            }
            cumulValue = Number((cumulValue + dateValue.value).toFixed(8));
            cumulative.push({date: newDate, coinAmount: cumulValue});
        }
        return cumulative;
    }

    // Create stack history for time period
    createStackHistory(minDate, maxDate) {
        let historyName = Stack.historyNames(this.timePeriod.label);
        let labels = {coin: this.coin, staked: this.staked, source: this.source};
        this[historyName] = new StackHistory(this.timePeriod.label, this.cumulativeChangeRecord, ['coinAmount'], minDate, maxDate, false, labels);
    }

    // Create a stack history for a longer time period
    // - shorter time period cannot be created due to lack of time detail
    // - same timePeriod stack history can be created directly with createStackHistory
    createStackHistoryForLongerTimePeriod(historyTimePeriodLabel, minDate, maxDate) {
        let historyTimePeriod = new TimePeriod(historyTimePeriodLabel);
        let newStack = new Stack(this.coin, this.staked, this.source, historyTimePeriod.label, this.changeRecord);
        newStack.createStackHistory(minDate, maxDate);
        let historyName = Stack.historyNames(historyTimePeriod.label);
        return newStack[historyName];
    }

    // Date numbers (time) for change record
    get dateNumbers() {
        return this.changeRecord.map(x => Number(x.date));
    }

    dateIndex(dateNumber) {
        return this.dateNumbers.indexOf(dateNumber);
    }

    sortChangeRecordByDate() {
        this.changeRecord = this.changeRecord.sort((a, b) => a.date - b.date);
    }

    // Total value of change record
    get total() {
        let total = 0;
        for (const dateValue of this.changeRecord) {
            total += dateValue.value;
        }
        return Number(total.toFixed(8));
    }

    setCoinGeckoId(id) {
        this.coingeckoId = id;
    }

    // History name enum
    static historyNames(timePeriodLabel) {
        switch (timePeriodLabel) {
            case '1M':
                return 'monthHistory';
                break;
            case '1d':
                return 'dayHistory';
                break;
            case '1h':
                return 'hourHistory';
                break;
            default:
                console.log('Time period issue.');
        }
    }
}

// Collection of stacks (single coin+staked+source combinations)
class StackCollection {
    // Initialisation
    constructor(stacks) {
        this.stacks = [];
        // new StackCollection without argument creates a blank collection
        if (stacks !== undefined) {
            for (const stack of stacks) {
                addStack(stack);
            }
        }
    }

    addStack(stack) {
        this.stacks.push(stack);
    }

    addStacks(newStacks) {
        for (const stack of newStacks) {
            this.stacks.push(stack);
        }
    }

    // Replace existing stack - used when updating trades / transactions
    updateStacks(newStacks) {
        for (const stack of newStacks) {
            this.deleteStack(stack.coin, stack.staked, stack.source);
            this.addStack(stack);
        }
    }

    deleteStack(coin, staked, source) {
        let deleteIndex = this.findStackIndex(coin, staked, source);
        if (deleteIndex !== -1) {
            this.stacks.splice(deleteIndex, 1);
        }
    }

    // Delete stacks which match value included in key:[value] array pairs
    deleteStacksByKeyValues(keyValues) {
        let filteredStacks = this.stacks;
        for (const key in keyValues) {
            filteredStacks = filteredStacks.filter(x => !(keyValues[key].includes(x[key])));
        }
        this.stacks = filteredStacks;
    }

    findStack(coin, staked, source) {
        return this.stacks.find(x => x.coin === coin && x.staked === staked && x.source === source);
    }

    findStackIndex(coin, staked, source) {
        return this.stacks.findIndex(x => x.coin === coin && x.staked === staked && x.source === source);
    }

    get numberOfStacks() {
        return Object.keys(this.stacks).length;
    }

    // Adds fiat prices to histories
    addPricesFiat(historyTimePeriod, priceHistories, fiat) {
        for (const stack of this.stacks) {
            let priceHistory = priceHistories.findHistory({base: stack.coin, quote: fiat});
            if (priceHistory !== false) {
                if (priceHistory.moments !== false) {
                    let historyName = Stack.historyNames(historyTimePeriod);
                    stack[historyName].addNewDataRanges(priceHistory.moments, ['priceFiat']);
                } else {
                    //console.log(stack.coin + " - no Fiat prices - false")
                }
            } else {
               //console.log("no price history")
            }
        }
    }

    // Adds current prices to histories
    addCurrentPricesFiat(historyTimePeriod, userCoins) {
        for (const stack of this.stacks) {
            if (userCoins.hasOwnProperty(stack.coin)) {
                if (userCoins[stack.coin].hasOwnProperty('currentPrice')) {
                    let datum = {date: new TimePeriod(historyTimePeriod).mostRecentDateForTimePeriodPlusOne, priceFiat: userCoins[stack.coin].currentPrice};
                    let historyName = Stack.historyNames(historyTimePeriod);
                    stack[historyName].setValues([datum], ['priceFiat']);
                }
            }
        }
    }

    // Adds fiat values to histories
    addValuesFiat(historyTimePeriod, fiat) {
        for (const stack of this.stacks) {
            let historyName = Stack.historyNames(historyTimePeriod);
            //console.log(stack[historyName])
            stack[historyName].addValuesFiat(fiat);
        }
    }

    // Create data ranges for charts (currently not used)
    dataRanges(historyTimePeriod, key, fromDate, toDate, label, strokeWidth) {
        let chartData = [];
        let historyName = Stack.historyNames(historyTimePeriod);

        for (const stack of this.stacks) {
            if (stack[historyName][key] !== false) {
                let historyChartData = stack[historyName].chartDataRange(key, fromDate, toDate, stack[label], false, strokeWidth);
                if (historyChartData !== false) {
                    chartData.push(stack[historyName].chartDataRange(key, fromDate, toDate, stack[label], false, strokeWidth));
                }
            }
        }
        return chartData;
    }

    // Create stack histories for all stacks
    createStackHistories(startDate, endDate) {
        for (const stack of this.stacks) {
            if (stack.changeRecord.length > 0) { // Only create history if there is are some transactions!
                stack.createStackHistory(startDate, endDate);
            }
        }
    }

    createStackHistoriesForLongerTimePeriod(timePeriodLabel, startDate, endDate) {
        for (const stack of this.stacks) {
            let timePeriod = new TimePeriod(timePeriodLabel);
            let historyName = Stack.historyNames(timePeriod.label);
            stack[historyName] = stack.createStackHistoryForLongerTimePeriod(timePeriod.label, startDate, endDate);
        }
    }

    // Create history collection from stack collection
    createHistoryCollection(timePeriodLabel) {
        let histories = this.stacks.map(x => x[Stack.historyNames(timePeriodLabel)]).filter(x => x.valueFiat !== false);
        return new HistoryCollection(timePeriodLabel, histories);
    }

}
