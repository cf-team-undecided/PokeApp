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

// app.post('/details/:id', displayDetails );
app.get('/detail', onePoke);

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

function showSearch(request, response) {
  let SQL = 'SELECT * FROM species;';
  return client.query(SQL)
    .then(result => {
      console.log('###', result);
      response.render('./pages/search', {result: result.rows})
    })
    .catch(error => handleError(error, response));
}

function handleError(error, response) {
  response.render('pages/error', { error: error });
}

function onePoke(request, response) {
  response.render('./pages/pokemon-detail');
  app.use(express.static('./public'));
}
// Initial database build, should be called iff database is 100% empty

// buildTypeList();

// for (let i = 1; i < 808; i++) {
//   setTimeout(buildPokemonDatabase, i * 2000, i);
//   console.log(`Added #${i}`);
// }
