const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//Order Schema 
const orderSchema = new Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId, // this will give the customer id from users table
        ref: 'User', // it reference from user table 
        required: true
    },
    items: { type: Object, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    paymentType: { type: String, default: 'COD' },
    status: { type: String, default: 'order_placed' }

}, { timestamps: true });


//Order Modal
const Order = mongoose.model('Order', orderSchema);

module.exports = Order;