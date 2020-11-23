require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const path = require('path')
const expressLayouts = require('express-ejs-layouts');
const webRoutes = require('./routes/web');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const MongoDbStore = require('connect-mongo')(session);
const passport = require('passport')
const app = new express();


const PORT = process.env.PORT || 3000;


app.use(morgan('tiny'));

//Bring In body Parser
app.use(bodyParser.urlencoded({ extended: true }));



//! Bring in Mongoose connection
const URI = 'mongodb+srv://irtizakhan:test1234@nodetuts.0jkqg.mongodb.net/pizza?retryWrites=true&w=majority';
mongoose.connect(URI, { useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true, useCreateIndex: true, })
    .then((con) => {
        console.log(`Mongo Db Connected ${con.connection.host}`);
    })
    .catch(err => console.log('database not connected'));


//TODO: Connect-mongo For Session Store in Mongo DB
const mongoStore = new MongoDbStore({
    mongooseConnection: mongoose.connection,
})

// Bringing In express-session middleware
app.use(session({
    secret: process.env.SECRET_KEY, //acessing key for cookies
    resave: false,
    store: mongoStore,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 } //this value = 24 hours cookie will live 

}))

//Adding flash middleware
app.use(flash());

// Setting passport Middleware

const passportInit = require('./app/config/passport');
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());


//* Static middle ware
app.use(express.static('public'));
app.use(express.json());

//! Using Global Middleware ----- Now Sessions is avaliable in front-end as well 
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.user = req.user;
    next();
})

//* Template View
app.use(expressLayouts);
app.set('views', path.join(__dirname, '/resources/views'));
app.set('view engine', 'ejs');


//* Bring IN Routes
app.use('/', webRoutes);



//! Listening to Port 
app.listen(PORT, () => console.log(`Port Running On https://localhost:${PORT}`))