import { Test, TestingModule } from '@nestjs/testing';
import { DeviceService } from '../device/device.service';
import { Device } from '../device/entities/device.entity';
import { DataGateway } from './data.gateway';
import { DataService, MQTT_CLIENT } from './data.service';

describe('DataService', () => {
  let service: DataService;

  const mqttClient = {
    connected: false,
    on: jest.fn(),
    subscribe: jest.fn(),
    end: jest.fn((...args: unknown[]) => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback();
      }
    }),
  };

  const deviceService = {
    findBySerialNumber: jest.fn(),
  };

  const dataGateway = {
    emitDeviceReading: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataService,
        {
          provide: MQTT_CLIENT,
          useValue: mqttClient,
        },
        {
          provide: DeviceService,
          useValue: deviceService,
        },
        {
          provide: DataGateway,
          useValue: dataGateway,
        },
      ],
    }).compile();

    service = module.get<DataService>(DataService);
  });

  it('emits socket data when the device exists', async () => {
    const device = {
      id: 1,
      name: 'Temperature Sensor',
      serialNumber: 'TEMP-001',
      status: 'online',
    } as Device;

    deviceService.findBySerialNumber.mockResolvedValue(device);

    await service.handleMessage(
      'devices/temperature',
      JSON.stringify({
        devicesn: 'TEMP-001',
        temperature: '25',
        timestamp: 1713772800,
      }),
    );

    expect(deviceService.findBySerialNumber).toHaveBeenCalledWith('TEMP-001');
    expect(dataGateway.emitDeviceReading).toHaveBeenCalledWith(device, {
      devicesn: 'TEMP-001',
      temperature: '25',
      timestamp: 1713772800,
    });
  });

  it('ignores malformed payloads', async () => {
    await service.handleMessage('devices/temperature', '{"devicesn":123}');

    expect(deviceService.findBySerialNumber).not.toHaveBeenCalled();
    expect(dataGateway.emitDeviceReading).not.toHaveBeenCalled();
  });

  it('ignores unknown device serial numbers', async () => {
    deviceService.findBySerialNumber.mockResolvedValue(null);

    await service.handleMessage(
      'devices/temperature',
      JSON.stringify({
        devicesn: 'MISSING-001',
        temperature: '25',
        timestamp: '1713772800',
      }),
    );

    expect(dataGateway.emitDeviceReading).not.toHaveBeenCalled();
  });
});
