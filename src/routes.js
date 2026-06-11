const express = require('express');

const UserController = require('./controllers/UserController');
const MVPProposalController = require('./controllers/MVPProposalController');

//const DashboardController = require('../src/controllers/DashboardController');

const routes = express.Router();

routes.post('/users', UserController.store);
routes.post('/mvpproposals/aintern', MVPProposalController.store);
routes.post('/mvpproposals/aextern', MVPProposalController.store);
routes.post('/mvpproposals/ainextern', MVPProposalController.store);
routes.post('/mvpproposals/cintern', MVPProposalController.store);
routes.post('/mvpproposals/cextern', MVPProposalController.store);
routes.post('/mvpproposals/cinextern', MVPProposalController.store);


//routes.get('/dashboard', DashboardController.show);


module.exports = routes;  