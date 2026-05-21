const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middlewares/error.middleware');
const logger = require('./config/logger');
const { corsOrigin } = require('./config/origins');
const {
  apiLimiter,
  authLimiter,
} = require('./middlewares/rate-limit.middleware');

const app = express();

app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(
  morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// app.use(
//   '/api',
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 300,
//     message: 'Too many requests, please try again later',
//     standardHeaders: true,
//   })
// );

// app.use(
//   '/api/v1/auth',
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 20,
//     message: 'Too many auth attempts',
//   })
// );

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'SewaFi API',
    timestamp: new Date(),
    uptime: process.uptime(),
  });
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth', authLimiter);

app.use('/api/v1/auth', require('./modules/auth/auth.routes'));
app.use('/api/v1/customer', require('./modules/customers/customer.routes'));
app.use('/api/v1/users', require('./modules/users/user.routes'));
app.use('/api/v1/provider', require('./modules/providers/provider.routes'));
app.use('/api/v1/providers', require('./modules/providers/provider.routes'));
app.use('/api/v1/services', require('./modules/services/service.routes'));
app.use('/api/v1/subcategories', require('./modules/subcategories/subcategory.routes'));
app.use('/api/v1/bookings', require('./modules/bookings/booking.routes'));
app.use('/api/v1/reviews', require('./modules/reviews/review.routes'));
app.use('/api/v1/notifications', require('./modules/notifications/notification.routes'));
app.use('/api/v1/payments', require('./modules/payments/payment.routes'));
app.use('/api/v1/admin', require('./modules/admin/admin.routes'));
app.use('/api/v1/admin/faqs', require('./modules/faqs/faq.admin.routes'));
app.use('/api/v1/public', require('./modules/faqs/faq.public.routes'));
app.use('/api/v1/uploads', require('./modules/uploads/upload.routes'));
app.use('/api/v1/locations', require('./modules/locations/location.routes'));
app.use('/api/v1/dashboard', require('./modules/dashboard/dashboard.routes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

module.exports = app;
