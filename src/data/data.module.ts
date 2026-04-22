import { Module } from '@nestjs/common';
import { connect } from 'mqtt';
import { DeviceModule } from '../device/device.module';
import { DataController } from './data.controller';
import { DataGateway } from './data.gateway';
import { DataService, MQTT_CLIENT } from './data.service';

@Module({
  imports: [DeviceModule],
  controllers: [DataController],
  providers: [
    DataGateway,
    DataService,
    {
      provide: MQTT_CLIENT,
      useFactory: () =>
        connect(process.env.MQTT_URL ?? 'mqtt://localhost:1883'),
    },
  ],
})
export class DataModule {}
