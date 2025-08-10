/* ==== INDICIOS ==== */
IF OBJECT_ID('core.indicios') IS NULL
BEGIN
  CREATE TABLE core.indicios(
    indicio_id     BIGINT IDENTITY(1,1) PRIMARY KEY,
    expediente_id  BIGINT NOT NULL,
    tipo_code      NVARCHAR(80) NOT NULL,   -- ref a core.catalog_items(code) donde catalog_key='tipos_indicio'
    descripcion    NVARCHAR(2000) NULL,
    color_code     NVARCHAR(80) NULL,       -- ref a 'colores'
    tamano         NVARCHAR(120) NULL,      -- texto libre o con unidad (ej: "15 CM")
    peso           NVARCHAR(120) NULL,      -- texto libre o con unidad (ej: "1.2 KG")
    ubicacion_code NVARCHAR(80) NULL,       -- ref a 'ubicaciones'
    tecnico_id     BIGINT NOT NULL,         -- core.users.user_id
    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    deleted_at     DATETIME2 NULL,
    CONSTRAINT FK_indicio_exp FOREIGN KEY(expediente_id) REFERENCES core.expedientes(expediente_id)
  );
  CREATE INDEX IX_indicios_exp ON core.indicios(expediente_id) INCLUDE (tipo_code,ubicacion_code,tecnico_id);
END
GO

IF OBJECT_ID('core.trg_indicios_updated_at') IS NOT NULL DROP TRIGGER core.trg_indicios_updated_at;
GO
CREATE TRIGGER core.trg_indicios_updated_at ON core.indicios
AFTER UPDATE AS
BEGIN
  SET NOCOUNT ON;
  UPDATE i SET updated_at = SYSUTCDATETIME()
  FROM core.indicios i
  JOIN inserted x ON i.indicio_id = x.indicio_id;
END
GO

/* Crear indicio */
IF OBJECT_ID('core.usp_Indicio_Create') IS NOT NULL DROP PROCEDURE core.usp_Indicio_Create;
GO
CREATE PROCEDURE core.usp_Indicio_Create
  @expediente_id  BIGINT,
  @tipo_code      NVARCHAR(80),
  @descripcion    NVARCHAR(2000)=NULL,
  @color_code     NVARCHAR(80)=NULL,
  @tamano         NVARCHAR(120)=NULL,
  @peso           NVARCHAR(120)=NULL,
  @ubicacion_code NVARCHAR(80)=NULL,
  @tecnico_id     BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM core.expedientes WHERE expediente_id=@expediente_id AND deleted_at IS NULL)
    THROW 51000, 'Expediente inexistente', 1;

  INSERT INTO core.indicios(expediente_id,tipo_code,descripcion,color_code,tamano,peso,ubicacion_code,tecnico_id)
  VALUES(@expediente_id,@tipo_code,@descripcion,@color_code,@tamano,@peso,@ubicacion_code,@tecnico_id);

  DECLARE @new_id BIGINT = SCOPE_IDENTITY();

  INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id, metadata)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @tecnico_id), N'indicio.create', N'core.indicios',
          CONVERT(NVARCHAR(64), @new_id), CONCAT(N'{"expediente_id":',@expediente_id,N'}'));

  SELECT indicio_id=@new_id;
END
GO

/* Listar por expediente */
IF OBJECT_ID('core.usp_Indicio_ListByExpediente') IS NOT NULL DROP PROCEDURE core.usp_Indicio_ListByExpediente;
GO
CREATE PROCEDURE core.usp_Indicio_ListByExpediente
  @expediente_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT indicio_id, expediente_id, tipo_code, descripcion, color_code, tamano, peso, ubicacion_code,
         tecnico_id, created_at, updated_at
  FROM core.indicios
  WHERE expediente_id=@expediente_id AND deleted_at IS NULL
  ORDER BY created_at ASC;
END
GO

/* Actualizar */
IF OBJECT_ID('core.usp_Indicio_Update') IS NOT NULL DROP PROCEDURE core.usp_Indicio_Update;
GO
CREATE PROCEDURE core.usp_Indicio_Update
  @indicio_id     BIGINT,
  @tipo_code      NVARCHAR(80),
  @descripcion    NVARCHAR(2000)=NULL,
  @color_code     NVARCHAR(80)=NULL,
  @tamano         NVARCHAR(120)=NULL,
  @peso           NVARCHAR(120)=NULL,
  @ubicacion_code NVARCHAR(80)=NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.indicios
    SET tipo_code=@tipo_code, descripcion=@descripcion, color_code=@color_code,
        tamano=@tamano, peso=@peso, ubicacion_code=@ubicacion_code
  WHERE indicio_id=@indicio_id AND deleted_at IS NULL;

  SELECT affected=@@ROWCOUNT;
END
GO

/* Eliminar (soft) */
IF OBJECT_ID('core.usp_Indicio_Delete') IS NOT NULL DROP PROCEDURE core.usp_Indicio_Delete;
GO
CREATE PROCEDURE core.usp_Indicio_Delete
  @indicio_id BIGINT,
  @actor NVARCHAR(128)=NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.indicios SET deleted_at=SYSUTCDATETIME()
  WHERE indicio_id=@indicio_id AND deleted_at IS NULL;

  IF @@ROWCOUNT=1
    INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id)
    VALUES (SYSUTCDATETIME(), @actor, N'indicio.delete', N'core.indicios', CONVERT(NVARCHAR(64), @indicio_id));

  SELECT affected=@@ROWCOUNT;
END
GO
