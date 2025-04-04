const mongoose = require('mongoose');

const ProviderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        unique: true,
        trim: true,
        maxlength: [50, 'Name can not be more than 50 characters']
    },
    address: {
        type: String,
        required: [true, 'Please add an address']
    },
    tel: {
        type: String,
        required: [true, 'Please add an telephone number'],
        unique: true
    },
    carAvaliable: {
        type: Number,
        required: true,
        min: [0, 'Available cars cannot be negative'],
        default: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Available cars must be an integer'
        }
    }
});

module.exports=mongoose.model('Provider', ProviderSchema);