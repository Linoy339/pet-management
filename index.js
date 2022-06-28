const express = require('express');
const mongoose = require('mongoose');
var cors = require('cors');
const jwt = require('jsonwebtoken');
const config = require('config');
const cookieParser = require('cookie-parser');
const mongoMemoryServer = require('mongodb-memory-server');
const expressValidator = require('express-validator');

const routes = require('./routes/routes');
const { ReturnDocument } = require('mongodb');

require('dotenv').config();

const mongoString = process.env.DATABASE_URL;

const modelUser = mongoose.model('user'); 

mongoose.connect(mongoString);
const database = mongoose.connection;

database.on('error', (error) => {
    console.log(error);
});

database.once('connected', () => {
    console.log("Database Connected");
});

const app = express();

app.use(express.json());
app.use('/api', routes);
app.use(cors());
app.use(cookieParser);

if (!config.get('PrivateKey')) {
    console.error('FATAL ERROR: PrivateKey is not defined.');
    process.exit(1);
}

database.collection('users').countDocuments({'role':1}, function(err,res) {
    if(err) throw err;
    if(res) {
        app.listen(8080, () => {
            console.log(`Server started at ${8080}`);
          })
    }
    else{
        console.log("Sorry! No Super Admin");
        
    }
});
