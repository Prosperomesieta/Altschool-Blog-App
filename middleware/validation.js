const Joi = require('joi');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }
    
    next();
  };
};

// User registration validation schema
const registerSchema = Joi.object({
  first_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'any.required': 'First name is required'
    }),
  
  last_name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'any.required': 'Last name is required'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required'
    })
});

// User login validation schema
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Blog creation validation schema
const createBlogSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters',
      'any.required': 'Title is required'
    }),
  
  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  body: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'Body must be at least 10 characters long',
      'any.required': 'Body is required'
    }),
  
  tags: Joi.array()
    .items(Joi.string().min(2).max(30))
    .max(10)
    .default([])
    .messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.min': 'Each tag must be at least 2 characters long',
      'string.max': 'Each tag cannot exceed 30 characters'
    })
});

// Blog update validation schema
const updateBlogSchema = Joi.object({
  title: Joi.string()
    .min(5)
    .max(200)
    .messages({
      'string.min': 'Title must be at least 5 characters long',
      'string.max': 'Title cannot exceed 200 characters'
    }),
  
  description: Joi.string()
    .max(500)
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  
  body: Joi.string()
    .min(10)
    .messages({
      'string.min': 'Body must be at least 10 characters long'
    }),
  
  tags: Joi.array()
    .items(Joi.string().min(2).max(30))
    .max(10)
    .messages({
      'array.max': 'Cannot have more than 10 tags',
      'string.min': 'Each tag must be at least 2 characters long',
      'string.max': 'Each tag cannot exceed 30 characters'
    }),
  
  state: Joi.string()
    .valid('draft', 'published')
    .messages({
      'any.only': 'State must be either draft or published'
    }) 
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Query parameter validation schemas
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sortBy: Joi.string().valid('created_at', 'read_count', 'reading_time').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  state: Joi.string().valid('draft', 'published'),
  search: Joi.string().max(100),
  author: Joi.string(),
  tags: Joi.string()
});

// Validate query parameters
const validateQuery = (req, res, next) => {
  const { error, value } = paginationSchema.validate(req.query);
  
  if (error) {
    const errors = error.details.map(detail => detail.message);
    return res.status(400).json({
      status: 'error',
      message: 'Invalid query parameters',
      errors
    });
  }
  
  req.query = value;
  next();
};

module.exports = {
  validate,
  validateQuery,
  registerSchema,
  loginSchema,
  createBlogSchema,
  updateBlogSchema 
}; 