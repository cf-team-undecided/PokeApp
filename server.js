'use strict';

// App Dependencies
const express = require('express');
const superagent = require('superagent');
const pg = require('pg');

// Load environment variables from .env file
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));

// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Specify a directory for statis resources
app.use(express.static('./public'));

// Set the view engine for templating
app.set('view engine', 'ejs');

// Routes

app.get('/', (request, response) => {
  getRandomPokemon()
    .then((randomMon) => {
      response.render('./index', { random: randomMon })
    })
});

app.get('/search', showSearch);

app.post('/search', showSearch);

app.post('/searchBy', searchBy);

app.get('/favorites', showFavorites);

app.get('/details/:id', displayDetails);

app.post('/add/', addFavorite);

app.delete('/delete', deleteFavorite);

app.get('/about-us', aboutUs);

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//********************
// Constructor
//********************

function PokemonDetails(pokemon) {
  this.image_url = pokemon.image_url;
  this.id = pokemon.national_dex_id;
  this.name = pokemon.name;
  this.height = pokemon.height;
  this.weight = pokemon.weight;
  this.typeOne = getTypeName(pokemon.type_primary_id);
  this.typeTwo = getTypeName(pokemon.type_secondary_id);
  this.strong = [];
  this.weak = [];
  this.description = '';
  this.moves = [];
  this.favoritesArr = [];
  this.randomMon = [];

}

//********************
// Helper functions
//********************

