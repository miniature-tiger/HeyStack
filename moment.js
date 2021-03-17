// MOMENT + HISTORY AND ASSOCIATED COLLECTION CLASSES - FOR MANAGEMENT OF TIME SERIES
// ----------------------------------------------------------------------------------

// Multiple key:value pairs at a point in time
class Moment {
    // Initialisation
    constructor(datum, keys) {
        this.date = datum.date;
        this.setValues(datum, keys);
    }

    setValues(datum, keys) {
        for (const key of keys) {
            this[key] = datum[key];
        }
    }

    get dateNumber() {
        return Number(this.date);
    }

    dateValue(key) {
        return {date: this.date, value: this[key]};
    }

    changeKey(oldKey, newKey) {
        this[newKey] = this[oldKey];
        this.removeKey(oldKey);
    }

    removeKey(key) {
        delete this[key];
    }

    checkedValue(key) {
        if (this.hasOwnProperty(key)) {
            if (this[key] === false) {
                return '';
            } else {
                return this[key];
            }
        } else {
            return 0;
        }
    }
}

// Array of moments to produce a time series - sorted by date
// - time period defines date intervals
class History {
    // Initialisation
    constructor(timePeriod, data, keys, minDate, maxDate, aggregate, labels) {
        this.timePeriod = new TimePeriod(timePeriod);
        this.keys = keys.slice(0);
        this.minDate = minDate;
        this.maxDate = maxDate;
        this.moments = [];
        this.labels = labels;
        // Add labels
        for (const label in labels) {
            this[label] = labels[label];
        }
        // Filter data to minDate and maxDate
        let filteredData = this.filterDataByDate(data);
        // Create and add moments
        if (aggregate === true) {
            this.aggregateMoments(filteredData, this.keys);
        } else {
            this.addMoments(filteredData, this.keys);
        }

    }

    filterDataByDate(data) {
        let filteredData = data;
        // Exclude data prior to minDate
        if (this.minDate !== false) {
            filteredData = filteredData.filter(x => x.date >= this.minDate);
        }
        // Exclude data prior to maxDate
        if (this.maxDate !== false) {
            filteredData = filteredData.filter(x => x.date <= this.maxDate);
        }
        return filteredData;
    }

    // Simple addition of moments
    addMoments(filteredData, keys) {
        this.moments = this.moments.concat(filteredData.map(x => this.newMoment(x, keys)));
        this.sortMomentsByDate();
    }

    // Aggregates values of moments with same date into one moment
    aggregateMoments(filteredData, keys) {
        for (const datum of filteredData) {
            let newDate = this.timePeriod.startOfTimePeriodForDate(datum.date);
            // Date does not previously exist
            let index = this.dateIndex(Number(newDate));
            if (index === -1) {
                datum.date = newDate;
                this.moments.push(this.newMoment(datum, keys));
            // Date exists - add to value
            } else {
                for (const key of keys) {
                    if (this.moments[index].hasOwnProperty(key)) {
                        this.moments[index][key] += datum[key];
                    } else {
                        this.moments[index][key] = datum[key];
                    }
                }
            }
        }
        this.sortMomentsByDate();
    }

    sortMomentsByDate() {
        this.moments = this.moments.sort((a, b) => a.date - b.date);
    }

    // Create new moment of matching class
    newMoment(datum, keys) {
        datum.date = this.timePeriod.startOfTimePeriodForDate(datum.date);
        return new Moment(datum, keys);
    }

    // Create new history of matching class
    newHistory(timePeriod, data, keys, minDate, maxDate, aggregate, labels) {
        return new History(timePeriod, data, keys, minDate, maxDate, aggregate, labels)
    }

    get dateNumbers() {
        return this.moments.map(x => Number(x.date));
    }

    dateIndex(dateNumber) {
        return this.dateNumbers.indexOf(dateNumber);
    }

    momentForDate(date) {
        let index = this.dateIndex(Number(date));
        if (index !== -1) {
            return this.moments[index];
        } else {
            return false;
        }
    }

    // Return moment at start of time period for given date
    startTimePeriodMomentForDate(date) {
        let startOfTimePeriod = this.timeperiod.startOfTimePeriodForDate(date);
        return this.momentForDate(startOfTimePeriod);
    }

