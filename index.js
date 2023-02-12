const express = require("express");
const sqlDatabase = require('./sqlDatabase');
const sqlFunctions = require('./sqlFunctions');
const crypto = require("./crypto");
const moment = require('moment');

var bodyParser = require('body-parser');
var app = express();

const {Worker} = require("worker_threads");
const fishFunctions = require("./fishFunctions");
const { json } = require("express");

var databaseName = "fish_db";

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

app.use(async function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, playerId, playerid, playerNonce, playernonce, hash, access-control-expose-headers");
    res.header("Access-Control-Expose-Headers", "playerId, playerNonce, hash");

    var oldSend = res.send;

    res.send = async function(data){
        // arguments[0] (or `data`) contains the response body
        if (typeof arguments[0] === "string")
            var responseData = arguments[0];
        else
            var responseData = JSON.stringify(arguments[0]);

        // console.log(req.params.address);
        if (req.params.address != null) {
            var address = req.params.address.toLocaleLowerCase();
            var playerId = String(await sqlFunctions.getPlayerId(address));

            if (playerId > 0)
                if (req.headers['playernonce'] == await sqlFunctions.getPlayerNonce(address))
                    var playerNonce = String(await sqlFunctions.getPlayerNonce(address, true) || 0);
                else
                    var playerNonce = String(await sqlFunctions.getPlayerNonce(address) || 0);

            if (playerId > 0)
                var hash = await crypto.getHash(playerId + playerNonce + responseData);
            else
                var hash = await crypto.getHash(responseData);

            // console.log("DADOS RESPONSE");
            // console.log({"playerId" : playerId});
            // console.log({"playerNonce": playerNonce});
            // console.log(responseData);
            // console.log({"hash": hash});
    
            if (playerId > 0) {
                res.header("playerId", playerId);
                res.header("playerNonce", playerNonce);
            }

            res.header("hash", hash);
        }

        oldSend.apply(res, arguments);
    } 

    next();
});

async function verifyRequest(req, res, next) {
    // console.log(req.body);
    if (await crypto.ValidateRequest(req.params.address.toLocaleLowerCase(), req.headers, req.body)) {
        // console.log("OK");
        next();
    }
    else
        res.send([false,
            {"message": "Error on request validation"}]);
}

app.get("/", (req, res) => {
    res.json({ message: 'Hello World!' });
});

async function workerHungry()
{
    const worker = new Worker("./workerHungry.js");

    worker.once("message", result => {
        //console.log("OK");
    });
    
    worker.on("error", error => {
        console.log(error);
    });
      
      worker.on("exit", exitCode => {
        console.log(exitCode);
    })
}

async function workerSicky()
{
    const worker = new Worker("./workerSicky.js");

    worker.once("message", result => {
        //console.log("OK");
    });
    
    worker.on("error", error => {
        console.log(error);
    });
      
      worker.on("exit", exitCode => {
        console.log(exitCode);
    })
}

async function workerDead()
{
    const worker = new Worker("./workerDead.js");

    worker.once("message", result => {
        //console.log("OK");
    });
    
    worker.on("error", error => {
        console.log(error);
    });
      
      worker.on("exit", exitCode => {
        console.log(exitCode);
    })
}

async function workerBreed()
{
    const worker = new Worker("./workerBreed.js");

    worker.once("message", result => {
        //console.log("OK");
    });
    
    worker.on("error", error => {
        console.log(error);
    });
      
      worker.on("exit", exitCode => {
        console.log(exitCode);
    })
}

async function workerAquarium()
{
    const worker = new Worker("./workerAquarium.js");

    worker.once("message", result => {
        //console.log("OK");
    });
    
    worker.on("error", error => {
        console.log(error);
    });
      
      worker.on("exit", exitCode => {
        console.log(exitCode);
    })
}

workerHungry();
workerSicky();
//workerDead();
workerBreed();
workerAquarium();

app.get('/db/createDatabase', async (req, res, next) => {  
    await sqlDatabase.createDatabase(res, databaseName);
});

app.get('/db/updateVersion001', async (req, res, next) => {
    await sqlDatabase.version001(res);
});

