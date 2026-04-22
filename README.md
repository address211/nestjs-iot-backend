# IoT Backend

NestJS backend for:

- managing IoT devices in MariaDB
- receiving temperature readings from MQTT
- broadcasting matched readings over Socket.IO

## Quick Demo

### 1. Install dependencies

```bash
npm install
```

### 2. Prepare services

You need:

- Node.js 20+
- MariaDB on `localhost:3306`
- an MQTT broker on `mqtt://localhost:1883`

### 3. Set environment variables

Example:

```bash
export PORT=3000
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=root
export DB_PASSWORD=
export DB_NAME=iot_backend
export MQTT_URL=mqtt://localhost:1883
export MQTT_TOPIC=devices/temperature
```

### 4. Create the database table

`TypeORM` auto-sync is disabled, so create the table manually for the demo:

```sql
CREATE DATABASE IF NOT EXISTS iot_backend;
USE iot_backend;

CREATE TABLE IF NOT EXISTS devices (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  serialNumber VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'offline',
  firmwareVersion VARCHAR(32) NOT NULL DEFAULT '1.0.0',
  location VARCHAR(120) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 5. Start the API

```bash
npm run start:dev
```

App URL:

```text
http://localhost:3000
```

## Demo Flow

### 1. Confirm MQTT connection settings

```bash
curl http://localhost:3000/data/status
```

Expected response shape:

```json
{
  "mqttUrl": "mqtt://localhost:1883",
  "mqttTopic": "devices/temperature",
  "connected": true
}
```

### 2. Create a demo device

```bash
curl -X POST http://localhost:3000/devices \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Warehouse Sensor",
    "serialNumber": "SN-1001",
    "status": "online",
    "firmwareVersion": "1.0.0",
    "location": "Aisle 3"
  }'
```

### 3. List saved devices

```bash
curl http://localhost:3000/devices
```

### 4. Publish a sample MQTT reading

Using Mosquitto:

```bash
mosquitto_pub -h localhost -p 1883 -t devices/temperature -m '{"devicesn":"SN-1001","temperature":"26.4","timestamp":1713772800}'
```

If the device serial exists in MariaDB, the backend emits a `device-reading` WebSocket event.

## HTTP API

### Data

- `GET /data/status`

### Devices

- `POST /devices`
- `GET /devices`
- `GET /devices/:id`
- `PATCH /devices/:id`
- `DELETE /devices/:id`

## WebSocket

Socket.IO gateway is enabled with CORS `*`.

Event emitted by the backend:

- `device-reading`

Payload shape:

```json
{
  "device": {
    "id": 1,
    "name": "Warehouse Sensor",
    "serialNumber": "SN-1001",
    "status": "online"
  },
  "reading": {
    "devicesn": "SN-1001",
    "temperature": "26.4",
    "timestamp": 1713772800
  },
  "receivedAt": "2026-04-22T12:00:00.000Z"
}
```

## Useful Commands

```bash
npm run start
npm run start:dev
npm run build
npm run test
npm run test:e2e
```

## Notes

- MQTT payloads must be valid JSON.
- Expected payload fields are `devicesn` and `temperature` as strings, plus `timestamp` as Unix time.
- `timestamp` may be sent as a number or numeric string and is normalized to a number before emission.
- Readings for unknown device serial numbers are ignored.
