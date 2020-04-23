'use strict'

require('dotenv').config();

const express = require('express');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');
const dbClient = new pg.Client(process.env.DATABASE_URL);
// const cors = require('cors');
const PORT = process.env.PORT || 3000;
const app = express();
// app.use(cors());
app.use(express.static('./public'));
app.use(express.urlencoded({extended: true}));
app.set('view engine', 'ejs');
app.use(methodOverride('_method'));

app.get('/', renderPage);
app.get('/searches/new', renderPage2);
app.post('/searches', newSearchData);
app.post('/books', addToCollection);
app.get('/books/:id', showBookDetails);
app.get('*', (request, response) => response.status(404).render('./pages/error', {errorMessage: 'Page not found', errorCorrect: 'The path you took, leads only here. Some would call this, "nowhere".'}));

function Book(book) {
    this.title = book.title;
    this.authors_names = book.authors;
    this.description = book.description;
    this.isbn = book.industryIdentifiers[0].identifier;
    this.bookshelf = book.bookshelf;
    if(book.imageLinks) {
        this.imageurl = book.imageLinks.thumbnail ? book.imageLinks.thumbnail : url('./styles/img/book-placeholder.png');
    }
}

function newSearchData(request, response) {
    let search = request.body;
    let searchText = search.searchQuery;
    let radioSelected = search.search;
    let googleUrl = `https://www.googleapis.com/books/v1/volumes?q=+${radioSelected}:${searchText}&maxResults=10`;

    superagent.get(googleUrl)
        .then((results) => results.body.items.map(book => new Book(book.volumeInfo)))
        .then((book => response.status(200).render('./pages/books/show', {book: book})))
        .catch(error => handleError(error, request, response));
}

function renderPage(request, response) {
    let sql = 'SELECT * FROM books;';
    dbClient.query(sql)
        .then(results => {
            let resultsData = results.rows;
            let totalBooks = results.rows.length;
            response.status(200).render('./pages/index.ejs', {book: resultsData, count: totalBooks});
        }).catch(error => handleError(error, request, response));
}

function renderPage2(request, response) {
    response.status(200).render('./pages/searches/new');
}

function showBookDetails(request, response) {
    let id = request.params.id;
    let sql = 'SELECT * FROM books WHERE id=$1;';
    let safeValues = [id];

    dbClient.query(sql, safeValues)
        .then(results => response.render('./pages/books/details', {book: results.rows}))
        .catch((err) => {
            response.status(500).render('./pages/error', {errorMessage: 'Could not show book details', errorCorrect: 'Yeah, I am not sure what you did there.'})
        })
}

function addToCollection (request, response) {
    let {title, authors_names, description, isbn, bookshelf, imageurl} = request.body;
    let sql = 'INSERT INTO books (title, authors_names, description, isbn, bookshelf, imageurl) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id;';
    let safeValues = [title, authors_names, description, isbn, bookshelf, imageurl];
    console.log('test', safeValues);
    dbClient.query(sql, safeValues)
        .then(results => {
            console.log(results.rows[0].id)
            response.status(200).redirect(`./books/${results.rows[0].id}`)})
        .catch((err) => {
            response.status(500).render('./pages/error', {errorMessage: 'Could not add books to DB or show them', errorCorrect: 'Yeah, no idea'})
        })
}
// app.use('/', (request, response) => response.send('Sorry that route does not exist'));

function handleError(error, request, response) {
    response.status(500).render('./pages/error.ejs');
  }

dbClient.connect()
    .then(() => {
        app.listen(PORT, () => console.log(`Server is running on PORT:${PORT}`));
    });