app.post('/api/loadPlayer/:address', verifyRequest, async (req, res, next) => {
    var address = req.params.address.toLowerCase();

    await sqlFunctions.loadPlayer(res, next, address);
});

app.post('/api/loadFish/:address', verifyRequest, async (req, res, next) => {
    var address = req.params.address.toLowerCase();

    await sqlFunctions.loadFish(res, next, address);
});

app.post('/api/buyPreSale/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();

    await sqlFunctions.buyPreSale(res, address);
});

app.post('/api/depositUsd/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.depositUsd(res, next, address, body);
});

app.post('/api/convertBalance/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.convertBalance(res, next, address, body.conversionType, body.amount);
});

app.post('/api/feedFish/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.feedFish(res,next, address, body);
});

app.post('/api/healFish/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.healFish(res,next, address, body);
});

app.post('/api/reviveFish/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.reviveFish(res, next, address, body);
});

app.post('/api/cleanAquarium/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();

    await sqlFunctions.cleanAquarium(res, next, address);
});

app.post('/api/startBreed/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.startBreed(res, next, address, body);
});

app.post('/api/getNewFishBreed/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.getNewFishBreed(res, next, address, body);
});

app.post('/api/getUpdatedInfos/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();

    await sqlFunctions.getUpdatedInfos(res, next, address);
});

app.post('/api/setActiveFish/:address', verifyRequest, async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.setActiveFish(res, next, address, body);
});

app.post('/api/setAquariumFishDecor/:address', verifyRequest, async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.setAquariumFishDecor(res, next, address, body);
});

app.post('/api/collectGemFish/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.collectGemFish(res, next, address, body);
});

app.post('/api/updatePlayerNests/:address', async (req, res, next) => {
    var address = req.params.address.toLowerCase();
    var body = req.body;

    await sqlFunctions.updatePlayerNests(res, next, address, body);
});

app.post('/api/setAquariumClean/:address', verifyRequest, async (req, res, next) => {
    var address = req.params.address.toLowerCase();

    await sqlFunctions.setAquariumClean(res, next, address);
});

//----------------------------------------------//

app.post('/api/teste', async (req, res, next) => {
    // console.log(req.query.referal);
    // console.log(req.params.address);

    const probabilities = {
        "commun": 0.52,
        "uncommun": 0.25,
        "rare": 0.15,
        "epic": 0.06,
        "legendaryChance": 0.02
    };

    const indexBuff = 2;

    const totalOutrosRegistrosAntes = Object.values(probabilities)
        .filter((valor, index) => index >= indexBuff)
        .reduce((acumulador, valor) => acumulador + valor);
    const totalOutrosRegistrosDepois = Object.values(probabilities)
        .filter((valor, index) => index < indexBuff)
        .reduce((acumulador, valor) => acumulador + valor);
    const reducao = totalOutrosRegistrosDepois * 0.2;
    const aumento = reducao / totalOutrosRegistrosAntes;

    const jsonModificado = Object.entries(probabilities).map(([chave, valor], index) => {
        if (index < indexBuff) {
            return [chave, Number((valor - (valor * 0.2)).toFixed(4))];
        } else {
            return [chave, Number((valor + (valor * aumento)).toFixed(4))];
        }
    });

    const jsonFinal = jsonModificado.reduce((acc, [chave, valor]) => {
        acc[chave] = valor;
        return acc;
    }, {});

    const totalBase = Object.values(probabilities).reduce((acumulador, valor) => acumulador + valor);
    const totalModificado = Object.values(jsonFinal).reduce((acumulador, valor) => acumulador + valor);

    res.send([indexBuff, probabilities, jsonFinal, totalBase, totalModificado]);

    // var totalModificado = Object.values(jsonFinal).reduce((acumulador, valor) => acumulador + valor);
    
    // const indexBuff = 1; // Índice a partir do qual as raridades serão aumentadas
    // const aumento = 0.2;
    // const totalOutrosRegistros = Object.values(probabilities)
    //     .filter((valor,index) => index < indexBuff)
    //     .reduce((acumulador, valor) => acumulador + valor);
    
    // const jsonModificado = Object.entries(probabilities).map(([chave, valor], index) => {
    //     if (index >= indexBuff) {
    //         console.log(Object.keys(probabilities).length);
    //         return [chave, valor + (aumento / (Object.keys(probabilities).length - indexBuff))];
    //     } else {
    //         return [chave, valor - (aumento * valor / totalOutrosRegistros)];
    //     }
    // });
    
    // const jsonFinal = jsonModificado.reduce((acc, [chave, valor]) => {
    //     acc[chave] = valor;
    //     return acc;
    // }, {});

    // const totalModificado = Object.values(jsonFinal).reduce((acumulador, valor) => acumulador + valor);

    // res.send([indexBuff, probabilities, jsonFinal, totalBase, totalModificado]);

    // const casal = [5, 5]
    // const tiros = {};
    // for (let i = 0; i < 1; i++) {
    //     var [tiro, probabilities] = fishFunctions.randomFishRarity(casal[0], casal[1]);
        
    //     if (tiros.hasOwnProperty(tiro)) {
    //         tiros[`${tiro}`] += 1;
    //     } else {
    //         tiros[`${tiro}`] = 1;
    //     }
    // }

    // res.send([casal, probabilitiesBase, probabilities, tiros]);
});

