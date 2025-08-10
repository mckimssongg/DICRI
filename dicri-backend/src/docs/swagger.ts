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
      cookieAuth: { type: "apiKey", in: "cookie", name: "refresh_token" },
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
          roles: {
            type: "array",
            items: { type: "string" },
            example: ["coordinador"],
          },
        },
      },
      CreateUserResponse: {
        type: "object",
        properties: {
          id: { type: "integer", example: 2 },
          username: { type: "string", example: "coordinador1" },
          email: { type: "string", example: "coord1@mp.gob.gt" },
          roles: {
            type: "array",
            items: { type: "string" },
            example: ["coordinador"],
          },
        },
      },
      PasswordResetRequest: {
        type: "object",
        properties: {
          username: { type: "string", example: "admin" },
          email: { type: "string", example: "admin@mp.gob.gt" },
        },
      },
      PasswordResetConfirm: {
        type: "object",
        required: ["token", "newPassword"],
        properties: {
          token: { type: "string", example: "reset-token-123" },
          newPassword: { type: "string", example: "Nuev4!Clave" },
        },
      },
      ExpedienteCreateRequest: {
        type: "object",
        required: ["sede_codigo", "fecha_registro", "titulo"],
        properties: {
          sede_codigo: { type: "string", example: "GUA" },
          fecha_registro: { type: "string", example: "2025-08-10" },
          titulo: { type: "string", example: "Homicidio zona 7" },
          descripcion: { type: "string", nullable: true },
        },
      },
      ExpedienteCreateResponse: {
        type: "object",
        properties: {
          expediente_id: { type: "integer" },
          folio: { type: "string", example: "GUA-2025-000001" },
        },
      },
      ExpedienteItem: {
        type: "object",
        properties: {
          expediente_id: { type: "integer" },
          folio: { type: "string" },
          sede_codigo: { type: "string" },
          fecha_registro: { type: "string" },
          titulo: { type: "string" },
          descripcion: { type: "string", nullable: true },
          tecnico_id: { type: "integer" },
          estado: { type: "string" },
        },
      },
      ExpedienteListResponse: {
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { $ref: "#/components/schemas/ExpedienteItem" },
          },
          total: { type: "integer" },
        },
      },
      AdjuntoItem: {
        type: "object",
        properties: {
          adjunto_id: { type: "integer" },
          archivo_nombre: { type: "string" },
          mime: { type: "string" },
          tamano_bytes: { type: "integer" },
          sha256: { type: "string" },
          storage_key: { type: "string" },
          creado_por: { type: "integer" },
          creado_at: { type: "string" },
          scan_status: {
            type: "string",
            enum: ["PENDING", "CLEAN", "INFECTED", "ERROR"],
          },
          scan_details: { type: "string", nullable: true },
        },
      },
      AdjuntoUploadResponse: {
        type: "object",
        properties: { adjunto_id: { type: "integer" } },
      },
      AdjuntoDownloadLink: {
        type: "object",
        properties: {
          url: { type: "string" },
          filename: { type: "string" },
          mime: { type: "string" },
        },
      },
      IndicioItem: {
        type: "object",
        properties: {
          indicio_id: { type: "integer" },
          expediente_id: { type: "integer" },
          tipo_code: { type: "string" },
          descripcion: { type: "string", nullable: true },
          color_code: { type: "string", nullable: true },
          tamano: { type: "string", nullable: true },
          peso: { type: "string", nullable: true },
          ubicacion_code: { type: "string", nullable: true },
          tecnico_id: { type: "integer" },
          created_at: { type: "string" },
          updated_at: { type: "string" },
        },
      },
      IndicioCreateRequest: {
        type: "object",
        required: ["tipo_code"],
        properties: {
          tipo_code: { type: "string", example: "ARMA" },
          descripcion: { type: "string" },
          color_code: { type: "string", example: "NEGRO" },
          tamano: { type: "string", example: "15 CM" },
          peso: { type: "string", example: "1.2 KG" },
          ubicacion_code: { type: "string", example: "LAB" },
        },
      },
      RejectRequest: {
        type: "object",
        required: ["motivo"],
        properties: {
          motivo: { type: "string", example: "Información incompleta" },
        },
      },
      ReporteExpedientesResponse: {
        type: "object",
        properties: {
          byEstado: {
            type: "array",
            items: {
              type: "object",
              properties: {
                estado: { type: "string" },
                total: { type: "integer" },
              },
            },
          },
          aprobRechPorFecha: {
            type: "array",
            items: {
              type: "object",
              properties: {
                estado: { type: "string" },
                fecha: { type: "string" },
                total: { type: "integer" },
              },
            },
          },
          porSede: {
            type: "array",
            items: {
              type: "object",
              properties: {
                sede_codigo: { type: "string" },
                estado: { type: "string" },
                total: { type: "integer" },
              },
            },
          },
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
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateUserRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateUserResponse" },
              },
            },
          },
          "400": {
            description: "Datos inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/reset/request": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Solicita reset de contraseña (siempre 202)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PasswordResetRequest" },
            },
          },
        },
        responses: {
          "202": { description: "Enviado (o silenciado si no existe)" },
          "400": {
            description: "Datos inválidos",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/auth/reset/confirm": {
      post: {
        tags: ["Auth"],
        security: [],
        summary: "Confirma reset con token",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PasswordResetConfirm" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "400": {
            description: "Inválido",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "410": {
            description: "Expirado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/v1/expedientes": {
      get: {
        tags: ["Expedientes"],
        summary: "Lista de expedientes (paginado)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "folio", in: "query", schema: { type: "string" } },
          { name: "sede_codigo", in: "query", schema: { type: "string" } },
          {
            name: "desde",
            in: "query",
            schema: { type: "string" },
            description: "YYYY-MM-DD",
          },
          {
            name: "hasta",
            in: "query",
            schema: { type: "string" },
            description: "YYYY-MM-DD",
          },
          {
            name: "page",
            in: "query",
            schema: { type: "integer", default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExpedienteListResponse" },
              },
            },
          },
        },
      },
      post: {
        tags: ["Expedientes"],
        summary: "Crea expediente (folio único por sede+año)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ExpedienteCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Creado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ExpedienteCreateResponse",
                },
              },
            },
          },
          "400": { description: "Datos inválidos" },
          "403": { description: "Sin permiso" },
        },
      },
    },
    "/api/v1/expedientes/{id}": {
      get: {
        tags: ["Expedientes"],
        summary: "Detalle por ID",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ExpedienteItem" },
              },
            },
          },
          "404": { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["Expedientes"],
        summary: "Elimina (soft) expediente",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
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
    "/api/v1/expedientes/{id}/adjuntos": {
      post: {
        tags: ["Adjuntos"],
        summary: "Sube un adjunto al expediente (AV + hash + S3)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: { file: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdjuntoUploadResponse" },
              },
            },
          },
          "415": { description: "Tipo no permitido" },
          "422": { description: "Archivo infectado" },
        },
      },
      get: {
        tags: ["Adjuntos"],
        summary: "Lista adjuntos del expediente",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AdjuntoItem" },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/adjuntos/{adjuntoId}/download": {
      get: {
        tags: ["Adjuntos"],
        summary: "Obtiene URL firmada de descarga (60s)",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "adjuntoId",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdjuntoDownloadLink" },
              },
            },
          },
          "409": { description: "Escaneo pendiente" },
          "423": { description: "Archivo infectado" },
          "404": { description: "No encontrado" },
        },
      },
    },
    "/api/v1/adjuntos/{adjuntoId}": {
      delete: {
        tags: ["Adjuntos"],
        summary: "Elimina (soft) el adjunto y elimina el objeto del storage",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "adjuntoId",
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
    "/api/v1/expedientes/{id}/indicios": {
      post: {
        tags: ["Indicios"],
        summary: "Crea indicio en expediente",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IndicioCreateRequest" },
            },
          },
        },
        responses: {
          "201": {
            description: "Creado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { indicio_id: { type: "integer" } },
                },
              },
            },
          },
        },
      },
      get: {
        tags: ["Indicios"],
        summary: "Lista indicios del expediente",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/IndicioItem" },
                },
              },
            },
          },
        },
      },
    },
    "/api/v1/indicios/{id}": {
      put: {
        tags: ["Indicios"],
        summary: "Actualiza indicio",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/IndicioCreateRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "404": { description: "No encontrado" },
        },
      },
      delete: {
        tags: ["Indicios"],
        summary: "Elimina (soft) indicio",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
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

    /* Revisión */
    "/api/v1/expedientes/{id}/submit": {
      post: {
        tags: ["Expedientes"],
        summary: "Enviar a revisión",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": { description: "OK" },
          "409": { description: "Estado inválido" },
        },
      },
    },
    "/api/v1/expedientes/{id}/approve": {
      post: {
        tags: ["Expedientes"],
        summary: "Aprobar expediente",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        responses: {
          "200": { description: "OK" },
          "409": { description: "Estado inválido" },
        },
      },
    },
    "/api/v1/expedientes/{id}/reject": {
      post: {
        tags: ["Expedientes"],
        summary: "Rechazar expediente",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RejectRequest" },
            },
          },
        },
        responses: {
          "200": { description: "OK" },
          "400": { description: "Motivo requerido" },
          "409": { description: "Estado inválido" },
        },
      },
    },

    /* Reportes */
    "/api/v1/reportes/expedientes": {
      get: {
        tags: ["Reportes"],
        summary: "Conteos por estado/fecha/sede",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "desde",
            in: "query",
            schema: { type: "string" },
            description: "YYYY-MM-DD",
          },
          {
            name: "hasta",
            in: "query",
            schema: { type: "string" },
            description: "YYYY-MM-DD",
          },
        ],
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReporteExpedientesResponse",
                },
              },
            },
          },
        },
      },
    },
  },
};
