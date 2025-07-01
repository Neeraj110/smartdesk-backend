Smartdesk Backend
Overview
Smartdesk Backend is a Node.js application built with Express and TypeScript, using MongoDB (via Mongoose) as the database. It provides a RESTful API for the Smartdesk Frontend, handling user authentication, file uploads, document processing, and AI-powered features. The backend integrates with Cloudinary for file storage, Google GenAI for AI capabilities, and supports Google OAuth for authentication. It is designed to support smart desk management or workspace functionalities.
Features

User Authentication: Register and login with JWT tokens and Google OAuth, with passwords hashed using bcryptjs.
Anglo-Saxon document parsing and analysis using Google GenAI.
File Uploads: Upload images and documents (Word, PDF) to Cloudinary, with parsing via mammoth and pdf-parse.
MongoDB Integration: Store user data, desk settings, or bookings in a MongoDB database.
CORS Support: Allows cross-origin requests from the frontend (e.g., Vercel-hosted).
API Endpoints: Includes routes for authentication (/api/auth), file uploads (/api/files), and document processing (/api/documents).

Tech Stack

Framework: Express 5.1.0, TypeScript 5.8.3
Database: MongoDB (Mongoose 8.15.0)
Authentication: jsonwebtoken 9.0.2, bcryptjs 3.0.2, googleapis 149.0.0
File Handling: Multer 2.0.0, Cloudinary 2.6.1
Document Processing: Mammoth 1.9.1, pdf-parse 1.1.1
AI Integration: @google/genai 1.4.0
Development Tools: Nodemon 3.1.10, ts-node 10.9.2

Project Structure
smartdesk-backend/
├── src/                    # Source code
│   ├── config/             # Configuration (e.g., database, Cloudinary)
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Authentication and error handling
│   ├── models/             # Mongoose schemas (e.g., User, Document)
│   ├── routes/             # API routes (e.g., auth.ts, files.ts)
│   ├── index.ts            # Main server file
│   └── ...                 # Utilities, types
├── dist/                   # Compiled TypeScript output
├── tests/                  # Unit tests
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── .gitignore              # Files to ignore
└── README.md               # This file

Prerequisites

Node.js: v18 or higher
MongoDB: Local or cloud instance (e.g., MongoDB Atlas)
Cloudinary Account: For file storage
Google Cloud Account: For GenAI and OAuth credentials
pnpm: v9.12.2 (package manager)

Setup Instructions

Clone the Repository:
git clone https://github.com/Neeraj110/smartdesk-backend.git
cd smartdesk-backend


Install Dependencies:
pnpm install


Configure Environment Variables:Create a .env file in the root directory and add:
MONGODB_URI=<mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
GOOGLE_GENAI_API_KEY=<google-genai-api-key>
PORT=3000

Replace placeholders with your credentials.

Run Development Server:
pnpm dev

The API will be available at http://localhost:3000.

Build for Production:
pnpm build

