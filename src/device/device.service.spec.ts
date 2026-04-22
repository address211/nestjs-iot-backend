import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DeviceService } from './device.service';
import { Device } from './entities/device.entity';

describe('DeviceService', () => {
  let service: DeviceService;
  let repository: jest.Mocked<Repository<Device>>;

  const dataSource = {
    isInitialized: true,
    initialize: jest.fn(),
  } as unknown as DataSource;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeviceService,
        {
          provide: getRepositoryToken(Device),
          useValue: {
            create: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            merge: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: getDataSourceToken(),
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<DeviceService>(DeviceService);
    repository = module.get(getRepositoryToken(Device));
  });

  it('returns devices ordered by id', async () => {
    repository.find.mockResolvedValue([
      {
        id: 1,
        name: 'Temperature Sensor',
        serialNumber: 'TEMP-001',
      } as Device,
    ]);

    await expect(service.findAll()).resolves.toHaveLength(1);
    expect(repository.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
  });

  it('throws when a device cannot be found', async () => {
    repository.findOneBy.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });
});
