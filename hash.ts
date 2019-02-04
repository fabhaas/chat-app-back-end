import * as crypto from "crypto";

/**
 * Hashes password with salt
 * @param password the password
 * @param salt the salt
 */
export function hashPassword(password : string, salt : string) {
    const hmac = crypto.createHmac("sha512", salt);
    hmac.update(password);
    return hmac.digest("hex");
}
