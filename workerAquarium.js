const {parentPort, workerData} = require("worker_threads");
const moment = require('moment');
const sqlFunctions = require('./sqlFunctions');

parentPort.postMessage(setAquariumDirty());

const probabilities = {
    "vip1": 1,
    "vip2": 0.7,
    "vip3": 0.5,
    "vip4": 0.3,
    "vip5": 0.1
};

function checkVipChance(vip) {
    let gen = Math.random(); 

    const values = Object.values(probabilities);
    const vipValue = values[vip - 1];

    return !(vipValue > gen);
};

function setAquariumDirty()
{
    _setAquariumDirty();

    return "";
};

async function _setAquariumDirty()
{
    while (true)
    {
        try {
            var players = await sqlFunctions.selectAquariumNotDirty();
            var dirtyList = [];
            var luckyList = [];
            var massacreList = [];
    
            players.forEach(function(player) {
                let now = moment().utc();
                let lastDirty = moment(player.aquariumLastDirty).add(23, 'hours').add(59, 'minutes').add(30, 'seconds');
                let dirtyAt = moment(player.dirtyAt).add(3, 'hours').add(59, 'minutes').add(30, 'seconds');
                
                if (!player.aquariumIsDirty) {
                    if (moment(now).isAfter(lastDirty)) {
                        if (checkVipChance(player.vipLevel))
                            luckyList.push(player.address);
                        else
                            dirtyList.push(player.address);
                    }
                } else {
                    if (moment(now).isAfter(dirtyAt))
                        massacreList.push(player.address);
                }
            });
    
            if ((dirtyList.length > 0) || (luckyList.length > 0) || (massacreList.length > 0))
                await sqlFunctions.setDirtyAquarium(dirtyList, luckyList, massacreList);   
        } catch (error) {
            console.log(['---------------', 'workerAquarium', '---------------']);
            console.log([error]);
            console.log(['---------------', '---------------', '---------------']);
        }

        let now = moment();
        let nextRun = moment().add(30, 'minutes');

        console.log(`Rotina workerAquarium finalizada`);

        await new Promise(resolve => setTimeout(resolve, (nextRun.valueOf() - now.valueOf())));
    }
};