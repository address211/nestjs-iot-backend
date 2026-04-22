import { Test, TestingModule } from '@nestjs/testing';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

describe('DeviceController', () => {
  let controller: DeviceController;

  const deviceService = {
    findAll: jest.fn().mockResolvedValue([
      {
        id: 1,
        name: 'Temperature Sensor',
        serialNumber: 'TEMP-001',
        status: 'online',
        firmwareVersion: '1.2.0',
        location: 'Lab A',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceController],
      providers: [
        {
          provide: DeviceService,
          useValue: deviceService,
        },
      ],
    }).compile();

    controller = module.get<DeviceController>(DeviceController);
  });

  it('should return all devices', async () => {
    await expect(controller.findAll()).resolves.toHaveLength(1);
  });
});
