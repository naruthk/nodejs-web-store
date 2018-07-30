const mongoose = require('mongoose');
mongoose.Promise = global.Promise;  // So we can use the advance ES6 promises
const slug = require('slugs')   // URL-friendly permalink

// We're using a "strict" schema. This servers as a validation of input
// before we process it inside the "storeController" file.
const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: 'Please enter a store name!'
  },
  slug: String,
  description: {
    type: String,
    trim: true
  },
  tags: [String],
  created: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [{
      type: Number,
      required: 'You must supply coordinates!'
    }],
    address: {
      type: String,
      required: 'You must supply an address!'
    }
  },
  photos: String
});

// before we save this schema to the database, we will
// take the name that we passed in, and set the slug property
// to be whatever the property of the slug is
storeSchema.pre('save', async function(next) {
  if (!this.isModified('name')) {
    return next(); // skip setting the slug if the name has already
    // been saved
  }
  // it will take the name that you passed in, run it through
  // the slug package that we imported, and set the slug
  // property to whatever output the slug is
  this.slug = slug(this.name);
  
  // Find other stores that have a slug of wes, wes-1, wes-2, etc.
  const slugRegEx = new RegExp(`^(${this.slug})((-[0-9]*$)?)$`, 'i');
  const storesWithSlug = await this.constructor.find({ slug: slugRegEx });
  if (storesWithSlug.length) {
    this.slug = `${this.slug}-${storesWithSlug.length + 1}`;
  }

  // Calling next() will save the slug and store it for later use
  next();
});

storeSchema.statics.getTagsList = function() {
  return this.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

module.exports = mongoose.model('Store', storeSchema);