    // Return moments at beginning and end of time period for given date
    startAndEndTimePeriodMomentsForDate(date) {
        let result = {start: false, end: false};

        let startOfTimePeriod = this.timePeriod.startOfTimePeriodForDate(date);
        let startIndex = this.dateIndex(Number(startOfTimePeriod));

        if (startIndex !== -1) {
            result.start = this.moments[startIndex];
            if (startIndex+1 < this.moments.length) {
                result.end = this.moments[startIndex+1];
            }
        } else {
            let endOfTimePeriod = this.timePeriod.forwardOneTimePeriodForDate(startOfTimePeriod);
            let endIndex = this.dateIndex(Number(endOfTimePeriod));
            if (endIndex !== -1) {
                result.end = this.moments[endIndex];
            }
        }
        return result;
    }

    // Add new date/key ranges to existing moments
    addNewDataRanges(data, keys) {
        this.addKeys(keys);
        this.setValues(data, keys);
    }

    addKeys(keys) {
        // Add keys
        this.keys.push(...keys);
    }

    setValues(data, keys) {
        // Loop through new data dates
        for (const datum of data) {
            let index = this.dateIndex(Number(datum.date));
            // Date exists - add data to moments
            if (index !== -1) {
                this.moments[index].setValues(datum, keys)
            }
        }
    }

    // Change key name in all moments (and replace in keys array)
    changeKey(oldKey, newKey) {
        let oldKeyIndex = this.keys.indexOf(oldKey);
        if (oldKeyIndex !== -1 && this.moments !== false) {
            this.moments.forEach(x => x.changeKey(oldKey, newKey));
            this.keys[oldKeyIndex] = newKey;
        }
    }

    get firstMoment() {
        return this.moments[0];
    }

    get firstMomentDate() {
        return this.firstMoment.date;
    }

    get lastMoment() {
        return this.moments[this.numberOfMoments-1];
    }

    get lastMomentDate() {
        return this.lastMoment.date;
    }

    get numberOfMoments() {
        return this.moments.length;
    }

    get minDateMinusOne() {
        return this.timePeriod.backOneTimePeriodForDate(this.minDate);
    }

    // Create array of all dates for time period between first and last moment
    get dateArrayFromMoments() {
        return this.timePeriod.createDateArray(this.firstMomentDate, this.lastMomentDate);
    }

    // Create array of all dates for time period between minDate and maxDate
    get dateArrayFromMinMaxDates() {
        return this.timePeriod.createDateArray(this.minDate, this.maxDate);
    }

    // Date array based on min/max dates or moments
    // - uses first / last moment if min/max are false
    get fullDateArray() {
        let startDate = this.minDate;
        let endDate = this.maxDate;
        // Use moments to generate start and end of array if to set min and max dates
        if (this.minDate === false) {
            startDate = this.firstMomentDate;
        }
        if (this.maxDate === false) {
            endDate = this.lastMomentDate;
        }
        return this.timePeriod.createDateArray(startDate, endDate);
    }

    get fullDateArrayToNowBackOneOnStart() {
        return this.timePeriod.createDateArray(this.minDateMinusOne, this.timePeriod.mostRecentDateForTimePeriod);
    }

    // Return moment data for key between dates
    dataRange(key, fromDate, toDate) {
        fromDate = this.formatFromDate(fromDate, this.timePeriod.label);
        toDate = this.formatToDate(toDate, this.timePeriod.label);
        let filteredMoments = this.filteredMomentsByDate(fromDate, toDate);
        let dateValues = filteredMoments.map(x => x.dateValue([key]));
        return {dateValues: dateValues}
    }

    formatFromDate(fromDate, timePeriod) {
        if (fromDate === false) {
            fromDate = Number(new Date('2000-01-01T00:00:00.000Z'));
        }
        return fromDate;
    }

    formatToDate(toDate, timePeriod) {
        if (toDate === false) {
            toDate = Number(this.timePeriod.mostRecentDateForTimePeriodPlusOne);
        }
        return toDate;
    }

