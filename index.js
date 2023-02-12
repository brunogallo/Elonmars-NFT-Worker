const express = require("express");
const { fork } = require('child_process');
const fs = require('fs');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/"));

const walletPayment = "0x6ACBB20B1035eF8ae0CFfF3D5e61a1A70d9b72e2";
const price = 0.0065;

const backupBuyers = 'buyers.txt';

var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// const minhas = 0x4C3F032fDC892Af2fdAEdD8519B5240e39d06d52, 0x757f48F4d64bf679eF8416E42bE0bE1d3814a9Ea, 0xef91FefD1E3695e6D0Ba300893FD45b3Fa0e0559, 0xc1703056e85Ce988Eb542d1d7CaEDCde066505f6, 0xCE43dC6544da19E9651cED4A1Fa2Eb8bB4861fCD, 0xF6fEDf2628E19FaCca87B9de99efA10Ef237c627, 0x9E6142A8CcE077a4d4B7f2daF9e0A4840472adb7, 0x9B6C64C33397Dd8695C7c7D90B0CE7441f4309E0, 0xeB29596302b3a0FE3D61F95dc7eC7a299eDEA4c4, 0xa10d50C0bf04A10adC4489fF5cdfB6eb5810Bf2a
// const gallo = 0xEc857D011742B3Bd9c7Af0984b4e937C47163427

async function ReloadBuyers() {
  fs.readFile(backupBuyers, 'utf-8', function (error, fileContent) {
    if (error) {
      console.error(error);
    } else {
      const addresses = fileContent.split('\n');
      
      addresses.forEach(address => {
        var addressStr = address.trim();
        if (addressStr != "") {
          var worker = fork('./worker.js');
          worker.send({ addressStr });
        }
      });
    }
  });
}

async function SaveAddress(address) {
  fs.readFile(backupBuyers, 'utf-8', function (error, fileContent) {
    if (error) {
      console.error(error);
    } else {
      const addresses = fileContent.split('\n');
      if (addresses.includes(address)) {
        console.log(`The address ${address} already exists in ${backupBuyers}.`);
      } else {
        fs.appendFile(backupBuyers, `\n${address}`, function (error) {
          if (error) {
            console.error(error);
          } else {
            console.log(`The address ${address} has been added to ${backupBuyers}.`);
          }
        });
      }
    }
  });
}

async function SendNewWallet(res, address, txHash, isDev) {
  var validation;
  if (!isDev)
    web3.eth.getTransaction(txHash)
    .then(transaction => {
      validation = (transaction.from == address) && (transaction.from == walletPayment) && (transaction.value / (10 ** 18) == price);

      // console.log('Transaction: ', transaction);
      // console.log('transaction.from: ', transaction.from);
      // console.log('transaction.to: ', transaction.to);
      // console.log('transaction.value: ', transaction.value);
      // console.log('transaction.value / (10 ** 18): ', transaction.value / (10 ** 18));
    })
    .catch(error => {
      res.send('Transaction error');
    });

  if ((isDev) || (validation)) {

    await SaveAddress(address);

    const worker = fork('./worker.js');
    worker.send({ address });
    
    res.send(`Worker started for address: ${address}.`);
  } else {
    res.send(`Purchase cancelled, error validating payment information.`);
  }
}

app.get('/start/:address', (req, res) => {
  const address = req.params.address;
  const txHash = String(req.body.txHash);
  const isDev = req.body.isDev;

  SendNewWallet(res, address, txHash, isDev);
});

ReloadBuyers();

app.listen(3000, () => {
  console.log(`Example app listening on port ${3000}`);
});