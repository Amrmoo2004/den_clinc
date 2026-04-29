import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dental Clinic API',
            version: '1.0.0',
            description: 'نظام إدارة عيادة الأسنان — REST API Documentation',
        },
        servers: [
            {
                url: 'http://35.173.181.149:3000',
                description: 'Production Server',
            },
            {
                url: process.env.BASE_URL || 'http://localhost:3000',
                description: 'Local Development Server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [{ bearerAuth: [] }],
    },
    apis: ['./src/modules/**/*.controller.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
