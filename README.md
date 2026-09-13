# LOWKEY BLOG

A lightweight, modern blog platform built with **React, TypeScript, Express, Prisma, and PostgreSQL**.

Designed for [tubbylab.com](https://tubbylab.com), LOWKEY BLOG includes a public-facing blog, authenticated admin dashboard, post management, categories, tags, SEO fields, and Supabase Storage integration for cover images.

---

## ✨ Features

### Public Blog

* View published blog posts
* Individual post pages
* Post excerpts
* Cover images
* Categories
* Tags
* SEO-friendly titles and descriptions
* Responsive design
* Fast React/Vite frontend

### Admin Dashboard

* Secure admin login
* Create posts
* Edit posts
* Delete posts
* Publish/unpublish posts
* Manage categories
* Manage tags
* Upload cover images
* Replace cover images
* Remove cover images
* SEO title and description management

### Image Management

Cover images are stored using the **Supabase Storage S3-compatible API**.

The application automatically handles image cleanup:

* Delete post → deletes its cover image
* Remove image while editing → deletes the old image
* Replace image → deletes the old image
* Keep the same image → no deletion
* Images are uploaded through the backend, keeping S3 credentials private

### Security

* Admin authentication
* Protected admin API endpoints
* Bearer token authentication
* Zod request validation
* File type validation
* 5 MB upload limit
* Backend authorization for post mutations
* S3 credentials never exposed to the frontend

---

# 🛠 Tech Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Axios
* React Router
* Lucide React

## Backend

* Node.js
* Express
* TypeScript
* Prisma
* PostgreSQL
* Zod
* Multer
* AWS SDK for JavaScript

## Infrastructure

* Supabase PostgreSQL
* Supabase Storage
* Vercel
* Render

---

# 📁 Project Structure

A typical project structure looks like:

```text
lowkey-blog/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── Admin.tsx
│   │   │   ├── AdminLogin.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── AdminPostNew.tsx
│   │   │   ├── AdminPostEdit.tsx
│   │   │   └── ...
│   │   ├── data/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── prisma.ts
│   │   │   └── s3.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── posts.ts
│   │   │   ├── categories.ts
│   │   │   └── tags.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── ...
│
└── README.md
```

---

# 🗄 Database

The application uses **PostgreSQL** through Prisma ORM.

The main database models are:

```text
Admin
Post
Category
Tag
PostTag
```

### Relationships

```text
Category
   │
   └── Post
         │
         └── PostTag
                │
                └── Tag
```

Posts can have:

* One optional category
* Multiple tags
* One optional cover image

---

# 📐 Prisma Schema

The core database structure:

```prisma
model Admin {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Post {
  id              Int        @id @default(autoincrement())
  title           String
  slug            String     @unique
  excerpt         String?
  content         String
  coverImageUrl   String?
  seoTitle        String?
  seoDescription  String?
  published       Boolean    @default(false)
  publishedAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  categoryId      Int?

  category        Category?  @relation(
    fields: [categoryId],
    references: [id],
    onDelete: SetNull
  )

  tags            PostTag[]

  @@index([published, publishedAt])
  @@index([categoryId])
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  posts     Post[]
}

model Tag {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())
  posts     PostTag[]
}

model PostTag {
  postId Int
  tagId  Int

  post   Post @relation(
    fields: [postId],
    references: [id],
    onDelete: Cascade
  )

  tag    Tag @relation(
    fields: [tagId],
    references: [id],
    onDelete: Cascade
  )

  @@id([postId, tagId])
  @@index([tagId])
}
```

---

# 🔐 Authentication

The admin dashboard uses token-based authentication.

After successful login, the frontend stores the authentication token:

```ts
localStorage.setItem("blog_token", data.token);
```

Protected API requests use:

```http
Authorization: Bearer <token>
```

The backend protects administrative operations using:

```ts
requireAuth
```

Protected operations include:

* Creating posts
* Updating posts
* Deleting posts
* Uploading images
* Managing categories
* Managing tags

The public blog does not require authentication.

---

# 👤 Create Admin User

After setting up the backend and database, create an admin account using:

```bash
npm run create-admin -- admin@example.com "password"
```

For example:

```bash
npm run create-admin -- admin@tubbylab.com "your-secure-password"
```

The command creates an admin user in the PostgreSQL database with a securely hashed password.

After creating the admin account, access:

```text
/admin/login
```

> Use a strong password for the production admin account.

---

# 🖼 Cover Image Storage

Cover images are stored in a Supabase Storage bucket:

```text
blog-covers
```

The architecture is:

```text
React Admin
     │
     ▼
Express API
     │
     ▼
Supabase Storage S3 API
     │
     ▼
blog-covers
     │
     ▼
Public Image URL
     │
     ▼
Post.coverImageUrl
```

The frontend never receives the Supabase S3 secret key.

---

# ☁️ Supabase Storage Configuration

Create a public storage bucket named:

```text
blog-covers
```

Configure the Supabase S3-compatible credentials in the backend environment.

Example:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

SUPABASE_S3_ENDPOINT=https://YOUR_PROJECT_REF.storage.supabase.co/storage/v1/s3

SUPABASE_S3_REGION=YOUR_REGION

SUPABASE_S3_ACCESS_KEY_ID=YOUR_ACCESS_KEY

SUPABASE_S3_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

SUPABASE_STORAGE_BUCKET=blog-covers
```

### Important

Never expose:

```env
SUPABASE_S3_SECRET_ACCESS_KEY
```

to the frontend.

These credentials belong only in the backend environment.

---

# 📤 Image Upload

Images are uploaded through:

```http
POST /api/posts/upload
```

The request requires authentication.

The upload field is:

```text
image
```

Maximum file size:

```text
5 MB
```

Only image MIME types are accepted.

The backend generates a unique filename using:

```ts
crypto.randomUUID()
```

Example:

```text
8e5c2d2a-7f8c-4d0a-9c2d-example.webp
```

The API returns:

```json
{
  "url": "https://PROJECT.supabase.co/storage/v1/object/public/blog-covers/example.webp",
  "fileName": "example.webp"
}
```

The returned URL is stored in:

```text
Post.coverImageUrl
```

---

# 🧹 Automatic Image Cleanup

The backend automatically removes old cover images from Supabase Storage.

### Delete Post

When a post is deleted:

```http
DELETE /api/posts/:id
```

the API:

1. Finds the post
2. Gets its cover image URL
3. Deletes the image from Supabase Storage
4. Deletes the post from PostgreSQL

### Remove Image

When editing a post, if the existing image is removed:

```text
old image → null
```

the API deletes the old image from Storage.

### Replace Image

If the existing image is replaced:

```text
old image → new image
```

the API saves the new URL and deletes the old image.

### Same Image

If the existing image remains unchanged:

```text
old image === new image
```

nothing is deleted.

---

# ⚠️ Orphaned Uploads

A new image is uploaded before the post is saved.

Therefore, if an administrator:

1. Uploads an image
2. Does not save the post
3. Leaves the page

the uploaded image can remain in Supabase Storage without being referenced by a post.

This is currently acceptable for the application.

A future cleanup process could remove unused images automatically.

---

# 🔌 API Endpoints

## Authentication

```http
POST /api/auth/login
```

Admin login.

---

## Posts

### List Published Posts

```http
GET /api/posts
```

Returns published posts.

### List All Posts

```http
GET /api/posts?admin=true
```

Used by the admin dashboard.

### Get Post

```http
GET /api/posts/:slug
```

Returns a published post by slug.

### Create Post

```http
POST /api/posts
Authorization: Bearer <token>
```

### Update Post

```http
PUT /api/posts/:id
Authorization: Bearer <token>
```

### Delete Post

```http
DELETE /api/posts/:id
Authorization: Bearer <token>
```

### Upload Cover Image

```http
POST /api/posts/upload
Authorization: Bearer <token>
```

---

# 🏷 Categories

Category endpoints allow the admin to manage post categories.

Typical operations include:

```http
GET    /api/categories
POST   /api/categories
PUT    /api/categories/:id
DELETE /api/categories/:id
```

Administrative operations require authentication.

---

# 🔖 Tags

Tag endpoints allow the admin to manage tags.

Typical operations include:

```http
GET    /api/tags
POST   /api/tags
PUT    /api/tags/:id
DELETE /api/tags/:id
```

Administrative operations require authentication.

---

# 🧪 Validation

Post requests are validated using **Zod**.

Example fields:

```text
title
slug
excerpt
content
published
seoTitle
seoDescription
coverImageUrl
categoryId
tagIds
```

Slug format:

```text
^[a-z0-9]+(?:-[a-z0-9]+)*$
```

Examples:

```text
my-first-post
building-with-react
lowkey-blog
```

Invalid examples:

```text
My First Post
my_first_post
my first post
```

---

# 🚀 Local Development

## Requirements

Install:

* Node.js
* npm
* PostgreSQL or Supabase PostgreSQL
* Git

---

# 📦 Install Frontend

```bash
cd frontend
npm install
```

Create:

```text
frontend/.env
```

Example:

```env
VITE_API_URL=http://localhost:3001
```

Start the frontend:

```bash
npm run dev
```

The Vite development server will normally run on:

```text
http://localhost:5173
```

---

# 📦 Install Backend

```bash
cd backend
npm install
```

Create:

```text
backend/.env
```

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE

SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co

SUPABASE_S3_ENDPOINT=https://YOUR_PROJECT_REF.storage.supabase.co/storage/v1/s3

SUPABASE_S3_REGION=YOUR_REGION

SUPABASE_S3_ACCESS_KEY_ID=YOUR_ACCESS_KEY

SUPABASE_S3_SECRET_ACCESS_KEY=YOUR_SECRET_KEY

SUPABASE_STORAGE_BUCKET=blog-covers

FRONTEND_URL=http://localhost:5173

JWT_SECRET=your-secure-secret
```

Use your actual credentials for production.

---

# 🧬 Prisma

Generate the Prisma client:

```bash
npx prisma generate
```

Run development migrations:

```bash
npx prisma migrate dev
```

For production:

```bash
npx prisma migrate deploy
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# ▶️ Start Backend

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Production:

```bash
npm start
```

The API normally runs on:

```text
http://localhost:3001
```

---

# 🌐 Production Architecture

The production setup is:

```text
                    ┌──────────────────┐
                    │   tubbylab.com   │
                    │ React Frontend   │
                    │     Vercel       │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Express API    │
                    │     Render       │
                    └────────┬─────────┘
                             │
                 ┌───────────┴───────────┐
                 ▼                       ▼
        ┌─────────────────┐     ┌─────────────────┐
        │ PostgreSQL      │     │ Supabase        │
        │ Supabase        │     │ Storage         │
        └─────────────────┘     └─────────────────┘
```

---

# 🔧 Frontend Environment

Production frontend:

```env
VITE_API_URL=https://YOUR-API-DOMAIN
```

For example:

```env
VITE_API_URL=https://your-api.onrender.com
```

The frontend uses:

```ts
const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001";
```

---

# 🔒 CORS

The backend should allow the production frontend domain.

Example:

```env
FRONTEND_URL=https://tubbylab.com
```

Additional frontend domains can be configured if required.

For local development:

```text
http://localhost:5173
```

---

# 🏗 Build

## Frontend

```bash
cd frontend
npm run build
```

The production files are generated in:

```text
frontend/dist
```

## Backend

```bash
cd backend
npm run build
```

The compiled backend is generated according to the TypeScript configuration.

---

# 🚢 Deployment

## Frontend — Vercel

Deploy the `frontend` directory to Vercel.

Set:

```env
VITE_API_URL=https://YOUR-API-DOMAIN
```

Build command:

```bash
npm run build
```

Output directory:

```text
dist
```

---

## Backend — Render

Deploy the backend application to Render.

Configure:

```text
Build Command:
npm install && npm run build

Start Command:
npm start
```

Set all required environment variables in Render.

---

# 🗃 Database — Supabase

The application uses Supabase PostgreSQL through Prisma.

Set:

```env
DATABASE_URL=YOUR_SUPABASE_DATABASE_URL
```

Run production migrations:

```bash
npx prisma migrate deploy
```

---

# 🔑 Admin Login

The admin interface is available under:

```text
/admin/login
```

After authentication, the token is stored locally:

```text
blog_token
```

Admin pages check for this token before allowing access.

The token is also sent to protected API endpoints using:

```http
Authorization: Bearer <token>
```

---

# 📝 Creating a Post

The typical workflow is:

```text
Admin Login
     ↓
New Post
     ↓
Enter Title
     ↓
Generate/Enter Slug
     ↓
Write Content
     ↓
Select Category
     ↓
Select Tags
     ↓
Upload Cover Image
     ↓
Configure SEO
     ↓
Publish
```

The cover image is uploaded first and its URL is then stored with the post.

---

# 📊 Post Publishing

Posts support two states:

```text
Draft
Published
```

When a post is published for the first time:

```ts
publishedAt = new Date()
```

When unpublished:

```ts
publishedAt = null
```

When an already-published post is edited, its existing `publishedAt` value is preserved.

---

# 🧹 Deleting Posts

Deleting a post automatically removes:

```text
Post record
       +
PostTag records
       +
Cover image from Supabase Storage
```

`PostTag` records are automatically removed through the database relationship using cascade deletion.

---

# 🛡️ Security Notes

Never commit the following to Git:

```text
.env
.env.local
.env.production
```

Never expose:

```text
SUPABASE_S3_SECRET_ACCESS_KEY
DATABASE_URL
JWT_SECRET
```

The S3 credentials are only used by the backend.

Frontend code should only receive the public image URL.

---

# 📋 Recommended .gitignore

```gitignore
node_modules/
dist/
.env
.env.*
!.env.example
```

---

# 🧪 Useful Commands

### Install dependencies

```bash
npm install
```

### Start development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Start production

```bash
npm start
```

### Create admin

```bash
npm run create-admin -- admin@example.com "password"
```

### Prisma client

```bash
npx prisma generate
```

### Prisma development migration

```bash
npx prisma migrate dev
```

### Prisma production migration

```bash
npx prisma migrate deploy
```

### Prisma Studio

```bash
npx prisma studio
```

---

# 🗺️ Future Improvements

Possible future enhancements:

* Image cleanup for abandoned uploads
* Image optimization/resizing
* Automatic WebP/AVIF conversion
* Scheduled publishing
* Draft autosave
* Markdown support
* Rich text editor
* Post search
* Pagination
* Analytics
* RSS feed
* Sitemap generation
* Open Graph image generation
* Social sharing
* Comments
* Revision history
* Multiple admin users
* Role-based permissions

---

# 👨‍💻 Author

**Cromuel**

Full Stack Developer

Davao City, Philippines

Portfolio:

https://tubbylab.com/

* [LinkedIn](https://www.linkedin.com/in/cromuel/)

---

## LOWKEY BLOG

> Simple. Fast. Lowkey.
