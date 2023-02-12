const {parentPort, workerData} = require("worker_threads");
const moment = require('moment');
const sqlFunctions = require('./sqlFunctions');

parentPort.postMessage(setGemFish());

const probabilities = {
    "commun": 0.4,
    "uncommun": 0.6,
    "rare": 0.8,
    "epic": 0.9,
    "legendary": 1
};

function checkRarityGem(rarity) {
    let gen = Math.random(); 

    const values = Object.values(probabilities);
    const gemValue = values[rarity - 1];

    return (gemValue >= gen);
};

function setGemFish()
{
    _setGemFish();

    return "";
};

async function _setGemFish()
{
    while (true)
    {
        try {
            var fishes = await sqlFunctions.selectAllFish("isBreeding = false AND gemsValue = 0");
            var gemList = [];
            var resetList = [];
    
            fishes.forEach(function(fish) {            
                    let now = moment().utc();
                    let lastGemPick = moment(fish.lastGemPick).add(3, 'hours').add(59, 'minutes').add(30, 'seconds');
                    
                    if (moment(now).isAfter(lastGemPick))
                        if (checkRarityGem(fish.rarity))
                            gemList.push(fish.id);
                        else
                            resetList.push(fish.id);
            });
    
            if ((dirtyList.length > 0) || (luckyList.length > 0))
                await sqlFunctions.setGemFish(gemList, resetList);

        } catch (error) {
            console.log(['---------------', 'workerGem', '---------------']);
            console.log([error]);
            console.log(['---------------', '---------------', '---------------']);
        }

        let now = moment();
        let nextRun = moment().add(30, 'minutes');

        console.log(`Rotina workerGem finalizada`);

        await new Promise(resolve => setTimeout(resolve, (nextRun.valueOf() - now.valueOf())));
    }
};