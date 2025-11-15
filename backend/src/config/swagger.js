import swaggerJsdoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Advancia Pay Ledger API',
    version: '1.0.0',
    description: 'Complete API documentation for Advancia Pay Ledger - A modular SaaS payment platform',
    contact: {
      name: 'API Support',
      email: 'support@advancia.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:4001',
      description: 'Development server',
    },
    {
      url: 'https://staging-api.advancia.com',
      description: 'Staging server',
    },
    {
      url: 'https://api.advancia.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT token',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service authentication',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['USER', 'ADMIN', 'AGENT'] },
          emailVerified: { type: 'boolean' },
          twoFactorEnabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TokenWallet: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          balance: { type: 'number', format: 'decimal' },
          currency: { type: 'string', example: 'ADVP' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      CryptoWallet: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          address: { type: 'string' },
          network: { type: 'string', example: 'TRC20' },
          balance: { type: 'number', format: 'decimal' },
          currency: { type: 'string', example: 'USDT' },
          isActive: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Transaction: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          type: { type: 'string', enum: ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'PAYMENT'] },
          amount: { type: 'number', format: 'decimal' },
          currency: { type: 'string' },
          status: { type: 'string', enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'] },
          description: { type: 'string' },
          metadata: { type: 'object' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SupportTicket: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          subject: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] },
          priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
          assignedTo: { type: 'string', format: 'uuid', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string', nullable: true },
          details: { type: 'object', nullable: true },
        },
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication token is missing or invalid',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Unauthorized',
              message: 'Invalid or expired token',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions to access this resource',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Forbidden',
              message: 'You do not have permission to access this resource',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Not Found',
              message: 'The requested resource was not found',
            },
          },
        },
      },
      ValidationError: {
        description: 'Invalid request data',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Validation Error',
              message: 'Invalid input data',
              details: {
                email: 'Invalid email format',
              },
            },
          },
        },
      },
    },
  },
  tags: [
    { name: 'Authentication', description: 'User authentication and authorization' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Wallets', description: 'Token and crypto wallet operations' },
    { name: 'Transactions', description: 'Transaction management and history' },
    { name: 'Payments', description: 'Payment processing and gateways' },
    { name: 'Support', description: 'Support ticket management' },
    { name: 'Admin', description: 'Administrative functions' },
    { name: 'Analytics', description: 'Analytics and reporting' },
    { name: 'Health', description: 'System health and monitoring' },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.js',
    './src/routes/*.ts',
    './src/routes/**/*.js',
    './src/routes/**/*.ts',
    './src/routes/swagger/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
