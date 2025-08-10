/* ==== Adjuntos de expediente ==== */
IF OBJECT_ID('core.expediente_adjuntos') IS NULL
BEGIN
  CREATE TABLE core.expediente_adjuntos(
    adjunto_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    expediente_id BIGINT NOT NULL,
    archivo_nombre NVARCHAR(255) NOT NULL,
    mime NVARCHAR(100) NOT NULL,
    tamano_bytes BIGINT NOT NULL,
    sha256 NVARCHAR(64) NOT NULL,
    storage_key NVARCHAR(300) NOT NULL, -- p.ej. exp/{expediente_id}/{uuid}-{filename}
    creado_por BIGINT NOT NULL,
    creado_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    eliminado_at DATETIME2 NULL,
    scan_status NVARCHAR(20) NOT NULL DEFAULT N'PENDING', -- PENDING|CLEAN|INFECTED|ERROR
    scan_details NVARCHAR(400) NULL,
    CONSTRAINT FK_adj_exp FOREIGN KEY(expediente_id) REFERENCES core.expedientes(expediente_id)
  );
  CREATE INDEX IX_adj_exp ON core.expediente_adjuntos(expediente_id);
END
GO

/* Crear adjunto */
IF OBJECT_ID('core.usp_Adjunto_Create') IS NOT NULL DROP PROCEDURE core.usp_Adjunto_Create;
GO
CREATE PROCEDURE core.usp_Adjunto_Create
  @expediente_id BIGINT,
  @archivo_nombre NVARCHAR(255),
  @mime NVARCHAR(100),
  @tamano_bytes BIGINT,
  @sha256 NVARCHAR(64),
  @storage_key NVARCHAR(300),
  @creado_por BIGINT
AS
BEGIN
  SET NOCOUNT ON;

  IF NOT EXISTS (SELECT 1 FROM core.expedientes WHERE expediente_id=@expediente_id AND deleted_at IS NULL)
    THROW 51000, 'Expediente inexistente', 1;

  INSERT INTO core.expediente_adjuntos(expediente_id,archivo_nombre,mime,tamano_bytes,sha256,storage_key,creado_por,scan_status)
  VALUES(@expediente_id,@archivo_nombre,@mime,@tamano_bytes,@sha256,@storage_key,@creado_por,N'PENDING');

  DECLARE @new_id BIGINT = SCOPE_IDENTITY();

  INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id, metadata)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @creado_por), N'adjunto.create', N'core.expediente_adjuntos',
          CONVERT(NVARCHAR(64), @new_id),
          CONCAT(N'{"expediente_id":',@expediente_id,N',"name":"',@archivo_nombre,N'"}'));

  SELECT adjunto_id=@new_id;
END
GO

/* Actualiza estado de escaneo */
IF OBJECT_ID('core.usp_Adjunto_UpdateScan') IS NOT NULL DROP PROCEDURE core.usp_Adjunto_UpdateScan;
GO
CREATE PROCEDURE core.usp_Adjunto_UpdateScan
  @adjunto_id BIGINT,
  @status NVARCHAR(20),
  @details NVARCHAR(400)=NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.expediente_adjuntos
    SET scan_status=@status, scan_details=@details
  WHERE adjunto_id=@adjunto_id AND eliminado_at IS NULL;
  SELECT affected = @@ROWCOUNT;
END
GO

/* Listar adjuntos de un expediente */
IF OBJECT_ID('core.usp_Adjunto_ListByExpediente') IS NOT NULL DROP PROCEDURE core.usp_Adjunto_ListByExpediente;
GO
CREATE PROCEDURE core.usp_Adjunto_ListByExpediente
  @expediente_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT adjunto_id, archivo_nombre, mime, tamano_bytes, sha256, storage_key,
         creado_por, creado_at, scan_status, scan_details
  FROM core.expediente_adjuntos
  WHERE expediente_id=@expediente_id AND eliminado_at IS NULL
  ORDER BY creado_at DESC;
END
GO

/* Obtener adjunto */
IF OBJECT_ID('core.usp_Adjunto_GetById') IS NOT NULL DROP PROCEDURE core.usp_Adjunto_GetById;
GO
CREATE PROCEDURE core.usp_Adjunto_GetById
  @adjunto_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 *
  FROM core.expediente_adjuntos
  WHERE adjunto_id=@adjunto_id AND eliminado_at IS NULL;
END
GO

/* Borrado lógico */
IF OBJECT_ID('core.usp_Adjunto_Delete') IS NOT NULL DROP PROCEDURE core.usp_Adjunto_Delete;
GO
CREATE PROCEDURE core.usp_Adjunto_Delete
  @adjunto_id BIGINT,
  @actor NVARCHAR(128)=NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @affected INT = 0;
  UPDATE core.expediente_adjuntos
    SET eliminado_at = SYSUTCDATETIME()
  WHERE adjunto_id=@adjunto_id AND eliminado_at IS NULL;
  SET @affected = @@ROWCOUNT;

  IF @affected = 1
  BEGIN
    INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id)
    VALUES (SYSUTCDATETIME(), @actor, N'adjunto.delete', N'core.expediente_adjuntos', CONVERT(NVARCHAR(64), @adjunto_id));
  END

  SELECT affected=@affected;
END
GO