    filteredMomentsByDate(fromDate, toDate) {
        return this.moments.filter(x => (x.date >= fromDate && x.date <= toDate))
    }

    // Create chart data range
    chartDataRange(key, fromDate, toDate, label, colour, strokeWidth) {
        let dataRange = this.dataRange(key, fromDate, toDate);
        if (dataRange.dateValues.length === 0) {
            return false;
        } else {
            dataRange.label = label;
            dataRange.timePeriod = this.timePeriod.label;
            dataRange.valid = true;
            dataRange.colour = colour;
            dataRange.strokeWidth = strokeWidth;
            return dataRange;
        }
    }

    filterOutZeroMoments(key) {
        this.moments = this.moments.filter(x => x[key] !== 0);
    }

    // Create history based on change in value of key for this history
    changeInValuesHistory(keys) {
        let changeValues = [];
        for (let i=0; i<this.moments.length-1; i+=1) {
            let changeValue = {date: this.moments[i].date};
            for (const key of keys) {
                changeValue[key] = this.moments[i+1][key] - this.moments[i][key];
            }
            changeValues.push(changeValue);
        }
        return this.newHistory(this.timePeriod.label, changeValues, keys, false, false, false, {});
    }

    // Create new history with longer time period (through aggregation of shorter time periods)
    createHistoryForLongerTimePeriod(timePeriodLabel) {
        let newHistory = this.newHistory(timePeriodLabel, this.moments, this.keys, false, false, true, this.labels);
        return newHistory;
    }

}

// Collection of histories
class HistoryCollection {
    // Initialisation
    constructor(timePeriod, histories) {
        this.timePeriod = new TimePeriod(timePeriod);
        this.histories = [];
        //this.totalHistory;

        // Add histories to store
        for (const history of histories) {
            this.addHistory(history);
        }

        // Store earliest and latest moment dates
        this.earliestMomentDate = this.earliestMomentDateCalc();
        this.latestMomentDate = this.latestMomentDateCalc();
    }

    // Store histories in histories array
    addHistory(history) {
        this.histories.push(history);
    }

    earliestMomentDateCalc() {
        let minNumber = Math.min(...this.histories.map(x => Number(x.firstMomentDate)));
        return new Date(minNumber);
    }

    latestMomentDateCalc() {
        //let maxNumber = Math.max(...this.historiesIterable.map(x => Number(x.lastMomentDate)));
        let maxNumber = Math.max(...this.histories.map(x => Number(x.lastMomentDate)));
        return new Date(maxNumber);
    }

    // Delete histories removing those matching values in key value pairs
    deleteHistoriesByKeyValues(keyValues) {
        let filteredHistories = this.histories;
        for (const key in keyValues) {
            filteredHistories = filteredHistories.filter(x => !(keyValues[key].includes(x[key])));
        }
        this.histories = filteredHistories;
    }

    // Create collection of matching class
    newCollection(timePeriod, histories) {
        return new HistoryCollection(timePeriod, histories);
    }

    // Find history in collection based on keyValue object (i.e. {key: value, key2: value2})
    findHistory(keyValues) {
        let filteredHistories = this.histories;
        for (const key of Object.keys(keyValues)) {
            filteredHistories = filteredHistories.filter(x => x[key] === keyValues[key]);
        }
        if (filteredHistories.length > 0) {
            return filteredHistories[0];
        } else {
            return false;
        }
    }

    // Create set of items in collection for a key
    setOfKeys(key) {
        return Array.from(new Set(this.histories.map(x => x[key])));
    }

    // Aggregate all histories by a key (e.g. aggregate all histories by coin)
    aggregateByKey(aggregationKey, keysToInclude, positiveNegative) {
        // Blank HistoryCollection for storage
        let aggregateCollection = this.newCollection(this.timePeriod.label, []);
        // Find set of aggregationKey items
        let keyList = this.setOfKeys(aggregationKey);

        for (const item of keyList) {
            // Filter histories that match item from keyList
            let itemHistories = this.histories.filter(x => x[aggregationKey] === item);
            // Total these histories
            let labels = {};
            labels[aggregationKey] = item;
            let totalItemHistories = this.totalAcrossHistories(itemHistories, labels, keysToInclude, positiveNegative);
            aggregateCollection.addHistory(totalItemHistories);
        }
        return aggregateCollection;
    }

