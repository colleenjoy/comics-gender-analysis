const db = require('./server/db');
const fetch = require('node-fetch');
const Character = require('./server/db/models/character');

async function seed() {
  await db.sync({ force: true });
  console.log('db synced');

  const characterList = [];

  // while loop to get all the characters
  let start = true;
  let continueStr = '';
  while (start || continueStr) {
    start = false;
    const response = await fetch(
      `https://marvel.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Female_Characters&cmlimit=500&cmcontinue=${continueStr}`
    );
    const responseJson = await response.json();
    continueStr = responseJson['query-continue']
      ? responseJson['query-continue'].categorymembers.cmcontinue
      : '';
    const responseCharacters = responseJson.query.categorymembers;
    characterList.push(
      ...responseCharacters
        .filter(character => character.title.includes('(Earth-616)'))
        .map(character => {
          const characterName = character.title.split('(Earth-616)')[0];
          return {
            name: characterName,
            gender: 'female',
          };
        })
    );
  }
  start = true;
  continueStr = '';
  while (start || continueStr) {
    start = false;
    const response = await fetch(
      `https://marvel.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Male_Characters&cmlimit=500&cmcontinue=${continueStr}`
    );
    const responseJson = await response.json();
    continueStr = responseJson['query-continue']
      ? responseJson['query-continue'].categorymembers.cmcontinue
      : '';
    const responseCharacters = responseJson.query.categorymembers;
    characterList.push(
      ...responseCharacters
        .filter(character => character.title.includes('(Earth-616)'))
        .map(character => {
          const characterName = character.title.split('(Earth-616)')[0];
          return {
            name: characterName,
            gender: 'male',
          };
        })
    );
  }
  characterList.map(async character => {
    const nameArr = character.name.split(' ');
    const response = await fetch(
      `https://marvel.fandom.com/api.php?action=query&format=json&titles=${nameArr.join(
        '_'
      )}_(Earth-616)&prop=pageprops`
    );
    const responseJson = await response.json();
    const pageInfo = JSON.parse(
      Object.values(responseJson.query)[0].pageprops.infoboxes
    );
    const pageInfoObj = pageInfo
      .filter(field => field.type === 'data' || field.type === 'group')
      .reduce((acc, field) => {
        if (field.type === 'group') {
          field.data.value
            .filter(subfield => subfield.type === 'data')
            .reduce((innerAcc, subfield) => {
              innerAcc[subfield.data.source] = subfield.data.value;
              return innerAcc;
            }, acc);
          return acc;
        }
        acc[field.data.source] = field.data.value;
        return acc;
      }, {});
  });
  await Promise.all(
    characterList.map(character => {
      return Character.create({
        name: character.name,
        gender: character.gender,
      });
    })
  );
  console.log(`seeded successfully`);
}

async function runSeed() {
  console.log('seeding...');
  try {
    await seed();
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    console.log('closing db connection');
    await db.close();
    console.log('db connection closed');
  }
}

if (module === require.main) {
  runSeed();
}

module.exports = seed;

// make req to the wiki api - use fetch api to do this   https://marvel.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Female_Characters
// add that to list of characters until done
// filter out earth-616 characters
// add to database table based on gender (male, female)
