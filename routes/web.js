const express = require('express');
const router = express.Router();
const Menu = require('../app/models/menu');
const User = require('../app/models/user');
const Order = require('../app/models/order1');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const passport = require('passport');
const ensureAuthentication = require('../app/http/middlewares/auth');
const checkUser = require('../app/http/middlewares/customer');
const moment = require('moment');
const checkAdmin = require('../app/http/middlewares/admin');


// TODO: This Function is currently not working we have to check it later 
const _getRedirect = (req) => {
    return req.user.role === 'admin' ? '/admin/orders' : '/customer/orders';
}

router.get('/', async(req, res) => {

    const menu = await Menu.find().sort({ createdAt: -1 });
    //console.log(menu);
    res.status(200).render('home', { pizzas: menu });

})

router.get('/cart', (req, res) => {
    res.render('customer/cart');
})

router.get('/login', (req, res) => {
    res.render('auth/login');
})

//Login Auth
router.post('/login', ensureAuthentication, (req, res, next) => {

    const { email, password } = req.body;

    const schema = Joi.object({
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(6),
    })

    //Now Validating My Result 
    const result = schema.validate(req.body);
    if (result.error) {
        req.flash('error', 'Fields Must be Filled');
        return res.redirect('/login');
    }

    //console.log(req.body);
    passport.authenticate('local', {
        successRedirect: '/', //_getRedirect(req), //TODO: This function is not working we have to check passport auth setting
        badRequest: 'Something went Wrong',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);


});

router.get('/register', ensureAuthentication, (req, res) => {
    res.render('auth/register');
})

//Registering a User
router.post('/register', (req, res) => {
    const { name, email, password } = req.body;
    //Bringing In Joi validation
    const schema = Joi.object({
        name: Joi.string().min(3).max(20).required(),
        email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }).required(),
        password: Joi.string()
            .pattern(new RegExp('^[a-zA-Z0-9]{3,30}$')).min(6),
    })

    //Now Validating My Result 
    const result = schema.validate(req.body);
    if (result.error) {
        req.flash('error', 'All Fields Must be Filled');
        req.flash('name', name);
        req.flash('email', email);
        return res.redirect('/register');
    }

    //Checking if the email is already registered
    User.findOne({ email: email })
        .then(user => {
            if (user) {
                req.flash('error', 'Email Already Registered');
                req.flash('name', name);
                req.flash('email', email);
                return res.redirect('/register');
            } else {
                const newUser = new User({
                    name,
                    email,
                    password
                });

                //Hashing the password
                bcrypt.genSalt(10, (err, salt) => {
                    bcrypt.hash(newUser.password, salt, (err, hash) => {
                        if (err) throw err;
                        newUser.password = hash;
                        //* Saving the User details to database;
                        newUser.save()
                            .then((result) => {
                                req.flash('success_msg', 'You are now Register and can login now');
                                return res.redirect('/');

                            })
                            .catch(err => {
                                req.flash('error', 'Something Went Wrong  Registered');
                                return res.redirect('/register');
                            })

                    })
                })




            }

        })
})

//Storing items in cart through sessions
router.post('/update-cart', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = {
            items: {},
            totalQty: 0,
            totalPrice: 0
        }
    }
    let cart = req.session.cart;
    //check if item is not in the cart 
    console.log(typeof(req.body._id));
    if (!cart.items[req.body._id]) {
        cart.items[req.body._id] = {
            item: req.body,
            qty: 1
        }
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;
    } else {
        cart.items[req.body._id].qty = cart.items[req.body._id].qty + 1;
        cart.totalQty = cart.totalQty + 1;
        cart.totalPrice = cart.totalPrice + req.body.price;

    }
    return res.json({ totalQty: req.session.cart.totalQty });
})

//*-----CUSTOMERS ROUTES

//Order Page
router.post('/orders', checkUser, (req, res) => {
    //console.log(req.body);
    const { phone, address } = req.body;
    //validate Fields
    if (!phone || !address) {
        req.flash('error', 'Please Filled The Fields to Order');
        return res.redirect('/cart');
    }


    Order.findOne({ phone: phone })
        .then(order => {
            if (order) {
                req.flash('error', 'Order Already Registered On this Phone Number ');
                return res.redirect('/cart');
            } else {
                // Save Order in Database
                const newOrder = new Order({
                    customerId: req.user._id, //passport js returns you the currrent user that is logged in 
                    items: req.session.cart.items,
                    phone,
                    address,
                });
                newOrder.save()
                    .then(result => {
                        req.flash('success', 'Order Placed Successfully');
                        delete req.session.cart //delete from the card 
                        return res.redirect('/customer/orders');

                    })
                    .catch(err => {
                        req.flash('error', 'Something Went Wrong ');
                        return res.redirect('/cart');
                    })


            }
        })


})

//Orders Page 
router.get('/customer/orders', checkUser, async(req, res) => {
    const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 })
        //console.log(orders);  
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.render('customer/orders', { orders, moment });
})


//* ----ADMIN ROUTES
router.get('/admin/orders', (req, res) => {
    Order.find({ status: { $ne: 'completed' } }, null, { sort: { 'createdAt': -1 } })
        .populate('customerId', '-password').exec((err, order) => {
            if (req.xhr) // checking if request is an ajax call
            {
                res.json(order);
            } else {

                res.render('admin/orders');
            }
        })


})

router.post('/admin/order/status', (req, res) => {
    Order.updateOne({ _id: req.body.orderId }, { status: req.body.status }, (err, data) => {
        if (err) {
            return res.redirect('/admin/orders');

        }
        return res.redirect('/admin/orders');
    })

})


router.get('/customer/order/:id', async(req, res) => {
    const id = req.params.id;
    const order = await Order.findById(id)
    if (req.user._id.toString() === order.customerId.toString()) {
        res.render('customer/singleOrder', { order });

    } else {
        res.redirect('/');
    }

})

//* LOGOUT ROUTE    
router.post('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
})

module.exports = router;