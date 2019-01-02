import crypto from "crypto";

export function hashPassword(password : string, salt : string) {
    const hmac = crypto.createHmac("sha512", salt);
    hmac.update(password);
    return hmac.digest("hex");
}
