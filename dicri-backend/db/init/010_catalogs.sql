/* ==== Catálogos genéricos (core) ==== */
IF OBJECT_ID('core.catalogs') IS NULL
BEGIN
  CREATE TABLE core.catalogs(
    catalog_id INT IDENTITY(1,1) PRIMARY KEY,
    catalog_key NVARCHAR(80) NOT NULL UNIQUE, -- p.ej. colores, tipos_indicio
    catalog_name NVARCHAR(160) NOT NULL,
    version INT NOT NULL DEFAULT 1
  );
END
GO

IF OBJECT_ID('core.catalog_items') IS NULL
BEGIN
  CREATE TABLE core.catalog_items(
    item_id INT IDENTITY(1,1) PRIMARY KEY,
    catalog_id INT NOT NULL,
    code NVARCHAR(80) NOT NULL,
    label NVARCHAR(200) NOT NULL,
    is_active BIT NOT NULL DEFAULT 1,
    sort_order INT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    deleted_at DATETIME2 NULL,
    CONSTRAINT FK_catalog_items_catalogs FOREIGN KEY (catalog_id) REFERENCES core.catalogs(catalog_id),
    CONSTRAINT UQ_catalog_code UNIQUE (catalog_id, code)
  );
END
GO

IF OBJECT_ID('core.trg_catalog_items_updated_at') IS NOT NULL DROP TRIGGER core.trg_catalog_items_updated_at;
GO
CREATE TRIGGER core.trg_catalog_items_updated_at ON core.catalog_items
AFTER UPDATE AS
BEGIN
  SET NOCOUNT ON;
  UPDATE ci SET updated_at = SYSUTCDATETIME()
  FROM core.catalog_items ci
  JOIN inserted i ON ci.item_id=i.item_id;
END
GO

/* ===== Helpers ===== */
IF OBJECT_ID('core.usp_Catalog_Ensure') IS NOT NULL DROP PROCEDURE core.usp_Catalog_Ensure;
GO
CREATE PROCEDURE core.usp_Catalog_Ensure
  @catalog_key NVARCHAR(80),
  @catalog_name NVARCHAR(160)
AS
BEGIN
  SET NOCOUNT ON;
  IF NOT EXISTS(SELECT 1 FROM core.catalogs WHERE catalog_key=@catalog_key)
    INSERT INTO core.catalogs(catalog_key, catalog_name) VALUES(@catalog_key,@catalog_name);
  SELECT * FROM core.catalogs WHERE catalog_key=@catalog_key;
END
GO

/* ===== CRUD Items ===== */
IF OBJECT_ID('core.usp_CatalogItem_List') IS NOT NULL DROP PROCEDURE core.usp_CatalogItem_List;
GO
CREATE PROCEDURE core.usp_CatalogItem_List
  @catalog_key NVARCHAR(80)
AS
BEGIN
  SET NOCOUNT ON;
  SELECT ci.item_id, c.catalog_key, ci.code, ci.label, ci.is_active, ci.sort_order
  FROM core.catalog_items ci
  JOIN core.catalogs c ON c.catalog_id=ci.catalog_id
  WHERE c.catalog_key=@catalog_key AND ci.deleted_at IS NULL
  ORDER BY ci.sort_order, ci.label;
END
GO

IF OBJECT_ID('core.usp_CatalogItem_Create') IS NOT NULL DROP PROCEDURE core.usp_CatalogItem_Create;
GO
CREATE PROCEDURE core.usp_CatalogItem_Create
  @catalog_key NVARCHAR(80),
  @code NVARCHAR(80),
  @label NVARCHAR(200),
  @sort_order INT = 0
AS
BEGIN
  SET NOCOUNT ON;
  DECLARE @catalog_id INT;
  SELECT @catalog_id=catalog_id FROM core.catalogs WHERE catalog_key=@catalog_key;
  IF @catalog_id IS NULL THROW 51000, 'Catálogo inexistente', 1;

  INSERT INTO core.catalog_items(catalog_id, code, label, sort_order) VALUES(@catalog_id,@code,@label,@sort_order);
  SELECT SCOPE_IDENTITY() AS item_id;
END
GO

IF OBJECT_ID('core.usp_CatalogItem_Update') IS NOT NULL DROP PROCEDURE core.usp_CatalogItem_Update;
GO
CREATE PROCEDURE core.usp_CatalogItem_Update
  @item_id INT,
  @label NVARCHAR(200),
  @is_active BIT,
  @sort_order INT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.catalog_items SET label=@label, is_active=@is_active, sort_order=@sort_order WHERE item_id=@item_id AND deleted_at IS NULL;
  SELECT @@ROWCOUNT AS affected;
END
GO

IF OBJECT_ID('core.usp_CatalogItem_Delete') IS NOT NULL DROP PROCEDURE core.usp_CatalogItem_Delete;
GO
CREATE PROCEDURE core.usp_CatalogItem_Delete
  @item_id INT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE core.catalog_items SET deleted_at=SYSUTCDATETIME() WHERE item_id=@item_id AND deleted_at IS NULL;
  SELECT @@ROWCOUNT AS affected;
END
GO

/* ===== Seeds ===== */
EXEC core.usp_Catalog_Ensure N'colores',        N'Colores';
EXEC core.usp_Catalog_Ensure N'tipos_indicio',  N'Tipos de indicio';
EXEC core.usp_Catalog_Ensure N'ubicaciones',    N'Ubicaciones';
EXEC core.usp_Catalog_Ensure N'unidades',       N'Unidades de medida';

-- Mínimos (idempotentes)
MERGE core.catalog_items AS t
USING (SELECT c.catalog_id, v.code, v.label, v.sort_order FROM core.catalogs c
       JOIN (VALUES
         (N'colores',N'BLANCO',N'Blanco',10),
         (N'colores',N'NEGRO', N'Negro', 20),
         (N'unidades',N'CM',N'Centímetro',10),
         (N'unidades',N'KG',N'Kilogramo',20),
         (N'tipos_indicio',N'ARMA',N'Arma',10),
         (N'tipos_indicio',N'DROGA',N'Droga',20),
         (N'ubicaciones',N'LAB',N'Laboratorio',10),
         (N'ubicaciones',N'BOD',N'Bodega',20)
       ) v(cat_key,code,label,sort_order) ON c.catalog_key=v.cat_key) AS s
ON (t.catalog_id=s.catalog_id AND t.code=s.code AND t.deleted_at IS NULL)
WHEN NOT MATCHED THEN
  INSERT(catalog_id,code,label,sort_order) VALUES(s.catalog_id,s.code,s.label,s.sort_order);
GO
