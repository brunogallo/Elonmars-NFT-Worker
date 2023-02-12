const {parentPort, workerData} = require("worker_threads");
const moment = require('moment');
const sqlFunctions = require('./sqlFunctions');

parentPort.postMessage(setFishSicky());

const probabilities = {
    "commun": 1,
    "uncommun": 0.8,
    "rare": 0.7,
    "epic": 0.5,
    "legendary": 0.3
};

function checkRaritySicky(rarity) {
    let gen = Math.random();

    const values = Object.values(probabilities);
    const rarityValue = values[rarity - 1];

    return (rarityValue > gen);
};

function setFishSicky()
{
    _setFishSicky();

    return "";
};

async function _setFishSicky()
{
    while (true)
    {
        try {
            var fishes = await sqlFunctions.selectAllFish("isBreeding = true AND breedTimeLeft > 0 AND isDead = false");
            var sickyList = [];
            var resetList = [];
            var deadList = [];
    
            fishes.forEach(function(fish) {
                let now = moment().utc();
                let lastSicky = moment(fish.lastSicky).add(4, 'hours').add(59, 'minutes').add(30, 'seconds');
                let sickyAt = moment(fish.sickyAt).add(3, 'hours').add(59, 'minutes').add(30, 'seconds');
    
                if (!fish.isSicky) {
                    if (moment(now).isAfter(lastSicky))
                        if (checkRaritySicky(fish.rarity))
                            sickyList.push(fish.id);
                        else
                            resetList.push(fish.id);
                } else {
                    if (moment(now).isAfter(sickyAt)) {
                        deadList.push(fish.id);
                    }
                }
            });
    
            if ((sickyList.length > 0) || (resetList.length > 0) || (deadList.length > 0))
                await sqlFunctions.setSickyFish(sickyList, resetList, deadList);

        } catch (error) {
            console.log(['---------------', 'workerSicky', '---------------']);
            console.log([error]);
            console.log(['---------------', '---------------', '---------------']);
        }

        let now = moment();
        let nextRun = moment().add(30, 'minutes');

        console.log(`Rotina workerSicky finalizada`);

        await new Promise(resolve => setTimeout(resolve, (nextRun.valueOf() - now.valueOf())));
    }
};