const iex = require('iexcloud_api_wrapper');

exports.fetchNasdaqSymbols = async () => {
    return require('../utils/nasdaqSym.json').data;
}

exports.quote = async (sym) => {
    try {
        const quoteData = await iex.quote(sym);
        return quoteData;
    } catch (ex) {
        console.error(`⛔ Exception: ${ex.response.data}`);
    }
}
