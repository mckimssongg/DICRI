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
      cookieAuth: { type: "apiKey", in: "cookie", name: "refresh_token" }
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
      CatalogItem: {
        type: "object",
        properties: {
          item_id: { type: "integer" },
          catalog_key: { type: "string" },
          code: { type: "string" },
          label: { type: "string" },
          is_active: { type: "boolean" },
          sort_order: { type: "integer" },
        },
      },
      CatalogCreateRequest: {
        type: "object",
        required: ["code", "label"],
        properties: {
          code: { type: "string" },
          label: { type: "string" },
          sort_order: { type: "integer", default: 0 },
        },
      },
      CatalogUpdateRequest: {
        type: "object",
        required: ["label", "is_active", "sort_order"],
        properties: {
          label: { type: "string", example: "Rojo intenso" },
          is_active: { type: "boolean", example: true },
          sort_order: { type: "integer", example: 10 },
        },
      },
      CreateUserRequest: {
        type: "object",
        required: ["username", "password", "email"],
        properties: {
          username: { type: "string", example: "coordinador1" },
          password: { type: "string", example: "Str0ng!Pass" },
          email: { type: "string", example: "coord1@mp.gob.gt" },
          mfa_required: { type: "boolean", example: false },
          roles: { type: "array", items: { type: "string" }, example: ["coordinador"] }
        }
      },
      CreateUserResponse: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          username: { type: "string", example: "coordinador1" },
          email: { type: "string", example: "coord1@mp.gob.gt" },
          roles: { type: "array", items: { type: "string" }, example: ["coordinador"] }
        }
      },
      PasswordResetRequest: {
        type: "object",
        properties: {
          username: { type: "string", example: "admin" },
          email: { type: "string", example: "admin@mp.gob.gt" }
        }
      },
      PasswordResetConfirm: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", example: "reset-token-123" },
          newPassword: { type: "string", example: "Nuev4!Clave" }
        }
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
    "/api/v1/catalogs/{catalogKey}/items": {
      get: {
        tags: ["Catálogos"],
        summary: "Lista items de un catálogo",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "catalogKey",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/CatalogItem" },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ["Catálogos"],
        summary: "Crea item",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "catalogKey",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CatalogCreateRequest" },
            },
          },
        },
        responses: { "201": { description: "Creado" } },
      },
    },
    "/api/v1/catalogs/items/{itemId}": {
      put: {
        tags: ["Catálogos"],
        summary: "Actualiza item",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "itemId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CatalogUpdateRequest" },
            },
          },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["Catálogos"],
        summary: "Elimina (soft) item",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "itemId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "204": { description: "No Content" },
          "404": { description: "No encontrado" },
        },
      },
    },
    "/api/v1/users": {
      post: {
        tags: ["Usuarios"],
        summary: "Crea usuario y asigna roles",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/CreateUserRequest" } }
          }
        },
        responses: {
          "201": {
            description: "Creado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateUserResponse" } }
            }
          },
          "400": {
            description: "Datos inválidos",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          }
        }
      }
    },
    "/api/v1/auth/reset/request": {
      post: {
        tags: ["Auth"], security: [],
        summary: "Solicita reset de contraseña (siempre 202)",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PasswordResetRequest" } }
          }
        },
        responses: {
          "202": { description: "Enviado (o silenciado si no existe)" },
          "400": {
            description: "Datos inválidos",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          }
        }
      }
    },
    "/api/v1/auth/reset/confirm": {
      post: {
        tags: ["Auth"], security: [],
        summary: "Confirma reset con token",
        requestBody: {
          required: true,
          content: {
            "application/json": { schema: { $ref: "#/components/schemas/PasswordResetConfirm" } }
          }
        },
        responses: {
          "200": { description: "OK" },
          "400": {
            description: "Inválido",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          },
          "410": {
            description: "Expirado",
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } }
            }
          }
        }
      }
    },
  },
};
