// const connection = require("./sqlConnection");
// const pool = connection.pool;
// const collector = connection.collector;
const database = require('./sqlConnection');

const fishFunctions = require('./fishFunctions');
const moment = require('moment');
const crypto = require("crypto");
const express = require('express');

const gemGenerate = 100000.00;

const feedValue = 100000.00;
const healValue = 150000.00;
const reviveValue = 1000000.00;
const breedValue = 1000000.00;

const breedTime = 1440;
const communTimeFull = 1;
const uncommunTimeFull = 1;
const rareTimeFull = 0.95;
const epicTimeFull = 0.9;
const legendaryTimeFull = 0.8;

const vipLevel1 = 15000000;
const vipLevel2 = 50000000;
const vipLevel3 = 150000000;
const vipLevel4 = 300000000;
const vipLevel5 = 600000000;

const referalLevel1 = 1;
const referalLevel2 = 2;
const referalLevel3 = 4;
const referalLevel4 = 7;
const referalLevel5 = 10;

const playerFields = ["id", "nonce", "address", "usdValue", "shellValue", "gemValue", "gemConsumed", "usdWithdrawn", "profileCreated", "lastLogin", "aquariumIsDirty", "aquariumLastDirty", "aquariumDirtyAt", "amountNests", "referalCode", "referalLinked", "decor1", "decor2", "decor3", "decor4", "decor5"];
const fishFields = ["id", "address", "rarity", "gender", "isBreeding", "breedCount", "isHungry", "isSicky", "isDead", "hungryAt", "sickyAt", "lastHungry", "lastSicky", "breedingWith", "breedTimeLeft", "breedingSlot", "bornAt", "skin", "active", "gemsValue", "lastGemPick", "lastBreedTick", "inAquarium"];
const txDepositFields = ["id", "address", "txHash", "usdAmount", "depositCreatedAt"];
const txWithdrawFields = ["id", "fishId", "addressSeller", "shellAmount", "sellCreatedAt", "addressBought", "boughtAt"];
const txSlotsFields = ["id", "address", "slotNumber", "usdAmount", "boughtAt", "txCharged"];

function formatDateField(fieldName, alias, fieldAs) {
    return `DATE_FORMAT(${alias ? alias + "." : ""}${fieldName}, '%Y-%m-%dT%TZ') as ${fieldAs ? fieldAs : fieldName}`
    //return `DATE_FORMAT(CONVERT_TZ(${alias ? alias + "." : ""}${fieldName}, @@session.time_zone, '+00:00'), '%Y-%m-%dT%TZ') as ${fieldAs ? fieldAs : fieldName}`
}

function getVipLevel() {
    return ` (CASE ` +
        ` WHEN gemConsumed >= ${vipLevel5} THEN 5 ` +
        ` WHEN gemConsumed >= ${vipLevel4} THEN 4 ` +
        ` WHEN gemConsumed >= ${vipLevel3} THEN 3 ` +
        ` WHEN gemConsumed >= ${vipLevel2} THEN 2 ` +
        ` WHEN gemConsumed >= ${vipLevel1} THEN 1 ` +
        ` ELSE 0 ` +
        ` END) AS vipLevel `;
}

function getValues(alias, fieldName) {
    return  ` IF(${alias ? alias + "." : ""}${fieldName} >= 1000000000, ` +
            ` CASE WHEN ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000000, 1) = TRUNCATE(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000000, 1),0) THEN ` +
            ` CONCAT(TRUNCATE(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000000, 1),0), 'KKK') ` +
            ` ELSE REPLACE(CONCAT(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000000, 1), 'KKK'), '.', ',') END, ` +
            ` IF(${alias ? alias + "." : ""}${fieldName} >= 1000000, ` +
            ` CASE WHEN ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000, 1) = TRUNCATE(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000, 1),0) THEN ` +
            ` CONCAT(TRUNCATE(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000, 1),0), 'KK') ` +
            ` ELSE REPLACE(CONCAT(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000000, 1), 'KK'), '.', ',') END, ` +
            ` IF(${alias ? alias + "." : ""}${fieldName} >= 1000, ` +
            ` CASE WHEN ROUND(${alias ? alias + "." : ""}${fieldName} / 1000, 1) = TRUNCATE(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000, 1),0) THEN ` +
            ` CONCAT(TRUNCATE(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000, 1),0), 'K') ` +
            ` ELSE REPLACE(CONCAT(ROUND(${alias ? alias + "." : ""}${fieldName} / 1000, 1), 'K'), '.', ',') END, ` +
            ` ${alias ? alias + "." : ""}${fieldName} ` +
            ` ) ` +
            ` ) ` +
            ` ) AS ${fieldName} `;
}

function getReferalLevel() {
    return ` @result := (SELECT count(1) FROM player B WHERE B.referalLinked = A.referalCode and B.referalLinked <> "" AND B.gemConsumed >= 15000000) AS vipeds, ` +
        ` (CASE ` +
        ` WHEN @result >= ${referalLevel5} THEN 5 ` +
        ` WHEN @result >= ${referalLevel4} THEN 4 ` +
        ` WHEN @result >= ${referalLevel3} THEN 3 ` +
        ` WHEN @result >= ${referalLevel2} THEN 2 ` +
        ` WHEN @result >= ${referalLevel1} THEN 1 ` +
        ` ELSE 0 ` +
        ` END) AS referalLevel `;
}

function convertNumber(value) {
    try {
        if (typeof value != 'string') return value;
        const valueX = parseFloat(value.replace(/[^0-9\.-]+/g,""));
        const unit = value.replace(/[^a-zA-Z]+/g,"");
      
        if (unit === 'K') {
            return valueX * 1000;
        } else if (unit === 'KK') {
            return valueX * 1000000;
        } else if (unit === 'KKK') {
            return valueX * 1000000000;
        } else
            return valueX;
    } catch (error) {
        console.log(['---------------', 'convertNumber', '---------------']);
        throw error;
    }
}

