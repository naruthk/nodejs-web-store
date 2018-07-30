const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const uuid = require('uuid');
const jimp = require('jimp');

// Checks if file type is allowed.
const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/');
    if (isPhoto) {
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
};

// Renders the index page (from Pug template)
exports.homePage = (req, res) => {
  res.render('index');
};

// Renders the editstore page (from Pug template)
exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' });
};

exports.upload = multer(multerOptions).single('photo');

// Resize the photo the user has uploaded to a specific width and auto height
// Saves the photo to public/uploads 
exports.resize = async (req, res, next) => {
  // Check if there is no new file to resize
  if (!req.file) {
    next(); // skip to the next middleware
    return;
  }

  // we only want the file type ".jpeg .png" for instance
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;

  // now we resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);
  
  // once we have written the photo to our filesystem, keep going
  next();
};

// We mark this function as async in order for us to be able
// to use await inside its function
exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  req.flash('success', `Successfully Created ${store.name}. Care to leave a review?`);
  res.redirect(`/stores/${store.slug}`);

  // We can see the output of the store that was created.
  // console.log(req.body)
  // res.json(req.body);
};

exports.getStores = async (req, res) => {
  // 1. Query the database for a list of all stores
  const stores = await Store.find();
  console.log(stores);
  res.render('stores', { title: 'Stores', stores: stores });
};

exports.editStore = async (req, res) => {
  // 1. Find the store given the ID
  const store = await Store.findOne({ _id: req.params.id });

  // 2. Confirm they are the owner of the store


  // 3. Render out the edit form so the user can update their store
  res.render('editStore', { title: `Edit ${store.name}`, store: store });
};

exports.updateStore = async (req, res) => {
  // Set the location data to be a point
  req.body.location.type = 'Point';

  // Find and update the store
  const store = await Store.findOneAndUpdate(
    { _id: req.params.id }, 
    req.body, 
    { new: true, // return the new store instead of the old one
      runValidators: true
  }).exec();
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store -></a>`);
  res.redirect(`/stores/${store._id}/edit`);
  // Redirect them to the store and tell the it worked
};

exports.getStoreBySlug = async (req, res, next) => {
  const store = await Store.findOne({ slug: req.params.slug});
  // If the slug isn't found, just pass to the next step
  if (!store) return next();
  res.render('store', { store: store, title: store.name });
};

exports.getStoresByTag = async (req, res) => {
  const tag = req.params.tag;
  // If there is no specific tag given, then fetch all available stores that have at least one tag avaialable
  const tagQuery = tag || { $exists: true };

  // Store.getTagsList() is implemented inside Store.js
  const tagsPromise = Store.getTagsList();
  const storesPromise = Store.find({ tags: tagQuery });
  const [tags, stores] = await Promise.all([tagsPromise, storesPromise]);
  res.render('tag', { tags: tags, title: 'Tags', tag: tag, stores: stores});
};