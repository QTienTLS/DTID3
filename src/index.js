const express = require('express');
const app = express();
require('dotenv').config();
const {engine} = require('express-handlebars');
const bodyParser = require('body-parser');
const db = require('./DBCofig');
const path = require('path');
const MainController = require('./controllers/mainController')

db.connect();
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);
app.use(bodyParser.json());

//view engine setup
app.engine('hbs', engine({
    extname: '.hbs'
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get('/',MainController.index);
app.post('/upload-data',MainController.uploadData);
app.get('/preprocess/:id',MainController.preprocess);
app.get('/dt/:id/:p',MainController.buildDT);
//static files
app.use(express.static(path.join(__dirname, 'public')));

app.listen(process.env.PORT || 3000,()=>{
    console.log(`App running at port: ${process.env.PORT}`);
});