    // Aggregate all histories - positiveNegative allows only aggregation of positive or negative values
    totalAcrossHistories(histories, labels, keysToInclude, positiveNegative) {
        let totalHistory = {};
        if (histories.length > 0) {
            for (const [i, history] of histories.entries()) {
                if (i === 0) {
                    totalHistory = history.newHistory(this.timePeriod.label, this.blankDataArray(this.fullDateArray, keysToInclude), keysToInclude, false, false, false, labels);
                }
                this.addHistoryToTotal(history, totalHistory, keysToInclude, positiveNegative);
            }
            // Remove added moments (for total constructed from non-complete histories)
            this.removeAdditionalMomentsFromTotal(totalHistory);
        }
        return totalHistory;
    }

    addHistoryToTotal(history, totalHistory, keysToInclude, positiveNegative) {
        history.moments.forEach(x => this.addMomentToTotal(x, totalHistory, keysToInclude, positiveNegative));
    }

    addMomentToTotal(moment, totalHistory, keysToInclude, positiveNegative) {
        let arrayNumber = this.timePeriod.numberOfPeriodsBetweenDates(this.earliestMomentDate, moment.date);

        for (const key of keysToInclude) {
            if (isNaN(moment[key])) {
                ////console.log(moment)
            } else {
                let amount = +moment[key];
                if ( (positiveNegative === 'positive' && amount > 0) || (positiveNegative === 'negative' && amount < 0) || (positiveNegative !== 'negative' && positiveNegative !== 'positive') ) {
                    totalHistory.moments[arrayNumber][key] += amount;
                    totalHistory.moments[arrayNumber].keep = true;
                }
            }
        }
    }

    removeAdditionalMomentsFromTotal(totalHistory) {
        // Only keep those moments where a value has been added
        totalHistory.moments = totalHistory.moments.filter(x => x.keep === true);
        // Clean moments
        totalHistory.moments.forEach(x => x.removeKey('keep'));
    }

    get fullDateArray() {
        return this.timePeriod.createDateArray(this.earliestMomentDate, this.latestMomentDate);
    }

    blankDataArray(dateArray, keys) {
        return dateArray.map(x => this.blankDatum(x, keys));
    }

    blankDatum(date, keys) {
        let datum = {date: date};
        for (const key of keys) {
            datum[key] = 0;
        }
        return datum;
    }

    createCollectionForLongerTimePeriod(timePeriodLabel) {
        let newHistories = [];
        for (const history of this.histories) {
            newHistories.push(history.createHistoryForLongerTimePeriod(timePeriodLabel));
        }
        return this.newCollection(timePeriodLabel, newHistories);;
    }

    logLastMoments() {
        for (const history of this.histories) {
            console.log(history.coin, history.lastMoment);
        }
    }

    async export(labelToUse, keysToInclude, exportOrLog) {
        let groupedHistory = this.prepareForExport(labelToUse, keysToInclude);
        if (exportOrLog === true) {
            await this.exportPrepared(groupedHistory);
            console.log(groupedHistory);
        } else {
            console.log(groupedHistory);
        }
    }

    prepareForExport(labelToUse, keysToInclude) {
        let groupedHistory = new History('1d', [], [], false, false, true, {});
        for (let history of this.histories) {
            let newKeys = [];
            for (let keyToInclude of keysToInclude) {
                history.changeKey(keyToInclude, history[labelToUse] + '_' + keyToInclude);
                newKeys.push(history[labelToUse] + '_' + keyToInclude);
            }
            groupedHistory.addKeys(newKeys);
            groupedHistory.aggregateMoments(history.moments, newKeys);
        }
        return groupedHistory;
    }

    async exportPrepared(groupedHistory) {
        let data = groupedHistory.moments;
        let exportHeaders = ['date'].concat(groupedHistory.keys);
        let filename = 'historiesExport';
        let exportHelper = new ExportHelper(data, exportHeaders, filename);
        await exportHelper.exportData();
    }
}


