/* ==== EXPEDIENTES ==== */
IF OBJECT_ID('core.sedes') IS NULL
BEGIN
  CREATE TABLE core.sedes(
    sede_id INT IDENTITY(1,1) PRIMARY KEY,
    sede_codigo NVARCHAR(10) NOT NULL UNIQUE, -- p.ej. GUA, QUE, PET
    sede_nombre NVARCHAR(120) NOT NULL
  );
END
GO

/* contador de folios por sede+año */
IF OBJECT_ID('core.expediente_folio_seq') IS NULL
BEGIN
  CREATE TABLE core.expediente_folio_seq(
    sede_codigo NVARCHAR(10) NOT NULL,
    anio INT NOT NULL,
    next_seq INT NOT NULL DEFAULT 1,
    PRIMARY KEY (sede_codigo, anio)
  );
END
GO

/* entidad expediente (soft delete) */
IF OBJECT_ID('core.expedientes') IS NULL
BEGIN
  CREATE TABLE core.expedientes(
    expediente_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    folio NVARCHAR(32) NOT NULL UNIQUE,             -- SED-AAAA-###### 
    sede_codigo NVARCHAR(10) NOT NULL,              -- FK lógica a core.sedes.sede_codigo
    fecha_registro DATE NOT NULL,
    titulo NVARCHAR(200) NOT NULL,
    descripcion NVARCHAR(2000) NULL,
    tecnico_id BIGINT NOT NULL,                      -- core.users.user_id
    estado NVARCHAR(20) NOT NULL DEFAULT N'BORRADOR',-- BORRADOR | EN_REVISION | RECHAZADO | APROBADO
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL
  );
  CREATE INDEX IX_expedientes_sede_anio ON core.expedientes (sede_codigo, fecha_registro);
END
GO

IF OBJECT_ID('core.trg_expedientes_updated_at') IS NOT NULL DROP TRIGGER core.trg_expedientes_updated_at;
GO
CREATE TRIGGER core.trg_expedientes_updated_at ON core.expedientes
AFTER UPDATE AS
BEGIN
  SET NOCOUNT ON;
  UPDATE e SET updated_at = SYSUTCDATETIME()
  FROM core.expedientes e
  JOIN inserted i ON e.expediente_id = i.expediente_id;
END
GO

/* === Helper: asegura sede base === */
IF OBJECT_ID('core.usp_Sede_Ensure') IS NOT NULL DROP PROCEDURE core.usp_Sede_Ensure;
GO
CREATE PROCEDURE core.usp_Sede_Ensure
  @sede_codigo NVARCHAR(10),
  @sede_nombre NVARCHAR(120)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM core.sedes WHERE sede_codigo=@sede_codigo)
    INSERT INTO core.sedes(sede_codigo, sede_nombre) VALUES(@sede_codigo, @sede_nombre);
  SELECT sede_codigo, sede_nombre FROM core.sedes WHERE sede_codigo=@sede_codigo;
END
GO

/* === Generación de folio único SED-YYYY-###### === */
IF OBJECT_ID('core.usp_Folio_Next') IS NOT NULL DROP PROCEDURE core.usp_Folio_Next;
GO
CREATE PROCEDURE core.usp_Folio_Next
  @sede_codigo NVARCHAR(10),
  @anio INT,
  @folio NVARCHAR(32) OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @seq INT;

  BEGIN TRAN
    IF NOT EXISTS (SELECT 1 FROM core.expediente_folio_seq WITH (UPDLOCK, HOLDLOCK) WHERE sede_codigo=@sede_codigo AND anio=@anio)
      INSERT INTO core.expediente_folio_seq(sede_codigo, anio, next_seq) VALUES(@sede_codigo, @anio, 1);

    SELECT @seq = next_seq FROM core.expediente_folio_seq WITH (UPDLOCK, HOLDLOCK)
      WHERE sede_codigo=@sede_codigo AND anio=@anio;

    UPDATE core.expediente_folio_seq
      SET next_seq = @seq + 1
      WHERE sede_codigo=@sede_codigo AND anio=@anio;
  COMMIT

  SET @folio = CONCAT(@sede_codigo, N'-', FORMAT(@anio, '0000'), N'-', FORMAT(@seq, '000000'));
END
GO

