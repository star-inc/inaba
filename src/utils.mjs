import {
    createHash,
    randomBytes,
} from "node:crypto";

export const useSendMessage = (ws) =>
    (data) => ws.send(JSON.stringify(data));

/**
 * Shortcut for hasOwnProperty with safe.
 * @module native
 * @function
 * @param {object} srcObject
 * @param {string} propName
 * @return {boolean}
 */
export function isObjectPropExists(srcObject, propName) {
    return Object.prototype.hasOwnProperty.call(srcObject, propName);
}

/**
 * The alias to create cryptographic random string.
 * @param {number} length
 * @return {string}
 */
export function randomString(length) {
    const seed = randomBytes(length);
    return seed.toString("base64");
}

/**
 * The alias to hash md5 hex.
 * @param {string} data
 * @return {string}
 */
export function md5hex(data) {
    return createHash("md5").
        update(data).
        digest("hex");
}
