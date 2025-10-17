const crypto = require ("crypto")
const key = crypto.randomBytes(32).toString("hex".toUpperCase());
console.log(key)

//726f40882025fe74dbd1de8a64c9972b7b71d098075f411a3a328c5c7d9d200a
//64009b8a8531cd7f59ee5cd9192f7ca763ece0f3ff491960638c4a0d1b49a0ff