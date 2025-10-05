# Blog App

This is a Node.js + Express + MongoDB blog app with JWT authentication. Users can register, log in, create blogs, publish them, and perform CRUD operations. Features include pagination, filtering, search, and read counts.

# Features


- User registration and login (with JWT authentication)
- Create, read, update, and delete blog posts
- Publish or draft posts
- Filter by author, tags, or publication state
- Read time calculation
- Validation using Joi
- Pagination, sorting, and search
- Role-based access (author vs public)
- Secure password hashing with bcrypt


# Technologies Used


- Node.js
- Express.js
- MongoDB + Mongoose
- JWT for authentication
- Joi for validation
- dotenv
- Morgan for logging


#  Authentication


JWT tokens are used for secure access. After registering or logging in, include your token in the `Authorization` header:


Authorization: Bearer <your_token>


# Folder Structure


📁 BLOGGING_API
├── 📁 controllers
├── 📁 models
├── 📁 routes
├── 📁 middleware
├── 📁 validators
├── 📁 utils
├── .env
├── .gitignore
├── package.json
└── server.js



Installation

Clone the repository:

git clone https://github.com/Prosperomesieta/Altschool-Blog-App.git


Install dependencies

npm install
Create a .env file
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
Start the server
npm run dev
Server runs at: http://localhost:3000

API Endpoints
Auth
POST /api/auth/register – Register user

POST /api/auth/login – Login user

Blogs
POST /api/blogs – Create blog (auth required)

GET /api/blogs – Get published blogs (public)

GET /api/blogs/:id – Get single blog

PATCH /api/blogs/:id – Update blog (author only)

DELETE /api/blogs/:id – Delete blog (author only)

GET /api/blogs/user – Get blogs by logged-in user

Use Postman or Thunder Client to test routes. Be sure to:

Register or login to get a token

Use the token in headers for protected routes

