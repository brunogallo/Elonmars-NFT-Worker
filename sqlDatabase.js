const database = require('./sqlConnection');

module.exports = {
    createDatabase: async function(res, databaseName) {
        let createQuery = `CREATE DATABASE ${databaseName}`;
  
        // use the query to create a Database.
        database.query(createQuery, (err) => {
            if(err) {
                console.log(err);
                res.send(err);
            } else {
                console.log("Database Created Successfully !");
                res.send("Database Created Successfully");
            };
        });
    },
    version001: async function(res) {
        //let databaseName = "fish_db";
        //let useQuery = `USE ${databaseName}`;
        //database.query(useQuery, (error) => {
        //    if(error) throw error;
  
        //    console.log("Using Database");
        //});

        var sql_string = ' CREATE TABLE `player`( `id` BIGINT NOT NULL AUTO_INCREMENT, `nonce` BIGINT, `address` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL, `usdValue` DECIMAL, `shellValue` DECIMAL, `gemValue` DECIMAL, `gemConsumed` DECIMAL, `usdWithdrawn` DECIMAL, `profileCreated` DATETIME, `lastLogin` DATETIME, `aquariumIsDirty` BOOLEAN, aquariumLastDirty DATETIME NULL DEFAULT NULL, aquariumDirtyAt DATETIME, amountNests INT, referalCode VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, referalLinked VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, decor1 INT, decor2 INT, decor3 INT, decor4 INT, decor5 INT, PRIMARY KEY (`id`)); '
        sql_string += ' CREATE TABLE `fish`( `id` BIGINT NOT NULL AUTO_INCREMENT, `address` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `rarity` INT, `gender` INT, `isBreeding` BOOLEAN, `breedCount` INT, `isHungry` BOOLEAN, `isSicky` BOOLEAN, `isDead` BOOLEAN, `hungryAt` DATETIME, `sickyAt` DATETIME, `lastHungry` DATETIME, `lastSicky` DATETIME, `breedingWith` INT, `breedTimeLeft` DECIMAL, breedingSlot INT, `bornAt` DATETIME, `skin` INT, `active` BOOLEAN, gemsValue DECIMAL, lastGemPick DATETIME, lastBreedTick DATETIME, inAquarium BOOLEAN, PRIMARY KEY (`id`)); ';
        sql_string += ' CREATE TABLE `txDeposit`( `id` BIGINT NOT NULL AUTO_INCREMENT, `address` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `txHash` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `usdAmount` DECIMAL, `depositCreatedAt` DATETIME, PRIMARY KEY (`id`)); ';
        sql_string += ' CREATE TABLE `txWithdraw`( `id` BIGINT NOT NULL AUTO_INCREMENT, `address` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `txHash` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `usdAmount` DECIMAL, `feeAmount` DECIMAL, `feeCharged` BOOLEAN, `withdrawApproved` TINYINT, `reasonDenied` INT, `withdrawCreatedAt` DATETIME, `withdrawHandledAt` DATETIME, `feeChargedAt` DATETIME, PRIMARY KEY (`id`)); ';
        sql_string += ' CREATE TABLE `fishSales`( `id` BIGINT NOT NULL AUTO_INCREMENT, `fishId` BIGINT, `addressSeller` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `shellAmount` DECIMAL, `sellCreatedAt` DATETIME, `addressBought` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, `boughtAt` DATETIME, `sold` BOOLEAN, PRIMARY KEY (`id`)); ';
        sql_string += ' CREATE TABLE `txSlots`( `id` BIGINT NOT NULL AUTO_INCREMENT, `address` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_bin, slotNumber INT, `usdAmount` INT, `boughtAt` DATETIME, `txCharged` BOOLEAN, PRIMARY KEY (`id`)); ';

        database.query(sql_string, (err, results) => {
            if(err) {
                console.log(err);

                return res.send('Version not updated. Check the logs.');
            } else {
                console.log("Tables created successfully !");

                return res.send('Version 001 updated successfully !');
            }
        });
    }
};