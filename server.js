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

// Routes
// Set the view engine for templating
app.set('view engine', 'ejs');

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//********************
// Constructor
//********************

function Pokemon (pokemon, typeOne, typeTwo) {
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

function getPokemonData(id) {
  let SQL = `ELEECT * FROM species WHERE nationa_dex_id=$1`;
  let values = ([id]);
  client.query(SQL, values);
}

function handleError(error, response) {
  response.render('pages/error', {error: error});
}