async function selectPlayer (address) {
    try {
        var [[result]] = 
            await simpleSelect(
                ["A.id", "A.nonce", getValues("A", "usdValue"), getValues("A", "shellValue"), getValues("A", "gemValue"), "A.gemConsumed", "A.usdWithdrawn", formatDateField("profileCreated", "A"), formatDateField("lastLogin", "A"), "A.aquariumIsDirty", formatDateField("aquariumLastDirty", "A"), formatDateField("aquariumDirtyAt", "A"), getVipLevel(), getReferalLevel(), "A.amountNests", "A.decor1", "A.decor2", "A.decor3", "A.decor4", "A.decor5"],
                ["player A"],
                [`A.address = '${address}'`]);

        result.aquariumIsDirty = verifyTinyInt(result.aquariumIsDirty);

        return result;
    } catch (error) {
        console.log(['---------------', 'selectPlayer', '---------------']);
        throw error;
    }
}

async function selectAllPlayer () {
    try {
        var [result] =
            await simpleSelect(
                ["A.id", "A.address", "A.nonce", getValues("A", "usdValue"), getValues("A", "shellValue"), getValues("A", "gemValue"), "A.gemConsumed", "A.usdWithdrawn", formatDateField("profileCreated", "A"), formatDateField("lastLogin", "A"), "A.aquariumIsDirty", formatDateField("aquariumLastDirty", "A"), formatDateField("aquariumDirtyAt", "A"), getVipLevel(), getReferalLevel(), "A.amountNests", "A.decor1", "A.decor2", "A.decor3", "A.decor4", "A.decor5"],
                ["player A"]);

        result.forEach(element => {
            element.aquariumIsDirty = verifyTinyInt(element.aquariumIsDirty);
        });

        return result;
    } catch (error) {
        console.log(['---------------', 'selectAllPlayer', '---------------']);
        throw error;
    }
}

async function selectFishId (address, id) {
    try {
        var [[result]] =
            await simpleSelect(
                ["id", "rarity", "gender", "isBreeding", "breedCount", "isHungry", "isSicky", "isDead", formatDateField("hungryAt"), formatDateField("sickyAt"), formatDateField("lastHungry"), formatDateField("lastSicky"), "breedingWith", "breedTimeLeft", "breedingSlot", "skin", "active", "gemsValue", formatDateField("lastGemPick"), formatDateField("lastBreedTick"), "inAquarium"],
                ["fish"],
                [`address = '${address}'`, "AND", `id = '${id}'`]);

        if (result != null) {
            result.isBreeding = verifyTinyInt(result.isBreeding);
            result.isHungry = verifyTinyInt(result.isHungry);
            result.isSicky = verifyTinyInt(result.isSicky);
            result.isDead = verifyTinyInt(result.isDead);
            result.active = verifyTinyInt(result.active);
            result.inAquarium = verifyTinyInt(result.inAquarium);
        }

        return result;
    } catch (error) {
        console.log(['---------------', 'selectFishId', '---------------']);
        throw error;
    }
}

async function selectFishes (address) {
    try {
        var [result] = 
            await simpleSelect(
                ["id", "rarity", "gender", "isBreeding", "breedCount", "isHungry", "isSicky", "isDead", formatDateField("hungryAt"), formatDateField("sickyAt"), formatDateField("lastHungry"), formatDateField("lastSicky"), "breedingWith", "breedTimeLeft", "breedingSlot", "skin", "active", "gemsValue", formatDateField("lastGemPick"), formatDateField("lastBreedTick"), "inAquarium"],
                ["fish"],
                [`address = '${address}'`],
                []
                ["active DESC, isBreeding DESC, isDead DESC, isSicky DESC, isHungry DESC, rarity DESC, id"]);

        result.forEach(element => {
            element.isBreeding = verifyTinyInt(element.isBreeding);
            element.isHungry = verifyTinyInt(element.isHungry);
            element.isSicky = verifyTinyInt(element.isSicky);
            element.isDead = verifyTinyInt(element.isDead);
            element.active = verifyTinyInt(element.active);
            element.inAquarium = verifyTinyInt(element.inAquarium);
        });

        return result;
    } catch (error) {
        console.log(['---------------', 'selectFishes', '---------------']);
        throw error;
    }
}

async function selectUsedBreedingSlots (address) {
    try {
        var [result] = 
            await simpleSelect(
                ["breedingSlot"],
                ["fish"],
                [`address = '${address}'`, "AND", `breedingSlot > 0`],
                ["breedingSlot"],
                ["breedingSlot"]);

        return result;
    } catch (error) {
        console.log(['---------------', 'selectUsedBreedingSlots', '---------------']);
        throw error;
    }
}

function successResponse(responseData) {
    return [true, responseData];
}

function errorResponse(responseMessage) {
    return [false, {"message": responseMessage}];
}

const query = function(sql, params) {
    return new Promise(function(resolve, reject) {
      pool.getConnection(function(err, connection) {
        if (err) {
          reject(err);
          return;
        }
  
        connection.query(sql, params, function(err, results) {
          collector.release(connection);
          if (err) {
            reject(err);
            return;
          }
  
          resolve(results);
        });
      });
    });
  };

async function simpleSelect (fieldsSelect, tablesSelect, whereSelect, groupBy, orderBy) {
    try {
        var sqlSelect = " SELECT " + fieldsSelect.join(", ") + 
                        " FROM " + tablesSelect.join(" ") + 
                        `${whereSelect ? " WHERE " + whereSelect.join(" ") : ""}` + 
                        `${groupBy ? " GROUP BY " + groupBy.join(" ") : ""}` + 
                        `${orderBy ? " ORDER BY " + orderBy.join(" ") : ""}`;
        // console.log(sqlSelect);
        return await database.promise().query(sqlSelect);
    } catch (error) {
        console.log(['---------------', 'simpleSelect', '---------------']);
        throw error;
    }
}

