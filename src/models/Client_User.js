const mongoose = require('mongoose');


const Client_UserSchema = new mongoose.Schema({
    email: String,
    cpf_cnpj: String,
});

module.exports = mongoose.model('Client_User', Client_UserSchema);