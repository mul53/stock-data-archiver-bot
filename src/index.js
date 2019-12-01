require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Arweave = require('arweave/node');

const { fetchNasdaqSymbols, quote } = require('./services/stockService')

const arweavePort = process.env.ARWEAVE_PORT ? process.env.ARWEAVE_PORT : 443;
const arweaveHost = process.env.ARWEAVE_HOST ? process.env.ARWEAVE_HOST : "arweave.net";
const arweaveProtocol = process.env.ARWEAVE_PROTOCOL ? process.env.ARWEAVE_PROTOCOL : "https";

if (!process.env.WALLET_FILE) {
    console.log("ERROR: Please specify a wallet file to load using argument " +
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
    
        const output = `
        Transaction ${tx.get("id")} dispatched to
        ${arweaveHost}:${arweavePort} with response: ${res.status}.`;

        console.log(output);
    } catch (ex) {
        console.log('Exception :', ex);
    }
}

const archiveStocks = async () => {
    try {
        for (let sym of await fetchNasdaqSymbols()) {
            const {
                symbol,
                companyName,
                open,
                close,
                high,
                previousClose,
                marketCap,
                week52High,
                week52Low,
                ytdChange
            } = await quote(sym);

            const data = JSON.stringify({
                symbol,
                companyName,
                open,
                close,
                high,
                previousClose,
                marketCap,
                week52High,
                week52Low,
                ytdChange
            });

            let now = new Date();
            let date = now.toISOString().split('T')[0];

            let tx = await arweave.createTransaction({ data }, wallet);

            tx.addTag('Content-Type', 'application/json');
            tx.addTag('Symbol', symbol);
            tx.addTag('Date', date);
            tx.addTag('Stream', 'Stock Quote');

            dispatchTX(tx);

            break;
        }
    } catch (ex) {
        console.log('Exception: ', ex);
    }
}

archiveStocks();