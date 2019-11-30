const iex = require('iexcloud_api_wrapper');

const fetchNasdaqSymbols = async () => {
    return require('../utils/nasdaqSym.json').data;
}

const quote = async (sym) => {
    try {
        const quoteData = await iex.quote(sym);
        console.log(quoteData);
    } catch (ex) {
        console.error(`Exception: ${ex.response.data}`);
    }
}

exports.archiveStocks = async () => {
    try {

        for (let sym of await fetchNasdaqSymbols()) {
            const q = await quote(sym);
            break;
        }

    } catch (ex) {
        console.error(`Exception: ${ex}`);
    }
}