// A history where values aggregate over time
class CumulativeHistory extends History {
    // Initialisation
    constructor(timePeriod, data, keys, minDate, maxDate, aggregate, labels) {
        super(timePeriod, data, keys, minDate, maxDate, false, labels);
        if (this.minDate !== false) {
            this.addOpeningMoment(data, keys);
        }
        this.expandMomentsCumulative(this.fullDateArray);
    }

    // For cumulative histories add an opening moment to reflect cumulative value prior to (or at) minDate
    // - only called if there is a minDate set
    addOpeningMoment(data, keys) {
        let priorData = data.filter(x => x.date <= this.minDate);
        // If no prior data no need to add opening moment
        // - expandMomentsCumulative will start with zero moment for all keys at min date
        if (priorData.length !== 0) {
            let lastPriorDatum = priorData[priorData.length - 1];
            // No need to add opening moment if there is already a cumulative datum at the min date
            if (lastPriorDatum.date.getTime() !== this.minDate.getTime()) {
                let openingMoment = this.newMoment(lastPriorDatum, keys);
                // Change date from last prior moment to minDate
                openingMoment.date = new Date(this.minDate.getTime());
                this.moments.unshift(openingMoment);
            }
        }
    }

    // Expand the moments array by adding a new moment for each missing date of fullDates
    // - cumulative approach sets the new moment based on the previous moment
    expandMomentsCumulative(dates) {
        let data = [];
        let lastFoundMoment = {};
        this.keys.forEach(x => lastFoundMoment[x] = 0);
        let j = 0;
        for (const date of dates) {
            // No Moment for this date => create one
            if (this.moments[j].dateNumber !== Number(date)) {
                let momentDatum = {date: date};
                for (const key of this.keys) {
                    momentDatum[key] = lastFoundMoment[key];
                }
                data.push(momentDatum);
            // Moment exists for this date => increase j
            } else {
                lastFoundMoment = this.moments[j];
                j = Math.min(j+1, this.numberOfMoments-1);
            }
        }
        // Add new moments and sort
        this.addMoments(data, this.keys);
    }
}

// Moment with specific functions for prices
class PriceMoment extends Moment {
    addCalibrationData(timePeriodLabel) {
        // Capture original date
        this.originalDate = new Date(this.date);
        this.valid = true;
        // Calculate nearest correct date to original date
        let timePeriod = new TimePeriod(timePeriodLabel);
        this.date = timePeriod.startOfTimePeriodForDate(this.originalDate);
        this.dateDifference = this.originalDate - this.date;
        if (this.dateDifference > timePeriod.seconds*1000 / 2) {
            this.date = timePeriod.forwardOneTimePeriodForDate(this.date);
            this.dateDifference = this.originalDate - this.date;
        }
    }
}

// History with specific functions for prices
class PriceHistory extends History {
    // No sort by date applied - have to add prices in date order
    // - can set moments to false if there is an issue with the price feed
    addMoments(filteredData, keys) {
        if (filteredData === false) {
            this.moments = false;
        } else {
            this.moments = this.moments.concat(filteredData.map(x => this.newMoment(x, keys)));
        }
    }

    newMoment(datum, keys) {
        return new PriceMoment(datum, keys);
    }

    calibrateDates() {
        // Add calibration data
        for (let moment of this.moments) {
            moment.addCalibrationData(this.timePeriod.label);
        }
        // Mark duplicates
        for (let [i, moment] of this.moments.entries()) {
            if (i < this.moments.length-1) {
                if (Number(this.moments[i].date) === Number(this.moments[i+1].date)) {
                    let sameDates = this.moments.filter(x => Number(x.date) === Number(this.moments[i].date))
                    sameDates.forEach(x => x.valid = false)
                    let smallestDifference = sameDates.reduce((a, c) => Math.abs(c.dateDifference) < Math.abs(a.dateDifference) ? c : a);
                    smallestDifference.valid = true;
                }
            }
        }
        // Remove duplicates
        this.moments = this.moments.filter(x => x.valid === true);
        // Clean moments
        this.moments.forEach(x => x.removeKey('valid'));
        this.moments.forEach(x => x.removeKey('originalDate'));
        this.moments.forEach(x => x.removeKey('dateDifference'));
    }
}

