/* Agrega auditoría a grant/revoke */
IF OBJECT_ID('core.usp_Role_GrantPermission') IS NOT NULL
  DROP PROCEDURE core.usp_Role_GrantPermission;
GO
CREATE PROCEDURE core.usp_Role_GrantPermission
  @role_key NVARCHAR(50),
  @perm_key NVARCHAR(100),
  @actor    NVARCHAR(128) = NULL
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

  DECLARE @meta NVARCHAR(MAX) = CONCAT(N'{"role":"',@role_key,N'","perm":"',@perm_key,N'"}');
  INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id, metadata)
  VALUES (SYSUTCDATETIME(), @actor, N'role.grant', N'role_permissions', NULL, @meta);

  SELECT * FROM core.role_permissions WHERE role_id=@rid AND perm_id=@pid;
END
GO

IF OBJECT_ID('core.usp_Role_RevokePermission') IS NOT NULL
  DROP PROCEDURE core.usp_Role_RevokePermission;
GO
CREATE PROCEDURE core.usp_Role_RevokePermission
  @role_key NVARCHAR(50),
  @perm_key NVARCHAR(100),
  @actor    NVARCHAR(128) = NULL
AS
BEGIN
  SET NOCOUNT ON;

  DELETE rp
  FROM core.role_permissions rp
  JOIN core.roles r ON r.role_id = rp.role_id
  JOIN core.permissions p ON p.perm_id = rp.perm_id
  WHERE r.role_key=@role_key AND p.perm_key=@perm_key;

  DECLARE @meta NVARCHAR(MAX) = CONCAT(N'{"role":"',@role_key,N'","perm":"',@perm_key,N'"}');
  INSERT INTO core.audit_log(event_time, actor, action, entity, entity_id, metadata)
  VALUES (SYSUTCDATETIME(), @actor, N'role.revoke', N'role_permissions', NULL, @meta);

  SELECT 'ok' AS status;
END
GO