function getDate() {
    return moment.utc().format('YYYY-MM-DD HH:mm:ss');
}

async function simpleUpdate (fieldsUpdate, tableUpdate, fieldsWhere) {
    try {
        var sqlUpdate = "";
    
        for (var i = 0; i < fieldsUpdate.length; i++) {
            sqlUpdate += " UPDATE " + tableUpdate[i] + " SET " + fieldsUpdate[i].join(" ") + `${fieldsWhere[i].join(" ") ? " WHERE " + fieldsWhere[i].join(" ") : ""}` + ";";
        }

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', 'simpleUpdate', '---------------']);
        throw error;
    }
}

async function simpleInsert (fieldsInsert, tableInsert, valuesInsert) {
    try {
        var sqlInsert = "";
    
        for (var i = 0; i < tableInsert.length; i++) {
            sqlInsert += " INSERT INTO " + tableInsert[i] + " (" + fieldsInsert[i].join(", ") + ") VALUES (" + valuesInsert[i].join(", ") + ");";
        }

        return await database.promise().query(sqlInsert);
    } catch (error) {
        console.log(['---------------', 'simpleInsert', '---------------']);
        console.log(sqlInsert);
        throw error;
    }
}

function verifyTinyInt (value) {
    return (value == 1);
}

async function insertNewFish (address, date, rarity, skin) {
    try {
        var valuesInsert = [[0, `'${address}'`, rarity, 0, false, 0, false, false, false, 0, 0, 0, 0, 0, 0, `'${date}'`, skin, false, 0, 0, 0, false]];

        return await simpleInsert([fishFields], [["fish"]], valuesInsert);
    } catch (error) {
        console.log(['---------------', 'insertNewFish', '---------------']);
        throw error;
    }    
}

async function calculateBalanceConversion (amount, usdValue, shellValue, gemValue, conversionType) {
    try {
        switch (conversionType) {
            case 'DS':
                if (usdValue >= amount) {
                    usdValue -= amount;
                    shellValue += (amount * 100);
                } else {
                    return {result: false};
                }
    
                break;
            case 'SG':
                if (shellValue >= amount) {
                    shellValue -= amount;
                    gemValue += (amount * 1000);
                } else {
                    return {result: false};
                }
    
                break;
            case 'SD':
                if (shellValue >= amount) {
                    shellValue -= amount;
                    usdValue += (amount / 100);
                } else {
                    return {result: false};
                }
                break;
        }
    
        return {'result': true,
                'usdValue': usdValue,
                'shellValue': shellValue,
                'gemValue': gemValue};
    } catch (error) {
        console.log(['---------------', 'calculateBalanceConversion', '---------------']);
        throw error;
    }
}

async function playerBalanceConvert (values) {
    try {
        var sqlUpdate = ' UPDATE player SET usdValue = ?, shellValue = ?, gemValue = ? WHERE player.address = ?; ';

        return await database.promise().query(sqlUpdate, values);
    } catch (error) {
        console.log(['---------------', 'playerBalanceConvert', '---------------']);
        throw error;
    }
}

async function selectPlayerNFish(address, fishId) {
    try {
        var fishsSelect = await selectFishId(address, fishId);
        var playerSelect = await selectPlayer(address);
    
        return [fishsSelect, playerSelect];
    } catch (error) {
        console.log(['---------------', 'selectPlayerNFish', '---------------']);
        throw error;
    }
}

async function selectPlayerCurrency(address) {
    try {
        var [[response]] = await simpleSelect([getValues(null, "usdValue"), getValues(null, "shellValue"), getValues(null, "gemValue")],
            [],
            [`address = '${address}'`]);

        return response;
    } catch (error) {
        console.log(['---------------', 'selectPlayerCurrency', '---------------']);
        throw error;
    } 
}

async function selectAfterTakeAction(address, fishId) {
    try {
        var [[response]] = await simpleSelect(["A.gemValue", "B.isHungry", formatDateField("hungryAt", "B"), "B.isSicky", formatDateField("sickyAt", "B"), "B.isDead"],
            ["player A", "INNER JOIN", "fish B on (A.address = B.address)"],
            [`A.address = '${address}'`, "AND", `B.id = ${fishId}`]);

        response.isHungry = verifyTinyInt(response.isHungry);
        response.isSicky = verifyTinyInt(response.isSicky);
        response.isDead = verifyTinyInt(response.isDead);

        return response;        
    } catch (error) {
        console.log(['---------------', 'selectAfterTakeAction', '---------------']);
        throw error;
    } 
}

async function selectAfterStartBreed(address, maleFishId, femaleFishId) {
    try {
        var [[response]] = await simpleSelect(
            ["A.gemValue", "B.id as maleId", "B.isBreeding AS maleIsBreeding", "B.breedingWith AS maleBreedingWith", "B.breedTimeLeft AS maleBreedTimeLeft", "B.breedingSlot as maleBreedingSlot",
                "C.id as femaleId", "C.isBreeding AS femaleIsBreeding", "C.breedingWith AS femaleBreedingWith", "C.breedTimeLeft AS femaleBreedTimeLeft", "C.breedingSlot as femaleBreedingSlot"],
            ["player A", "INNER JOIN", `fish B on (A.address = B.address AND B.id = ${maleFishId})`, 
                "INNER JOIN", `fish C on (A.address = C.address AND C.id = ${femaleFishId})`], 
            [`A.address = '${address}'`]);
    
        response.maleIsBreeding = verifyTinyInt(response.maleIsBreeding);
        response.femaleIsBreeding = verifyTinyInt(response.femaleIsBreeding);
    
        return response;  
    } catch (error) {
        console.log(['---------------', 'selectAfterStartBreed', '---------------']);
        throw error;
    }
}

