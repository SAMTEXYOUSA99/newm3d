const express = require('express');

const UserController = require('./controllers/UserController');
const MVPProposalController = require('./controllers/MVPProposalController');
const ProposalController = require('./controllers/ProposalController');
const FilesController = require('./controllers/FilesController');
const ProjectsController = require('./controllers/ProjectsController');
const ProductItemsController = require('./controllers/ProductItemsController');
const ActivitiesController = require('./controllers/ActivitiesController');
const ContractsController = require('./controllers/ContractsController');

//const DashboardController = require('../src/controllers/DashboardController');

const routes = express.Router();

routes.post('/users', UserController.store);
routes.post('/mvpproposals/aintern', MVPProposalController.store);
routes.post('/mvpproposals/aextern', MVPProposalController.store);
routes.post('/mvpproposals/ainextern', MVPProposalController.store);
routes.post('/mvpproposals/cintern', MVPProposalController.store);
routes.post('/mvpproposals/cextern', MVPProposalController.store);
routes.post('/mvpproposals/cinextern', MVPProposalController.store);

routes.post('/proposals', ProposalController.store);

// Files (upload flow)
routes.post('/api/files/presign', FilesController.presign);
routes.post('/api/files/complete', FilesController.complete);
routes.get('/api/files/:id', FilesController.getFile);
routes.delete('/api/files/:id', FilesController.remove);

// Projects
routes.get('/api/projects', ProjectsController.list);
routes.post('/api/projects', ProjectsController.create);
routes.get('/api/projects/:id', ProjectsController.get);
routes.patch('/api/projects/:id', ProjectsController.patch);
routes.patch('/api/projects/:id/autosave', ProjectsController.autosave);
routes.delete('/api/projects/:id', ProjectsController.remove);

// Product items
routes.post('/api/projects/:id/items', ProductItemsController.addItem);
routes.patch('/api/projects/:id/items/:itemId', ProductItemsController.patchItem);
routes.delete('/api/projects/:id/items/:itemId', ProductItemsController.removeItem);

// Activities
routes.get('/api/projects/:id/activities', ActivitiesController.list);
routes.post('/api/projects/:id/activities', ActivitiesController.create);

// Contracts
routes.post('/api/projects/:id/contract', ContractsController.createContract);
routes.get('/api/contracts/:jobId/status', ContractsController.getStatus);


//routes.get('/dashboard', DashboardController.show);


module.exports = routes;  