// Displays the search page, rendering 20 Pokemon at one time
function showSearch(request, response) {
  let SQL = 'SELECT * FROM species ';

  if (request.body.pages === undefined) { SQL += 'LIMIT 50' }
  if (request.body.pages) { SQL += `ORDER BY national_dex_id OFFSET ${parseInt(request.body.pages) * 50} FETCH NEXT 50 ROWS ONLY` }

  // Get the random Pokemon object
  return getRandomPokemon()
    .then((randomMon) => {

      return client.query(SQL)
        .then(result => {
          response.render('./pages/search', { result: result.rows, types: ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'], random: randomMon })
        })
    })
    .catch(err => handleError(err, response))
}

// Re-renders search page based on type selected from dropdown
function searchBy(request, response) {
  if (request.body.types === '0') {
    response.redirect('/search');
  }
  let SQL = 'SELECT * FROM species WHERE ';

  if (request.body.search) { SQL += `name='${request.body.search}'` }
  if (request.body.search === '') { SQL += `type_primary_id='${parseInt(request.body.types)}'` }

  // Get the random Pokemon object
  return getRandomPokemon()
    .then((randomMon) => {

      return client.query(SQL)
        .then(result => {
          response.render('./pages/search', { result: result.rows, types: ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'], random: randomMon }
          )
        })
    })
    .catch(err => handleError(err, response))
}

function aboutUs(request, response) {
  return getRandomPokemon()
    .then((randomMon) => {
      response.render('./pages/about-us', { random: randomMon });
    })
}

function showFavorites(request, response) {
  let SQL = 'SELECT * FROM species ';
  let fullArr = [];

  // Get the random Pokemon object
  return getRandomPokemon()
    .then((randomMon) => {

      return client.query(SQL)
        .then(allPokemon => {
          fullArr = (allPokemon.rows);
          client.query(`SELECT * FROM favorites;`)
            .then((favorites) => {
              let favoritesArr = [];
              let values = favorites.rows.map(faves => faves.id).sort((a, b) => a - b);

              fullArr.forEach((val) => {
                values.forEach((faveVal) => {
                  if (val.national_dex_id === faveVal) {
                    favoritesArr.push(val)
                  }
                })
              })

              response.render('./pages/favorites', { results: favoritesArr, types: ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'], random: randomMon }
              )
            })
        })
    })
    .catch(err => handleError(err, response))
}

// Display details of selected Pokemon
function displayDetails(request, response) {
  let SQL = `SELECT * FROM species WHERE national_dex_id=$1`
  let value = [request.params.id];

  // Get the random Pokemon object
  return getRandomPokemon()
    .then((randomMon) => {

      return client.query(SQL, value)
        .then((results) => {
          let details = new PokemonDetails(results.rows[0])

          // Get favorites array to check if selected Pokemon is favorited
          client.query(`SELECT * FROM favorites;`)
            .then((favorites) => {
              favorites.rows.forEach((faves) => details.favoritesArr.push(faves.id));

              // Check Pokemon's type to determine weaknesses and strengths
              getDamageMods(details.typeOne, details.typeTwo)
                .then((modResults) => {
                  modResults.forEach((val, idx) => {
                    if (val > 1) {
                      details.weak.push(getTypeName(idx));
                    }
                    if (val < 1) {
                      details.strong.push(getTypeName(idx));
                    }
                  })

                  // Query the API for the Pokemon's flavor text and move list
                  getFlavorText(details.id)
                    .then((flavorResults) => {
                      details.description = flavorResults.split('\n').join(' ')

                      // Query the database to get move details if available, or get them from the API
                      return getMoveList(details.id)
                        .then((moveList) => {
                          details.moves = moveList;
                          details.moves.forEach((move) => {
                            move.type_id = getTypeName(move.type_id);
                          })
                          // Render results
                          response.render(`pages/detail`, { results: details, random: randomMon })
                        })
                    })
                })
            })
        })
    })
    .catch(err => handleError(err, response))
}

// Function to get a random Pokemon object for the random sprite display, called in other route functions
function getRandomPokemon() {
  let SQL = `SELECT * FROM species WHERE national_dex_id=$1;`;
  let randomPokemon = Math.ceil(Math.random() * Math.ceil(802));
  let value = [randomPokemon];
  return client.query(SQL, value)
    .then((results) => {
      return results.rows[0];
    })
}

// Adds the current Pokemon to favorites list
function addFavorite(request, response) {
  let SQL = `INSERT INTO favorites(id) VALUES($1);`;
  let value = [request.body.data];

  client.query(SQL, value)
    .then(result => {
      result = ['invisible'];
      response.send(result)
    })
    .catch(error => handleError(error, response));
}

// Removes the current Pokmeon from favorites list
function deleteFavorite(request, response) {
  let SQL = `DELETE FROM favorites WHERE id=$1;`;
  let values = [request.body.data];

  client.query(SQL, values)
    .then(result => {
      result = ['invisible'];
      response.send(result)
    })
    .catch(error => handleError(error, response));
}

// Error handler
function handleError(error, response) {
  response.render('pages/error', { error: error });
}

// Initial database creation, each part should be called iff database is 100% empty
function buildIfEmpty() {
  // Used to set calls back to back, instead of all at once
  let delay = 0;

  // If types arn't populated, build them - needed for foreign keys
  client.query(`SELECT * FROM types`)
    .then((result) => {
      if (result.rows.length === 1) {
        console.log('Types list is empty, building...')
        buildTypeList();
        delay += 2;
      }
    })

  // Species list is needed for searching
  client.query(`SELECT * FROM species`)
    .then((result) => {
      if (result.rows.length === 0) {
        for (let i = 1; i < 808; i++) {
          setTimeout(buildPokemonDatabase, (i + delay) * 2000, i);

        }
        console.log('Pokemon list is empty, building...')
        delay += 1614;
      }
    })

  // Type damag relations are needed for strength/weakness charts
  client.query(`SELECT * FROM types_damage_to`)
    .then((result) => {
      if (result.rows.length === 0) {
        for (let i = 1; i < 19; i++) {
          setTimeout(buildTypeDamageMods, (i + delay) * 1000, i);
        }
        console.log('Weaknesses list is empty, building...');
        delay += 40;
      }

    })

  // Displays what a move can target, foreign key for moves
  // Always a single call, it can slot in wherever
  client.query(`SELECT * FROM target_type`)
    .then((result) => {
      if (result.rows.length === 0) {
        buildTargetTypes();
        console.log('Move targetting types list is empty, building...');
      }
    })

  // Will be needed as foreign key for movelist with details
  client.query('SELECT * FROM moves')
    .then((result) => {
      if (result.rows.length === 0) {
        for (let i = 1; i < 728; i++) {
          setTimeout(getMoveData, (i + delay) * 1000, i);
        }
        console.log('Moves list is empty, building...');
      }
    })
}

// Function used to build database of all 807 Pokemon
function buildPokemonDatabase(id) {
  let url = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  superagent.get(url)
    .then((speciesResult) => {
      let newUrl = speciesResult.body.varieties.filter((variety) => variety.is_default)[0].pokemon.url;

      superagent.get(newUrl)
        .then(result => {

          let SQL = `INSERT INTO species (national_dex_id, name, image_url, fem_image_url, type_primary_id, type_secondary_id, height, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
          let values = [result.body.id, result.body.species.name, result.body.sprites.front_default, result.body.sprites.front_female || 'null', (result.body.types[0].slot === 1) ? parseInt(result.body.types[0].type.url.split('/')[6]) : parseInt(result.body.types[1].type.url.split('/')[6]), (result.body.types[0].slot === 2) ? parseInt(result.body.types[0].type.url.split('/')[6]) : 0, result.body.height, result.body.weight];
          client.query(SQL, values)
            .then(() => {
              console.log(`Pokemon #${id}, ${result.body.species.name} complete`);
            });
        })
    })
}

// Checks database to see if the move data is stored locally and retrieves it, or queries API if not local
function getMoveData(id) {
  let SQL = `SELECT * FROM moves WHERE api_id=${id}`;
  client.query(SQL)
    .then(result => {
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      let url = `https://pokeapi.co/api/v2/move/${id}`;
      superagent.get(url)
        .then((result) => {
          let newSQL = `INSERT INTO moves(api_id, name, power, accuracy, target_type_id, damage_class_id, type_id, effect_text) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`;
          let values = [id, result.body.name, result.body.power, result.body.accuracy, result.body.target.url.split('/')[6], result.body.damage_class.url.split('/')[6], result.body.type.url.split('/')[6], result.body.effect_entries.filter(entry => entry.language.name === 'en')[0].effect];

          return client.query(newSQL, values).then((record => {
            console.log('Move created: ', record.rows[0]);
            return record.rows[0];
          })
          )
        })
    })
}

// Generates an array of all possible types
function buildTypeList() {
  let url = 'https://pokeapi.co/api/v2/type/';

  return superagent.get(url)
    .then((result) => {
      result.body.results.forEach((type) => {
        let SQL = 'INSERT INTO types (api_id, name) VALUES($1, $2);'
        let values = ([type.url.split('/')[6], type.name]);

        return client.query(SQL, values)
          .then(() => { return });
      })
    })
}

// If only given a baseType, returns an array of all damage relations of that type
// If given a baseType AND a targetType, returns the modifier with relation to just that type
function getDamageMods(typeOne, typeTwo) {
  let typeList = ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];
  let typeOneIndex = typeList.indexOf(typeOne);
  let typeTwoIndex = typeList.indexOf(typeTwo);

  let output = new Array(19).fill(1);

  let typeOneModList = [];
  let typeTwoModList = [];
  return client.query(`SELECT type_damage_from_multiplier FROM types_damage_from WHERE type_id=${typeOneIndex};`)
    .then((typeOneResult) => {
      typeOneModList = typeOneResult.rows.map((row) => { return row.type_damage_from_multiplier });
      return client.query(`SELECT type_damage_from_multiplier FROM types_damage_from WHERE type_id=${typeTwoIndex};`)
        .then((typeTwoResult) => {
          typeTwoModList = typeTwoResult.rows.map((row) => { return row.type_damage_from_multiplier });

          output = output.map((element, index) => {
            return element * typeOneModList[index - 1] * typeTwoModList[index - 1]
          })
          output[0] = 1;
          return output;
        })
    })
}

// Builds arrays used to determine which type is effective in a given matchup
function buildTypeDamageMods(i) {

  let url = `https://pokeapi.co/api/v2/type/${i}`;
  superagent.get(url)
    .then((result) => {
      let damageToMods = new Array(18).fill(1);
      let damageFromMods = new Array(18).fill(1);

      result.body.damage_relations.double_damage_from.forEach(type => {
        damageFromMods[parseInt(type.url.split('/')[6]) - 1] = 2;
      });

      result.body.damage_relations.double_damage_to.forEach(type => {
        damageToMods[parseInt(type.url.split('/')[6]) - 1] = 2;
      });

      result.body.damage_relations.half_damage_from.forEach(type => {
        damageFromMods[parseInt(type.url.split('/')[6]) - 1] = .5;
      });

      result.body.damage_relations.half_damage_to.forEach(type => {
        damageToMods[parseInt(type.url.split('/')[6]) - 1] = .5;
      });

      result.body.damage_relations.no_damage_from.forEach(type => {
        damageFromMods[parseInt(type.url.split('/')[6]) - 1] = 0;
      });

      result.body.damage_relations.no_damage_to.forEach(type => {
        damageToMods[parseInt(type.url.split('/')[6]) - 1] = 0;
      });

      for (let j = 1; j < 19; j++) {
        let SQL = `INSERT INTO types_damage_to(type_id, type_damage_to, type_damage_to_multiplier) VALUES($1, $2, $3)`;
        let values = [i, j, damageToMods[j - 1]];
        client.query(SQL, values);
      }

      for (let j = 1; j < 19; j++) {
        let SQL = `INSERT INTO types_damage_from(type_id, type_damage_from, type_damage_from_multiplier) VALUES($1, $2, $3)`;
        let values = [i, j, damageFromMods[j - 1]];
        client.query(SQL, values);
      }
    })
}

// Gets target type list and puts in SQL
function buildTargetTypes() {
  let url = `https://pokeapi.co/api/v2/move-target/`;
  superagent.get(url)
    .then((results) => {
      results.body.results.forEach((result) => {
        let SQL = `INSERT INTO target_type(api_id, name) VALUES($1, $2);`;
        let values = [result.url.split('/')[6], result.name];

        client.query(SQL, values);
      })
    })
}

// Takes the api_id of a type and returns the string name
function getTypeName(typeId) {
  let types = ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];
  return types[typeId];
}

