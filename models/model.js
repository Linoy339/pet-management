const mongoose = require('mongoose');
const { DATE, DATETIME } = require('mysql/lib/protocol/constants/types');
const { createTrue } = require('typescript');

var userSchema = new mongoose.Schema({

    first_name: { 
        required: true,
        type: String
    },
    last_name: {
        required: true,
        type: String
    },
    password: {
        required: true,
        type: String
    },
    email: {
        required: true,
        type: String
    },
    age: {
        required: true,
        type: Number
    },
    country: {
        required: true,
        type: String
    },
    role: {
        type: Number,
        default: 1
    }

});

module.exports = mongoose.model("user", userSchema);

var categorySchema = new mongoose.Schema({

    _id: { type: mongoose.Schema.Types.ObjectId },
    name: {
            type: String,
            required: true
    },
    status: {
            type: Number,
            required: true
    }

});

module.exports = mongoose.model("category", categorySchema);
    
var petSchema = new mongoose.Schema({
    
    name: {
            type: String,
            required: true
    },
    status: {
            type: Number,
            required: true
    },
    category_id: 
           { type: mongoose.Schema.Types.ObjectId, 
            ref: 'category'
    },
    breed: {
            type: String,
            required: true
    },
    age: {
            type: Number,
            required: true
    },
    create_date: {
            type: Date,
            default: Date.now
    },
    update_date: {
            type: Date,
            default: Date.now
    }

});


module.exports = mongoose.model('pet', petSchema);
    