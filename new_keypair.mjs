// Generate keypair.

import {
    randomString,
    md5hex,
} from "./src/utils.mjs";

const inabaToken = randomString(32);
const inabaKey = md5hex(inabaToken);

console.info({
    inabaToken,
    inabaKey,
});
