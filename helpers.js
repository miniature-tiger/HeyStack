// HELPER FUNCTIONS
// ----------------

// Helper for time period (day, hour, minute etc)
class TimePeriod {
    // Initialisation
    constructor(timePeriod) {
        this.label = timePeriod;
    }

    get minutes() {
        switch(this.label) {
            case '1d':
                return 60*24;
                break;
            case '1h':
                return 60;
                break;
            case '1m':
                return 1;
                break;
            default:
                console.log('size not appropriate');
        }
    }

    get seconds() {
        switch(this.label) {
            case '1d':
                return 60*60*24;
                break;
            case '1h':
                return 60*60;
                break;
            case '1m':
                return 60*1;
                break;
            case '1s':
                return 1;
                break;
            default:
                console.log('size not appropriate');
        }
    }

    get mostRecentDateForTimePeriod() {
        let dateNow = new Date();
        return this.startOfTimePeriodForDate(dateNow);
    }

    get mostRecentDateForTimePeriodPlusOne() {
        return this.forwardOneTimePeriodForDate(this.mostRecentDateForTimePeriod);
    }

    startOfTimePeriodForDate(date) {
        // Clone date to prevent changes by reference to date being passed
        let newDate = new Date(date.getTime());
        // Set date elements to zero based on time period length
        switch (this.label) {
            case '1M':
                newDate.setUTCDate(1);
                newDate.setUTCHours(0);
                newDate.setUTCMinutes(0);
                newDate.setUTCSeconds(0);
                newDate.setUTCMilliseconds(0);
            case '1d':
                newDate.setUTCHours(0);
                newDate.setUTCMinutes(0);
                newDate.setUTCSeconds(0);
                newDate.setUTCMilliseconds(0);
                break;
            case '1h':
                newDate.setUTCMinutes(0);
                newDate.setUTCSeconds(0);
                newDate.setUTCMilliseconds(0);
                break;
            case '1m':
                newDate.setUTCSeconds(0);
                newDate.setUTCMilliseconds(0);
                break;
            case '1s':
                newDate.setUTCMilliseconds(0);
                break;
            default:
                console.log('Time period issue.');
        }
        return newDate;
    }

    endOfTimePeriodForDate(date) {
        let startOfTimePeriod = this.startOfTimePeriodForDate(date);
        return this.forwardOneTimePeriodForDate(startOfTimePeriod);
    }

    createDateArray(startDate, endDate) {
        let currentDate = new DateHelper(startDate).date;
        let dateRange = [];
        while (Number(currentDate) <= Number(endDate)) {
            dateRange.push(currentDate);
            currentDate = this.forwardOneTimePeriodForDate(currentDate);
        }
        return dateRange;
    }

    backOneTimePeriodForDate(date) {
        return this.backForwardXTimePeriodsForDate(date, -1)
    }

    forwardOneTimePeriodForDate(date) {
        return this.backForwardXTimePeriodsForDate(date, 1)
    }

    //numberOfTimePeriods positive is forwards
    backForwardXTimePeriodsForDate(date, numberOfTimePeriods) {
        // Move date based on time period length
        switch (this.label) {
            case '1M':
                return new DateHelper(date).moveUTCDateByMonths(numberOfTimePeriods);
                break;
            case '1d':
                return new DateHelper(date).moveUTCDateByDays(numberOfTimePeriods);
                break;
            case '1s':
            case '1m':
            case '1h':
                return new DateHelper(date).addXSecondsToDate(numberOfTimePeriods * this.seconds);
                break;
            default:
                console.log('Time period issue.');
                return false;
        }
    }

    // Returns number of periods between two dates - zero if the dates are the same
    numberOfPeriodsBetweenDates(dateOne, dateTwo) {
        switch (this.label) {
            case '1d':
            case '1h':
            case '1m':
            case '1s':
                return (dateTwo - dateOne) / (1000 * this.seconds);
                break;
            case '1M':
                let monthsTwo = dateTwo.getUTCFullYear() * 12 + dateTwo.getUTCMonth();
                let monthsOne = dateOne.getUTCFullYear() * 12 + dateOne.getUTCMonth();
                return monthsTwo - monthsOne;
                break;
            default:
            //
        }
    }
}

// Helper for date
class DateHelper {
    // Initialisation
    constructor(date) {
        this.date = date;
    }

    get time() {
        return Number(this.date);
    }

    get unixTimestamp() {
        return Math.floor(Number(this.date)/1000);
    }

    addXMinutesToDate(x) {
        let newDate = new Date();
        newDate.setTime(this.date.getTime() + (x*60*1000));
        return newDate;
    }

    addXSecondsToDate(x) {
        let newDate = new Date();
        newDate.setTime(this.date.getTime() + (x*1000));
        return newDate;
    }

    moveUTCDateByDays(numberOfDays) {
        let newDate = new Date(this.date.getTime());
        newDate.setUTCDate(this.date.getUTCDate() + numberOfDays);
        return newDate;
    }

    moveUTCDateByMonths(numberOfMonths) {
        let newDate = new Date(this.date.getTime());
        newDate.setUTCMonth(this.date.getUTCMonth() + numberOfMonths);
        return newDate;
    }

