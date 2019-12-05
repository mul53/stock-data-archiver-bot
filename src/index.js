require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Arweave = require('arweave/node');
const CronJob = require('cron').CronJob;

const { fetchNasdaqSymbols, quote } = require('./services/stockService')

const arweavePort = process.env.ARWEAVE_PORT ? process.env.ARWEAVE_PORT : 443;
const arweaveHost = process.env.ARWEAVE_HOST ? process.env.ARWEAVE_HOST : "arweave.net";
const arweaveProtocol = process.env.ARWEAVE_PROTOCOL ? process.env.ARWEAVE_PROTOCOL : "https";

if (!process.env.WALLET_FILE) {
    console.log("⛔ ERROR: Please specify a wallet file to load using argument " +
        "'--wallet-file <PATH>'.")
    process.exit();
}

const rawWallet = fs.readFileSync(path.join(__dirname, process.env.WALLET_FILE));
const wallet = JSON.parse(rawWallet);

const arweave = Arweave.init({
    host: arweaveHost,
    port: arweavePort,
    protocol: arweaveProtocol
});

const dispatchTX = async tx => {
    try {
        const anchorId = await arweave.api.get('/tx_anchor').then(x => x.data);
        tx.last_tx = anchorId;
    
        await arweave.transactions.sign(tx, wallet);
        const res = await arweave.transactions.post(tx);
    
        const output = 
            `\n\n🚀 Transaction ${tx.get("id")} dispatched to \n` +
            `${arweaveHost}:${arweavePort} with response: ${res.status}.`;
        console.log(output);
    } catch (ex) {
        console.log('⛔ Exception :', ex);
    }
}

const archiveStocks = async () => {
    try {
        console.log('Fetching quotes 📈...');
        const symbols = await fetchNasdaqSymbols();
        for (let sym of symbols) {
            const quoteData = await quote(sym);

            if (!quoteData) continue;

            const data = JSON.stringify(quoteData);

            let now = new Date();
            let date = now.toISOString().split('T')[0];

            let tx = await arweave.createTransaction({ data }, wallet);

            tx.addTag('Content-Type', 'application/json');
            tx.addTag('Symbol', quoteData.symbol);
            tx.addTag('Date', date);
            tx.addTag('Stream', 'Stock Quote');

            await dispatchTX(tx);
        }
        console.log('Done fetching quotes 🚀🚀🚀...')
    } catch (ex) {
        console.log('⛔ Exception: ', ex);
    }
}

const run = async () => {
    console.log('Started Stock Archiver Bot 🤖 ...');

    new CronJob('0 0 18 * * 1-5', archiveStocks, null, true, 'America/New_York');
}

run();
