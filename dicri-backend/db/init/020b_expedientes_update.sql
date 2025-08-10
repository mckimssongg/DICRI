/* Editar expediente sólo en BORRADOR */
IF OBJECT_ID('core.usp_Expediente_Update') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Update;
GO
CREATE PROCEDURE core.usp_Expediente_Update
  @id BIGINT,
  @sede_codigo NVARCHAR(10),
  @fecha_registro DATE,
  @titulo NVARCHAR(200),
  @descripcion NVARCHAR(2000) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM core.expedientes WHERE expediente_id=@id AND deleted_at IS NULL AND estado=N'BORRADOR')
    THROW 51000, 'Sólo se puede editar un expediente en BORRADOR', 1;

  UPDATE core.expedientes
    SET sede_codigo=@sede_codigo, fecha_registro=@fecha_registro, titulo=@titulo, descripcion=@descripcion
  WHERE expediente_id=@id;

  SELECT affected = @@ROWCOUNT;
END
GO

/* Resubmit: RECHAZADO -> EN_REVISION */
IF OBJECT_ID('core.usp_Expediente_Resubmit') IS NOT NULL DROP PROCEDURE core.usp_Expediente_Resubmit;
GO
CREATE PROCEDURE core.usp_Expediente_Resubmit
  @expediente_id BIGINT,
  @actor_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @estado NVARCHAR(20);
  SELECT @estado=estado FROM core.expedientes WHERE expediente_id=@expediente_id AND deleted_at IS NULL;
  IF @estado IS NULL THROW 51000, 'Expediente inexistente', 1;
  IF @estado <> N'RECHAZADO' THROW 51000, 'Sólo se puede re-enviar desde RECHAZADO', 1;

  UPDATE core.expedientes SET estado=N'EN_REVISION' WHERE expediente_id=@expediente_id;
  INSERT INTO core.expediente_decisiones(expediente_id,accion,actor_id)
  VALUES(@expediente_id,N'SUBMIT',@actor_id);

  INSERT INTO core.audit_log(event_time,actor,action,entity,entity_id)
  VALUES (SYSUTCDATETIME(), CONVERT(NVARCHAR(128), @actor_id), N'expediente.resubmit', N'core.expedientes', CONVERT(NVARCHAR(64), @expediente_id));

  SELECT 'ok' AS status;
END
GO
