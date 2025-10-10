const Blog = require('../models/blogModel');
const User = require('../models/userModel');
const { AppError, catchAsync } = require('../middleware/errorHandler');

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


  let query = { state: 'published' };

  
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }


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


  if (tags) {
    const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
    query.tags = { $in: tagArray };
  }


  const skip = (page - 1) * limit;
  const total = await Blog.countDocuments(query);
  const pages = Math.ceil(total / limit);


  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;


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


const getBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findOne({
    _id: req.params.id,
    state: 'published'
  }).populate('author', 'first_name last_name email');

  if (!blog) {
    return next(new AppError('Blog not found or not published', 404));
  }

  
  await blog.incrementReadCount();

  res.status(200).json({
    status: 'success',
    data: {
      blog
    }
  });
});


const createBlog = catchAsync(async (req, res, next) => {
  const { title, description, body, tags } = req.body;

  
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

  
  await blog.populate('author', 'first_name last_name email');

  res.status(201).json({
    status: 'success',
    message: 'Blog created successfully',
    data: {
      blog
    }
  });
});


const getMyBlogs = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
    state
  } = req.query;

  
  let query = { author: req.user._id };

  
  if (state) {
    query.state = state;
  }

  
  const skip = (page - 1) * limit;
  const total = await Blog.countDocuments(query);
  const pages = Math.ceil(total / limit);

  
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  
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


const updateBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only update your own blogs', 403));
  }

  
  if (req.body.title && req.body.title !== blog.title) {
    const existingBlog = await Blog.findOne({ title: req.body.title });
    if (existingBlog) {
      return next(new AppError('Blog with this title already exists', 400));
    }
  }

  
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


const deleteBlog = catchAsync(async (req, res, next) => {
  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  
  if (blog.author.toString() !== req.user._id.toString()) {
    return next(new AppError('You can only delete your own blogs', 403));
  }

  await Blog.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: 'success',
    message: 'Blog deleted successfully'
  });
});


const updateBlogState = catchAsync(async (req, res, next) => {

  const { state } = req.body;

  if (!state || !['draft', 'published'].includes(state)) {
    return next(new AppError('State must be either draft or published', 400));
  }

  const blog = await Blog.findById(req.params.id);

  if (!blog) {
    return next(new AppError('Blog not found', 404));
  }

  
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