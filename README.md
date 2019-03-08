# PokeApp
This is our 301d44 Final Project! Yee Haw

Project : Gotta Cache 'em All! 

Started: 20170304

Authors: Dana Voros, Andrew "Roketsu" Roska, Peter Murphy, and Alexander White

# PokeApp
                This is our 301d44 Final Project! Yee Haw


Started: 20170304

A pokedex to search for, learn about and favorite pokemon. 

The problem domain is for a user to be able to search for pokemon they're curious about and save their favorites. We grab the poke data using the Poke API @ https://pokeapi.co/ and cache the results in SQL.

                            --Versions--

1.0.1 -- Added Dependencies and basic routes. 
1.0.2 -- Hello World proof of life. 
1.0.3 -- Database setup. 
1.0.4 -- Basic Grid layout. 
1.0.5 -- Filtering Pokemon. 
1.0.6 -- Pagination. 
1.0.7 -- Detail view.
1.0.8 -- Major CSS update. 
1.0.9 -- Favorites. 

         -- Dependencies -- See package.json for more details --

dotenv, ejs, express, pg, superagent

                        --instructions to startup--

After Git Cloning, run npm install to get our packages, run our schema and take a break for 45 minutes while it loads. Then run nodemon and you can serve it from your local host. 

                           -- example API calls -- 

            Call ===> https://pokeapi.co/api/v2/pokemon-species/34

base_happiness:70
capture_rate:45

color:{} 2 keys
name:"purple"
url:"https://pokeapi.co/api/v2/pokemon-color/7/"

egg_groups:[] 2 items

0:{} 2 keys
name:"ground"
url:"https://pokeapi.co/api/v2/egg-group/5/"

1:{} 2 keys
name:"monster"
url:"https://pokeapi.co/api/v2/egg-group/1/"

evolution_chain:{} 1 key
url:"https://pokeapi.co/api/v2/evolution-chain/13/"

evolves_from_species:{} 2 keys
name:"nidorino"
url:"https://pokeapi.co/api/v2/pokemon-species/33/"

flavor_text_entries:[] 54 items

form_descriptions:[] 0 items

forms_switchable:false
gender_rate:0 

etc...

            Call ===> https://pokeapi.co/api/v2/type/5


{
    "damage_relations": {
        "double_damage_from": [
            {
                "name": "water",
                "url": "https://pokeapi.co/api/v2/type/11/"
            },
            {
                "name": "grass",
                "url": "https://pokeapi.co/api/v2/type/12/"
            },
        (etc...)
        ],
        "double_damage_to": [
            {
                "name": "poison",
                "url": "https://pokeapi.co/api/v2/type/4/"
            },
            {
                "name": "rock",
                "url": "https://pokeapi.co/api/v2/type/6/"
            },
        (etc...)
        ],
        "half_damage_from": [
            {
                "name": "poison",
                "url": "https://pokeapi.co/api/v2/type/4/"
            },
            {
                "name": "rock",
                "url": "https://pokeapi.co/api/v2/type/6/"
            }
        ],
        "half_damage_to": [
            {
                "name": "bug",
                "url": "https://pokeapi.co/api/v2/type/7/"
            },
            {
                "name": "grass",
                "url": "https://pokeapi.co/api/v2/type/12/"
            }
        ],
       
    (etc...)
}      


                        -- Database examples --  


CREATE TABLE IF NOT EXISTS types (
  api_id INTEGER PRIMARY KEY,
  name VARCHAR(10)
);


CREATE TABLE IF NOT EXISTS abilities (
  api_id INTEGER PRIMARY KEY,
  name VARCHAR(20),
  description text
);

CREATE TABLE IF NOT EXISTS target_type (
  api_id INTEGER PRIMARY KEY,
  name TEXT
);










