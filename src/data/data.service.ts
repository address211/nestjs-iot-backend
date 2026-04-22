import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { MqttClient } from 'mqtt';
import { DeviceService } from '../device/device.service';
import { DataGateway } from './data.gateway';
import { MqttReading } from './interfaces/mqtt-reading.interface';

export const MQTT_CLIENT = 'MQTT_CLIENT';

@Injectable()
export class DataService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DataService.name);
  private readonly mqttUrl = process.env.MQTT_URL ?? 'mqtt://localhost:1883';
  private readonly mqttTopic = process.env.MQTT_TOPIC ?? 'devices/temperature';

  constructor(
    @Inject(MQTT_CLIENT)
    private readonly mqttClient: MqttClient,
    private readonly deviceService: DeviceService,
    private readonly dataGateway: DataGateway,
  ) {}

  onApplicationBootstrap(): void {
    this.mqttClient.on('connect', () => {
      this.logger.log(`Connected to MQTT broker ${this.mqttUrl}`);
      this.mqttClient.subscribe(this.mqttTopic, (error) => {
        if (error) {
          this.logger.error(
            `Failed to subscribe to MQTT topic ${this.mqttTopic}`,
            error.message,
          );
          return;
        }

        this.logger.log(`Subscribed to MQTT topic ${this.mqttTopic}`);
      });
    });

    this.mqttClient.on('message', (topic, payload) => {
      void this.handleMessage(topic, payload.toString());
    });

    this.mqttClient.on('error', (error) => {
      this.logger.error('MQTT client error', error.stack);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.mqttClient.end(!this.mqttClient.connected, {}, () => resolve());
    });
  }

  getStatus() {
    return {
      mqttUrl: this.mqttUrl,
      mqttTopic: this.mqttTopic,
      connected: this.mqttClient.connected,
    };
  }

  async handleMessage(topic: string, payload: string): Promise<void> {
    const reading = this.parsePayload(payload);

    if (!reading) {
      this.logger.warn(`Ignored invalid MQTT payload on ${topic}: ${payload}`);
      return;
    }

    const device = await this.deviceService.findBySerialNumber(reading.devicesn);

    if (!device) {
      this.logger.warn(
        `Ignored MQTT payload for unknown device serial ${reading.devicesn}`,
      );
      return;
    }

    this.dataGateway.emitDeviceReading(device, reading);
  }

  private parsePayload(payload: string): MqttReading | null {
    try {
      const parsed = JSON.parse(payload) as Partial<MqttReading>;
      const timestamp = this.parseTimestamp(parsed.timestamp);

      if (
        typeof parsed.devicesn !== 'string' ||
        typeof parsed.temperature !== 'string' ||
        timestamp === null
      ) {
        return null;
      }

      return {
        devicesn: parsed.devicesn,
        temperature: parsed.temperature,
        timestamp,
      };
    } catch {
      return null;
    }
  }

  private parseTimestamp(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  }
}
