// Generate keypair.

import {
    randomString,
    md5hex,
} from "./src/utils/native.mjs";

const inabaToken = randomString(128);
const inabaKey = md5hex(inabaToken);

console.info({
    inabaToken,
    inabaKey,
});
