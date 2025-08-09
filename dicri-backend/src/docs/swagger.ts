import { OpenAPIV3 } from 'openapi-types';

export const openApiSpec: OpenAPIV3.Document = {
  openapi: '3.0.3',
  info: {
    title: 'DICRI API',
    version: '0.1.0',
    description:
      'API de DICRI (dev). Endpoints versionados bajo /api/v1. Autenticación por JWT (bearer) y refresh por cookie httpOnly.',
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Dev local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      LoginRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: { type: 'string', example: 'admin' },
          password: { type: 'string', example: 'Admin123!' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              email: { type: 'string', nullable: true },
              roles: { type: 'array', items: { type: 'string' } },
              mfaRequired: { type: 'boolean' },
            },
          },
        },
      },
      RefreshResponse: {
        type: 'object',
        properties: { accessToken: { type: 'string' } },
      },
      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
    },
  },
  security: [],
  paths: {
    '/api/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login con usuario y contraseña',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } } },
          '401': { description: 'Credenciales inválidas', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          '423': { description: 'Cuenta bloqueada' },
        },
      },
    },
    '/api/v1/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Obtiene nuevo accessToken usando cookie refresh_token',
        responses: {
          '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } } },
          '401': { description: 'Refresh inválido/ausente', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/v1/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cierra sesión (borra refresh cookie)',
        responses: { '204': { description: 'No Content' } },
      },
    },
    '/api/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Datos del usuario autenticado',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'OK' },
          '401': { description: 'Token inválido/ausente' },
        },
      },
    },
  },
};
