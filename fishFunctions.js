const probabilities = {
    "commun": 0.52,
    "uncommun": 0.25,
    "rare": 0.15,
    "epic": 0.06,
    "legendaryChance": 0.02
};

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

function getNewRarity(newProbabilities) {
    let gen = Math.random(); 

    console.log(`Número sorteado ${gen}`);

    if (gen < newProbabilities.commun) {
        return 1;
    } else if (gen < newProbabilities.commun + newProbabilities.uncommun) {
        return 2;
    } else if (gen < newProbabilities.commun + newProbabilities.uncommun + newProbabilities.rare) {
        return 3;
    } else if (gen < newProbabilities.commun + newProbabilities.uncommun + newProbabilities.rare + newProbabilities.epic) {
        return 4;
    } else {
        return 5;
    }
}

function _getFishSkin(rarity) {
    switch (rarity) {
        case 1:
            return 0
        case 2:
            return 1
        case 3:
            return 2
        case 4:
            return randomIntFromInterval(3,4)
        case 5:
            return randomIntFromInterval(5,7)
    }
}

function generateFishRarity(maleRarity, femaleRarity) {
    if ((maleRarity != femaleRarity) || (maleRarity == 1)) {
        console.log("Gerado com as probabilidades default");
        console.log(probabilities);
        
        return getNewRarity(probabilities);
        // return [getNewRarity(probabilities), probabilities];
    } else {
        const indexBuff = maleRarity - 1;

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

        console.log("Gerado com buff nas probabilidades");

        console.log(probabilities);
        console.log(jsonFinal);

        return getNewRarity(jsonFinal);
        // return [getNewRarity(jsonFinal), jsonFinal];
    }
}

module.exports = {
    randomFishSkin: function(rarity) {
        return _getFishSkin(rarity);
    },
    randomFishRarity: function(maleRarity, femaleRarity) {
        return generateFishRarity(maleRarity, femaleRarity);
    }
}