// Checks database to see if flavortext of a Pokemon is stored locally and retrieves it, or queries API if not local
function getFlavorText(id) {
  let SQL = `SELECT text FROM flavor_text WHERE species_id=${id}`;
  return client.query(SQL)
    .then((result) => {
      if (result.rows.length > 0) {
        return result.rows[0].text
      }
      let url = `https://pokeapi.co/api/v2/pokemon-species/${id}`;
      return superagent.get(url)
        .then(result => {
          let newSQL = `INSERT INTO flavor_text(species_id, text) VALUES($1, $2)`;
          let values = [id, result.body.flavor_text_entries.filter(entry => entry.language.name === 'en')[0].flavor_text];
          client.query(newSQL, values);
          return result.body.flavor_text_entries.filter(entry => entry.language.name === 'en')[0].flavor_text
        })
    })
}

function getMoveList(id) {
  let SQL = `SELECT * FROM moves_learned JOIN moves ON moves_learned.move_id=moves.api_id WHERE species_id=${id}`;
  return client.query(SQL)
    .then((result) => {

      if (result.rows.length > 0) {
        return result.rows.slice(0);
      }
      let url = `https://pokeapi.co/api/v2/pokemon/${id}`;
      return superagent.get(url)
        .then((pokemonResult) => {
          let insertSql = [];
          pokemonResult.body.moves.forEach((move) => {
            if (move.version_group_details[0].level_learned_at >= 1) {
              let newSQL = `INSERT INTO moves_learned(species_id, move_id, level_learned) VALUES(${id}, ${move.move.url.split('/')[6]}, ${move.version_group_details[0].level_learned_at});`
              insertSql.push(newSQL);
            }
          })
          return client.query(insertSql.join('\n'))
            .then(() => {

              return client.query(SQL)
                .then((result) => {
                  return result.rows;
                })
            })

        })
    })
}

// buildIfEmpty();
