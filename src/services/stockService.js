const iex = require('iexcloud_api_wrapper');

exports.quote = async (sym) => {
    try {
        const quoteData = await iex.quote(sym);
        console.log(quoteData);
    } catch (ex) {
        console.error(`Exception: ${ex.response.data}`);
    }
}