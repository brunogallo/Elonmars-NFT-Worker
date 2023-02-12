const crypto = require("crypto");
const sqlFunctions = require("./sqlFunctions");

async function HashString (string) {
    // console.log(string);

    // const stack = new Error().stack;
    // console.log(stack);

    let hashsha512 = crypto.createHash("sha512").update(string).digest("hex");
    // console.log("SHA-512:", hashsha512);
    
    let hashsha256 = crypto.createHash("sha256").update(hashsha512).digest("hex");
    // console.log("SHA-256:", hashsha256);
    
    let hashmd5 = crypto.createHash("md5").update(hashsha256).digest("hex");
    // console.log("MD5:", hashmd5);
 
    return hashmd5;
}

async function MD5String (string) {
    return crypto.createHash("md5").update(string).digest("hex");
}

module.exports = {
    ValidateRequest: async function(address, headers, body) {
        var hash = String(headers['hash']);

        // console.log("headers['hash']: " + headers['hash']);
        // console.log("headers['playerid']: " + headers['playerid']);
        // console.log("headers['playernonce']: " + headers['playernonce']);

        var calculatedHash = "";

        if (headers['playerid'] != null) {
            var playerId = String(headers['playerid']);
            var playerNonce = String(headers['playernonce']);

            calculatedHash = String(await HashString(String(playerId + playerNonce + String(JSON.stringify(body)))));
        } else
            calculatedHash = String(await HashString(String(String(JSON.stringify(body)))));

        var bodyAddress = String(body.address.toLocaleLowerCase());

        //console.log(address);
        if (headers['playerid'] != null)
            var selectPlayer = await sqlFunctions.getPlayer(address);

        //console.log("B");
        //console.log(await HashString(String(body)));
        // console.log(body);
        // console.log(await HashString(String(JSON.stringify(body))));
        //console.log(await HashString(String(`{"address":"0x4c3f032fdc892af2fdaedd8519b5240e39d06d52"}`)));

        // console.log([String(address), String(bodyAddress)]);

        // if (headers['playerid'] != null) {
        //     console.log([String(playerId), String(selectPlayer.id)]);
        //     console.log([String(playerNonce), String(selectPlayer.nonce)]);
        // }

        // console.log([String(hash), String(calculatedHash)]);
        
        // if (headers['playerid'] != null)
        //     console.log([{"(address === bodyAddress)": (address === bodyAddress)}, 
        //         {"((headers['playerid'] == null) || (String(playerId) === String(selectPlayer.id)))": ((headers['playerid'] == null) || (String(playerId) === String(selectPlayer.id)))},
        //         {"((headers['playernonce'] == null) || (String(playerNonce) === String(selectPlayer.nonce)))": ((headers['playernonce'] == null) || (String(playerNonce) === String(selectPlayer.nonce)))},
        //         {"(String(calculatedHash) === String(hash)))": (String(calculatedHash) === String(hash))}]);
        // else
        //     console.log([{"(address === bodyAddress)": (address === bodyAddress)}, 
        //         {"(String(calculatedHash) === String(hash)))": (String(calculatedHash) === String(hash))}]);

        if (headers['playerid'] != null)
            var validation = ((address === bodyAddress) &&
                ((headers['playerid'] == null) || (String(playerId) === String(selectPlayer.id))) &&
                ((headers['playernonce'] == null) || (String(playerNonce) === String(selectPlayer.nonce))) &&
                (String(calculatedHash) === String(hash)));
        else
            var validation = ((address === bodyAddress) &&
                (String(calculatedHash) === String(hash)));

        // console.log(validation);
        return validation;
    },
    getHash: async function (data) {
        return await HashString(String(data));
    },
    _MD5String: async function (string) {
        return await MD5String(String(string));
    }
}