function breedTimeByRarity(rarity) {
    try {
        switch (rarity) {
            case 1:
            case 2:
                return breedTime;
                break;
            case 3:
                return breedTime * rareTimeFull;
                break;
            case 4:
                return breedTime * epicTimeFull;
                break;
            case 5:
                return breedTime * legendaryTimeFull;
                break;
        }
    } catch (error) {
        console.log(['---------------', 'breedTimeByRarity', '---------------']);
        throw error;
    }
}

async function updateHungryFish (idsHungry, idsReset) {
    try {
        var sqlUpdate = "";
        var date = getDate();
        
        for (var i = 0; i < idsHungry.length; i++)
            sqlUpdate += ` UPDATE fish SET isHungry = true, hungryAt = '${date}' WHERE id = ${idsHungry[i]} ;`;
    
        for (var i = 0; i < idsReset.length; i++)
            sqlUpdate += ` UPDATE fish SET isHungry = false, hungryAt = 0, lastHungry = '${date}' WHERE id = ${idsReset[i]} ;`;
    
        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', 'updateHungryFish', '---------------']);
        throw error;
    }
}

async function updateDirtyAquarim (idsDirty, idsLucky) {
    try {
        var sqlUpdate = "";                                                                                                                     
        var date = getDate();
        
        for (var i = 0; i < idsDirty.length; i++)
            sqlUpdate += ` UPDATE player SET aquariumIsDirty = true, aquariumDirtyAt = '${date}' WHERE address = '${idsDirty[i]}' ;`;
    
        for (var i = 0; i < idsLucky.length; i++)
            sqlUpdate += ` UPDATE player SET aquariumIsDirty = false, aquariumDirtyAt = 0, aquariumLastDirty = '${date}' WHERE address = '${idsLucky[i]}' ;`;
    
        try {
            await database.promise().query(sqlUpdate);
        } catch (error) {
            console.log(error);
    
            return [];
        }
    } catch (error) {
        console.log(['---------------', 'updateDirtyAquarim', '---------------']);
        throw error;
    }
}

async function updateSickyFish (idsSicky, idsReset) {
    try {
        var sqlUpdate = "";
        var date = getDate();
        
        for (var i = 0; i < idsSicky.length; i++)
            sqlUpdate += ` UPDATE fish SET isSicky = true, sickyAt = '${date}' WHERE id = ${idsSicky[i]} ;`;
    
        for (var i = 0; i < idsReset.length; i++)
            sqlUpdate += ` UPDATE fish SET isSicky = false, sickyAt = 0, lastSicky = '${date}' WHERE id = ${idsReset[i]} ;`;
    
        try {
            await database.promise().query(sqlUpdate);
        } catch (error) {
            console.log(error);
            return [];
        }
    } catch (error) {
        console.log(['---------------', 'updateSickyFish', '---------------']);
        throw error;
    }
}

async function updateDeadFish (idsDead) {
    try {
        var sqlUpdate = "";

        for (var i = 0; i < idsDead.length; i++)
            sqlUpdate += ` UPDATE fish SET isHungry = false, hungryAt = 0, lastHungry = 0,               ` +
                         `                 isSicky = false, sickyAt = 0, lastSicky = 0,                  ` +
                         `                 isDead = true, isBreeding = false, breedTimeLeft = 0,         ` +
                         `                 breedingWith = 0, lastBreedTick = 0, breedingSlot = 0         ` +
                         ` WHERE id = ${idsDead[i]} AND isBreeding = true AND breedTimeLeft > 0 ;        `;
    
        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', 'updateDeadFish', '---------------']);
        throw error;
    }
}

async function updateKillAllFish (addressDead) {
    try {
        var sqlUpdate = "";
    
        for (var i = 0; i < addressDead.length; i++)
            sqlUpdate += ` UPDATE fish SET isHungry = false, hungryAt = 0, lastHungry = 0,                   ` +
                         `                 isSicky = false, sickyAt = 0, lastSicky = 0,                      ` +
                         `                 isDead = true, isBreeding = false, breedTimeLeft = 0,             ` +
                         `                 breedingWith = 0, lastBreedTick = 0, breedingSlot = 0             ` +
                         ` WHERE address = '${addressDead[i]}' AND isBreeding = true AND breedTimeLeft > 0 ; `;

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', 'updateKillAllFish', '---------------']);
        throw error;
    }
}

async function updateBreededFish (idsUpdate) {
    try {
        var sqlUpdate = "";
        var date = getDate();
    
        for (var i = 0; i < idsUpdate.length; i++)
            sqlUpdate += ` UPDATE fish SET isBreeding = true, breedTimeLeft = ${idsUpdate[i][1]}, lastBreedTick = '${date}' ` +
                         ` WHERE id = ${idsUpdate[i][0]} ;`;

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', 'updateBreededFish', '---------------']);
        throw error;
    }
}

async function updateGemFish (idsGem, idsReset) {
    try {
        var sqlUpdate = "";
        var date = getDate();
        
        for (var i = 0; i < idsGem.length; i++)
            sqlUpdate += ` UPDATE fish SET gemsValue = ${gemGenerate} ` +
                         ` WHERE id = ${idsGem[i]} ;`;
    
        for (var i = 0; i < idsReset.length; i++)
            sqlUpdate += ` UPDATE fish SET gemsValue = 0 AND lastGemPick = '${date}' ` +
                         ` WHERE id = ${idsGem[i]} ;`;

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', 'updateGemFish', '---------------']);
        throw error;
    }
}

