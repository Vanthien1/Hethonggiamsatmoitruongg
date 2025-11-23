
# 🌐 IoT Environmental Monitoring Dashboard

## 🇻🇳 README Tiếng Việt

Hệ thống giám sát môi trường gồm dashboard realtime, backend API, SQL Server và mô phỏng cảm biến.

### 📁 Cấu trúc thư mục

### ⚙️ Cài đặt & Chạy hệ thống
- `npm install`
- Tạo file `.env`
- Chạy backend: `node app.js`
- Chạy mô phỏng cảm biến: `node sensor.js`

### 🧭 Sơ đồ kiến trúc (Mermaid)
```mermaid
flowchart TD

A[Frontend (Client)\nEJS + Chart.js\nCSS + JS] -->|HTTP JSON API| B

B[Backend (Node.js + Express)\napp.js\nAPI + Auth + Session] -->|SQL Query| C

C[Database (SQL Server)\nUsers, SensorStats\nsetup.sql, seed-users.sql]

D[Sensor Simulator\nsensor.js\nInsert mỗi 60s] -->|INSERT| C
```

---

## 🇬🇧 README English Version

A real‑time dashboard system for monitoring Temperature, Dust, and Pressure.

### ⚙️ Setup & Run
- `npm install`
- Create `.env` file
- Run server: `node app.js`
- Run sensor simulator: `node sensor.js`

### 🧭 Architecture Diagram (Mermaid)
```mermaid
flowchart TD

A[Frontend (Client)\nEJS + Chart.js\nCSS + JS] -->|HTTP JSON API| B

B[Backend (Node.js + Express)\napp.js\nAPI + Auth + Session] -->|SQL Query| C

C[SQL Server Database\nUsers, SensorStats\nsetup.sql, seed-users.sql]

D[Sensor Simulator\nsensor.js\nInsert every 60s] -->|INSERT| C
```
