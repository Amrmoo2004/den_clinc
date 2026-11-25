# den_clinc

A Dental Clinic Management System API. It handles patients, appointments, treatment plans, invoices, inventory and reports for a dental clinic. Built with Node.js, Express and MongoDB.

## Features

- Authentication with JWT and role-based access
- Patient records and an interactive dental chart
- Appointment scheduling and daily bookings
- Treatment plans
- Invoices and billing
- Inventory with stock logs
- Clinic services and settings
- Reports
- Email notifications with Nodemailer
- Image uploads with Cloudinary

## Tech Stack

- Node.js (ES modules) and Express 5
- MongoDB with Mongoose
- JWT and bcryptjs
- Multer and Cloudinary
- Nodemailer
- Morgan, CORS, cookie-parser

## Project Structure

```
src/
  app.js          Express app setup
  index.js        Server entry point
  db/             Database connection and Mongoose models
  middlewares/    Authentication, authorization, validation
  modules/        Feature modules (controller + service)
  seed/           Seed script
  utils/          Helpers (errors, email, security, Cloudinary)
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database
- A Cloudinary account (for uploads)
- An email account for sending mail

### Install

```bash
git clone https://github.com/Amrmoo2004/den_clinc.git
cd den_clinc
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
URL_DATABASE=your_mongodb_connection_string
PORT=3000
NODE_ENV=development
BASE_URL=your_base_url
SALTROUNDS=10
JWT_SECRET=your_jwt_secret

ACCESS_USER_TOKEN_SECRET=your_secret
REFRESH_USER_TOKEN_SECRET=your_secret
ACCESS_SYSTEM_TOKEN_SECRET=your_secret
REFRESH_SYSTEM_TOKEN_SECRET=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Run

```bash
npm start
```

For development with auto-reload:

```bash
npm run start:dev
```

## API Routes

| Area | Base route |
| --- | --- |
| Auth | `/api/auth` |
| Patients | `/api/patients` |
| Dental chart | `/api/dental-chart` |
| Appointments | `/api/appointments` |
| Treatment plans | `/api/treatment-plans` |
| Invoices | `/api/invoices` |
| Inventory | `/api/inventory` |
| Reports | `/api/reports` |
| Settings | `/api/settings` |
| Daily bookings | `/api/daily-bookings` |

## Author

Amr Mohamad ([@Amrmoo2004](https://github.com/Amrmoo2004))