async function _selectBreedingFish () {
    try {
        var sqlSelect = " SELECT A.breedTimeLeft,                       " +
                        formatDateField("lastBreedTick", "A") + ",      " +
                        "        A.breedingSlot,                        " +
                        "        A.id                                   " +
                        "  FROM fish A                                  " +
                        " INNER JOIN fish B on (A.id = B.breedingWith   " +
                        "                   AND B.isHungry = false      " +
                        "                   AND B.isSicky = false       " +
                        "                   AND B.isDead = false)       " +
                        " WHERE A.isBreeding = true                     " +
                        "   AND B.isBreeding = true                     " +
                        "   AND A.isHungry = false                      " +
                        "   AND A.isSicky = false                       " +
                        "   AND A.isDead = false;                       ";

        return await database.promise().query(sqlSelect);   
    } catch (error) {
        console.log(['---------------', '_selectBreedingFish', '---------------']);
        throw error;
    }
}

function MD5String(address) {
    try {
        return crypto.createHash("md5").update(address).digest("hex");
    } catch (error) {
        console.log(['---------------', 'MD5String', '---------------']);
        throw error;
    }
}

async function _setActiveFish(address, fishList) {
    try {
        var date = getDate();
        var sqlUpdate = ` UPDATE fish SET active = false, gemsValue = 0, lastGemPick = 0 WHERE address = '${address}'; `;

        fishList.forEach(fish => {
            sqlUpdate += ` UPDATE fish SET active = true, gemsValue = 0, lastGemPick = '${date}' WHERE address = '${address}' AND id = ${fish}; `;
        });

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', '_setActiveFish', '---------------']);
        throw error;
    }
}

async function _setAquariumFishDecor(address, fishList, decorList) {
    try {
        var date = getDate();
        var sqlUpdate = ` UPDATE fish SET inAquarium = false, gemsValue = 0, lastGemPick = 0 WHERE address = '${address}'; `;
        sqlUpdate += ` UPDATE player SET decor1 = -1, decor2 = -1, decor3 = -1, decor4 = -1, decor5 = -1 WHERE address = '${address}'; `;

        if(fishList[0] > 0)
            fishList.forEach(fish => {
                sqlUpdate += ` UPDATE fish SET inAquarium = true, gemsValue = 0, lastGemPick = '${date}' WHERE address = '${address}' AND id = ${fish}; `;
            });

        if(decorList[0] > 0)
        for (let index = 0; index < decorList.length; index++)
            sqlUpdate += ` UPDATE player SET decor${index + 1} = ${decorList[index]} WHERE address = '${address}'; `;            

        // console.log(sqlUpdate);

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', '_setAquariumFish', '---------------']);
        throw error;
    }
}

async function _collectGemFish(address, fishId) {
    try {
        var date = getDate();
        var sqlUpdate = ` UPDATE fish SET gemsValue = 0, lastGemPick = '${date}' WHERE address = '${address}' AND id = ${fishId}; `;
        sqlUpdate += ` UPDATE player set gemValue = gemValue + ${gemGenerate} WHERE address = '${address}'`;

        await database.promise().query(sqlUpdate);
    } catch (error) {
        console.log(['---------------', '_setActiveFish', '---------------']);
        throw error;
    }
}

