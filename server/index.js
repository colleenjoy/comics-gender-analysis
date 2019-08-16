if (process.env.NODE_ENV !== 'production') require('../secrets');
const api = require('marvel-api');

const marvel = api.createClient({
  publicKey: process.env.MARVEL_PUBLIC_KEY,
  privateKey: process.env.MARVEL_PRIVATE_KEY,
});

// marvel.characters
//   .findAll(100, 100)
//   .then(console.log)
//   .done();

// marvel.characters
//   .find('1017105')
//   .then(res => console.log(res.data[0].comics))
//   .fail(console.error)
//   .done();

fetch('http://example.com/movies.json')
  .then(function(response) {
    return response.json();
  })
  .then(function(myJson) {
    console.log(JSON.stringify(myJson));
  });
