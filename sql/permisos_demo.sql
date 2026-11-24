-- Ejecutar como administrador. Sustituir el marcador por una clave propia antes de ejecutar.
USE master;
GO
IF SUSER_ID(N'crm_demo_app') IS NULL
 CREATE LOGIN crm_demo_app WITH PASSWORD = 'REEMPLAZAR_Con_Clave_Unica_2026!';
GO
USE BD_AtlanticCity;
GO
IF USER_ID(N'crm_demo_app') IS NULL
 CREATE USER crm_demo_app FOR LOGIN crm_demo_app;
GO
GRANT SELECT ON dbo.Rol TO crm_demo_app;
GRANT SELECT, INSERT, UPDATE ON dbo.Usuario TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Cliente TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Auditoria TO crm_demo_app;
GRANT SELECT, INSERT, UPDATE ON dbo.Membresia TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Beneficio TO crm_demo_app;
GRANT SELECT, INSERT, DELETE ON dbo.Membresia_Beneficio TO crm_demo_app;
GRANT SELECT, INSERT, UPDATE ON dbo.Cliente_Membresia TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Actividad TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Visita TO crm_demo_app;
GRANT SELECT ON dbo.Promocion TO crm_demo_app;
GRANT SELECT, INSERT, UPDATE ON dbo.Solicitud TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Respuesta TO crm_demo_app;
GRANT SELECT, INSERT ON dbo.Notificacion TO crm_demo_app;
GO
