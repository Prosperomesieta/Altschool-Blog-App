const express = require('express');
const {
  getAllBlogs,
  getBlog,
  createBlog,
  getMyBlogs,
  updateBlog,
  deleteBlog,
  updateBlogState
} = require('../controllers/blogController');
const { authenticateToken, optionalAuth } = require('../middleware/authMiddleware');
const { validate, validateQuery, createBlogSchema, updateBlogSchema } = require('../middleware/validation');

const router = express.Router();


router.get('/', validateQuery, getAllBlogs);
router.get('/:id', getBlog); 


router.use(authenticateToken);

router.post('/', validate(createBlogSchema), createBlog);
router.get('/user/me', validateQuery, getMyBlogs);
router.put('/:id', validate(updateBlogSchema), updateBlog);
router.delete('/:id', deleteBlog);
router.put('/:id/state', updateBlogState);




module.exports = router;  