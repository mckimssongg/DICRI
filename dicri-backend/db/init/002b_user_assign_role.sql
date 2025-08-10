IF OBJECT_ID('core.usp_User_AssignRole') IS NOT NULL DROP PROCEDURE core.usp_User_AssignRole;
GO
CREATE PROCEDURE core.usp_User_AssignRole
  @user_id BIGINT,
  @role_key NVARCHAR(50)
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @rid INT = (SELECT role_id FROM core.roles WHERE role_key=@role_key);
  IF @rid IS NULL THROW 51000, 'Rol inexistente', 1;
  IF NOT EXISTS (SELECT 1 FROM core.user_roles WHERE user_id=@user_id AND role_id=@rid)
    INSERT INTO core.user_roles(user_id, role_id) VALUES(@user_id, @rid);
  SELECT 'ok' AS status;
END
GO
