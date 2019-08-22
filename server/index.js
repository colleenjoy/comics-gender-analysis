if (process.env.NODE_ENV !== 'production') require('../secrets');
const api = require('marvel-api');

const marvel = api.createClient({
  publicKey: process.env.MARVEL_PUBLIC_KEY,
  privateKey: process.env.MARVEL_PRIVATE_KEY,
});
