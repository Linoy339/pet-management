const express = require('express');
const router = express.Router();
const Model = require('../models/model');
const { db } = require('../models/model');
var mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const config = require('config');
const auth = require('../routes/auth');
const cors = require('cors');
const jwtSecret = '4715aed3c946f7b0a38e6b534a9583628d84e96d10fbc04700770d572af3dce43625dd'
module.exports = router;
const database = mongoose.connection;
const { body, validationResult } = require('express-validator');

const modelUser = mongoose.model('user');
const modelCat = mongoose.model('category');
const modelPet = mongoose.model('pet');

// Signup - POST
router.post('/signup', 

    body('email').isEmail().normalizeEmail(),
    body('age').isInt({gt:18,lt:90}),
    body('first_name').isAlpha(),
    body('last_name').isAlpha(),
    body('country').isAlpha(),
    body('role').isInt({gt:0,lt:3}),
    body('password').isLength({
    min: 6
    }),

    body("email").custom(value => {
        return modelUser.find({
            email: value
        }).then(user => {
            if (user.length > 0) {
                return Promise.reject('Email already in use');
            }
        });
    }),

    body("password").custom(value => {
        return modelUser.find({ 
            password: value
        }).then(user => {
            if (user.length > 0) {
                return Promise.reject('Password already in use');
            }
        })
    }),

    (req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
        }   );
    }
    const { first_name, last_name, password, email, age, country, role } = req.body;
        
    bcrypt.hash(req.body.password, 10).then( async(hash) => {
      await modelUser.create({
      first_name,
      last_name,
      password: hash,
      email,
      age,
      country,
      role
    }).then((user) => res.status(200).json({
        message: "User successfully created",
        user,
        })).catch((error) =>
            res.status(400).json({
            message: "User not created",
            error: error.message,
        }));
    });
}); 
 

// LOGIN - POST
router.post('/login', 
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({min:6}),
    async(req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const user = await modelUser.findOne({ email:req.body.email });
        if (!user) {res.status(401).json({
            message: "Login not successful",
            error: "User not found",
        });
        } else {
            bcrypt.compare(req.body.password, user.password).then(function (result) {
                if (result) {
                    jwt.sign({user}, 'privatekey', { expiresIn: '1h' },(err, token) => {
                        if(err) { console.log(err) }    
                        res.send(token);
                    });
                } else {
                    res.status(401).json({
                        message: "Login not successful",
                        error: "User not found",
                    });
                } 
            })
        }
    }catch (err) { console.log(err);}
});


//Check - Token
const checkToken = (req, res, next) => {
    const header = req.headers['authorization'];
    
    if(typeof header !== 'undefined') {
        const bearer = header.split(' ');
        const token = bearer[1];
        req.token = token;
        next();
    } else {
        res.sendStatus(403)
    }
}


//Verify Token
router.get("/retrieve", checkToken,  (req, res) => {
    try {
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err) {
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } else { 
                res.json({
                    message: 'Successful log in',
                    authorizedData
                });
                console.log('SUCCESS: Connected to protected route');
            }
        })
    } catch (e) {
        res.send({ message: "Error in Fetching user" });
    }
});


//Category - POST
router.post('/category', 
    body("name").isString(),
    body("status").isInt({min:0,max:1}),
    body("name").custom(value => {
        return modelCat.find({
            name: value
        }).then(category => {
            if (category.length > 0) {
                return Promise.reject('Category already added');
            }
        });
    }),
    checkToken, (req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        jwt.verify(req.token, 'privatekey', async(err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            else {
                const category = new Model({
                    name: req.body.name,
                    status: req.body.status
                })
                try {
                    const data =  await modelCat.create(category);
                    if(data) {
                        res.status(200).json(category);
                    }
                    else{
                        res.status(400).json("Not inserted");
                    }
                } catch(error) {
                    res.status(400).json({ message: error.message });
                }
            }
    });
});


