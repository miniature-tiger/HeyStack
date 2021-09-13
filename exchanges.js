// EXCHANGE API FUNCTIONS
// -----------------------

// Coingecko api functions
let coingecko = {

    // Fetch list of coins with IDs
    fetchCoinList: async function() {
        let response = await fetch("https://api.coingecko.com/api/v3/coins/list");
        return await response.json();
    },

    // Market prices for updating current coin prices
    fetchMarketPrices: async function(coinIds, currency) {
        let formattedCurrency = currency.toLowerCase();

        let batches = [];
        while (coinIds.length > 0) {
            batches.push(coinIds.splice(0, 50));
        }

        let results = [];
        for (let batch of batches) {
            let batchResult = await this.fetchMarketPricesSinglePage(batch, formattedCurrency);
            results = results.concat(batchResult);
        }
        return results;

    },

    // Market prices for updating current coin prices
    fetchMarketPricesSinglePage: async function(coinIds, formattedCurrency) {

        let ids = '';
        if (coinIds.length > 0) {
            for (let [i, id] of coinIds.entries()) {
                if (i === 0) {
                    ids = id;
                } else {
                    ids = ids + ',' + id;
                }
            }
        }
        let dataString = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=' + formattedCurrency + '&ids=' + ids + '&order=market_cap_desc&per_page=50&page=1&sparkline=false';
        let response = await fetch(dataString);
        return await response.json();
    },

    // Fetch crypto price histories - all prices from now backwards x time periods
    fetchHistoricPrices: async function(coin, currency, timePeriodLabel, timePeriodsToFetch) {
        let daysToFetch = this.calibrateDaysToFetch(timePeriodLabel, timePeriodsToFetch);
        let result = await this.fetchHistoricPricesPrivate(coin, currency, timePeriodLabel, daysToFetch);
        // Extract prices from result
        if (result === false) {
            return false;
        } else {
            if (timePeriodLabel === '1d') {
                return result.prices;
            } else {
                return result.prices.slice(-(timePeriodsToFetch+1));
            }
        }
    },

    // Fetch crypto price histories
    fetchHistoricPricesPrivate: async function(coin, currency, timePeriodLabel, daysToFetch) {
        // Set currency to lower case
        let formattedCurrency = currency.toLowerCase();
        let dataString;
        if (timePeriodLabel === '1d') {
            dataString = 'https://api.coingecko.com/api/v3/coins/' + coin + '/market_chart?vs_currency=' + formattedCurrency + '&days=' + daysToFetch + '&interval=daily';
        } else {
            dataString = 'https://api.coingecko.com/api/v3/coins/' + coin + '/market_chart?vs_currency=' + formattedCurrency + '&days=' + daysToFetch;
        }
        let response = await fetch(dataString);
        if (response.ok === true) {
            return await response.json();
        } else {
            return false;
        }
    },

    // Converting number of time periods into number of days
    calibrateDaysToFetch: function(timePeriodLabel, timePeriodsToFetch) {
        if (timePeriodLabel === '1d') {
            // use 'daily' parameter
            return timePeriodsToFetch;
        } else if (timePeriodLabel === '1h') {
            // daysToFetch needs to be > 1 to return hours info (else minutes)
            let daysToFetch = timePeriodsToFetch / 24;
            return Math.max(25/24, daysToFetch);
        }
    },

    // Fetch historic prices for coin over set period
    fetchHistoricPricesRange: async function(coin, currency, fromDate, toDate) {
        // Set currency to lower case
        let formattedCurrency = currency.toLowerCase();
        // Generate request URL
        let dataString = 'https://api.coingecko.com/api/v3/coins/' + coin + '/market_chart/range?vs_currency=' + formattedCurrency + '&from=' + fromDate + '&to=' + toDate;
        // Request data
        let response = await fetch(dataString);
        if (response.ok === true) {
            return await response.json();
        } else {
            return false;
        }
    },
}

// Binance api functions
let binance = {
    // API
    api: "https://api.binance.com/api/v3/",

    // Fetch list of coin pairs
    exchangeInfo: async function() {
        //let response = await fetch("https://api.binance.com/api/v3/klines?symbol=LTCBTC&interval=1d");
        let response = await fetch(this.api + "exchangeInfo");
        return await response.json();
    },
}
