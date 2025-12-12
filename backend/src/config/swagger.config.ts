import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Socket Backend API',
    version: '1.0.0',
    description: 'Backend API documentation with Swagger',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${process.env.PORT || 3000}`,
      description: 'Development server',
    },
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'User ID',
            example: '1',
          },
          name: {
            type: 'string',
            description: 'User name',
            example: 'John Doe',
          },
          email: {
            type: 'string',
            description: 'User email',
            example: 'john@example.com',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
        required: ['id', 'name', 'email', 'createdAt', 'updatedAt'],
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Success',
          },
          data: {
            type: 'object',
          },
          statusCode: {
            type: 'number',
            example: 200,
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          message: {
            type: 'string',
            example: 'Error message',
          },
          error: {
            type: 'string',
            example: 'Error details',
          },
          statusCode: {
            type: 'number',
            example: 500,
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Socket',
      description: 'Socket.IO connection statistics',
    },
    {
      name: 'Chat',
      description: 'Chat message persistence endpoints',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routers/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);

