# SewaFi - Home Services Platform

SewaFi is a full-stack web application that connects customers with service providers for various home services. It features a multi-role system with customers, providers, and admins, enabling seamless booking, management, and review of services.

## Features

### User Management
- **Authentication**: JWT-based login, registration, password reset, and email verification
- **Roles**: Customer, Provider, Admin
- **Profiles**: User profiles with avatars, provider profiles with ratings and verification

### Services
- **Service Categories**: Organized categories for different types of services
- **Service Listings**: Providers can offer services with custom pricing
- **Service Management**: Admins can manage service categories and listings

### Bookings
- **Booking System**: Customers can book services with scheduling and location
- **Status Tracking**: Bookings go through pending, accepted, in-progress, completed, cancelled, rejected
- **Payment Integration**: Basic payment status tracking (expandable)

### Reviews and Ratings
- **Review System**: Customers can review completed bookings
- **Rating Calculation**: Provider ratings based on reviews

### Real-time Features
- **Notifications**: Real-time notifications using Socket.io
- **Provider Availability**: Real-time status updates

### Admin Dashboard
- **User Management**: View and manage all users
- **Service Management**: Manage services and categories
- **Booking Oversight**: Monitor all bookings

### Provider Dashboard
- **Job Management**: View available jobs and manage assigned bookings
- **Service Offering**: Manage offered services

### Customer Dashboard
- **Booking History**: View past and upcoming bookings
- **Profile Management**: Update personal information

## Tech Stack

### Backend
- **Node.js** with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **File Upload**: Cloudinary integration
- **Email**: Nodemailer for notifications and OTP
- **Caching**: Redis for session management and queues
- **Real-time**: Socket.io
- **Validation**: Joi and Zod
- **Logging**: Winston with daily rotation
- **Security**: Helmet, CORS, rate limiting

### Frontend
- **React** with Vite
- **Routing**: React Router
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Real-time**: Socket.io client
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database
- Redis server
- Cloudinary account (for file uploads)
- Email service (Gmail, SendGrid, etc.)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Sewafi-Home Services"
```

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=5000
   LOG_LEVEL=info

   DATABASE_URL="postgresql://username:password@localhost:5432/sewafi_db"

   JWT_ACCESS_SECRET="your-32-char-access-secret"
   JWT_REFRESH_SECRET="your-32-char-refresh-secret"
   JWT_ACCESS_EXPIRY="15m"
   JWT_REFRESH_EXPIRY="7d"

   CORS_ORIGIN="http://localhost:5173"
   FRONTEND_URL="http://localhost:5173"

   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"

   EMAIL_SERVICE="gmail"
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-app-password"
   EMAIL_FROM="noreply@sewafi.com"

   OTP_EXPIRY_MINUTES=10
   OTP_MAX_ATTEMPTS=5

   REDIS_URL="redis://localhost:6379"

   MAX_FILE_SIZE=5242880
   ALLOWED_EXTENSIONS="jpg,jpeg,png,webp"
   ```

4. Set up the database:
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # (Optional) Seed the database
   npm run db:seed
   ```

5. Start the backend server:
   ```bash
   npm run dev  # For development with nodemon
   # or
   npm start    # For production
   ```

The backend will run on `http://localhost:5000`.

### 3. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will run on `http://localhost:5173`.

### 4. API Documentation

- Swagger UI: `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`
- Route reference: [docs/backend-api-overview.md](docs/backend-api-overview.md)
- Postman collection: `SewaFi.postman_collection.json`

Import the Postman collection to test the full API surface. Swagger UI now acts as a quick route index for the currently exposed backend modules.

## Database Schema

The application uses the following main entities:
- **Users**: Customer, Provider, Admin roles
- **Provider Profiles**: Extended info for service providers
- **Service Categories**: Grouping of services
- **Services**: Available services with pricing
- **Provider Services**: Many-to-many relationship between providers and services
- **Bookings**: Service bookings with status tracking
- **Reviews**: Customer reviews for completed bookings
- **Refresh Tokens**: For JWT token management

## Project Structure

```
Sewafi-Home Services/
├── SewaFi.postman_collection.json
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── migrations/
│   ├── src/
│   │   ├── config/
│   │   ├── middlewares/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── bookings/
│   │   │   ├── reviews/
│   │   │   ├── services/
│   │   │   └── users/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── layouts/
    │   ├── pages/
    │   └── utils/
    └── package.json
```

## Current Progress

### Completed Features
- ✅ User authentication and authorization (JWT)
- ✅ Multi-role system (Customer, Provider, Admin)
- ✅ User profile management with avatar upload
- ✅ Service category and service management
- ✅ Provider service offerings with custom pricing
- ✅ Booking system with status tracking
- ✅ Review and rating system
- ✅ Real-time notifications
- ✅ Admin dashboard for user/service/booking management
- ✅ Provider dashboard for job management
- ✅ Customer dashboard for booking history
- ✅ Email notifications and OTP verification
- ✅ File upload to Cloudinary
- ✅ Database migrations and seeding
- ✅ Logging and error handling
- ✅ Security middleware (helmet, CORS, rate limiting)

### In Progress / Future Enhancements
- 🔄 Payment gateway integration
- 🔄 Advanced search and filtering
- 🔄 Mobile app development
- 🔄 Push notifications
- 🔄 Advanced analytics dashboard
- 🔄 Multi-language support

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests (if available)
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Author

Shisir
