/* eslint-disable complexity */
const db = require('./server/db');
const fetch = require('node-fetch').default;
const Character = require('./server/db/models/character');

async function getCharactersSet(
  first,
  continueStrFemale = '',
  continueStrMale = ''
) {
  const characterList = [];

  if (first || continueStrFemale !== '') {
    let responseFemale;
    try {
      responseFemale = await fetch(
        `https://marvel.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Female_Characters&cmlimit=500&cmcontinue=${continueStrFemale}`
      );
    } catch (error) {
      console.log(
        'there was an error in the female character api call: ',
        responseFemale,
        error
      );
    }
    const responseJsonFemale = await responseFemale.json();

    continueStrFemale = responseJsonFemale['query-continue']
      ? responseJsonFemale['query-continue'].categorymembers.cmcontinue
      : '';

    const responseCharactersFemale = responseJsonFemale.query.categorymembers;
    characterList.push(
      ...responseCharactersFemale
        .filter(character => character.title.includes('(Earth-616)'))
        .map(character => {
          return {
            name: character.title.split('(Earth-616)')[0],
            gender: 'female',
          };
        })
    );
  }
  if (first || continueStrMale !== '') {
    let responseMale;
    try {
      responseMale = await fetch(
        `https://marvel.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:Male_Characters&cmlimit=500&cmcontinue=${continueStrMale}`
      );
    } catch (error) {
      console.log(
        'there was an error in the female character api call: ',
        responseMale,
        error
      );
    }
    const responseJsonMale = await responseMale.json();
    continueStrMale = responseJsonMale['query-continue']
      ? responseJsonMale['query-continue'].categorymembers.cmcontinue
      : '';
    const responseCharactersMale = responseJsonMale.query.categorymembers;
    characterList.push(
      ...responseCharactersMale
        .filter(character => character.title.includes('(Earth-616)'))
        .map(character => {
          return {
            name: character.title.split('(Earth-616)')[0],
            gender: 'male',
          };
        })
    );
  }
  return { characterList, continueStrFemale, continueStrMale };
}

async function getAllCharacters() {
  let i = 0;
  try {
    let {
      characterList,
      continueStrFemale,
      continueStrMale,
    } = await getCharactersSet(true);

    while (continueStrFemale || continueStrMale) {
      console.log(
        'in while loop i: ',
        i,
        'number of characters collected: ',
        characterList.length
      );
      let newCharacters = await getCharactersSet(
        false,
        continueStrFemale,
        continueStrMale
      );
      characterList.push(...newCharacters.characterList);
      continueStrFemale = newCharacters.continueStrFemale;
      continueStrMale = newCharacters.continueStrMale;
      i++;
    }
    return characterList;
  } catch (error) {
    console.log('an error happened: ', error);
  }
}

async function seed() {
  await db.sync({ force: true });
  console.log('db synced');

  const characterList = await getAllCharacters();
  let j = 0;
  try {
    for (let i = 0; i < characterList.length; i++) {
      console.log('in for loop i: ', j);
      const currentCharacter = characterList[i];
      let start = true;
      let continueStrAppearances = '';
      let appearances = 0;
      const name = currentCharacter.name.split(' ').join('_');
      while (start || continueStrAppearances) {
        start = false;
        const response = await fetch(
          `https://marvel.fandom.com/api.php?action=query&format=json&list=categorymembers&cmtitle=Category:${
            encodeURIComponent(name)

            // .replace(/’/g, '%E2%80%99')
            // .replace(/ā/g, '%C4%81')
            // .replace(/ū/g, '%C5%AB')
            // .replace(/ō/g, '%C5%8D')
            // .replace(/ḥ/g, '%E1%B8%A5')
            // .replace(
            //   /é/g,
            //   '%C3%A9'
            // )
          }(Earth-616)/Appearances&cmlimit=500&cmcontinue=${continueStrAppearances}`
        );
        const responseJson = await response.json();
        continueStrAppearances = responseJson['query-continue']
          ? responseJson['query-continue'].categorymembers.cmcontinue
          : '';
        appearances += responseJson.query.categorymembers.length;
      }
      currentCharacter.appearances = appearances;
      await Character.create({
        name: currentCharacter.name,
        gender: currentCharacter.gender,
        appearances: currentCharacter.appearances,
      });
      j++;
    }
  } catch (error) {
    console.log('an error happened: ', characterList[j], error);
  }

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
