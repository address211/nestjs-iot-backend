import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { Device } from './entities/device.entity';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(createDeviceDto: CreateDeviceDto): Promise<Device> {
    await this.ensureDataSource();
    const device = this.deviceRepository.create(createDeviceDto);
    return this.deviceRepository.save(device);
  }

  async findAll(): Promise<Device[]> {
    await this.ensureDataSource();
    return this.deviceRepository.find({
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Device> {
    await this.ensureDataSource();
    const device = await this.deviceRepository.findOneBy({ id });

    if (!device) {
      throw new NotFoundException(`Device ${id} not found`);
    }

    return device;
  }

  async findBySerialNumber(serialNumber: string): Promise<Device | null> {
    await this.ensureDataSource();
    return this.deviceRepository.findOneBy({ serialNumber });
  }

  async update(id: number, updateDeviceDto: UpdateDeviceDto): Promise<Device> {
    await this.ensureDataSource();
    const device = await this.findOne(id);
    const merged = this.deviceRepository.merge(device, updateDeviceDto);
    return this.deviceRepository.save(merged);
  }

  async remove(id: number): Promise<{ deleted: true; id: number }> {
    await this.ensureDataSource();
    const device = await this.findOne(id);
    await this.deviceRepository.remove(device);

    return {
      deleted: true,
      id,
    };
  }

  private async ensureDataSource(): Promise<void> {
    if (this.dataSource.isInitialized) {
      return;
    }

    try {
      await this.dataSource.initialize();
    } catch (error) {
      throw new ServiceUnavailableException(
        'MariaDB connection is unavailable. Check DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME.',
        {
          cause: error,
        },
      );
    }
  }
}
