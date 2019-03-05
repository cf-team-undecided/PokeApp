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

app.get('/detail', onePoke);

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//********************
// Constructor
//********************


//********************
// Helper functions
//********************

function handleError(error, response) {
  response.render('pages/error', {error: error});
}

function onePoke(request, response) {
  response.render('./pages/pokemon-detail');
  app.use(express.static('./public'));
}
