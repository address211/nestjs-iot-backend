import { Logger } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Device } from '../device/entities/device.entity';
import { MqttReading } from './interfaces/mqtt-reading.interface';

export interface DeviceReadingEvent {
  device: Pick<Device, 'id' | 'name' | 'serialNumber' | 'status'>;
  reading: MqttReading;
  receivedAt: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DataGateway {
  private readonly logger = new Logger(DataGateway.name);

  @WebSocketServer()
  private server: Server;

  emitDeviceReading(device: Device, reading: MqttReading): void {
    const payload: DeviceReadingEvent = {
      device: {
        id: device.id,
        name: device.name,
        serialNumber: device.serialNumber,
        status: device.status,
      },
      reading,
      receivedAt: new Date().toISOString(),
    };

    this.server.emit('device-reading', payload);
    this.server.to(device.serialNumber).emit('device-reading', payload);
    this.logger.debug(`Emitted device-reading for ${device.serialNumber}`);
  }
}
