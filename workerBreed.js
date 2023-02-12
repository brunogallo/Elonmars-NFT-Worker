const {parentPort, workerData} = require("worker_threads");
const moment = require('moment');
const sqlFunctions = require('./sqlFunctions');

parentPort.postMessage(updateBreedTime());

function updateBreedTime()
{
    _updateBreedTime();

    return "";
};

async function _updateBreedTime()
{
    while (true)
    {
        try {
            var fishes = await sqlFunctions.selectBreedingFish();
            var updateList = [];
    
            fishes.forEach(function(fish) {
                let now = moment().utc();
                let lastBreedTick = moment(fish.lastBreedTick).add(29, 'minutes').add(30, 'seconds');
                
                if (moment(now).isAfter(lastBreedTick)) {
                    let breedTimeLeft = Number(fish.breedTimeLeft) - 30;
                
                    if (breedTimeLeft <= 0)
                        breedTimeLeft = 0;
                    
                    updateList.push([fish.id, breedTimeLeft]);
                }                                 
            });
    
            if (updateList.length > 0)
                await sqlFunctions.setBreededFish(updateList);   
        } catch (error) {
            console.log(['---------------', 'workerBreed', '---------------']);
            console.log([error]);
            console.log(['---------------', '---------------', '---------------']);
        }

        let now = moment();
        let nextRun = moment().add(30, 'minutes');

        console.log(`Rotina workerBreed finalizada`);

        await new Promise(resolve => setTimeout(resolve, (nextRun.valueOf() - now.valueOf())));
    }

function getDate() {
    return moment.utc().format('YYYY-MM-DD HH:mm:ss');
}
};