module.exports = {
    loadPlayer: async function(res, next, address){
        try {
            var player = [];

            var rowsSelect = await selectPlayer(address);
    
            var date = getDate();
    
            if ((rowsSelect == null) || ([rowsSelect].length <= 0)) {
                var [result] =
                    await simpleInsert(
                        [playerFields],
                        [["player"]],
                        [[0, 0, `'${address}'`, 0, 0, 0, 0, 0, `'${date}'`, `'${date}'`, false, `'${date}'`, 0, 0, 0, `'${MD5String(address)}'`, `''`, 0, 0, 0, 0, 0]]);
    
                if (result.insertId != null)
                    player = await selectPlayer(address);
            } else {
                // console.log('Perfil encontrado ' + address);
                player = rowsSelect;
            }
    
            if (player != null)
                res.send(successResponse(player));
            else
                res.send(errorResponse("Error on load player"));

        } catch (error) {
            next(error);
        }
    },
    loadFish: async function(res, next, address){
        try {
            var fishes = await selectFishes(address);

            if ((fishes != null) || (fishes.length <= 0)){
                // console.log(fishes);
                res.send(successResponse(fishes));
            }
            else
                res.send(errorResponse("Error on load fish"));
        } catch (error) {
            next(error);
        }
    },
    depositUsd: async function(res, next, address, body) {
        try {
            console.log(convertNumber(body.depositValue));
            if (convertNumber(body.depositValue) > 0) {
                var player = await selectPlayer(address);

                var newUsdValue = convertNumber(player.usdValue) + convertNumber(body.depositValue);
        
                var date = getDate();
        
                await simpleUpdate(
                    [["usdValue", "=", newUsdValue]],
                    [["player"]],
                    [["address", "=", `'${address}'`]]);
                
                await simpleInsert(
                    [txDepositFields],
                    [["txDeposit"]],
                    [[0, `'${address}'`, `'${body.txHash}'`, convertNumber(body.depositValue), `'${date}'`]]);
        
                player = await selectPlayer(address);
        
                res.send(successResponse(player));
            } else {
                res.send(errorResponse("The amount is invalid"));
            }
        } catch (error) {
            next(error);
        }
    },
    convertBalance: async function (res, next, address, conversionType, amount) {
        try {
            if (amount > 0) {
                var rowsSelect = await selectPlayer(address);

                if ((rowsSelect == null) || ([rowsSelect].length <= 0)) {
                    console.log('Player not found!');
                    res.send(errorResponse("Player not found"));
                    return;
                }
        
                var values = await calculateBalanceConversion(convertNumber(amount), convertNumber(rowsSelect.usdValue), convertNumber(rowsSelect.shellValue), convertNumber(rowsSelect.gemValue), conversionType);
        
                if (!values.result) {
                    console.log('Insuficient balance!');
                    res.send(errorResponse("Insuficient balance"));
                    return;
                }
        
                await playerBalanceConvert([[convertNumber(values.usdValue)], [convertNumber(values.shellValue)], [convertNumber(values.gemValue)], [address]]);
        
                //var result = await selectPlayerCurrency(address);
                var player = await selectPlayer(address);
        
                res.send(successResponse(player));
            } else {
                res.send(errorResponse("The amount is invalid."));
            }
        } catch (error) {
            next(error);
        }
    },
    buyPreSale: async function(res,next, address) {
        try {
            var date = getDate();
            var valuesInsert = [[0, `'${address}'`, 1, 0, false, 0, false, false, false, 0, 0, 0, 0, 0, 0, `'${date}'`, fishFunctions.randomFishSkin(1), false, 0, 0, 0, false],
                                [0, `'${address}'`, 1, 1, false, 0, false, false, false, 0, 0, 0, 0, 0, 0, `'${date}'`, fishFunctions.randomFishSkin(1), false, 0, 0, 0, false]];
    
            var [result] =
                await simpleInsert(
                    [fishFields, fishFields],
                    [["fish"], ["fish"]],
                    valuesInsert);
    
            //console.log(result[0].insertId);
            //console.log(result[1].insertId);
    
            //console.log('Casal criado para ' + address);
            res.send(successResponse({"message": "Casal criado para " + address}));
        } catch (error) {
            next(error);
        }
    },
    feedFish: async function(res, next, address, body) {
        try {
            var [fishsSelect, playerSelect] = await selectPlayerNFish(address, body.fishId);

            if ((fishsSelect.isHungry) && (convertNumber(playerSelect.gemValue) >= feedValue)) {
                var date = getDate();
                var updatedGemConsumed = convertNumber(playerSelect.gemConsumed) + feedValue;
    
                await simpleUpdate(
                                   [["isHungry", "=", "false", ",", "hungryAt", "=", "0", ",", "lastHungry", "=", `'${date}'`], 
                                    ["gemValue", "=", convertNumber(playerSelect.gemValue) - feedValue, ",", "gemConsumed", "=", updatedGemConsumed]],
                                   [["fish"], 
                                    ["player"]],
                                   [["address", "=", `'${address}'`, "AND", "id", "=", body.fishId], 
                                    ["address", "=", `'${address}'`]]);
    
                var response = await selectAfterTakeAction(address, body.fishId);
    
                res.send(successResponse(response));
            } else {
                res.send(errorResponse("Fish is not hungry, or the player doesn't have enough gems."));
            }
        } catch (error) {
            next(error);
        }
    },
    healFish: async function(res, next, address, body) {
        try {
            var [fishsSelect, playerSelect] = await selectPlayerNFish(address, body.fishId);

            if ((fishsSelect.isSicky) && (convertNumber(playerSelect.gemValue) >= healValue)) {
                var date = getDate();
                var updatedGemConsumed = convertNumber(playerSelect.gemConsumed) + healValue;
    
                await simpleUpdate(
                                   [["isSicky", "=", "false", ",", "sickyAt", "=", "0", ",", "lastSicky", "=", `'${date}'`], 
                                    ["gemValue", "=", convertNumber(playerSelect.gemValue) - healValue, ",", "gemConsumed", "=", updatedGemConsumed]],
                                   [["fish"], 
                                    ["player"]],
                                   [["address", "=", `'${address}'`, "AND", "id", "=", body.fishId], 
                                    ["address", "=", `'${address}'`]]);
    
                var response = await selectAfterTakeAction(address, body.fishId);
    
                res.send(successResponse(response));
            } else {
                res.send(errorResponse("Fish is not sicky, or the player doesn't have enough gems."));
            }
        } catch (error) {
            next(error);
        }
    },
    reviveFish: async function(res, next, address, body) {
        try {
            var [fishsSelect, playerSelect] = await selectPlayerNFish(address, body.fishId);

            if ((fishsSelect.isDead) && (convertNumber(playerSelect.gemValue) >= reviveValue)) {
                var updatedGemConsumed = convertNumber(playerSelect.gemConsumed) + reviveValue;
                
                await simpleUpdate(
                                   [["isDead", "=", "false"], 
                                    ["gemValue", "=", convertNumber(playerSelect.gemValue) - reviveValue, ",", "gemConsumed", "=", updatedGemConsumed]],
                                   [["fish"], 
                                    ["player"]],
                                   [["address", "=", `'${address}'`, "AND", "id", "=", body.fishId], 
                                    ["address", "=", `'${address}'`]]);
    
                var response = await selectAfterTakeAction(address, body.fishId);
    
                res.send(successResponse(response));
            } else {
                res.send(errorResponse("Fish is not dead, or the player doesn't have enough gems."));
            }
        } catch (error) {
            next(error);
        }
    },
    cleanAquarium: async function(res, next, address) {
        try {
            var player = await selectPlayer(address);

            if (player.aquariumIsDirty) {
                var date = getDate();
    
                await simpleUpdate(
                    [["aquariumIsDirty", " = ", "false", ", ", "aquariumDirtyAt", " = ", 0, ", ", "aquariumLastDirty", " = ", `'${date}'`]],
                    [["player"]],
                    [["address", "=", `'${address}'`]]);
        
                player = await selectPlayer(address);
        
                res.send(successResponse(player));
            } else
                res.send(errorResponse("Aquarium is not dirty."))
        } catch (error) {
            next(error);
        }
    },
    startBreed: async function(res, next, address, body) {
        try {
            var [maleFishSelect, playerSelect] = await selectPlayerNFish(address, body.maleFishId);
            var [femaleFishSelect, playerSelect] = await selectPlayerNFish(address, body.femaleFishId);
            var usedBreedingSlots = await selectUsedBreedingSlots(address);
    
            var breedMultiplier = convertNumber(1 + (Math.max(maleFishSelect.breedCount, femaleFishSelect.breedCount) / 10));
            let breedCost = breedValue * breedMultiplier;
            var breedSlot = [1, 2, 3].find(num => usedBreedingSlots.every(obj => obj.breedingSlot !== num)) || 0;

            if ((convertNumber(playerSelect.gemValue) < (breedCost)))
                res.send(errorResponse(`Insufficient player balance. #13 Player balance: ${playerSelect.gemValue} #13 Breed Cost: ${breedCost}`));
            else if (usedBreedingSlots.length > playerSelect.amountNests)
                res.send(errorResponse(`No breed spaces available.`));
            else if (breedSlot == 0)
                res.send(errorResponse(`No breed spaces available.`));
            else if (playerSelect.aquariumIsDirty)
                res.send(errorResponse(`Aquarium is dirty.`));
            else if ((maleFishSelect.isHungry) || (femaleFishSelect.isHungry) ||
                    (maleFishSelect.isSicky) || (femaleFishSelect.isSicky) ||
                    (maleFishSelect.isDead) || (femaleFishSelect.isDead))
                res.send(errorResponse(`The fish are hungry/sick/dead.`));
            else
                if ((maleFishSelect.gender == 0) && (femaleFishSelect.gender == 1) && 
                    (!maleFishSelect.isBreeding) && (!femaleFishSelect.isBreeding) && 
                    (maleFishSelect.active) && (femaleFishSelect.active)) {
                        var newGemValue = convertNumber(playerSelect.gemValue) - breedCost;
                        var updatedGemConsumed = convertNumber(playerSelect.gemConsumed) + breedCost;
                        var date = getDate();
                        var breedTime = breedTimeByRarity(Math.min(maleFishSelect.rarity, femaleFishSelect.rarity));
        
                        maleFishSelect.breedCount += 1;
                        femaleFishSelect.breedCount += 1;
                
                        await simpleUpdate(
                            [["gemValue", "=", newGemValue, ",", "gemConsumed", "=", updatedGemConsumed], 
                            ["isBreeding", "=", "true", ",", "breedingSlot", "=", breedSlot, ",", "lastHungry", "=", `'${date}'`, ",", "lastSicky", "=", `'${date}'`, ",", "breedCount", "=", maleFishSelect.breedCount, ",", "breedingWith", "=", femaleFishSelect.id, ",", "breedTimeLeft", "=", breedTime, ",", "lastBreedTick", " = ", `'${date}'`],
                            ["isBreeding", "=", "true", ",", "breedingSlot", "=", breedSlot, ",", "lastHungry", "=", `'${date}'`, ",", "lastSicky", "=", `'${date}'`, ",", "breedCount", "=", femaleFishSelect.breedCount, ",", "breedingWith", "=", maleFishSelect.id, ",", "breedTimeLeft", "=", breedTime, ",", "lastBreedTick", " = ", `'${date}'`]],
                            [["player"], 
                            ["fish"], 
                            ["fish"]],
                            [["address", "=", `'${address}'`],
                            ["address", "=", `'${address}'`, "AND", "id", "=", maleFishSelect.id],
                            ["address", "=", `'${address}'`, "AND", "id", "=", femaleFishSelect.id]]);
        
                        var response = await selectAfterStartBreed(address, maleFishSelect.id, femaleFishSelect.id);
        
                        res.send(successResponse(response));
                } else {
                    res.send(errorResponse("The fish received by the server cannot breed."));
                }
        } catch (error) {
            next(error);
        }
    },
    getNewFishBreed: async function(res, next, address, body) {
        try {
            var maleFishSelect = await selectFishId(address, body.maleFishId);
            var femaleFishSelect = await selectFishId(address, body.femaleFishId);

            if ((maleFishSelect == null) || (femaleFishSelect == null)){
                res.send(errorResponse("Fish not found"));
            } else
                if ((maleFishSelect.gender == 0) && (femaleFishSelect.gender == 1) && 
                    (maleFishSelect.isBreeding) && (femaleFishSelect.isBreeding) &&
                    (maleFishSelect.breedTimeLeft == 0) && (femaleFishSelect.breedTimeLeft == 0)) {
                        var newFishRarity = fishFunctions.randomFishRarity(maleFishSelect.rarity, femaleFishSelect.rarity);
                        var newFishSkin = fishFunctions.randomFishSkin(newFishRarity);
                        var date = getDate();
        
                        await simpleUpdate(
                            [["isBreeding", "=", "false", ",", "breedingSlot", "=", 0, ",", "breedingWith", "=", 0, ",", "lastBreedTick", "=", `${date}`],
                                ["isBreeding", "=", "false", ",", "breedingSlot", "=", 0, ",", "breedingWith", "=", 0, ",", "lastBreedTick", "=", `${date}`]],
                            [["fish"], ["fish"]],
                            [["address", "=", `'${address}'`, "AND", "id", "=", maleFishSelect.id],
                                ["address", "=", `'${address}'`, "AND", "id", "=", femaleFishSelect.id]]);
        
                        var [result] =
                            await insertNewFish(address, date, newFishRarity, newFishSkin);
        
                        if (result.insertId > 0) {
                            var fishsSelect = await selectFishId(address, result.insertId);
        
                            res.send(successResponse(fishsSelect));
                        } else {
                            res.send(errorResponse("Error on generating new fish"));
                        }
                } else {
                    res.send(errorResponse("The Breed fisnish has been stopped, we found some inconsistency in the information on the server"));
                }
        } catch (error) {
            next(error);
        }
    },
    getUpdatedInfos: async function (res, next, address) {
        try {
            var player = await selectPlayer(address);
            var fishes = await selectFishes(address);

            res.send([true, [player, fishes]]);
        } catch (error) {
            next(error);
        }
    },
    setActiveFish: async function (res, next, address, body) {
        try {
            console.log(body.activeFish);
            await _setActiveFish(address, body.activeFish || JSON.parse('[0]'));   
            
            var fish = await selectFishes(address);

            res.send(successResponse(fish));
        } catch (error) {
            next(error);
        }
    },
    setAquariumFishDecor: async function (res, next, address, body) {
        try {
            // console.log(body.fishList);
            await _setAquariumFishDecor(address, body.fishList || JSON.parse('[0]'), body.decorList || JSON.parse('[0]'));   
            
            var player = await selectPlayer(address);
            var fishes = await selectFishes(address);

            console.log(successResponse([player, fishes]));

            res.send([true, [player, fishes]]);

            // res.send(successResponse(fish));
        } catch (error) {
            next(error);
        }
    },
    collectGemFish: async function (res, next, address, body) {
        try {
            var fish = await selectFishId(address, body.fishId);

            if ((fish.active) && (fish.gemsValue == gemGenerate))
                await _collectGemFish(address, body.fishId);
            
            var [fish, player] = await selectPlayerNFish(address, body.fishId);

            res.send(successResponse([fish, player]));
        } catch (error) {
            next(error);
        }
    },
    updatePlayerNests: async function (res, next, address, body) {
        try {
            await simpleUpdate(
                [["amountNests", "=", body.newSlot]],
                [["player"]],
                [["address", "=", `'${address}'`, "AND", "id", "=", maleFishSelect.id]]);

            var date = getDate();
            var valuesInsert = [[0, `'${address}'`, body.newSlot, body.usdValue, `'${date}'`, body.txHash]];
            await simpleInsert(
                [txSlotsFields],
                [["txSlots"]],
                valuesInsert);
            
            var player = await selectPlayer(address);

            res.send(successResponse(player));

            // res.send(successResponse(fish));
        } catch (error) {
            next(error);
        }
    },
    setAquariumClean: async function (res, next, address) {
        try {
            var date = getDate();
            await simpleUpdate(
                [["aquariumIsDirty", "=", "false", ",", "aquariumLastDirty", "=", `'${date}'`]],
                [["player"]],
                [["address", "=", `'${address}'`]]);  
            
            var player = await selectPlayer(address);

            res.send([true, player]);

            // res.send(successResponse(fish));
        } catch (error) {
            next(error);
        }
    },
    selectAllFish: async function (whereSQL) {
        try {
            var [result] =
                await simpleSelect(
                    ["id", "rarity", "gemsValue", "isBreeding", "isHungry", "isSicky", "isDead", formatDateField("lastGemPick"), formatDateField("hungryAt"), formatDateField("sickyAt"), formatDateField("lastHungry"), formatDateField("lastSicky"), formatDateField("lastBreedTick"), "inAquarium"],
                    ["fish"],
                    [whereSQL]);
    
            return result;
        } catch (error) {
            console.log(error);
            return [];
        }
    },
    selectBreedingFish: async function () {
        var [result] = await _selectBreedingFish();
        return result;
    },
    selectAquariumNotDirty: async function () {
        var result = await selectAllPlayer();
        return result;
    },
    setDirtyAquarium: async function (dirtyList, luckyList, massacreList) {
        try {
            if ((dirtyList.length > 0) || (luckyList.length > 0))
                await updateDirtyAquarim(dirtyList, luckyList);

            if (massacreList.length > 0)
                await updateKillAllFish(massacreList);

        } catch (error) {
            console.log(error);
            return [];
        }
    },
    setHungryFish: async function (hungryList, resetList, deadList) {
        try {
            if ((hungryList.length > 0) || (resetList.length > 0))
                await updateHungryFish(hungryList, resetList);

            if (deadList.length > 0)
                await updateDeadFish(deadList);

        } catch (error) {
            console.log(error);
            return [];
        }
    },
    setSickyFish: async function (sickyList, resetList, deadList) {
        try {
            if ((sickyList.length > 0) || (resetList.length > 0))
                await updateSickyFish(sickyList, resetList);

            if (deadList.length > 0)
                await updateDeadFish(deadList);

        } catch (error) {
            console.log(error);
            return [];
        }
    },
    setBreededFish: async function (updateList) {
        try {
            await updateBreededFish(updateList);

        } catch (error) {
            console.log(error);
            return [];
        }
    },
    getPlayer: async function (address) {
        var playerSelect = await selectPlayer(address);

        return playerSelect;
    },
    getPlayerId: async function (address) {
        var playerSelect = await selectPlayer(address);

        try {
            return playerSelect.id;
        } catch (error) {
            return 0;
        }
    },
    getPlayerNonce: async function (address, udpateNonce) {
        var playerSelect = await selectPlayer(address);

        var newNonce = playerSelect.nonce;

        if ((udpateNonce != null) && (udpateNonce)) {
            newNonce += 1;
            simpleUpdate([["nonce", "=", newNonce]],
                [["player"]],
                [["address", "=", `'${address}'`]]);
            }

        return newNonce;
    },
    addReferalLink: async function (address, referalCode) {
        var playerSelect = await selectPlayer(address);

        var referalLinked = playerSelect.referalLinked;

        if ((referalLinked == null) && (referalCode != null)) {
            simpleUpdate(
                [["referalLinked", "=", referalCode]],
                [["player"]],
                [["address", "=", `'${address}'`]]);
        }

        playerSelect = await selectPlayer(address);
    },
    setGemFish: async function (gemList, resetList) {
        try {
            await updateGemFish(gemList, resetList);

        } catch (error) {
            console.log(error);
            return [];
        }
    },
    teste: async function (res, next) {
        var player = await selectPlayer(address);
        var fishes = await selectFishes(address);

        return player;
    }
}