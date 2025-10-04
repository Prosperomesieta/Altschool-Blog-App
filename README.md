# 📝 AltSchool Blogging API

A RESTful blogging platform API built with **Node.js**, **Express.js**, and **MongoDB**, designed for creating, reading, updating, and deleting blog posts. It supports authentication, validation, pagination, and filtering.

## 🚀 Features

- User registration and login (with JWT authentication)
- Create, read, update, and delete blog posts
- Publish or draft posts
- Filter by author, tags, or publication state
- Read time calculation
- Validation using Joi
- Pagination, sorting, and search
- Role-based access (author vs public)
- Secure password hashing with bcrypt

## 📚 Technologies Used

- Node.js
- Express.js
- MongoDB + Mongoose
- JWT for authentication
- Joi for validation
- dotenv
- Morgan for logging

## 🔐 Authentication

JWT tokens are used for secure access. After registering or logging in, include your token in the `Authorization` header:

Authorization: Bearer <your_token>

shell
Copy
Edit

## 📂 Folder Structure

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

bash
Copy
Edit

## 🛠️ Installation

1. **Clone the repo**

```bash
git clone https://github.com/AkinwumiOyinkansola/AltSchool-Blogging-API.git
cd AltSchool-Blogging-API
Install dependencies

bash
Copy
Edit
npm install
Create a .env file

env
Copy
Edit
PORT=3800
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
Start the server

bash
Copy
Edit
npm run dev
Server runs at: http://localhost:3800

🧪 API Endpoints
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

Supports query params: page, limit, sortBy, state, tags, search, author.

🔍 Example Query
bash
Copy
Edit
GET /api/blogs?author=John&state=published&sortBy=read_count&page=2&limit=10
🧪 Testing
Use Postman or Thunder Client to test routes. Be sure to:

Register or login to get a token

Use the token in headers for protected routes

📄 License
MIT License © Akinwunmi Oyinkansola