/* === Crear expediente === */
IF OBJECT_ID('core.usp_Expediente_Create') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Create;
GO
CREATE PROCEDURE core.usp_Expediente_Create
  @sede_codigo NVARCHAR(10),
  @fecha_registro DATE,
  @titulo NVARCHAR(200),
  @descripcion NVARCHAR(2000),
  @tecnico_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @anio INT = YEAR(@fecha_registro);
  DECLARE @folio NVARCHAR(32);

  EXEC core.usp_Folio_Next @sede_codigo=@sede_codigo, @anio=@anio, @folio=@folio OUTPUT;

  INSERT INTO core.expedientes(folio, sede_codigo, fecha_registro, titulo, descripcion, tecnico_id, estado)
  VALUES(@folio, @sede_codigo, @fecha_registro, @titulo, @descripcion, @tecnico_id, N'BORRADOR');

  DECLARE @new_id BIGINT = SCOPE_IDENTITY();

  INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id, metadata)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @tecnico_id), N'expediente.create', N'core.expedientes', CONVERT(NVARCHAR(64), @new_id),
          CONCAT(N'{"folio":"',@folio,N'"}'));

  SELECT expediente_id=@new_id, folio=@folio;
END
GO

/* === Obtener por id (sin borrados) === */
IF OBJECT_ID('core.usp_Expediente_GetById') IS NOT NULL DROP PROCEDURE core.usp_Expediente_GetById;
GO
CREATE PROCEDURE core.usp_Expediente_GetById
  @id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT expediente_id, folio, sede_codigo, fecha_registro, titulo, descripcion, tecnico_id, estado,
         created_at, updated_at
  FROM core.expedientes
  WHERE expediente_id=@id AND deleted_at IS NULL;
END
GO

/* === Listado básico con filtros y paginado === */
IF OBJECT_ID('core.usp_Expediente_List') IS NOT NULL DROP PROCEDURE core.usp_Expediente_List;
GO
CREATE PROCEDURE core.usp_Expediente_List
  @folio NVARCHAR(32) = NULL,
  @sede_codigo NVARCHAR(10) = NULL,
  @desde DATE = NULL,
  @hasta DATE = NULL,
  @page INT = 1,
  @pageSize INT = 20
AS
BEGIN
  SET NOCOUNT ON;

  WITH q AS (
    SELECT e.*, ROW_NUMBER() OVER (ORDER BY e.created_at DESC) AS rn
    FROM core.expedientes e
    WHERE e.deleted_at IS NULL
      AND (@folio IS NULL OR e.folio = @folio)
      AND (@sede_codigo IS NULL OR e.sede_codigo = @sede_codigo)
      AND (@desde IS NULL OR e.fecha_registro >= @desde)
      AND (@hasta IS NULL OR e.fecha_registro <= @hasta)
  )
  SELECT expediente_id, folio, sede_codigo, fecha_registro, titulo, estado, tecnico_id, created_at, updated_at
  FROM q
  WHERE rn BETWEEN ((@page-1)*@pageSize + 1) AND (@page*@pageSize);

  SELECT total = COUNT(1) FROM core.expedientes e
    WHERE e.deleted_at IS NULL
      AND (@folio IS NULL OR e.folio = @folio)
      AND (@sede_codigo IS NULL OR e.sede_codigo = @sede_codigo)
      AND (@desde IS NULL OR e.fecha_registro >= @desde)
      AND (@hasta IS NULL OR e.fecha_registro <= @hasta);
END
GO

/* === Soft delete === */
IF OBJECT_ID('core.usp_Expediente_Delete') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Delete;
GO
CREATE PROCEDURE core.usp_Expediente_Delete
  @id BIGINT,
  @actor NVARCHAR(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.expedientes SET deleted_at = SYSUTCDATETIME() WHERE expediente_id=@id AND deleted_at IS NULL;

  IF @@ROWCOUNT = 1
    INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id)
    VALUES (SYSUTCDATETIME(), @actor, N'expediente.delete', N'core.expedientes', CONVERT(NVARCHAR(64), @id));

  SELECT affected = @@ROWCOUNT;
END
GO

/* ==== Seeds mínimas de sedes (idempotentes) ==== */
EXEC core.usp_Sede_Ensure N'GUA', N'Guatemala Central';
EXEC core.usp_Sede_Ensure N'QUE', N'Quetzaltenango';
EXEC core.usp_Sede_Ensure N'PET', N'Petén';
GO