// Moment with specific functions for stacks
class StackMoment extends Moment {
    addValueFiat(fiat) {
        let valueFiat = this.coinAmount * this.priceFiat;
        if (isNaN(valueFiat)) {
            //this.valueFiat = '';
            this.valueFiat = 0;
        } else {
            this.valueFiat = valueFiat;
        }
    }

    checkedValue(key) {
        if (this.hasOwnProperty(key)) {
            if (this[key] === false) {
                return '';
            } else {
                return this[key];
            }
        } else {
            return 0;
        }
    }
}

// History with specific functions for stacks
class StackHistory extends CumulativeHistory {

    newMoment(datum, keys) {
        return new StackMoment(datum, keys);
    }

    addValuesFiat(fiat) {
        let status = this.checkValuesFiatStatus();
        if (status === 'new') {
            this.keys.push('valueFiat');
        }
        if (status !== false) {
            for (const moment of this.moments) {
                moment.addValueFiat(fiat)
            }
        }
    }

    checkValuesFiatStatus() {
        if (!this.keys.includes('priceFiat')) {
            return false;
        } else if (this.keys.includes('valueFiat')) {
            return 'update';
        } else {
            return 'new';
        }
    }

    get coinLabel() {
        if (this.staked === true) {
            if (this.coin === 'HIVE' || this.coin === 'STEEM') {
                return (this.coin + ' POWER');
            } else {
                return (this.coin + ' STAKED');
            }
        } else {
            return this.coin;
        }
    }
}

// Moment with specific functions for coins
class CoinMoment extends Moment {
    addValueFiat() {
        let valueFiat = this.coinAmount * this.priceFiat;
        if (isNaN(valueFiat)) {
            this.valueFiat = 0;
        } else {
            this.valueFiat = valueFiat;
        }
    }

    checkedValue(key) {
        if (this.hasOwnProperty(key)) {
            if (this[key] === false) {
                return '';
            } else {
                return this[key];
            }
        } else {
            return 0;
        }
    }
}

// History with specific functions for coins
class CoinHistory extends History {
    newMoment(datum, keys) {
        return new CoinMoment(datum, keys);
    }

    // Creates new history of matching class
    newHistory(timePeriod, data, keys, minDate, maxDate, aggregate, labels) {
        return new CoinHistory(timePeriod, data, keys, minDate, maxDate, aggregate, labels)
    }

    addValuesFiat(fiat) {
        if (this.keys.includes('priceFiat')) {
            this.keys.push('valueFiat')
            for (const moment of this.moments) {
                moment.addValueFiat(fiat)
            }
        }
    }

    get coinLabel() {
        if (this.staked === true) {
            if (this.coin === 'HIVE' || this.coin === 'STEEM') {
                return (this.coin + ' POWER');
            } else {
                return (this.coin + ' STAKED');
            }
        } else {
            return this.coin;
        }
    }

    createStakedHistoryFromVests(coin) {
        let stakedValues = grapheneTools.convertVestsMomentsToLiquid(coin.toLowerCase(), this.moments, 'coinAmount');
        let labels = {coin: coin, staked: true, source: this.source};
        return new CoinHistory('1d', stakedValues, ['coinAmount'], false, false, false, labels);
    }
}

// History Collection with specific functions for coins
class CoinHistoryCollection extends HistoryCollection {
    addPricesFiat(priceHistories, fiat) {
        for (const history of this.histories) {
            let priceHistory = priceHistories.findHistory({base: history.coin, quote: fiat});
            if (priceHistory !== false) {
                if (priceHistory.moments !== false) {
                    history.addNewDataRanges(priceHistory.moments, ['priceFiat']);
                } else {
                    console.log("no Fiat prices - false")
                }
            } else {
               console.log("no price history")
            }
        }
    }

    addCurrentPricesFiat(userCoins) {
        for (const history of this.histories) {
            if (userCoins.hasOwnProperty(history.coin)) {
                if (userCoins[history.coin].hasOwnProperty('currentPrice')) {
                    let datum = {date: this.timePeriod.mostRecentDateForTimePeriodPlusOne, priceFiat: userCoins[history.coin].currentPrice};
                    history.setValues([datum], ['priceFiat']);
                }
            }
        }
    }

