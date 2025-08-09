IF OBJECT_ID('core.password_resets') IS NULL
BEGIN
  CREATE TABLE core.password_resets(
    reset_id UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES core.users(user_id),
    token NVARCHAR(128) NOT NULL UNIQUE,
    expires_at DATETIME2 NOT NULL,
    used BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID('core.usp_PasswordReset_Request') IS NOT NULL DROP PROCEDURE core.usp_PasswordReset_Request;
GO
CREATE PROCEDURE core.usp_PasswordReset_Request
  @username NVARCHAR(64) = NULL,
  @email    NVARCHAR(256) = NULL
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @uid BIGINT = (
    SELECT TOP 1 user_id FROM core.users
    WHERE (username=@username OR email=@email) AND is_active=1
  );
  IF @uid IS NULL RETURN; -- silencioso

  DECLARE @token NVARCHAR(128) = CONVERT(NVARCHAR(128), NEWID());
  INSERT INTO core.password_resets(user_id, token, expires_at)
  VALUES(@uid, @token, DATEADD(MINUTE, 15, SYSUTCDATETIME()));
  SELECT token=@token; -- útil en dev
END
GO

IF OBJECT_ID('core.usp_PasswordReset_Consume') IS NOT NULL DROP PROCEDURE core.usp_PasswordReset_Consume;
GO
CREATE PROCEDURE core.usp_PasswordReset_Consume
  @token NVARCHAR(128),
  @new_hash NVARCHAR(200)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @uid BIGINT;
  SELECT TOP 1 @uid=pr.user_id
  FROM core.password_resets pr
  WHERE pr.token=@token AND pr.used=0 AND pr.expires_at>SYSUTCDATETIME();

  IF @uid IS NULL THROW 51000, 'Token inválido o expirado', 1;

  BEGIN TRAN
    UPDATE core.users
      SET password_hash=@new_hash, failed_attempts=0, locked_until=NULL
      WHERE user_id=@uid;
    UPDATE core.password_resets SET used=1 WHERE token=@token;
  COMMIT

  SELECT 'ok' AS status;
END
GO
