const mongoose = require('mongoose');


const MVPProposalSchema = new mongoose.Schema({
    //thumbnail: String,
    projectName: String,
    clientName: String,
    clientPhone: String,
    projectModelFirst: String,
    projectModelSecond: String,
    projectPrice: String,
    clientSource: String,
    projectServices: [String],
    services: [String],
    projectSpecificText: String,
    currentDate: String,
    projectDeadline: String,
    projectModelType: String,
    //company: String,
    //uf: String,
   /* user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserM3D'
    }*/

  });





module.exports = mongoose.model('MVPProposal', MVPProposalSchema);