/* ==== Listar usuarios con filtros/paginado ==== */
IF OBJECT_ID('core.usp_User_List') IS NOT NULL DROP PROCEDURE core.usp_User_List;
GO
CREATE PROCEDURE core.usp_User_List
  @q NVARCHAR(128) = NULL,
  @page INT = 1,
  @pageSize INT = 20
AS
BEGIN
  SET NOCOUNT ON;
  WITH q AS (
    SELECT u.user_id, u.username, u.email, u.is_active, u.mfa_required, u.last_login_at,
           ROW_NUMBER() OVER (ORDER BY u.created_at DESC) AS rn
    FROM core.users u
    WHERE (@q IS NULL OR @q = N'' OR
          u.username LIKE CONCAT(N'%',@q,N'%') OR
          u.email    LIKE CONCAT(N'%',@q,N'%'))
  )
  SELECT user_id, username, email, is_active, mfa_required, last_login_at
  FROM q
  WHERE rn BETWEEN ((@page-1)*@pageSize + 1) AND (@page*@pageSize);

  SELECT total = COUNT(1) FROM core.users u
  WHERE (@q IS NULL OR @q = N'' OR
         u.username LIKE CONCAT(N'%',@q,N'%') OR
         u.email    LIKE CONCAT(N'%',@q,N'%'));
END
GO

/* ==== Obtener usuario por ID (con roles) ==== */
IF OBJECT_ID('core.usp_User_GetById') IS NOT NULL DROP PROCEDURE core.usp_User_GetById;
GO
CREATE PROCEDURE core.usp_User_GetById
  @user_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT TOP 1 u.user_id, u.username, u.email, u.is_active, u.mfa_required, u.last_login_at, u.created_at, u.updated_at
  FROM core.users u WHERE u.user_id=@user_id;

  SELECT r.role_key
  FROM core.user_roles ur
  JOIN core.roles r ON r.role_id = ur.role_id
  WHERE ur.user_id=@user_id
  ORDER BY r.role_key;
END
GO

/* ==== Actualizar datos base ==== */
IF OBJECT_ID('core.usp_User_Update') IS NOT NULL DROP PROCEDURE core.usp_User_Update;
GO
CREATE PROCEDURE core.usp_User_Update
  @user_id BIGINT,
  @email NVARCHAR(256),
  @is_active BIT,
  @mfa_required BIT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.users
    SET email=@email, is_active=@is_active, mfa_required=@mfa_required
  WHERE user_id=@user_id;
  SELECT affected = @@ROWCOUNT;
END
GO

/* ==== Cambiar contraseña (hash ya calculado) ==== */
IF OBJECT_ID('core.usp_User_SetPassword') IS NOT NULL DROP PROCEDURE core.usp_User_SetPassword;
GO
CREATE PROCEDURE core.usp_User_SetPassword
  @user_id BIGINT,
  @password_hash NVARCHAR(200)
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.users SET password_hash=@password_hash, failed_attempts=0, locked_until=NULL
  WHERE user_id=@user_id;
  SELECT affected = @@ROWCOUNT;
END
GO

/* ==== Deshabilitar (soft) ==== */
IF OBJECT_ID('core.usp_User_Disable') IS NOT NULL DROP PROCEDURE core.usp_User_Disable;
GO
CREATE PROCEDURE core.usp_User_Disable
  @user_id BIGINT,
  @actor NVARCHAR(128)=NULL
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.users SET is_active=0 WHERE user_id=@user_id;
  IF @@ROWCOUNT=1
    INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id)
    VALUES (SYSUTCDATETIME(), @actor, N'user.disable', N'core.users', CONVERT(NVARCHAR(64), @user_id));
  SELECT affected = @@ROWCOUNT;
END
GO

/* ==== Garantizar que 'admin' tenga TODOS los permisos presentes ==== */
-- Crea faltantes en role_permissions para admin con todos los permissions existentes
MERGE core.role_permissions AS t
USING (
  SELECT r.role_id, p.perm_id
  FROM core.roles r CROSS JOIN core.permissions p
  WHERE r.role_key = N'admin'
) s
ON (t.role_id=s.role_id AND t.perm_id=s.perm_id)
WHEN NOT MATCHED THEN
  INSERT(role_id, perm_id) VALUES(s.role_id, s.perm_id);
GO
