const {parentPort, workerData} = require("worker_threads");
const moment = require('moment');
const sqlFunctions = require('./sqlFunctions');

parentPort.postMessage(setFishHungry());

const probabilities = {
    "commun": 1,
    "uncommun": 0.9,
    "rare": 0.8,
    "epic": 0.6,
    "legendary": 0.4
};

function checkRarityHungry(rarity) {
    let gen = Math.random();

    const values = Object.values(probabilities);
    const rarityValue = values[rarity - 1];

    return (rarityValue > gen);
};

function setFishHungry()
{
    _setFishHungry();

    return "";
};

async function _setFishHungry()
{
    while (true)
    {
        try {
            var fishes = await sqlFunctions.selectAllFish("isBreeding = true AND breedTimeLeft > 0 AND isDead = false");
            var hungryList = [];
            var resetList = [];
            var deadList = [];
    
            fishes.forEach(function(fish) {
                let now = moment().utc();
                let lastHungry = moment(fish.lastHungry).add(3, 'hours').add(59, 'minutes').add(30, 'seconds');
                let hungryAt = moment(fish.hungryAt).add(3, 'hours').add(59, 'minutes').add(30, 'seconds');
    
                if (!fish.isHungry) {
                    if (moment(now).isAfter(lastHungry))
                        if (checkRarityHungry(fish.rarity))
                            hungryList.push(fish.id);
                        else
                            resetList.push(fish.id);
                } else {
                    if (moment(now).isAfter(hungryAt))
                        deadList.push(fish.id);
                }
            });
    
            if ((hungryList.length > 0) || (resetList.length > 0) || (deadList.length > 0))
                await sqlFunctions.setHungryFish(hungryList, resetList, deadList);   

        } catch (error) {
            console.log(['---------------', 'workerHungry', '---------------']);
            console.log([error]);
            console.log(['---------------', '---------------', '---------------']);
        }

        let now = moment();
        let nextRun = moment().add(30, 'minutes');

        console.log(`Rotina workerHungry finalizada`);

        await new Promise(resolve => setTimeout(resolve, (nextRun.valueOf() - now.valueOf())));
    }
};