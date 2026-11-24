/* CRM académico: servicios recreativos ficticios, sin apuestas ni pagos reales.
   SQL Server / SSMS. Ejecutar sobre una base nueva. No elimina datos existentes. */
IF DB_ID(N'BD_AtlanticCity') IS NULL
    EXEC(N'CREATE DATABASE BD_AtlanticCity');
GO
USE BD_AtlanticCity;
GO
IF OBJECT_ID(N'dbo.Usuario',N'U') IS NOT NULL
BEGIN
 PRINT N'La base ya contiene tablas. No ejecute este instalador sobre datos existentes.';
 SET NOEXEC ON;
END;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;

CREATE TABLE dbo.Rol (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre_rol NVARCHAR(40) NOT NULL UNIQUE,
    descripcion NVARCHAR(250) NULL
);
CREATE TABLE dbo.Usuario (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_rol INT NOT NULL REFERENCES dbo.Rol(id_rol),
    nombres NVARCHAR(100) NOT NULL,
    apellidos NVARCHAR(100) NOT NULL,
    correo NVARCHAR(254) NOT NULL UNIQUE,
    contrasena_hash NVARCHAR(255) NOT NULL,
    telefono VARCHAR(20) NULL,
    estado BIT NOT NULL DEFAULT 1,
    fecha_registro DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    fecha_modificacion DATETIME2(0) NULL,
    modificado_por INT NULL REFERENCES dbo.Usuario(id_usuario)
);
CREATE TABLE dbo.Segmento (
    id_segmento INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(250) NULL
);
CREATE TABLE dbo.Cliente (
    id_cliente INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL UNIQUE REFERENCES dbo.Usuario(id_usuario),
    id_segmento INT NULL REFERENCES dbo.Segmento(id_segmento),
    fecha_afiliacion DATE NOT NULL DEFAULT (CONVERT(DATE,SYSUTCDATETIME())),
    fecha_creacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    fecha_modificacion DATETIME2(0) NULL,
    creado_por INT NULL REFERENCES dbo.Usuario(id_usuario),
    modificado_por INT NULL REFERENCES dbo.Usuario(id_usuario)
);
CREATE TABLE dbo.Membresia (
    id_membresia INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(500) NULL,
    precio_referencial DECIMAL(10,2) NOT NULL CHECK (precio_referencial >= 0),
    duracion_dias INT NOT NULL CHECK (duracion_dias > 0),
    estado BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    fecha_modificacion DATETIME2(0) NULL,
    creado_por INT NULL REFERENCES dbo.Usuario(id_usuario),
    modificado_por INT NULL REFERENCES dbo.Usuario(id_usuario)
);
CREATE TABLE dbo.Beneficio (
    id_beneficio INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    descripcion NVARCHAR(300) NULL
);
CREATE TABLE dbo.Membresia_Beneficio (
    id_membresia INT NOT NULL REFERENCES dbo.Membresia(id_membresia),
    id_beneficio INT NOT NULL REFERENCES dbo.Beneficio(id_beneficio),
    CONSTRAINT PK_Membresia_Beneficio PRIMARY KEY (id_membresia,id_beneficio)
);
CREATE TABLE dbo.Cliente_Membresia (
    id_cliente_membresia INT IDENTITY(1,1) PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES dbo.Cliente(id_cliente),
    id_membresia INT NOT NULL REFERENCES dbo.Membresia(id_membresia),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    precio_simulado DECIMAL(10,2) NOT NULL CHECK (precio_simulado >= 0),
    estado VARCHAR(12) NOT NULL DEFAULT 'ACTIVA' CHECK (estado IN ('ACTIVA','CANCELADA','VENCIDA')),
    fecha_cancelacion DATETIME2(0) NULL,
    fecha_creacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    fecha_modificacion DATETIME2(0) NULL,
    creado_por INT NULL REFERENCES dbo.Usuario(id_usuario),
    modificado_por INT NULL REFERENCES dbo.Usuario(id_usuario),
    CONSTRAINT CK_CM_Fechas CHECK (fecha_fin >= fecha_inicio),
    CONSTRAINT CK_CM_Cancelacion CHECK ((estado='CANCELADA' AND fecha_cancelacion IS NOT NULL) OR (estado<>'CANCELADA' AND fecha_cancelacion IS NULL))
);
-- Impide tener dos planes activos simultáneamente.
CREATE UNIQUE INDEX UX_Cliente_Membresia_Activa ON dbo.Cliente_Membresia(id_cliente) WHERE estado='ACTIVA';
CREATE TABLE dbo.Actividad (
    id_actividad INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100) NOT NULL UNIQUE,
    descripcion NVARCHAR(300) NULL,
    estado BIT NOT NULL DEFAULT 1
);
CREATE TABLE dbo.Visita (
    id_visita INT IDENTITY(1,1) PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES dbo.Cliente(id_cliente),
    id_actividad INT NOT NULL REFERENCES dbo.Actividad(id_actividad),
    fecha_visita DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    observacion NVARCHAR(500) NULL,
    fecha_creacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    creado_por INT NULL REFERENCES dbo.Usuario(id_usuario)
);
CREATE TABLE dbo.Preferencia (
    id_cliente INT NOT NULL REFERENCES dbo.Cliente(id_cliente),
    id_actividad INT NOT NULL REFERENCES dbo.Actividad(id_actividad),
    fecha_registro DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_Preferencia PRIMARY KEY(id_cliente,id_actividad)
);
CREATE TABLE dbo.Promocion (
    id_promocion INT IDENTITY(1,1) PRIMARY KEY,
    id_actividad INT NOT NULL REFERENCES dbo.Actividad(id_actividad),
    codigo VARCHAR(30) NOT NULL UNIQUE,
    titulo NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(500) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    estado BIT NOT NULL DEFAULT 1,
    fecha_creacion DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    fecha_modificacion DATETIME2(0) NULL,
    creado_por INT NULL REFERENCES dbo.Usuario(id_usuario),
    modificado_por INT NULL REFERENCES dbo.Usuario(id_usuario),
    CONSTRAINT CK_Promocion_Fechas CHECK (fecha_vencimiento >= fecha_inicio)
);
CREATE TABLE dbo.Solicitud (
    id_solicitud INT IDENTITY(1,1) PRIMARY KEY,
    id_cliente INT NOT NULL REFERENCES dbo.Cliente(id_cliente),
    id_promocion INT NULL REFERENCES dbo.Promocion(id_promocion),
    asunto NVARCHAR(150) NOT NULL,
    descripcion NVARCHAR(1000) NOT NULL,
    fecha_solicitud DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    estado VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','EN_PROCESO','RESUELTA')),
    fecha_modificacion DATETIME2(0) NULL,
    modificado_por INT NULL REFERENCES dbo.Usuario(id_usuario)
);
CREATE TABLE dbo.Respuesta (
    id_respuesta INT IDENTITY(1,1) PRIMARY KEY,
    id_solicitud INT NOT NULL REFERENCES dbo.Solicitud(id_solicitud),
    id_usuario INT NOT NULL REFERENCES dbo.Usuario(id_usuario),
    mensaje NVARCHAR(1000) NOT NULL,
    fecha_respuesta DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE TABLE dbo.Notificacion (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL REFERENCES dbo.Usuario(id_usuario),
    titulo NVARCHAR(150) NOT NULL,
    mensaje NVARCHAR(500) NOT NULL,
    fecha_envio DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME(),
    leido BIT NOT NULL DEFAULT 0
);
CREATE TABLE dbo.Auditoria (
    id_auditoria BIGINT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NULL REFERENCES dbo.Usuario(id_usuario),
    modulo NVARCHAR(80) NOT NULL,
    accion NVARCHAR(80) NOT NULL,
    detalle NVARCHAR(1000) NULL,
    fecha_hora DATETIME2(0) NOT NULL DEFAULT SYSUTCDATETIME()
);
CREATE INDEX IX_Visita_Cliente_Fecha ON dbo.Visita(id_cliente,fecha_visita);
CREATE INDEX IX_Solicitud_Estado ON dbo.Solicitud(estado,fecha_solicitud);
CREATE INDEX IX_Respuesta_Solicitud ON dbo.Respuesta(id_solicitud,fecha_respuesta);
CREATE INDEX IX_Notificacion_Usuario ON dbo.Notificacion(id_usuario,leido);
CREATE INDEX IX_Auditoria_Fecha ON dbo.Auditoria(fecha_hora);
COMMIT;
GO
-- Datos ficticios. Las credenciales son marcadores no válidos para autenticación.
SET XACT_ABORT ON;
BEGIN TRANSACTION;
INSERT dbo.Rol(nombre_rol,descripcion) VALUES (N'Administrador',N'Gestión del sistema académico'),(N'Cliente',N'Consulta de servicios recreativos');
INSERT dbo.Usuario(id_rol,nombres,apellidos,correo,contrasena_hash,telefono) VALUES
(1,N'Admin',N'Demo',N'admin@example.test',N'NO_VALIDO_DEMO',NULL),
(2,N'Ana',N'Demo',N'ana@example.test',N'NO_VALIDO_DEMO',NULL),
(2,N'Luis',N'Demo',N'luis@example.test',N'NO_VALIDO_DEMO',NULL),
(2,N'Elena',N'Demo',N'elena@example.test',N'NO_VALIDO_DEMO',NULL);
INSERT dbo.Segmento(nombre,descripcion) VALUES (N'Nuevo',N'Perfil inicial'),(N'Frecuente',N'Visitas recreativas recurrentes');
INSERT dbo.Cliente(id_usuario,id_segmento,creado_por) VALUES (2,1,1),(3,2,1),(4,1,1);
INSERT dbo.Membresia(nombre,descripcion,precio_referencial,duracion_dias,creado_por) VALUES
(N'Clásica',N'Una opción para comenzar a disfrutar de beneficios.',49,30,1),(N'Premium',N'Más beneficios y una experiencia preferencial.',99,30,1),(N'VIP',N'Una categoría superior con beneficios exclusivos.',169,30,1);
INSERT dbo.Beneficio(nombre,descripcion) VALUES
(N'Acceso a actividades seleccionadas',NULL),
(N'Información de eventos',NULL),
(N'Gestión de cuenta en línea',NULL),
(N'Atención al cliente',NULL),
(N'Todos los beneficios de Clásica',NULL),
(N'Talleres culturales seleccionados',NULL),
(N'Atención preferencial',NULL),
(N'Actividades adicionales',NULL),
(N'Todos los beneficios de Premium',NULL),
(N'Atención prioritaria',NULL),
(N'Acceso a exposiciones especiales',NULL),
(N'Experiencias culturales',NULL);
INSERT dbo.Membresia_Beneficio VALUES (1,1),(1,2),(1,3),(1,4),(2,5),(2,6),(2,7),(2,8),(3,9),(3,10),(3,11),(3,12);
INSERT dbo.Cliente_Membresia(id_cliente,id_membresia,fecha_inicio,fecha_fin,precio_simulado,creado_por) VALUES
(1,1,CONVERT(DATE,SYSUTCDATETIME()),DATEADD(DAY,30,CONVERT(DATE,SYSUTCDATETIME())),49,2),
(2,2,CONVERT(DATE,SYSUTCDATETIME()),DATEADD(DAY,30,CONVERT(DATE,SYSUTCDATETIME())),99,3);
INSERT dbo.Actividad(nombre,descripcion) VALUES (N'Taller de pintura',N'Actividad artística'),(N'Exposición cultural',N'Exhibición de arte'),(N'Club de lectura',N'Actividad literaria');
INSERT dbo.Visita(id_cliente,id_actividad,observacion,creado_por) VALUES (1,1,N'Visita de prueba',1),(2,2,N'Visita de prueba',1),(2,3,N'Visita de prueba',1);
INSERT dbo.Preferencia(id_cliente,id_actividad) VALUES (1,1),(2,2),(2,3),(3,3);
INSERT dbo.Promocion(id_actividad,codigo,titulo,descripcion,fecha_inicio,fecha_vencimiento,creado_por) VALUES
(1,'DEMO-ARTE',N'Taller de pintura',N'Aviso informativo ficticio',CONVERT(DATE,SYSUTCDATETIME()),DATEADD(DAY,30,CONVERT(DATE,SYSUTCDATETIME())),1);
INSERT dbo.Solicitud(id_cliente,id_promocion,asunto,descripcion,estado) VALUES
(1,1,N'Información del taller',N'Consulta ficticia de horarios','PENDIENTE'),(2,NULL,N'Consulta de perfil',N'Consulta de prueba','RESUELTA');
INSERT dbo.Respuesta(id_solicitud,id_usuario,mensaje) VALUES (2,1,N'Solicitud de prueba atendida.');
INSERT dbo.Notificacion(id_usuario,titulo,mensaje) VALUES (3,N'Solicitud atendida',N'Revisa la respuesta de demostración.');
INSERT dbo.Auditoria(id_usuario,modulo,accion,detalle) VALUES (1,N'Sistema',N'INICIALIZACION',N'Carga de registros ficticios');
COMMIT;
GO
-- CRM académico de servicios culturales y recreativos, sin apuestas ni cobros.
-- Ejecutar en SSMS como administrador. No elimina datos ni recrea tablas.
USE BD_AtlanticCity;
GO
SET XACT_ABORT ON;
BEGIN TRANSACTION;
DECLARE @actividad INT;
SELECT @actividad=id_actividad FROM dbo.Actividad WHERE nombre=N'Exposición cultural';
IF @actividad IS NULL
BEGIN
 INSERT dbo.Actividad(nombre,descripcion) VALUES(N'Exposición cultural',N'Actividad artística y educativa');
 SET @actividad=CONVERT(INT,SCOPE_IDENTITY());
END;
-- Ocultar únicamente el registro inicial de ejemplo, conservando sus referencias.
UPDATE dbo.Promocion SET estado=0,fecha_modificacion=SYSUTCDATETIME()
WHERE codigo='DEMO-ARTE' AND titulo=N'Taller de pintura' AND descripcion=N'Aviso informativo ficticio';
DECLARE @hoy DATE=CONVERT(DATE,SYSUTCDATETIME());
IF NOT EXISTS(SELECT 1 FROM dbo.Promocion WHERE codigo='CULT-EXP')
 INSERT dbo.Promocion(id_actividad,codigo,titulo,descripcion,fecha_inicio,fecha_vencimiento)
 VALUES(@actividad,'CULT-EXP',N'Experiencias especiales',N'Consulta la programación de exposiciones y talleres artísticos.',@hoy,DATEADD(DAY,90,@hoy));
IF NOT EXISTS(SELECT 1 FROM dbo.Promocion WHERE codigo='CULT-ATENCION')
 INSERT dbo.Promocion(id_actividad,codigo,titulo,descripcion,fecha_inicio,fecha_vencimiento)
 VALUES(@actividad,'CULT-ATENCION',N'Atención al visitante',N'Consulta con nuestro equipo los horarios, la accesibilidad y los servicios de orientación.',@hoy,DATEADD(DAY,90,@hoy));
COMMIT;
SELECT codigo,titulo,descripcion,estado FROM dbo.Promocion ORDER BY id_promocion;
GO

-- COMPROBACIONES: usuarios y roles
SELECT u.id_usuario,u.nombres,u.apellidos,u.correo,r.nombre_rol
FROM dbo.Usuario u INNER JOIN dbo.Rol r ON u.id_rol=r.id_rol;
-- Historial de membresías ficticias
SELECT u.nombres,m.nombre AS membresia,cm.fecha_inicio,cm.fecha_fin,cm.estado
FROM dbo.Cliente_Membresia cm INNER JOIN dbo.Cliente c ON cm.id_cliente=c.id_cliente
INNER JOIN dbo.Usuario u ON c.id_usuario=u.id_usuario
INNER JOIN dbo.Membresia m ON cm.id_membresia=m.id_membresia;
-- Visitas por actividad, incluyendo actividades sin visitas
SELECT a.nombre,COUNT(v.id_visita) AS total_visitas
FROM dbo.Actividad a LEFT JOIN dbo.Visita v ON a.id_actividad=v.id_actividad
GROUP BY a.id_actividad,a.nombre;
-- Bandeja de atención
SELECT estado,COUNT(*) AS total FROM dbo.Solicitud GROUP BY estado;
-- Auditoría
SELECT * FROM dbo.Auditoria ORDER BY fecha_hora DESC,id_auditoria DESC;
-- NOTA: el backend deberá implementar hash seguro, autorización por rol,
-- actualización de campos de auditoría, vencimiento de planes y registro de cambios
-- dentro de transacciones. El esquema por sí solo no automatiza estas operaciones.

GO
SET NOEXEC OFF;
GO