//Pet - POST
router.post('/category/:id/pet', 
    body('name').isString(),
    body('breed').isString(),
    body('age').isNumeric(),
    body('status').isInt({min:0,max:1}),
    body("name").custom(value => {
        return modelPet.find( {
            name: value
        }).then(pet => {
            if (pet.length > 0) {
                return Promise.reject('Pet already added');
            }
        });
    }),
    body("category_id").custom(value => {
        return modelCat.find({
            _id: value
        }).then(category => {
            if (category.length == 0) {
                return Promise.reject("Category Doesn't Exist!");
            }
        });
    }),
    checkToken, (req,res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        jwt.verify(req.token, 'privatekey', async(err, authorizedData) => {
        try{
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            else {
                const data = new Model({
                name: req.body.name,
                status: req.body.status,
                breed: req.body.breed,
                age: req.body.age,
                category_id: mongoose.Types.ObjectId(req.body.category_id),
                create_date: req.body.create_date,
                update_date: req.body.update_date
                })
                const result = await modelPet.collection.insertOne(data);
                if(result){
                    res.status(200).json(data);
                }
                else{
                    res.status(400).json("Not Added");
                }
            }
        }catch(error) {
            res.status(400).json( { message: error.message });
        }
    })
});


//Category - GET
router.get('/category', checkToken,  async(req,res) => {
    try {
        const data = await modelCat.find();
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
        });     
        if(data){
            res.status(200).json(data);
        }
        else{
            res.status(400).json("Invalid Category ID");
        }
    } catch(error) {
        res.status(500).json({ message: error.message });
    }
});


//Category by ID - GET
router.get('/category/:id/', checkToken, async(req,res) => {
    try {
        id = mongoose.Types.ObjectId(req.params.id) ;
        const data = await modelCat.findById(id);
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
        });
        if(!data){
            res.json("Invalid Category ID!");
        }
        else{
            res.json(data);
        }
    } catch(error) {
        res.status(500).json( {message: error.message } );
    }
});


//Pet by Category ID - GET
router.get('/category/:id/pet/', checkToken, async(req,res) => {
    try {
        id = mongoose.Types.ObjectId(req.params.id) ;
        const data = await modelPet.find({}).where('category_id').equals(id);
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            if(data.length > 0) {
                res.json(data);
            }
            else {
                res.json("No pets of this Category available right now!");
            }
        });
    } catch(error) {
        res.status(500).json( {message: error.message} );
    }
});


//Pet by ID - GET
router.get('/pet/:id/', checkToken, async(req,res) => {
    try {
        const data =  await Model.findById(req.params.id);
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err) {
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            if(data) {
                res.json(data);
            }
            else{
                res.json("Invalid Pet ID!");
            }
        });
    } catch(error) {
        res.status(500).json( {message: error.message} );
    }
});


//Update by ID - Category
router.put('/category/:id', checkToken, async(req,res) => {
    try{
        id = mongoose.Types.ObjectId(req.params.id) ;
        const updatedData = req.body;
        const options = { new: true };
        const data = await modelCat.findByIdAndUpdate(id, updatedData, options);
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err) {
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            if(data) {
                res.json(data);
            }
            else {
                res.json("Invalid Category ID!");
            }
        });
    } catch(error) {
        res.status(400).json( {message: error.message} );
    }
});


//Update by ID - Pet
router.put('/pet/:id', checkToken, async(req,res) => {
    try{
        id = mongoose.Types.ObjectId(req.params.id) ;
        const updatedData = req.body;
        const options = { new: true };
        const data = await modelPet.findByIdAndUpdate(id, updatedData, options);
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            if(data) {
                res.json(data);
            }
            else{
                res.json("Invalid Pet ID!");
            }
        });
    } catch(error) {
        res.status(400).json( {message: error.message} );
    }
});


//Delete by ID - Category
router.delete('/category/:id', checkToken, async(req,res) => {
    try{
        const id = mongoose.Types.ObjectId(req.params.id) ;
        const cat_id = id;
        const data = await modelCat.findByIdAndDelete(id);
        const result = await modelPet.deleteMany({category_id:id});
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            if(data){
                res.json(`Deleted category and Pets of Category id ${cat_id}`);
            }
            else{
                res.json("Invalid Category ID!");
            }
        });
    } catch(error) {
        res.status(400).json( {message: error.message} );
    }
});


//Delete by ID - PET
router.delete('/pet/:id', checkToken, async(req,res) => {
    try{
        id = mongoose.Types.ObjectId(req.params.id) ;
        const data = await modelPet.findByIdAndDelete(id);
        jwt.verify(req.token, 'privatekey', (err, authorizedData) => {
            if(err){
                console.log('ERROR: Could not connect to the protected route');
                res.sendStatus(403);
            } 
            if(data){
                res.json(`Deleted Pet of id ${id}`);
            }
            else{
                res.json("Invalid Pet ID!");
            }
        }); 
    } catch(error) {
        res.status(400).json( {message: error.message} );
    }
});


