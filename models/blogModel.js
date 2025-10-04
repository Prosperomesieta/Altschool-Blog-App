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
    type: Number, // in minutes
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

// Index for better query performance
blogSchema.index({ author: 1, state: 1 });
blogSchema.index({ state: 1, created_at: -1 });
blogSchema.index({ title: 'text', tags: 'text' });

// Calculate reading time before saving
blogSchema.pre('save', function(next) {
  if (this.isModified('body')) {
    // Calculate reading time based on average reading speed of 200 words per minute
    const wordCount = this.body.split(/\s+/).length;
    this.reading_time = Math.ceil(wordCount / 200);
  }
  next();
});

// Virtual for formatted creation date
blogSchema.virtual('formatted_date').get(function() {
  return this.created_at.toDateString();
});

// Static method to find published blogs
blogSchema.statics.findPublished = function() {
  return this.find({ state: 'published' });
};

// Static method to find blogs by author
blogSchema.statics.findByAuthor = function(authorId) {
  return this.find({ author: authorId });
};

// Instance method to increment read count
blogSchema.methods.incrementReadCount = function() {
  this.read_count += 1;
  return this.save();
};

// Instance method to publish blog
blogSchema.methods.publish = function() {
  this.state = 'published';
  return this.save();
};

// Instance method to unpublish blog
blogSchema.methods.unpublish = function() {
  this.state = 'draft';
  return this.save();
};

module.exports = mongoose.model('Blog', blogSchema);