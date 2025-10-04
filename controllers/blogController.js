const Blog = require('../models/blogModel');
const User = require('../models/userModel');
const { AppError, catchAsync } = require('../middleware/errorHandler');

// Get all published blogs (public endpoint)
const getAllBlogs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    search,
    author,
    tags
  } = req.query;

  // Build query for published blogs only
  let query = { state: 'published' };

  // Add search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Filter by author name
  if (author) {
    const authorUser = await User.findOne({
      $or: [
        { first_name: { $regex: author, $options: 'i' } },
        { last_name: { $regex: author, $options: 'i' } }
      ]
    });
    
    if (authorUser) {
      query.author = authorUser._id;
    } else {
      // If author not found, return empty results
      return res.status(200).json({
        status: 'success',
        results: 0,
        data: {
          blogs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        }
      });
    }
  }

  // Filter by tags
  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
    query.tags = { $in: tagArray };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const total = await Blog.countDocuments(query);
  const pages = Math.ceil(total / limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  const blogs = await Blog.find(query)
    .populate('author', 'first_name last_name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    }
  });
});

// Get single blog by ID (public endpoint)
const getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({
    _id: req.params.id,
    state: 'published'
  }).populate('author', 'first_name last_name email');

  if (!blog) {
    return next(new AppError('Blog not found or not published', 404));
  }

  // Increment read count
  await blog.incrementReadCount();

  res.status(200).json({
    status: 'success',
    data: {
      blog
    }
  });
});

// Create new blog (authenticated)
const createBlog = catchAsync(async (req, res, next) => {
  const { title, description, body, tags } = req.body;

  // Check if title already exists
  const existingBlog = await Blog.findOne({ title });
  if (existingBlog) {
    return next(new AppError('Blog with this title already exists', 400));
  }

  const blog = await Blog.create({
    title,
    description,
    body,
    tags: tags || [],
    author: req.user._id
  });

  // Populate author information
  await blog.populate('author', 'first_name last_name email');

  res.status(201).json({
    status: 'success',
    message: 'Blog created successfully',
    data: {
      blog
    }
  });
});

// Get user's own blogs (authenticated)
const getMyBlogs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    state
  } = req.query;

  // Build query for user's blogs
  let query = { author: req.user._id };

  // Filter by state if provided
  if (state) {
    query.state = state;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  const total = await Blog.countDocuments(query);
  const pages = Math.ceil(total / limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Execute query
  const blogs = await Blog.find(query)
    .populate('author', 'first_name last_name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    status: 'success',
    results: blogs.length,
    data: {
      blogs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages
      }
    }
  });
});

// Update blog (authenticated - owner only)
const updateBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  // Check if user is the owner
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own blogs', 403));
  }

  // Check for title uniqueness if title is being updated
  if (req.body.title && req.body.title !== blog.title) {
    const existingBlog = await Blog.findOne({ title: req.body.title });
    if (existingBlog) {
      return next(new AppError('Blog with this title already exists', 400));
    }
  }

  // Update blog
  const updatedBlog = await Blog.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('author', 'first_name last_name email');

  res.status(200).json({
    status: 'success',
    message: 'Blog updated successfully',
    data: {
      blog: updatedBlog
    }
  });
});

// Delete blog (authenticated - owner only)
const deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  // Check if user is the owner
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own blogs', 403));
  }

  await Blog.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Blog deleted successfully'
  });
});

// Update blog state (authenticated - owner only)
const updateBlogState = catchAsync(async (req, res, next) => {

  const { state } = req.body;

  if (!state || !['draft', 'published'].includes(state)) {
    return next(new AppError('State must be either draft or published', 400));
  }

  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  // Check if user is the owner
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own blogs', 403));
  }

  blog.state = state;
  const updatedBlog = await blog.save();
  await updatedBlog.populate('author', 'first_name last_name email');

  res.status(200).json({
    status: 'success',
    message: `Blog ${state === 'published' ? 'published' : 'unpublished'} successfully`,
    data: {
      blog: updatedBlog
    }
  });
});

module.exports = {
  getAllBlogs,
  getBlog,
  createBlog,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  updateBlogState
};