    addValuesFiat(fiat) {
        for (const history of this.histories) {
            history.addValuesFiat(fiat);
        }
    }

    createStakedHistoryFromVests() {
        for (const history of this.histories) {
            if (history.coin === 'HIVEVESTS') {
                let newHistory = history.createStakedHistoryFromVests('HIVE');
                this.addHistory(newHistory);
                this.deleteHistoriesByKeyValues({coin: ['HIVEVESTS']});
            } else if (history.coin === 'STEEMVESTS') {
                let newHistory = history.createStakedHistoryFromVests('STEEM');
                this.addHistory(newHistory);
                this.deleteHistoriesByKeyValues({coin: ['STEEMVESTS']});
            }
        }
    }

    // Allows creation of collection of matching class
    newCollection(timePeriod, histories) {
        return new CoinHistoryCollection(timePeriod, histories);
    }
}

// The original - will eventually be replaced by moment / history combination
class DateValue {
    // Initialisation
    constructor(date, value) {
        this.date = date;
        this.value = value;
    }

    get dateNumber() {
        return Number(this.date);
    }
}

// The original - will eventually be replaced by moment / history combination
class DateValueRange {
    // Initialisation
    constructor(timePeriod, dateValues) {
        this.timePeriod = new TimePeriod(this.timePeriod);
        this.dateValues = dateValues;
    }

    get minDate() {
        let minNumber = Math.min(...this.dateValues.map(x => Number(x.date)));
        return new Date(minNumber);
    }

    get maxDate() {
        let maxNumber = Math.max(...this.dateValues.map(x => Number(x.date)));
        return new Date(maxNumber);
    }

    get maxDateEnd() {
        let minutes = this.timePeriod.minutes;
        return new DateHelper(this.maxDate).addXMinutesToDate(minutes);
    }

    generateFullDates() {
        let currentDate = new DateHelper(this.minDate);
        let fullDates = [];
        while (currentDate.time <= Number(this.maxDate)) {
            fullDates.push(currentDate.date);
            currentDate = new DateHelper(currentDate.addXMinutesToDate(this.timePeriod.minutes));
        }
        return fullDates;
    }
}


// ------- DEVELOPMENT -------------

class LabelledMoment extends Moment {
    // Initialisation
    constructor(datum, keys, labels) {
        super(datum, keys);
        // Add labels
        for (const label in labels) {
            this[label] = labels[label];
        }
    }

    hasSameLabelsAs(labelsToCheck) {
        let result = true;
        for (const [key, value] of Object.entries(labelsToCheck)) {
            if (this.hasOwnProperty(key)) {
                if (this[key] !== value) {
                    return false;
                }
            } else {
                return false;
            }
        }
        return true;
    }

    checkSameDayTrade(otherMoment) {
        if (Number(otherMoment.date) === Number(this.date)) {
            return true;
        } else {
            return false;
        }
    }

}

class LabelledHistory extends History {
    // Initialisation
    //constructor(timePeriod, data, keys, minDate, maxDate, aggregate, historyLabels) {
        // History constructor filters data, adds/aggregateAdds moments, and sorts by date
    //    super(timePeriod, data, keys, minDate, maxDate, aggregate, historyLabels);
    //}

    //addMoments(filteredData, keys) {
    //    this.moments = this.moments.concat(filteredData.map(x => this.newMoment(x, keys)));
    //    this.sortMomentsByDate();
    //}

