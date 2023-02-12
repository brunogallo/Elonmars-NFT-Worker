const axios = require('axios');
const moment = require('moment');

const urlClaimDiamond = 'https://api.play.elonmars.io/api/v1/user/claim/diamond';
const urlClaimBird = 'https://api.play.elonmars.io/api/v1/user/claim/bird';
const urlStakeDiamond = 'https://api.play.elonmars.io/api/v1/user/stake/diamond';
const urlStakeBird = 'https://api.play.elonmars.io/api/v1/user/stake/bird';
const urlSwapResource = 'https://api.play.elonmars.io/api/v1/user/swap/resource';
const urlSwapEgg = 'https://api.play.elonmars.io/api/v1/user/swap/egg';

var wallet;

process.on('message', async (message) => {
    // console.log(`Worker processing address: ${message.addressList}`);

    // message.addressList.forEach(address => {
    //     console.log(`ADDRESS ${address}`);
    // });

    wallet = message.addressStr;
    await Play();
});

async function makePostRequestClaimStake(url, walletAddress, position, diamond) {
    if (diamond != null)
      var data = JSON.stringify({ walletAddress, position, diamond });
    else
      var data = JSON.stringify({ walletAddress, position });
  
    console.log(data);
  
    try {
        const response = await axios.post(url, data, {
            headers: {
              'content-type': 'application/json'
            }
          });
        
          return response;
    } catch (error) {
        
    }
  }
  
  async function makePostRequestSwap(url, walletAddress, amount) {
    var data = JSON.stringify({ walletAddress, amount });
  
    console.log(data);
  
    try {
        const response = await axios.post(url, data, {
            headers: {
              'content-type': 'application/json'
            }
          });
        
          return response;
    } catch (error) {
        
    }
  }
  
  async function getNextClaim(walletAddress) {
    const data = JSON.stringify({walletAddress,"ref":null});
  
    const response = await axios.post("https://api.play.elonmars.io/api/v1/user", data, {
      headers: {
        'content-type': 'application/json'
      }
    });
  
    try {
      let now = moment();
      // var jsonStakedAt = moment(response.data.stakedDiamond[0].staked_at);
      var jsonNextClaim = moment(response.data.stakedDiamond[0].staked_at).add(181, 'minutes');
      var jsonNextClaimValue = jsonNextClaim.valueOf() - now.valueOf();
    
      if (jsonNextClaimValue > 0) {
        // var tempTime = moment.duration(jsonNextClaimValue);
        console.log(`PRÓXIMA COLHEITA ${jsonNextClaim.format('YYYY-MM-DD HH:mm:ss')} PARA A CARTEIRA ${walletAddress}`);
      }
    
      await new Promise(resolve => setTimeout(resolve, jsonNextClaimValue));
    } catch (error) {
      
    }
  
  }
  
  async function ClaimDiamond(walletAddress) {
      for (var index = 0; index < 11; index++) {
        try {
          var log = await makePostRequestClaimStake(urlClaimDiamond, walletAddress, index);
        } catch (error) {
          
        }
      }
  }
  
  async function ClaimBird(walletAddress) {
    for (var index = 0; index < 8; index++) {
      try {
        var log = await makePostRequestClaimStake(urlClaimBird, walletAddress, index);
      } catch (error) {
  
      }
    }
  }
  
  async function StakeDiamond(walletAddress) {
    for (var index = 0; index < 9; index++) {
      try {
        var log = await makePostRequestClaimStake(urlStakeDiamond, walletAddress, index, 1);
      } catch (error) {
  
      }
    }
  }
  
  async function StakeBird(walletAddress) {
    for (var index = 0; index < 8; index++) {
      try {
        var log = await makePostRequestClaimStake(urlStakeBird, walletAddress, index);
      } catch (error) {
  
      }
    }
  }
  
  async function SwapResource(walletAddress) {
    try {
      var log = await makePostRequestSwap(urlSwapResource, walletAddress, 45);
    } catch (error) {
      
    }
  }
  
  async function SwapEgg(walletAddress) {
    try {
      var log = await makePostRequestSwap(urlSwapEgg, walletAddress, 8);  
    } catch (error) {
      
    }
  }
  
  async function Play(){
    while (true) {
        const walletAddress = wallet;

        await getNextClaim(wallet);

        console.log();
        console.log(`INICIANDO PARA A WALLET (${walletAddress})`);
        console.log();

        await ClaimDiamond(walletAddress);

        await ClaimBird(walletAddress);

        await SwapResource(walletAddress);

        await SwapEgg(walletAddress);

        await StakeDiamond(walletAddress);

        await StakeBird(walletAddress);
    }
  }