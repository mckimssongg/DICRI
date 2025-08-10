/* ==== Revisión de expediente ==== */
IF OBJECT_ID('core.expediente_decisiones') IS NULL
BEGIN
  CREATE TABLE core.expediente_decisiones(
    decision_id   BIGINT IDENTITY(1,1) PRIMARY KEY,
    expediente_id BIGINT NOT NULL,
    accion        NVARCHAR(20) NOT NULL,      -- SUBMIT | APPROVE | REJECT
    motivo        NVARCHAR(1000) NULL,        -- obligatorio sólo para REJECT
    actor_id      BIGINT NOT NULL,
    created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_dec_exp FOREIGN KEY(expediente_id) REFERENCES core.expedientes(expediente_id)
  );
  CREATE INDEX IX_dec_exp ON core.expediente_decisiones(expediente_id, created_at DESC);
END
GO

/* Submit: BORRADOR -> EN_REVISION */
IF OBJECT_ID('core.usp_Expediente_Submit') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Submit;
GO
CREATE PROCEDURE core.usp_Expediente_Submit
  @expediente_id BIGINT,
  @actor_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @estado NVARCHAR(20);
  SELECT @estado=estado FROM core.expedientes WHERE expediente_id=@expediente_id AND deleted_at IS NULL;
  IF @estado IS NULL THROW 51000, 'Expediente inexistente', 1;
  IF @estado <> N'BORRADOR' THROW 51000, 'Sólo se puede enviar a revisión desde BORRADOR', 1;

  UPDATE core.expedientes SET estado=N'EN_REVISION' WHERE expediente_id=@expediente_id;
  INSERT INTO core.expediente_decisiones(expediente_id,accion,actor_id) VALUES(@expediente_id,N'SUBMIT',@actor_id);

  INSERT INTO core.audit_log(event_time,actor,action,entity,entity_id)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @actor_id), N'expediente.submit', N'core.expedientes', CONVERT(NVARCHAR(64), @expediente_id));

  SELECT 'ok' AS status;
END
GO

/* Approve: EN_REVISION -> APROBADO */
IF OBJECT_ID('core.usp_Expediente_Approve') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Approve;
GO
CREATE PROCEDURE core.usp_Expediente_Approve
  @expediente_id BIGINT,
  @actor_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @estado NVARCHAR(20);
  SELECT @estado=estado FROM core.expedientes WHERE expediente_id=@expediente_id AND deleted_at IS NULL;
  IF @estado IS NULL THROW 51000, 'Expediente inexistente', 1;
  IF @estado <> N'EN_REVISION' THROW 51000, 'Sólo se puede aprobar desde EN_REVISION', 1;

  UPDATE core.expedientes SET estado=N'APROBADO' WHERE expediente_id=@expediente_id;
  INSERT INTO core.expediente_decisiones(expediente_id,accion,actor_id) VALUES(@expediente_id,N'APPROVE',@actor_id);

  INSERT INTO core.audit_log(event_time,actor,action,entity,entity_id)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @actor_id), N'expediente.approve', N'core.expedientes', CONVERT(NVARCHAR(64), @expediente_id));

  SELECT 'ok' AS status;
END
GO

/* Reject: EN_REVISION -> RECHAZADO (requiere motivo) */
IF OBJECT_ID('core.usp_Expediente_Reject') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Reject;
GO
CREATE PROCEDURE core.usp_Expediente_Reject
  @expediente_id BIGINT,
  @actor_id BIGINT,
  @motivo NVARCHAR(1000)
AS
BEGIN
  SET NOCOUNT ON;
  IF @motivo IS NULL OR LTRIM(RTRIM(@motivo)) = N'' THROW 51000, 'Motivo de rechazo requerido', 1;

  DECLARE @estado NVARCHAR(20);
  SELECT @estado=estado FROM core.expedientes WHERE expediente_id=@expediente_id AND deleted_at IS NULL;
  IF @estado IS NULL THROW 51000, 'Expediente inexistente', 1;
  IF @estado <> N'EN_REVISION' THROW 51000, 'Sólo se puede rechazar desde EN_REVISION', 1;

  UPDATE core.expedientes SET estado=N'RECHAZADO' WHERE expediente_id=@expediente_id;
  INSERT INTO core.expediente_decisiones(expediente_id,accion,motivo,actor_id)
  VALUES(@expediente_id,N'REJECT',@motivo,@actor_id);

  INSERT INTO core.audit_log(event_time,actor,action,entity,entity_id,metadata)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @actor_id), N'expediente.reject', N'core.expedientes',
          CONVERT(NVARCHAR(64), @expediente_id), CONCAT(N'{"motivo":"',REPLACE(@motivo,'"','\"'),N'"}'));

  SELECT 'ok' AS status;
END
GO

/* ==== Reportes de expedientes ==== */
IF OBJECT_ID('core.usp_Reportes_Expedientes') IS NOT NULL DROP PROCEDURE core.usp_Reportes_Expedientes;
GO
CREATE PROCEDURE core.usp_Reportes_Expedientes
  @desde DATE = NULL,
  @hasta DATE = NULL
AS
BEGIN
  SET NOCOUNT ON;

  /* Conteo por estado */
  SELECT estado, total = COUNT(1)
  FROM core.expedientes
  WHERE deleted_at IS NULL
    AND (@desde IS NULL OR fecha_registro >= @desde)
    AND (@hasta IS NULL OR fecha_registro <= @hasta)
  GROUP BY estado;

  /* Aprobaciones y rechazos por fecha_registro */
  SELECT estado, fecha = CAST(fecha_registro AS DATE), total = COUNT(1)
  FROM core.expedientes
  WHERE deleted_at IS NULL
    AND estado IN (N'APROBADO', N'RECHAZADO')
    AND (@desde IS NULL OR fecha_registro >= @desde)
    AND (@hasta IS NULL OR fecha_registro <= @hasta)
  GROUP BY estado, CAST(fecha_registro AS DATE)
  ORDER BY fecha;

  /* Opcional: breakdown por sede */
  SELECT sede_codigo, estado, total = COUNT(1)
  FROM core.expedientes
  WHERE deleted_at IS NULL
    AND (@desde IS NULL OR fecha_registro >= @desde)
    AND (@hasta IS NULL OR fecha_registro <= @hasta)
  GROUP BY sede_codigo, estado
  ORDER BY sede_codigo, estado;
END
GO
