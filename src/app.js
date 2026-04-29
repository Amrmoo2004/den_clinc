import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './docs/swagger.js';
import { connectDB } from './db/db.connection.js';
import { globalErrorHandler } from './utils/response/response.js';

// Routers
import authRouter from './modules/auth/auth.controller.js';
import patientsRouter from './modules/patients/patients.controller.js';
import appointmentsRouter from './modules/appointments/appointments.controller.js';
import treatmentsRouter from './modules/treatments/treatments.controller.js';
import invoicesRouter from './modules/invoices/invoices.controller.js';
import inventoryRouter from './modules/inventory/inventory.controller.js';
import reportsRouter from './modules/reports/reports.controller.js';
import settingsRouter from './modules/settings/settings.controller.js';

export const bootstrap = async () => {
    const app = express();

    // Connect to DB
    await connectDB();

    // Middleware
    app.use(cors({ origin: '*', methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', optionsSuccessStatus: 204 }));
    app.use(express.json());
    app.use(cookieParser());
    app.use(morgan('dev'));

    // Swagger
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Dental Clinic API Docs',
    }));

    // Health check
    app.get('/', (req, res) => res.json({ success: true, message: 'Dental Clinic API is running 🦷' }));

    // Routes
    app.use('/api/auth', authRouter);
    app.use('/api/patients', patientsRouter);
    app.use('/api/appointments', appointmentsRouter);
    app.use('/api/treatment-plans', treatmentsRouter);
    app.use('/api/invoices', invoicesRouter);
    app.use('/api/inventory', inventoryRouter);
    app.use('/api/reports', reportsRouter);
    app.use('/api/settings', settingsRouter);

    // 404 handler
    app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

    // Global error handler
    app.use(globalErrorHandler);

    return app;
};