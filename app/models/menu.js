const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//menu Schema 
const menuSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    size: {
        type: String,
        required: true
    }

});


//Menu Modal
const Menu = mongoose.model('Menu', menuSchema);

module.exports = Menu;