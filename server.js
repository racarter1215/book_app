'use strict'

require('dotenv').config();

const express = require('express');
// const superagent = require('superagent');
// const pg = require('pg');
// const dbClient = new pg.Client(process.env.DATABASE_URL);
// const cors = require('cors');
const PORT = process.env.PORT || 3000;
const app = express();
// app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');

app.get('/', renderPage);

// dbClient.connect(error => {
//     if (error) {
//         console.error('connection to database error', error.stack)
//     } else {
//         console.log('connected to database')
//     }
// });

function renderPage(request, response) {
    response.status(200).render('./pages/index.ejs');
}
function handleError(error, request, response) {
    response.status(500).send({status: 500, responseText: 'Sorry something went wrong'});
  }

// app.use('/', (request, response) => response.send('Sorry that route does not exist'));

app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
});

