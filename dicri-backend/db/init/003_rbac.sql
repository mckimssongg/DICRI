/* === Tablas === */
IF OBJECT_ID('core.permissions') IS NULL
BEGIN
  CREATE TABLE core.permissions(
    perm_id   INT IDENTITY(1,1) PRIMARY KEY,
    perm_key  NVARCHAR(100) NOT NULL UNIQUE,   -- p.ej. expediente.create
    perm_name NVARCHAR(200) NOT NULL
  );
END
GO

IF OBJECT_ID('core.role_permissions') IS NULL
BEGIN
  CREATE TABLE core.role_permissions(
    role_id INT NOT NULL,
    perm_id INT NOT NULL,
    PRIMARY KEY(role_id, perm_id),
    FOREIGN KEY(role_id) REFERENCES core.roles(role_id),
    FOREIGN KEY(perm_id) REFERENCES core.permissions(perm_id)
  );
END
GO

/* === SPs de catálogo === */
IF OBJECT_ID('core.usp_Role_Create') IS NOT NULL DROP PROCEDURE core.usp_Role_Create;
GO
CREATE PROCEDURE core.usp_Role_Create
  @role_key  NVARCHAR(50),
  @role_name NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM core.roles WHERE role_key=@role_key)
    INSERT INTO core.roles(role_key, role_name) VALUES(@role_key,@role_name);
  SELECT * FROM core.roles WHERE role_key=@role_key;
END
GO

IF OBJECT_ID('core.usp_Role_List') IS NOT NULL DROP PROCEDURE core.usp_Role_List;
GO
CREATE PROCEDURE core.usp_Role_List
AS
BEGIN
  SET NOCOUNT ON;
  SELECT role_id, role_key, role_name FROM core.roles ORDER BY role_key;
END
GO

IF OBJECT_ID('core.usp_Permission_Create') IS NOT NULL DROP PROCEDURE core.usp_Permission_Create;
GO
CREATE PROCEDURE core.usp_Permission_Create
  @perm_key  NVARCHAR(100),
  @perm_name NVARCHAR(200)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS (SELECT 1 FROM core.permissions WHERE perm_key=@perm_key)
    INSERT INTO core.permissions(perm_key, perm_name) VALUES(@perm_key,@perm_name);
  SELECT * FROM core.permissions WHERE perm_key=@perm_key;
END
GO

IF OBJECT_ID('core.usp_Permission_List') IS NOT NULL DROP PROCEDURE core.usp_Permission_List;
GO
CREATE PROCEDURE core.usp_Permission_List
AS
BEGIN
  SET NOCOUNT ON;
  SELECT perm_id, perm_key, perm_name FROM core.permissions ORDER BY perm_key;
END
GO

/* === SPs de asignación === */
IF OBJECT_ID('core.usp_Role_GrantPermission') IS NOT NULL DROP PROCEDURE core.usp_Role_GrantPermission;
GO
CREATE PROCEDURE core.usp_Role_GrantPermission
  @role_key NVARCHAR(50),
  @perm_key NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @rid INT, @pid INT;
  SELECT @rid=role_id FROM core.roles WHERE role_key=@role_key;
  SELECT @pid=perm_id FROM core.permissions WHERE perm_key=@perm_key;
  IF @rid IS NULL OR @pid IS NULL
    THROW 51000, 'Role o permiso inexistente', 1;

  IF NOT EXISTS (SELECT 1 FROM core.role_permissions WHERE role_id=@rid AND perm_id=@pid)
    INSERT INTO core.role_permissions(role_id, perm_id) VALUES(@rid,@pid);

  SELECT * FROM core.role_permissions WHERE role_id=@rid AND perm_id=@pid;
END
GO

IF OBJECT_ID('core.usp_Role_RevokePermission') IS NOT NULL DROP PROCEDURE core.usp_Role_RevokePermission;
GO
CREATE PROCEDURE core.usp_Role_RevokePermission
  @role_key NVARCHAR(50),
  @perm_key NVARCHAR(100)
AS
BEGIN
  SET NOCOUNT ON;
  DELETE rp
  FROM core.role_permissions rp
  JOIN core.roles r ON r.role_id = rp.role_id
  JOIN core.permissions p ON p.perm_id = rp.perm_id
  WHERE r.role_key=@role_key AND p.perm_key=@perm_key;

  SELECT 'ok' AS status;
END
GO

/* === SP: permisos efectivos de un usuario === */
IF OBJECT_ID('core.usp_User_GetPermissions') IS NOT NULL DROP PROCEDURE core.usp_User_GetPermissions;
GO
CREATE PROCEDURE core.usp_User_GetPermissions
  @user_id BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  SELECT DISTINCT p.perm_key
  FROM core.user_roles ur
  JOIN core.role_permissions rp ON rp.role_id = ur.role_id
  JOIN core.permissions p ON p.perm_id = rp.perm_id
  WHERE ur.user_id = @user_id
  ORDER BY p.perm_key;
END
GO

/* === Seeds de permisos base (idempotentes) === */
-- Autenticación/Users
EXEC core.usp_Permission_Create N'users.read',  N'Ver usuarios';
EXEC core.usp_Permission_Create N'users.write', N'Crear/editar usuarios';
EXEC core.usp_Permission_Create N'roles.read',  N'Ver roles';
EXEC core.usp_Permission_Create N'roles.write', N'Crear/editar roles';
EXEC core.usp_Permission_Create N'perms.read',  N'Ver permisos';
EXEC core.usp_Permission_Create N'perms.write', N'Asignar permisos';

-- Expedientes
EXEC core.usp_Permission_Create N'expediente.create', N'Crear expediente';
EXEC core.usp_Permission_Create N'expediente.read',   N'Ver expediente';
EXEC core.usp_Permission_Create N'expediente.update', N'Editar expediente';
EXEC core.usp_Permission_Create N'expediente.review', N'Revisar/decidir expediente';

-- Indicios
EXEC core.usp_Permission_Create N'indicio.create', N'Crear indicio';
EXEC core.usp_Permission_Create N'indicio.read',   N'Ver indicio';
EXEC core.usp_Permission_Create N'indicio.update', N'Editar indicio';

-- Reportes
EXEC core.usp_Permission_Create N'reportes.read', N'Ver reportes';

-- Asignaciones por rol (mínimas)
EXEC core.usp_Role_GrantPermission N'admin',       N'perms.write';
EXEC core.usp_Role_GrantPermission N'admin',       N'roles.write';
EXEC core.usp_Role_GrantPermission N'admin',       N'users.write';
EXEC core.usp_Role_GrantPermission N'admin',       N'reportes.read';

EXEC core.usp_Role_GrantPermission N'coordinador', N'expediente.review';
EXEC core.usp_Role_GrantPermission N'coordinador', N'reportes.read';

EXEC core.usp_Role_GrantPermission N'tecnico',     N'expediente.create';
EXEC core.usp_Role_GrantPermission N'tecnico',     N'expediente.read';
EXEC core.usp_Role_GrantPermission N'tecnico',     N'indicio.create';
EXEC core.usp_Role_GrantPermission N'tecnico',     N'indicio.read';
EXEC core.usp_Role_GrantPermission N'tecnico',     N'indicio.update';

EXEC core.usp_Role_GrantPermission N'auditor',     N'reportes.read';
GO
