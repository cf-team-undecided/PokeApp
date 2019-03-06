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

app.get('/', (request, response) => response.render('./index'));

app.get('/search', showSearch );

app.post('/search', showSearch);

// app.post('/details/:id', displayDetails );
app.get('/detail', onePoke);

app.post('/searchBy', searchBy);

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//********************
// Constructor
//********************

function Pokemon(pokemon, typeOne, typeTwo) {
  this.id = pokemon.national_dex_id;
  this.name = pokemon.name;
  this.imageUrl = pokemon.image_url;
  this.femImageUrl = pokemon.fem_image_url;
  this.height = pokemon.height;
  this.weight = pokemon.weight;
  this.typeOne = typeOne;
  this.typeTwo = typeTwo;
}

//********************
// Helper functions
//********************

function buildPokemonDatabase(id) {

  let url = `https://pokeapi.co/api/v2/pokemon-species/${id}`;

  superagent.get(url)
    .then((speciesResult) => {
      let newUrl = speciesResult.body.varieties.filter((variety) => variety.is_default)[0].pokemon.url;

      superagent.get(newUrl)
        .then(result => {

          let SQL = `INSERT INTO species (national_dex_id, name, image_url, fem_image_url, type_primary_id, type_secondary_id, height, weight) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`;
          let values = [result.body.id, result.body.species.name, result.body.sprites.front_default, result.body.sprites.front_female || 'null', (result.body.types[0].slot === 1) ? parseInt(result.body.types[0].type.url.split('/')[6]) : parseInt(result.body.types[1].type.url.split('/')[6]), (result.body.types[0].slot === 2) ? parseInt(result.body.types[0].type.url.split('/')[6]) : 0, result.body.height, result.body.weight];
          // console.log(SQL);
          // console.log(values);
          client.query(SQL, values)
            .then(() => {
              console.log(`#${id} complete`);
            });
        })

    })

}

function buildTypeList() {
  let url = 'https://pokeapi.co/api/v2/type/';

  superagent.get(url)
    .then((result) => {
      // console.log(result);
      result.body.results.forEach((type) => {
        // console.log(type);
        let SQL = 'INSERT INTO types (api_id, name) VALUES($1, $2);'
        let values = ([type.url.split('/')[6], type.name]);

        client.query(SQL, values)
          .then(() => { return });
      })
    })
}

function getPokemonData(id) {
  let SQL = `SELECT * FROM species WHERE national_dex_id=$1`;
  let values = ([id]);
  client.query(SQL, values)
    .then((result) => {
      return result.rows[0];
    })
}

function changedArrayToPrepareForEJSRender (arr) {
  return arr.map(type =>{
    let whole = type;

    // whole.type_primary_id =  getTypeName(type.type_primary_id);
    // console.log(whole);
  })
}

function showSearch(request, response) {
  // let SQL = 'SELECT * FROM species;'
  // let SQL = 'SELECT * FROM species ORDER BY national_dex_id OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;';

  let SQL = 'SELECT * FROM species ORDER BY national_dex_id OFFSET ';
  if (request.body.pages){ SQL += `${parseInt(request.body.pages)} * 20 ROWS FETCH NEXT 20 ROWS`}
  

  return client.query(SQL)
    .then(result => {
      response.render('./pages/search', {result: result.rows, types: ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy']}
      )
      // .catch(error => handleError(error, response));
    });
}

function searchBy(request, response) {
  let SQL = 'SELECT * FROM species WHERE ';
  console.log('135', request.body.search);
  if(request.body.search) {SQL += `name='${request.body.search}'`}
  if(request.body.search === '') {SQL += `type_primary_id='${parseInt(request.body.types)}'`}
  return client.query(SQL)
    .then(result => {
      response.render('./pages/search', {result: result.rows, types: ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy']}
      )
      // .catch(error => handleError(error, response));
    })
}

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

// If only given a baseType, returns an array of all damage relations of that type
// If given a baseType AND a targetType, returns the modifier with relation to just that type

function getDamageModifierFrom(baseType, targetType) {
  // If targetType is specified, give specific result
  if (targetType) {
    let SQL = `SELECT type_damage_from, type_damage_from_multipler WHERE type_id=${baseType} AND type_damage_to=${targetType}`
    client.query(SQL)
      .then((result) => {
        return result.rows[0];
      })
  }

  // if targetType is not specified, return an array of all reults
  let SQL = `SELECT type_damage_from, type_damage_from_multipler WHERE type_id=${baseType}`
  client.query(SQL)
    .then((results) => {
      return results.rows;
    })
}

// If only given a baseType, returns an array of all damage relations of that type
// If given a baseType AND a targetType, returns the modifier with relation to just that type

function getDamageModifierTo(baseType, targetType) {
  // If targetType is specified, give specific result
  if (targetType) {
    let SQL = `SELECT type_damage_to, type_damage_to_multipler WHERE type_id=${baseType} AND type_damage_to=${targetType}`
    client.query(SQL)
      .then((result) => {
        return result.rows[0];
      })
  }

  // if targetType is not specified, return an array of all reults
  let SQL = `SELECT type_damage_to, type_damage_to_multipler WHERE type_id=${baseType}`
  client.query(SQL)
    .then((results) => {
      return results.rows;
    })
}

// gets target type list and puts in SQL
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

// takes the api_id of a type and returns the string name
function getTypeName(typeId) {
  let types = ['none', 'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy'];
  return types[typeId];
}

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

function handleError(error, response) {
  response.render('pages/error', { error: error });
}

function onePoke(request, response) {
  response.render('./pages/pokemon-detail');
  app.use(express.static('./public'));
}
// Initial database build, should be called iff database is 100% empty

client.query(`SELECT * FROM types`)
  .then((result) => {
    if (result.rows.length === 0) {
      buildTypeList();
    }
  })

client.query(`SELECT * FROM species`)
  .then((result) => {
    if (result.rows.length === 0)
      for (let i = 1; i < 808; i++) {
        setTimeout(buildPokemonDatabase, i * 2000, i);
        console.log(`Added #${i}`);
      }
  })

client.query(`SELECT * FROM types_damage_to`)
  .then((result) => {
    if (result.rows.length === 0) {
      for (let i = 1; i < 19; i++) {
        setTimeout(buildTypeDamageMods, i * 1000, i);
      }
    }
  })

client.query(`SELECT * FROM target_type`)
  .then((result) => {
    if (result.rows.length === 0) {
      buildTargetTypes();
    }
  })
