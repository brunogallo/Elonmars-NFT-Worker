const axios = require('axios');
const moment = require('moment');

const apiUrl = 'https://api.play.elonmars.io/api/v1/user/';

const actionClaimDiamond = 'claim/diamond';
const actionClaimBird = 'claim/bird';
const actionStakeDiamond = 'stake/diamond';
const actionStakeBird = 'stake/bird';
const actionSwapResource = 'swap/resource';
const actionSwapEgg = 'swap/egg';

var wallet;

process.on('message', async (message) => {
    // console.log(`Worker processing address: ${message.addressList}`);

    // message.addressList.forEach(address => {
    //     console.log(`ADDRESS ${address}`);
    // });

    wallet = message.walletAddress;
    await Play();
});

async function makePostRequestClaimStake(action, walletAddress, position, diamond) {
    if (diamond != null)
      var data = JSON.stringify({ walletAddress, position, diamond });
    else
      var data = JSON.stringify({ walletAddress, position });
  
    console.log(`${action} - ${data}`);
  
    try {
        const response = await axios.post(apiUrl+action, data, {
            headers: {
              'content-type': 'application/json'
            }
          });
        
          log(response);
          return response.data.success;
    } catch (error) {
      return error.response.data.success;
    }
  }
  
  async function makePostRequestSwap(action, walletAddress, amount) {
    var data = JSON.stringify({ walletAddress, amount });
  
    console.log(`${action} - ${data}`);
  
    try {
        const response = await axios.post(apiUrl+action, data, {
            headers: {
              'content-type': 'application/json'
            }
          });
        
          return response;
    } catch (error) {
        
    }
  }
  
  async function getNextClaim(walletAddress, wait) {
    const data = JSON.stringify({walletAddress,"ref":null});
  
    const response = await axios.post("https://api.play.elonmars.io/api/v1/user", data, {
      headers: {
        'content-type': 'application/json'
      }
    });
  
    try {
      let now = moment();
      // var jsonStakedAt = moment(response.data.stakedDiamond[0].staked_at);
      if (response.data.stakedDiamond != null)
        var jsonNextClaim = moment(response.data.stakedDiamond[0].staked_at).add(181, 'minutes');
      else if (response.data.stakedBirds != null)
        var jsonNextClaim = moment(response.data.stakedBirds[0].staked_at).add(181, 'minutes');
      else
      var jsonNextClaim = 0;

      var jsonNextClaimValue = jsonNextClaim.valueOf() - now.valueOf();
    
      if ((jsonNextClaimValue > 0) && (wait)) {
        // var tempTime = moment.duration(jsonNextClaimValue);
        console.log(`PRÓXIMA COLHEITA ${jsonNextClaim.format('YYYY-MM-DD HH:mm:ss')} PARA A CARTEIRA ${walletAddress}`);
      }
    
      if (wait)
        await new Promise(resolve => setTimeout(resolve, jsonNextClaimValue));
    } catch (error) {
      
    }

    return response.data;
  
  }
  
  async function ClaimDiamond(walletAddress, claimDiamonds) {
    // console.log(claimDiamonds.length);
    for (var index = 0; index < claimDiamonds.length; index++)
      try {
        await makePostRequestClaimStake(actionClaimDiamond, walletAddress, claimDiamonds[index].position);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        
      }
  }
  
  async function ClaimBird(walletAddress, claimBirds) {
    for (var index = 0; index < claimBirds.length; index++)
      try {
        await makePostRequestClaimStake(actionClaimBird, walletAddress, claimBirds[index].position);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
  
      }
  }
  
  async function StakeDiamond(walletAddress, stakedDiamonds, limitIndex) {
    for (var index = 0; index <= limitIndex; index++)
      if (((index >= 0 && index <= 7) ||
           (index == 10) ||
           (index >= 30 && index <= 37) ||
           (index >= 42 && index <= 45))) {
        if (!stakedDiamonds.some(item => item.position == index))
          try {
            console.log("STAKE DIAMANTE");
            var success = await makePostRequestClaimStake(actionStakeDiamond, walletAddress, index, 1);

            if (!success)
              break;

            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
            
          }
      } else {
        continue;
      }
  }
  
  async function StakeBird(walletAddress, stakedBirds, limitIndex) {
    for (var index = 0; index <= limitIndex; index++) {
      if ((limitIndex > 470) || 
            (((index >= 0 && index <= 7) ||
             (index >= 200 && index <= 217) ||
             (index >= 220 && index <= 227) ||
             (index >= 400 && index <= 407) ||
             (index >= 410 && index <= 417)))) {
        if (!stakedBirds.some(item => item.position == index))
          try {
            var success = await makePostRequestClaimStake(actionStakeBird, walletAddress, index);

            if (!success)
              break;

            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (error) {
      
          }
      } else
        continue;
    }
  }
  
  async function SwapResource(walletAddress, resouce) {
    try {
      await makePostRequestSwap(actionSwapResource, walletAddress, resouce);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      
    }
  }
  
  async function SwapEgg(walletAddress, eggs) {
    try {
      await makePostRequestSwap(actionSwapEgg, walletAddress, eggs);  
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      
    }
  }
  
  async function Play(){
    while (true) {
        const walletAddress = wallet;

        var addressData = await getNextClaim(wallet, true);

        var isPremium = true;
        var fullFarm = false;

        console.log();
        console.log(`INICIANDO PARA A WALLET (${walletAddress})`);

        // console.log(addressData.stakedDiamond);

        if (addressData.stakedDiamond != null)
          await ClaimDiamond(walletAddress, addressData.stakedDiamond);

        // console.log(addressData.stakedBirds);

        if (addressData.stakedBirds != null)
          await ClaimBird(walletAddress, addressData.stakedBirds);

        var addressData = await getNextClaim(wallet, false);

        await SwapResource(walletAddress, addressData.resource);

        await SwapEgg(walletAddress, addressData.eggs);

        if (fullFarm)
          await StakeDiamond(walletAddress, addressData.stakedDiamond, isPremium ? 45 : 10);

        await StakeBird(walletAddress, addressData.stakedBirds, fullFarm ? (isPremium ? 407 : 7) : 9999999);

        console.log(`FINALIZADO PARA A WALLET (${walletAddress})`);
        console.log();

        await new Promise(resolve => setTimeout(resolve, 300000));
    }
  }