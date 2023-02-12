const {parentPort, workerData} = require("worker_threads");
const moment = require('moment');
const sqlFunctions = require('./sqlFunctions');

parentPort.postMessage(setFishDead());

function setFishDead()
{
    _setFishDead();

    return "";
};

async function _setFishDead()
{
    while (true)
    {
        var fishes = await sqlFunctions.selectAllFish("isBreeding = true AND breedTimeLeft > 0 AND (isHungry = true OR isSicky = true)");
        var deadList = [];

        fishes.forEach(function(fish) {
            let now = moment();
            let lastHungry = fish.lastHungry;
            let lastSicky = fish.lastSicky;
            
            if ((moment(now).isAfter(moment(lastHungry).add(4, 'hours'))) ||
                (moment(now).isAfter(moment(lastSicky).add(4, 'hours'))))
                deadList.push(fish.id);
        });

        if (deadList.length > 0)
            await sqlFunctions.setDeadFish(deadList);

        let now = moment();
        let nextRun = moment().add(30, 'minutes');

        console.log(`Rotina workerDead finalizada`);

        await new Promise(resolve => setTimeout(resolve, (nextRun.valueOf() - now.valueOf())));
    }
};