const crypto = require("crypto");

module.exports = function (password, salt) {
    const hmac = crypto.createHmac("sha512", salt);
    hmac.update(password);
    return hmac.digest("hex");
}