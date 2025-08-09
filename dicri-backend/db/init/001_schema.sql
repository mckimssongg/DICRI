IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'core')
BEGIN
    EXEC('CREATE SCHEMA core');
END
GO

-- Audit table (append-only) - minimal for now
IF OBJECT_ID('core.audit_log') IS NULL
BEGIN
    CREATE TABLE core.audit_log (
        audit_id BIGINT IDENTITY(1,1) PRIMARY KEY,
        event_time DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        actor NVARCHAR(128) NULL,
        action NVARCHAR(64) NOT NULL,
        entity NVARCHAR(128) NULL,
        entity_id NVARCHAR(64) NULL,
        metadata NVARCHAR(MAX) NULL
    );
END
GO

-- Health stored procedure (simple ping)
IF OBJECT_ID('core.usp_Health_Ping') IS NULL
BEGIN
    EXEC('CREATE PROCEDURE core.usp_Health_Ping AS BEGIN SET NOCOUNT ON; SELECT 1 AS ok; END');
END
GO
