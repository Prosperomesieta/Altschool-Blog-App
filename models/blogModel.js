const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    unique: true,
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  body: {
    type: String,
    required: [true, 'Body is required']
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required']
  },
  state: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  read_count: {
    type: Number,
    default: 0,
    min: 0
  },
  reading_time: {
    type: Number, 
    default: 0,
    min: 0
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});


blogSchema.index({ author: 1, state: 1 });
blogSchema.index({ state: 1, created_at: -1 });
blogSchema.index({ title: 'text', tags: 'text' });


blogSchema.pre('save', function(next) {
  if (this.isModified('body')) {
    
    const wordCount = this.body.split(/\s+/).length;
    this.reading_time = Math.ceil(wordCount / 200);
  }
  next();
});


blogSchema.virtual('formatted_date').get(function() {
  return this.created_at.toDateString();
});


blogSchema.statics.findPublished = function() {
  return this.find({ state: 'published' });
};


blogSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId });
};


blogSchema.methods.incrementReadCount = function() {
  this.read_count += 1;
  return this.save();
};


blogSchema.methods.publish = function() {
  this.state = 'published';
  return this.save();
};


blogSchema.methods.unpublish = function() {
  this.state = 'draft';
  return this.save();
};

module.exports = mongoose.model('Blog', blogSchema);