    dateWithTimeZeroUTC() {
        return new Date(Date.UTC(this.date.getUTCFullYear(), this.date.getUTCMonth(), this.date.getUTCDate()));
    }

    dateToText() {
        if (this.date !== false) {
            return this.date.getDate() + "/" + Number(this.date.getMonth()+1) + "/" + this.date.getFullYear();
        } else {
            return false;
        }
    }

}

// Helper for time (date number)
class TimeHelper {
    // Initialisation
    constructor(time) {
        this.time = time;
    }

    get date() {
        return new Date(this.time);
    }

    addXMinutesToDateNumber(x) {
        let newDate = new Date();
        newDate.setTime(this.date.getTime() + (x*60*1000));
        return Number(newDate);
    }

    addXSecondsToDateNumber(x) {
        let newDate = new Date();
        newDate.setTime(this.date.getTime() + (x*1000));
        return Number(newDate);
    }
}

// Helper for formatting numbers
class NumberFormatHelper {
    // Initialisation
    constructor(number) {
        this.number = number;
    }

    currency(code) {
        return new Intl.NumberFormat('en-US', {style: 'currency', currency: code, maximumFractionDigits: 2, minimumFractionDigits: 2}).format(this.number);
    }

    comma(decimalPlaces) {
        return new Intl.NumberFormat('en-US', {maximumFractionDigits: decimalPlaces, minimumFractionDigits: decimalPlaces}).format(this.number);
    }

    xdpNumber(decimalPlaces) {
        return Number(this.number.toFixed(decimalPlaces));
    }

    sigFigDec(significant) {
        if (this.number !== 0) {
            let magnitude = Math.max(Math.floor(Math.log10(Math.abs(this.number)))+1, 0);
        } else {
            return 0;
        }
    }

    xdpAfterMagNumber(decimalPlaces) {
        if (this.number !== 0) {
            let magnitude = Math.min(Math.floor(Math.log10(Math.abs(this.number))), 0);
            return Number(this.number.toFixed(decimalPlaces - magnitude - 1));
        } else {
            return 0;
        }
    }

}

// Export helper
class ExportHelper {
    // Initialisation
    constructor(data, headers, filename) {
        this.data = data;
        this.headers = headers;
        this.filename = this.filenameCreator(filename);
    }

    filenameCreator(filename) {
        let date = new Date();
        return String(filename) + '_' + date.getUTCFullYear() + '-' + ("0" + (date.getUTCMonth()+1)).slice(-2) + '-' + ("0" + date.getUTCDate()).slice(-2) + '.csv';
    }

    // Export data to .csv file
    async exportData() {
        // Convert operations to csv format
        let csvFormattedData = this.convertOperationsToCSVComplex();
        // Export operations to disk
        await this.exportFile(this.filename, csvFormattedData);
    }

    async exportFile(filename, csvFormattedData) {
        let element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csvFormattedData));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();
        document.body.removeChild(element);
    }

    convertOperationsToCSVComplex() {
        // Convert dates to ISO date format timestamps and delete id
        for (let datum of this.data) {
            if (datum.hasOwnProperty('date')) {
                datum.date = datum.date.toISOString();
            }
        }
        // Create header array and push to final output
        let headers = this.headers.map(x => x.toString());
        let total = [headers];
        // Add data to final output
        for (const datum of this.data) {
            let line = [];
            for (const header of headers) {
                if (datum.hasOwnProperty(header)) {
                    line.push(datum[header]);
                } else {
                    line.push('');
                }
            }
            total.push(line);
        }

        let csvContent = '';
        for (let [i, line] of total.entries()) {
            if (i===0) {
                csvContent += line;
            } else {
                csvContent += "\r\n" + line;
            }
        }
        return csvContent;
    }



}

// Object extension without extending object
class ObjectHelper {
    // Initialisation
    constructor(object) {
        this.object = object;
    }

    checkEquality(duplicate, ignoreKeys) {
        // Check keys identical
        let objectKeys = Object.keys(this.object);
        let duplicateKeys = Object.keys(duplicate);
        let objectKeysHelper = new ArrayHelper(objectKeys);
        if (objectKeysHelper.checkEquality(duplicateKeys) === false) {
            return false;
        }

        for (let key of objectKeys) {
            if (!ignoreKeys.includes(key)) {
                let objectValue = this.object[key];
                let duplicateValue = duplicate[key];
                if (typeof objectValue === 'object' && typeof objectValue === 'object') {
                    let subObjectHelper = new ObjectHelper(objectValue);
                    if (subObjectHelper.checkEquality(duplicateValue, []) === false) {
                        return false;
                    }
                } else {
                    if (objectValue !== duplicateValue) {
                        return false;
                    }
                }
            }
        }
        // Otherwise return true
        return true;
    }

}

// Array extension without extending array
class ArrayHelper {
    // Initialisation
    constructor(array) {
        this.a = array;
    }

    checkEquality(b) {
        if (this.a == null || b == null) return false;
        if (this.a.length !== b.length) return false;
        for (let i = 0; i < this.a.length; i+=1) {
            if (this.a[i] !== b[i]) {
                return false;
            }
        }
        return true;
    }

}
