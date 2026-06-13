import { Test, TestingModule } from '@nestjs/testing';
import { ResponseResult } from '../../core/class';
import { PrismaService } from '../../database/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let service: HealthService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return health check response when database is accessible', async () => {
      // Mock successful database query
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);

      // Mock process.uptime()
      const mockUptime = 12345;
      jest.spyOn(process, 'uptime').mockReturnValue(mockUptime);

      const result = await service.check();

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(ResponseResult);
      expect(result.message).toBe('success.OK');
      expect(result.data).toEqual({ uptime: mockUptime });
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection failed');
      (prismaService.$queryRaw as jest.Mock).mockRejectedValue(mockError);

      // Mock handleError function (you might need to adjust this based on your implementation)
      jest.mock('../utils', () => ({
        handleError: jest.fn(error => {
          throw error;
        }),
      }));

      await expect(service.check()).rejects.toThrow('Database connection failed');
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should call database health check query', async () => {
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([{ 1: 1 }]);
      jest.spyOn(process, 'uptime').mockReturnValue(100);

      await service.check();

      expect(prismaService.$queryRaw).toHaveBeenCalledWith(['SELECT 1']);
    });
  });
});
