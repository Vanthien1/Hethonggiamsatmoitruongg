/* 1. TẠO LOGIN WEBIOT (NẾU CHƯA CÓ)*/
USE master;
GO

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'webiot')
BEGIN
    CREATE LOGIN webiot 
    WITH PASSWORD = 'WebIoT@123', 
         CHECK_POLICY = OFF;
END
GO
 
/* 2. TẠO DATABASE IOTWEB (NẾU CHƯA CÓ) */
IF DB_ID('IoTWeb') IS NULL 
BEGIN
    CREATE DATABASE IoTWeb;
END
GO

USE IoTWeb;
GO

/* 3. XÓA CÁC BẢNG CŨ NẾU CÓ (ĐÚNG THỨ TỰ FK) */
IF OBJECT_ID('dbo.SensorData', 'U') IS NOT NULL 
    DROP TABLE dbo.SensorData;
GO

IF OBJECT_ID('dbo.Sensors', 'U') IS NOT NULL 
    DROP TABLE dbo.Sensors;
GO

IF OBJECT_ID('dbo.Devices', 'U') IS NOT NULL 
    DROP TABLE dbo.Devices;
GO

IF OBJECT_ID('dbo.SensorStats', 'U') IS NOT NULL 
    DROP TABLE dbo.SensorStats;
GO

IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL 
    DROP TABLE dbo.Users;
GO


/* 4. TẠO BẢNG USERS*/
CREATE TABLE dbo.Users (
  Id       INT IDENTITY(1,1) PRIMARY KEY,
  Username VARCHAR(50)  NOT NULL UNIQUE,
  Email    VARCHAR(200) NOT NULL UNIQUE,
  Password VARCHAR(200) NOT NULL,
  FullName NVARCHAR(100),
  Role     VARCHAR(20)  NOT NULL DEFAULT 'customer'
);
GO

-- SEED 4 TÀI KHOẢN 
INSERT dbo.Users (Username, Email, Password, FullName, Role)
VALUES
  ('vanthien',  'vanthien36636@gmail.com', 'vanthien',  N'Khách hàng 0', 'customer'),
  ('minhthuat', 'buiminhthua@gmail.com',   '1minhthua', N'Khách hàng 1', 'customer'),
  ('vannam',    'nguyenvannam@gmail.com',  'vannam',    N'Khách hàng 2', 'customer'),
  ('huuhung',   'caohuuhung@gmail.com',    'huuhung',   N'Khách hàng 3', 'customer');
GO


/* 5. TẠO BẢNG SENSORSTATS(đang dùng DEFAULT(SYSDATETIME()) */
CREATE TABLE dbo.SensorStats (
  Id          INT IDENTITY(1,1) PRIMARY KEY,
  At          DATETIME2 NOT NULL DEFAULT(SYSDATETIME()),
  Temperature FLOAT NULL,
  Dust        FLOAT NULL,
  Pressure    FLOAT NULL
);
GO

CREATE INDEX IX_SensorStats_At ON dbo.SensorStats(At);
GO


/* 6. TẠO CÁC BẢNG DEVICES / SENSORS / SENSORDATA */

-- BẢNG DEVICES
CREATE TABLE dbo.Devices (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    Name      NVARCHAR(100) NOT NULL,
    Status    VARCHAR(20)   NOT NULL DEFAULT 'OFF',   -- ON / OFF
    CreatedAt DATETIME2     NOT NULL DEFAULT(SYSDATETIME())
);
GO

-- SEED 3 THIẾT BỊ MẪU
INSERT INTO dbo.Devices (Name, Status)
VALUES
    (N'Thiết bị đo môi trường 01', 'ON'),
    (N'Thiết bị đo môi trường 02', 'OFF'),
    (N'Thiết bị đo môi trường 03', 'ON');
GO

-- BẢNG SENSORS
CREATE TABLE dbo.Sensors (
    Id       INT IDENTITY(1,1) PRIMARY KEY,
    DeviceID INT          NOT NULL,
    Type     NVARCHAR(50) NOT NULL,       -- temperature, dust, pressure...
    Unit     NVARCHAR(20) NOT NULL,       -- °C, µg/m³, hPa...
    CONSTRAINT FK_Sensors_Devices
        FOREIGN KEY (DeviceID) REFERENCES dbo.Devices(Id)
        ON DELETE CASCADE
);
GO

-- SEED 3 CẢM BIẾN MẪU GẮN VỚI DEVICEID = 1
INSERT INTO dbo.Sensors (DeviceID, Type, Unit)
VALUES
    (1, 'temperature', N'°C'),
    (1, 'dust',        N'µg/m³'),
    (1, 'pressure',    N'hPa');
GO

-- BẢNG SENSORDATA
CREATE TABLE dbo.SensorData (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    SensorID  INT       NOT NULL,
    Value     FLOAT     NOT NULL,
    Timestamp DATETIME2 NOT NULL DEFAULT(SYSDATETIME()),
    CONSTRAINT FK_SensorData_Sensors
        FOREIGN KEY (SensorID) REFERENCES dbo.Sensors(Id)
        ON DELETE CASCADE
);
GO

CREATE INDEX IX_SensorData_Sensor_Time 
  ON dbo.SensorData(SensorID, Timestamp);
GO


/* 7. GÁN LOGIN WEBIOT → USER TRONG DB + QUYỀN*/

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'webiot')
BEGIN
    CREATE USER webiot FOR LOGIN webiot;
END
GO

-- Thêm vào role db_owner nếu chưa là member
IF NOT EXISTS (
    SELECT 1
    FROM sys.database_role_members rm
    JOIN sys.database_principals r ON rm.role_principal_id = r.principal_id
    JOIN sys.database_principals u ON rm.member_principal_id = u.principal_id
    WHERE r.name = 'db_owner' AND u.name = 'webiot'
)
BEGIN
    ALTER ROLE db_owner ADD MEMBER webiot;
END
GO

PRINT '⭐ CLEAN IoTWeb setup (không drop LOGIN, có Users, SensorStats, Devices, Sensors, SensorData) hoàn tất!';
GO

IF OBJECT_ID('dbo.vw_SensorStatsNice', 'V') IS NOT NULL
    DROP VIEW dbo.vw_SensorStatsNice;
GO

CREATE VIEW dbo.vw_SensorStatsNice AS
SELECT 
    Id                  AS SensorId,               -- ID bản ghi / cảm biến
    Temperature         AS NhietDo,               -- Nhiệt độ
    Dust                AS DoBui,                 -- Độ bụi
    Pressure            AS ApSuat,                -- Áp suất
    CONVERT(VARCHAR(8), DATEADD(HOUR, 7, At), 108) AS Gio,         -- HH:mm:ss
    CONVERT(VARCHAR(10),DATEADD(HOUR, 7, At), 103) AS Ngay         -- dd/MM/yyyy
FROM SensorStats;
GO


PRINT '⭐ CLEAN IoTWeb setup (Users, SensorStats, Devices, Sensors, SensorData, VIEW vw_SensorStatsNice) hoàn tất!';
GO

SELECT TOP 100 * FROM dbo.vw_SensorStatsNice ORDER BY SensorId DESC;


