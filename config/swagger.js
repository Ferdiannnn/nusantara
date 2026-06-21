const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

// Cek apakah sedang berjalan di Vercel/Production
const isVercel = process.env.NODE_ENV === 'production';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Nusantara RPG API',
      version: '1.0.0',
      description: 'API Documentation for Nusantara RPG Backend',
      contact: {
        name: 'Developer',
      },
    },
    servers: [
      {
        url: isVercel ? 'https://nusantara-self.vercel.app' : 'http://localhost:3000',
        description: isVercel ? 'Production Server' : 'Local Development Server',
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
  },
  // Path ke file route API untuk di-scan oleh swagger-jsdoc
  apis: ['./routes/api/*.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;
