import { OpenAPIV3 } from "openapi-types";

export const openApiSpec: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "DICRI API",
    version: "0.1.0",
    description:
      "API de DICRI (dev). Endpoints versionados bajo /api/v1. Autenticación por JWT (bearer) y refresh por cookie httpOnly.",
  },
  servers: [{ url: "http://localhost:3000", description: "Dev local" }],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string", example: "admin" },
          password: { type: "string", example: "Admin123!" },
        },
      },
      LoginResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "integer" },
              username: { type: "string" },
              email: { type: "string", nullable: true },
              roles: { type: "array", items: { type: "string" } },
              mfaRequired: { type: "boolean" },
            },
          },
        },
      },
      RefreshResponse: {
        type: "object",
        properties: { accessToken: { type: "string" } },
      },
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" } },
      },
      GrantRequest: {
        type: "object",
        required: ["roleKey", "permKey"],
        properties: {
          roleKey: { type: "string", example: "tecnico" },
          permKey: { type: "string", example: "expediente.read" },
        },
      },
      PermissionListItem: {
        type: "object",
        properties: {
          perm_id: { type: "integer" },
          perm_key: { type: "string" },
          perm_name: { type: "string" },
        },
      },
      RoleListItem: {
        type: "object",
        properties: {
          role_id: { type: "integer" },
          role_key: { type: "string" },
          role_name: { type: "string" },
        },
      },
    },
  },
  security: [],
  paths: {
    "/api/v1/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login con usuario y contraseña",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" },
            },
          },
        },
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginResponse" },
              },
            },
          },
          "401": {
            description: "Credenciales inválidas",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "423": { description: "Cuenta bloqueada" },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Obtiene nuevo accessToken usando cookie refresh_token",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RefreshResponse" },
              },
            },
          },
          "401": {
            description: "Refresh inválido/ausente",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Cierra sesión (borra refresh cookie)",
        responses: { "204": { description: "No Content" } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Datos del usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "OK" },
          "401": { description: "Token inválido/ausente" },
        },
      },
    },
    "/api/v1/rbac/roles": {
      get: {
        tags: ["RBAC"],
        summary: "Lista de roles",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/RoleListItem" },
                },
              },
            },
          },
          "401": { description: "No autorizado" },
          "403": { description: "Sin permiso" },
        },
      },
    },
    "/api/v1/rbac/permissions": {
      get: {
        tags: ["RBAC"],
        summary: "Lista de permisos",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/PermissionListItem" },
                },
              },
            },
          },
          "401": { description: "No autorizado" },
          "403": { description: "Sin permiso" },
        },
      },
    },
    "/api/v1/rbac/grant": {
      post: {
        tags: ["RBAC"],
        summary: "Concede un permiso a un rol",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GrantRequest" },
            },
          },
        },
        responses: {
          "204": { description: "Concedido" },
          "400": { description: "Datos inválidos" },
          "401": { description: "No autorizado" },
          "403": { description: "Sin permiso" },
        },
      },
    },
    "/api/v1/rbac/revoke": {
      post: {
        tags: ["RBAC"],
        summary: "Revoca un permiso de un rol",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/GrantRequest" },
            },
          },
        },
        responses: {
          "204": { description: "Revocado" },
          "400": { description: "Datos inválidos" },
          "401": { description: "No autorizado" },
          "403": { description: "Sin permiso" },
        },
      },
    },
    "/api/v1/rbac/me/permissions": {
      get: {
        tags: ["RBAC"],
        summary: "Permisos efectivos del usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissions: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          "401": { description: "No autorizado" },
        },
      },
    },
  },
};
