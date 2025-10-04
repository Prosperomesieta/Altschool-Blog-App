/*const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/userModel');
const Blog = require('../models/blogModel');

// Test database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blogging_api_test';

beforeAll(async () => {
  await mongoose.connect(MONGODB_URI);
});

beforeEach(async () => {
  await User.deleteMany({});
  await Blog.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Blog Endpoints', () => {
  let user1, user2, token1, token2;

  const validBlog = {
    title: 'Test Blog Title',
    description: 'This is a test blog description',
    body: 'This is the body content of the test blog. It should be long enough to pass validation.',
    tags: ['test', 'blog', 'api']
  };

  beforeEach(async () => {
    // Create test users
    user1 = await User.create({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      password: 'password123'
    });

    user2 = await User.create({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      password: 'password123'
    });

    // Get tokens
    const loginRes1 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'john@example.com',
        password: 'password123'
      });
    token1 = loginRes1.body.token;

    const loginRes2 = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'jane@example.com',
        password: 'password123'
      });
    token2 = loginRes2.body.token;
  });

  describe('POST /api/blogs', () => {
    it('should create a new blog with valid data', async () => {
      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send(validBlog)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Blog created successfully');
      expect(res.body.data.blog.title).toBe(validBlog.title);
      expect(res.body.data.blog.state).toBe('draft');
      expect(res.body.data.blog.author._id).toBe(user1._id.toString());
      expect(res.body.data.blog.reading_time).toBeGreaterThan(0);
    });

    it('should not create blog without authentication', async () => {
      const res = await request(app)
        .post('/api/blogs')
        .send(validBlog)
        .expect(401);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Access token is required');
    });

    it('should not create blog with duplicate title', async () => {
      await Blog.create({ ...validBlog, author: user1._id });

      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send(validBlog)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Blog with this title already exists');
    });

    it('should not create blog with invalid data', async () => {
      const invalidBlog = { ...validBlog, title: 'AB' }; // Title too short

      const res = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${token1}`)
        .send(invalidBlog)
        .expect(400);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validation failed');
    });
  });

  describe('GET /api/blogs', () => {
    beforeEach(async () => {
      // Create test blogs
      await Blog.create({
        ...validBlog,
        title: 'Published Blog 1',
        author: user1._id,
        state: 'published'
      });

      await Blog.create({
        ...validBlog,
        title: 'Published Blog 2',
        author: user2._id,
        state: 'published'
      });

      await Blog.create({
        ...validBlog,
        title: 'Draft Blog',
        author: user1._id,
        state: 'draft'
      });
    });

    it('should get all published blogs', async () => {
      const res = await request(app)
        .get('/api/blogs')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(2);
      expect(res.body.data.blogs).toHaveLength(2);
      
      // Should only return published blogs
      res.body.data.blogs.forEach(blog => {
        expect(blog.state).toBe('published');
      });
    });

    it('should paginate results correctly', async () => {
      const res = await request(app)
        .get('/api/blogs?page=1&limit=1')
        .expect(200);

      expect(res.body.results).toBe(1);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(1);
      expect(res.body.data.pagination.total).toBe(2);
    });

    it('should search blogs by title', async () => {
      const res = await request(app)
        .get('/api/blogs?search=Published Blog 1')
        .expect(200);

      expect(res.body.results).toBe(1);
      expect(res.body.data.blogs[0].title).toBe('Published Blog 1');
    });

    it('should filter blogs by author', async () => {
      const res = await request(app)
        .get('/api/blogs?author=John')
        .expect(200);

      expect(res.body.results).toBe(1);
      expect(res.body.data.blogs[0].author.first_name).toBe('John');
    });

    it('should sort blogs by read_count', async () => {
      // Update read count for one blog
      await Blog.findOneAndUpdate(
        { title: 'Published Blog 1' },
        { read_count: 10 }
      );

      const res = await request(app)
        .get('/api/blogs?sortBy=read_count&sortOrder=desc')
        .expect(200);

      expect(res.body.data.blogs[0].read_count).toBe(10);
    });
  });

  describe('GET /api/blogs/:id', () => {
    let publishedBlog, draftBlog;

    beforeEach(async () => {
      publishedBlog = await Blog.create({
        ...validBlog,
        title: 'Published Blog',
        author: user1._id,
        state: 'published'
      });

      draftBlog = await Blog.create({
        ...validBlog,
        title: 'Draft Blog',
        author: user1._id,
        state: 'draft'
      });
    });

    it('should get published blog by ID and increment read count', async () => {
      const initialReadCount = publishedBlog.read_count;

      const res = await request(app)
        .get(`/api/blogs/${publishedBlog._id}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.blog.title).toBe('Published Blog');
      expect(res.body.data.blog.read_count).toBe(initialReadCount + 1);
      expect(res.body.data.blog.author.first_name).toBe('John');
    });

    it('should not get draft blog', async () => {
      const res = await request(app)
        .get(`/api/blogs/${draftBlog._id}`)
        .expect(404);

      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Blog not found or not published');
    });

    it('should not get non-existent blog', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      
      const res = await request(app)
        .get(`/api/blogs/${ 
        
        
*/