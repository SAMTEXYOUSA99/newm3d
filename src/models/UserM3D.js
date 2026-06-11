const mongoose = require('mongoose');


const UserM3DSchema = new mongoose.Schema({
    email: String,
});

module.exports = mongoose.model('UserM3D', UserM3DSchema);