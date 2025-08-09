-- ==== Esquema de identidad y auth (core) ====

IF OBJECT_ID('core.users') IS NULL
BEGIN
  CREATE TABLE core.users (
    user_id        BIGINT IDENTITY(1,1) PRIMARY KEY,
    username       NVARCHAR(64)  NOT NULL UNIQUE,
    email          NVARCHAR(256) NULL,
    password_hash  NVARCHAR(200) NOT NULL,   -- bcrypt
    is_active      BIT NOT NULL DEFAULT 1,
    mfa_required   BIT NOT NULL DEFAULT 0,
    failed_attempts INT NOT NULL DEFAULT 0,
    locked_until   DATETIME2 NULL,
    last_login_at  DATETIME2 NULL,
    created_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID('core.roles') IS NULL
BEGIN
  CREATE TABLE core.roles (
    role_id   INT IDENTITY(1,1) PRIMARY KEY,
    role_key  NVARCHAR(50) NOT NULL UNIQUE,   -- admin, coordinador, tecnico, auditor
    role_name NVARCHAR(100) NOT NULL
  );
END
GO

IF OBJECT_ID('core.user_roles') IS NULL
BEGIN
  CREATE TABLE core.user_roles (
    user_id BIGINT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY(user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES core.users(user_id),
    FOREIGN KEY (role_id) REFERENCES core.roles(role_id)
  );
END
GO

-- Trigger de actualización updated_at
IF OBJECT_ID('core.trg_users_updated_at') IS NOT NULL DROP TRIGGER core.trg_users_updated_at;
GO
CREATE TRIGGER core.trg_users_updated_at ON core.users
AFTER UPDATE AS
BEGIN
  SET NOCOUNT ON;
  UPDATE u SET updated_at = SYSUTCDATETIME()
  FROM core.users u
  JOIN inserted i ON u.user_id = i.user_id;
END
GO

-- ====== SP: crear usuario
IF OBJECT_ID('core.usp_User_Create') IS NOT NULL DROP PROCEDURE core.usp_User_Create;
GO
CREATE PROCEDURE core.usp_User_Create
  @username NVARCHAR(64),
  @email NVARCHAR(256),
  @password_hash NVARCHAR(200),
  @mfa_required BIT = 0,
  @is_active BIT = 1
AS
BEGIN
  SET NOCOUNT ON;
  INSERT INTO core.users(username,email,password_hash,mfa_required,is_active)
  VALUES(@username,@email,@password_hash,@mfa_required,@is_active);

  DECLARE @new_id BIGINT = SCOPE_IDENTITY();
  SELECT user_id=@new_id FROM core.users WHERE user_id=@new_id;
END
GO

-- ====== SP: obtener usuario por username (incluye roles)
IF OBJECT_ID('core.usp_User_GetByUsername') IS NOT NULL DROP PROCEDURE core.usp_User_GetByUsername;
GO
CREATE PROCEDURE core.usp_User_GetByUsername
  @username NVARCHAR(64)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 u.user_id, u.username, u.email, u.password_hash, u.is_active, u.mfa_required,
         u.failed_attempts, u.locked_until, u.last_login_at
  FROM core.users u
  WHERE u.username = @username;

  SELECT r.role_key
  FROM core.user_roles ur
  JOIN core.roles r ON r.role_id = ur.role_id
  JOIN core.users u ON u.user_id = ur.user_id
  WHERE u.username = @username;
END
GO

-- ====== SP: registrar intento fallido (incrementa y bloquea al 3er intento por 15 min)
IF OBJECT_ID('core.usp_User_RegisterFailedLogin') IS NOT NULL DROP PROCEDURE core.usp_User_RegisterFailedLogin;
GO
CREATE PROCEDURE core.usp_User_RegisterFailedLogin
  @username NVARCHAR(64)
AS
BEGIN
  SET NOCOUNT ON;

  DECLARE @failed INT, @locked_until DATETIME2;

  UPDATE core.users
    SET failed_attempts = failed_attempts + 1
  WHERE username = @username;

  SELECT @failed = failed_attempts FROM core.users WHERE username = @username;

  IF (@failed >= 3)
  BEGIN
    UPDATE core.users
      SET locked_until = DATEADD(MINUTE, 15, SYSUTCDATETIME())
    WHERE username = @username;
  END

  SELECT failed_attempts, locked_until FROM core.users WHERE username = @username;
END
GO

-- ====== SP: limpiar intentos fallidos y actualizar último login
IF OBJECT_ID('core.usp_User_RegisterSuccessLogin') IS NOT NULL DROP PROCEDURE core.usp_User_RegisterSuccessLogin;
GO
CREATE PROCEDURE core.usp_User_RegisterSuccessLogin
  @username NVARCHAR(64)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.users
    SET failed_attempts = 0,
        locked_until = NULL,
        last_login_at = SYSUTCDATETIME()
  WHERE username = @username;
END
GO

-- ====== SP: bloquear/desbloquear manualmente (opcional)
IF OBJECT_ID('core.usp_User_SetLock') IS NOT NULL DROP PROCEDURE core.usp_User_SetLock;
GO
CREATE PROCEDURE core.usp_User_SetLock
  @username NVARCHAR(64),
  @locked_until DATETIME2
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.users SET locked_until=@locked_until WHERE username=@username;
END
GO

-- ====== Seeds de roles base (idempotentes)
IF NOT EXISTS (SELECT 1 FROM core.roles WHERE role_key='admin')
  INSERT INTO core.roles(role_key, role_name) VALUES('admin','Administrador');
IF NOT EXISTS (SELECT 1 FROM core.roles WHERE role_key='coordinador')
  INSERT INTO core.roles(role_key, role_name) VALUES('coordinador','Coordinador');
IF NOT EXISTS (SELECT 1 FROM core.roles WHERE role_key='tecnico')
  INSERT INTO core.roles(role_key, role_name) VALUES('tecnico','Técnico');
IF NOT EXISTS (SELECT 1 FROM core.roles WHERE role_key='auditor')
  INSERT INTO core.roles(role_key, role_name) VALUES('auditor','Auditor');
GO
