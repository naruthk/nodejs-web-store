const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { catchErrors } = require('../handlers/errorHandlers');

router.get('/', catchErrors(storeController.getStores));

// Displays a list of stores
router.get('/stores', catchErrors(storeController.getStores));

// Takes us to Add Store page
router.get('/add', storeController.addStore);

// For form submissions only!
// We will be submitting a form. so we use .post rather than .get
// Here we also catch errors in case we cannot add the store.
// See "errorhandlers.js" for more information
router.post(
  '/add',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.createStore)
);

// Here we are modifying an existing store and sending new data back to database
router.post(
  '/add/:id',
  storeController.upload,
  catchErrors(storeController.resize),
  catchErrors(storeController.updateStore)
);

router.get('/stores/:id/edit', catchErrors(storeController.editStore));

router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags/', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));


module.exports = router;