app.post('/api/teste2', async (req, res, next) => {
    // var rarity = 3;
    // const probabilities = {
    //     "commun": 1,
    //     "uncommun": 0.9,
    //     "rare": 0.8,
    //     "epic": 0.6,
    //     "legendaryChance": 0.4
    // };
    // let gen = Math.random();

    // const values = Object.values(probabilities);
    // const rarityValue = values[rarity - 1];

    // res.send([gen, rarity, rarityValue, (rarityValue >= gen)]);

    // var teste = await sqlFunctions.teste(res, next);

    var value = "5.00KKK";

    if (typeof value !== 'string') return value;
    const valueX = parseFloat(value.replace(/[^0-9\.-]+/g,""));
    const unit = value.replace(/[^a-zA-Z]+/g,"");
  
    if (unit === 'K') {
        var retorno = valueX * 1000;
    } else if (unit === 'KK') {
        var retorno = valueX * 1000000;
    } else if (unit === 'KKK') {
        var retorno = valueX * 1000000000;
    }
    
    res.send(String(retorno));
});

app.post('/api/getHash', async (req, res, next) => {
    var playerId = String(await sqlFunctions.getPlayerId(req.body.address.toLocaleLowerCase()));
    var playerNonce = String(await sqlFunctions.getPlayerNonce(req.body.address.toLocaleLowerCase()));    
    var hash = await crypto.getHash(String(playerId + playerNonce + JSON.stringify(req.body)));    

    req.headers['playerid'] = playerId;
    req.headers['playernonce'] = playerNonce;
    req.headers['hash'] = hash;

    var validation = await crypto.ValidateRequest(req.body.address.toLocaleLowerCase(), req.headers, req.body);

    // console.log(validation);
    
    res.json([playerId, playerNonce, hash, validation]);

    //console.log(res.body); 
});

app.post('/api/cryptoTeste', async (req, res, next) => {
    var playerId = String(await sqlFunctions.getPlayerId(req.body.address.toLocaleLowerCase()));
    var playerNonce = String(await sqlFunctions.getPlayerNonce(req.body.address.toLocaleLowerCase()));    
    var hash = await crypto.getHash(String(playerId + playerNonce + JSON.stringify(req.body)));    

    req.headers['playerid'] = playerId;
    req.headers['playernonce'] = playerNonce;
    req.headers['hash'] = hash;

    var validation = await crypto.ValidateRequest(req.body.address.toLocaleLowerCase(), req.headers, req.body);

    // console.log(validation);
    
    res.json([playerId, playerNonce, hash, validation]);

    //console.log(res.body); 
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
    console.error([err.message, err.stack]);

    res.status(500).send([false, {"message": "Oh no, something went wrong. Please try again."}]);
});

app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`);
});