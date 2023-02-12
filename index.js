const express = require("express");
const { fork } = require('child_process');
const fs = require('fs');
const Web3 = require('web3');
const BigNumber = require('bignumber.js');
// const web3 = new Web3(new Web3.providers.HttpProvider("https://bsc-dataseed.binance.org/"));
const web3 = new Web3(new Web3.providers.HttpProvider("https://data-seed-prebsc-1-s1.binance.org:8545/"));

const walletPayment = "0x6ACBB20B1035eF8ae0CFfF3D5e61a1A70d9b72e2";
const price = 0.0065;

const backupBuyers = 'buyers.txt';
const backupTx = 'tx.txt';

var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

// const minhas = 0x4C3F032fDC892Af2fdAEdD8519B5240e39d06d52, 0x757f48F4d64bf679eF8416E42bE0bE1d3814a9Ea, 0xef91FefD1E3695e6D0Ba300893FD45b3Fa0e0559, 0xc1703056e85Ce988Eb542d1d7CaEDCde066505f6, 0xCE43dC6544da19E9651cED4A1Fa2Eb8bB4861fCD, 0xF6fEDf2628E19FaCca87B9de99efA10Ef237c627, 0x9E6142A8CcE077a4d4B7f2daF9e0A4840472adb7, 0x9B6C64C33397Dd8695C7c7D90B0CE7441f4309E0, 0xeB29596302b3a0FE3D61F95dc7eC7a299eDEA4c4, 0xa10d50C0bf04A10adC4489fF5cdfB6eb5810Bf2a
// const gallo = 0xEc857D011742B3Bd9c7Af0984b4e937C47163427

app.get('/', (req, res) => {
  res.send("Hello world!")
});

async function ReloadBuyers() {
  try {
  fs.readFile(backupBuyers, 'utf-8', function (error, fileContent) {
    if (error) {
      console.error(error);
    } else {
      const addresses = fileContent.split('\n');
      
      addresses.forEach(address => {
        var walletAddress = address.trim();
        if (walletAddress != "") {
          var worker = fork('./worker.js');
          worker.send({ walletAddress });
        }
      });
    }
  });
  } catch (error) {
    console.log(error);  
  }
}

async function SaveAddress(address) {
  return new Promise((resolve, reject) => {
    fs.readFile(backupBuyers, 'utf-8', function (error, fileContent) {
      if (error) {
        console.error(error);
        return resolve(false);
      } else {
        const addresses = fileContent.split('\n');
        if (addresses.includes(address)) {
          console.log(`The address ${address} already exists in ${backupBuyers}.`);
          return resolve(false);
        } else {
          fs.appendFile(backupBuyers, `\n${address}`, function (error) {
            if (error) {
              console.error(error);
              return resolve(false);
            } else {
              console.log(`The address ${address} has been added to ${backupBuyers}.`);
              return resolve(true);
            }
          });
        }
      }
    });
  });
}

async function SaveTx(txHash) {
  try {
    const fileContent = await new Promise((resolve, reject) => {
      fs.readFile(backupTx, 'utf-8', (error, content) => {
        if (error) {
          reject(error);
        } else {
          resolve(content);
        }
      });
    });

    const txs = fileContent.split('\n');
    if (txs.includes(txHash)) {
      console.log(`The TX ${txHash} already exists in ${backupTx}.`);
      return false;
    } else {
      await new Promise((resolve, reject) => {
        fs.appendFile(backupTx, `\n${txHash}`, (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      console.log(`The TX ${txHash} has been added to ${backupTx}.`);
      return true;
    }
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function validateTransaction(txHash, address) {
  try {
    const transaction = await web3.eth.getTransaction(txHash);
    const validation = (String(transaction.from).toLowerCase() == String(address).toLowerCase()) && 
      (String(transaction.to).toLowerCase() == String(walletPayment).toLowerCase()) && 
      (BigNumber(transaction.value / (10 ** 18)) >= BigNumber(price));

    return validation;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function SendNewWallet(res, address, txHash, isDev) {
  try {
    var walletAddress = address;
    var validation = await validateTransaction(txHash, address);

    if ((isDev) || (validation)) {
      if (await SaveAddress(walletAddress)) {
        if (await SaveTx(txHash)) {

          const worker = fork('./worker.js');
          worker.send({ walletAddress });
          
          var response = [true, `Worker started for address: ${walletAddress}.`];
          // res.send(`Worker started for address: ${walletAddress}.`);
        } else {
          var response = [false, `Purchase cancelled, transaction already used.`];
          // res.send(`Purchase cancelled, transaction already used.`);
        }
      } else {
        var response = [false, `Purchase cancelled, address already exists.`];
      }
    } else {
      var response = [false, `Purchase cancelled, error validating payment information.`];
      // res.send(`Purchase cancelled, error validating payment information.`);
    }
  } catch (error) {
    console.log(error);
  }

  res.send(response);
}

app.get('/start/:address', (req, res) => {
  try {
    const address = req.params.address;
    const txHash = String(req.body.txHash);
    const isDev = req.body.isDev;

    SendNewWallet(res, address, txHash, isDev);
  } catch (error) {
    console.log(error);
  }
});

ReloadBuyers();

app.listen(3000, () => {
  console.log(`Example app listening on port ${3000}`);
});