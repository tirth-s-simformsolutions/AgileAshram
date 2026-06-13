import { getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { ResponseResult } from '../../core/class';
import { handleError } from '../utils';
import { HealthService } from './health.service';

jest.mock('../utils', () => ({
  handleError: jest.fn(error => {
    throw error;
  }),
}));

describe('HealthService', () => {
  let service: HealthService;

  const pingMock = jest.fn();

  const mockConnection = {
    db: {
      admin: () => ({
        ping: pingMock,
      }),
    },
  };

  beforeEach(async () => {
    pingMock.mockReset().mockResolvedValue(true);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: getConnectionToken(),
          useValue: mockConnection,
        },
      ],
    }).compile();

    service = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('check', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should return health check response when database is accessible', async () => {
      const mockUptime = 12345;
      jest.spyOn(process, 'uptime').mockReturnValue(mockUptime);

      const result = await service.check();

      expect(result).toBeInstanceOf(ResponseResult);
      expect(result.message).toBe('success.OK');
      expect(result.data).toEqual({ uptime: mockUptime });
    });

    it('should handle database connection errors', async () => {
      const mockError = new Error('Database connection failed');

      pingMock.mockRejectedValueOnce(mockError);

      await expect(service.check()).rejects.toThrow('Database connection failed');
      expect(handleError).toHaveBeenCalledWith(mockError);
    });

    it('should call database health check query', async () => {
      jest.spyOn(process, 'uptime').mockReturnValue(100);

      await service.check();

      expect(pingMock).toHaveBeenCalled();
    });
  });
});