    aggregateMoments(filteredData, keys, report) {
        for (const datum of filteredData) {
            let newDate = this.timePeriod.startOfTimePeriodForDate(datum.date);
            // Date does not previously exist

            let filteredMoments = this.moments.filter(x => Number(x.date) === Number(newDate));
            filteredMoments = filteredMoments.filter(x => x.hasSameLabelsAs(datum.labels));

            if (filteredMoments.length === 0) {
                //console.log('new date/labels - create');
                this.moments.push(this.newMoment(datum, keys, datum.labels));
            } else {
                //console.log('existing date+labels - aggregate');
                for (const key of keys) {
                    if (filteredMoments[0].hasOwnProperty(key)) {
                        filteredMoments[0][key] += datum[key];
                    } else {
                        filteredMoments[0][key] = datum[key];
                    }
                }
            }
            /*
            if (index === -1) {
                console.log('new date');
                datum.date = newDate;
                this.moments.push(this.newMoment(datum, keys, datum.labels));
                // Date exists - add to value
            } else if (!this.moments[index].hasSameLabelsAs(datum.labels)) {
                console.log('same date, different labels');
                datum.date = newDate;
                this.moments.push(this.newMoment(datum, keys, datum.labels));
            } else {
                console.log('same date, same labels');
                for (const key of keys) {
                    if (this.moments[index].hasOwnProperty(key)) {
                        this.moments[index][key] += datum[key];
                    } else {
                        this.moments[index][key] = datum[key];
                    }
                }
            }
            */
        }
        this.sortMomentsByDate();
    }



    newMoment(datum, keys, momentLabels) {
        datum.date = this.timePeriod.startOfTimePeriodForDate(datum.date);
        return new LabelledMoment(datum, keys, datum.labels);
    }

    // Creates new history of matching class
    newHistory(timePeriod, data, keys, minDate, maxDate, aggregate, labels) {
        return new LabelledHistory(timePeriod, data, keys, minDate, maxDate, aggregate, labels)
    }
}


class GainHistory extends LabelledHistory {
    // Initialisation
    constructor(timePeriod, data, keys, minDate, maxDate, aggregate, labels) {
        // History constructor filters data, adds/aggregateAdds moments, and sorts by date
        super(timePeriod, data, keys, minDate, maxDate, aggregate, labels);

        //this.processSameDayTrades();


        this.calculatePool();
    }

    processSameDayTrades() {
        for (let [i, moment] of this.moments.entries()) {
            if (i < this.moments.length-1) {
                let otherMoment = this.moments[i+1];
                if (moment.checkSameDayTrade(otherMoment)) {
                    // Find min abs coin amount
                    let minCoinAmount = Math.min(Math.abs(this.coinAmount), Math.abs(otherMoment.coinAmount));
                    // For trade with min amount:
                        // change gainCalc to 'sameDay'
                        // coinAmount, fiatValue unchanged

                    // For trade with max amount:
                        // change gainCalc to 'sameDay'
                        // coinAmount = min
                        // fiatValue = (min / Abs coinAmount) *  fiatValue

                    // For trade with max amount:
                        // Calculate new moment with gainCalc 'pool'
                        // leave gainCalc as pool
                        // coinAmount reduced by new moment coinAmount (in either direction)
                        // fiatValue reduced by new moment fiatValue (in either direction)?

                    // For sell sameDay calc realised gain as fiatValue sell - fiatValue buy

                }
            }
        }
    }

    calculatePool() {
        for (let [i, moment] of this.moments.entries()) {
            // Initialise moment from prior moment
            if (i===0) {
                moment['poolAmount'] = 0;
                moment['poolFiatValue'] = 0;
                moment['cumulativeRealisedGainValue'] = 0;
            } else {
                moment['poolAmount'] = this.moments[i-1].poolAmount;
                moment['poolFiatValue'] = this.moments[i-1].poolFiatValue;
                moment['cumulativeRealisedGainValue'] = this.moments[i-1].cumulativeRealisedGainValue;
            }
            if (moment.coinAmount >= 0) {
                moment.poolAmount += moment.coinAmount;
                moment.poolFiatValue += moment.fiatValue;
                moment['realisedGainValue'] = 0;
            } else {
                let purchaseCostOfSold = -Number((moment.poolFiatValue * (moment.coinAmount / moment.poolAmount)).toFixed(2));
                moment.poolAmount += moment.coinAmount;
                moment.poolFiatValue -= purchaseCostOfSold;
                moment['realisedGainValue'] = Number((moment.fiatValue - purchaseCostOfSold).toFixed(2));
                moment.cumulativeRealisedGainValue += moment.realisedGainValue;
            }

        }
    }

}
