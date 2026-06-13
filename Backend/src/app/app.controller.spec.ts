import { Test, TestingModule } from '@nestjs/testing';
import { HealthService } from '../common/services';
import { ResponseResult } from '../core/class';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;
  let healthService: HealthService;

  beforeEach(async () => {
    const mockHealthService = {
      check: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: HealthService,
          useValue: mockHealthService,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('AppController class', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should be an instance of AppController', () => {
      expect(controller).toBeInstanceOf(AppController);
    });

    it('should have healthService injected', () => {
      expect(controller['healthService']).toBeDefined();
      expect(controller['healthService']).toBe(healthService);
    });
  });

  describe('healthCheck', () => {
    it('should call healthService.check() method', async () => {
      const mockResult = new ResponseResult({
        message: 'OK',
        data: { uptime: 12345 },
      });

      (healthService.check as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.healthCheck();

      expect(healthService.check).toHaveBeenCalledTimes(1);
      expect(healthService.check).toHaveBeenCalledWith();
      expect(result).toEqual(mockResult);
    });

    it('should return health check response with uptime data', async () => {
      const expectedResponse = new ResponseResult({
        message: 'success.OK',
        data: { uptime: 54321 },
      });

      (healthService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.healthCheck();

      expect(result).toEqual(expectedResponse);
      expect(result.message).toBe('success.OK');
      expect(result.data).toEqual({ uptime: 54321 });
    });

    it('should return health check response with different uptime values', async () => {
      const uptimes = [0, 1000, 999999, 1.5];

      // Test each uptime value sequentially to avoid await in loop
      const testUptime = async (uptime: number) => {
        const expectedResponse = new ResponseResult({
          message: 'success.OK',
          data: { uptime },
        });

        (healthService.check as jest.Mock).mockResolvedValue(expectedResponse);

        const result = await controller.healthCheck();

        expect((result.data as { uptime: number }).uptime).toBe(uptime);
        expect(healthService.check).toHaveBeenCalledWith();
      };

      // Test all uptime values
      await Promise.all(uptimes.map(uptime => testUptime(uptime)));
    });

    it('should handle successful health check with empty data', async () => {
      const expectedResponse = new ResponseResult({
        message: 'success.OK',
        data: {},
      });

      (healthService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.healthCheck();

      expect(result).toEqual(expectedResponse);
      expect(result.message).toBe('success.OK');
      expect(result.data).toEqual({});
    });

    it('should handle health check with null data', async () => {
      const expectedResponse = new ResponseResult({
        message: 'success.OK',
        data: null,
      });

      (healthService.check as jest.Mock).mockResolvedValue(expectedResponse);

      const result = await controller.healthCheck();

      expect(result).toEqual(expectedResponse);
      expect(result.data).toBeNull();
    });

    it('should propagate errors from health service', async () => {
      const error = new Error('Database connection failed');
      (healthService.check as jest.Mock).mockRejectedValue(error);

      await expect(controller.healthCheck()).rejects.toThrow('Database connection failed');

      expect(healthService.check).toHaveBeenCalledTimes(1);
    });

    it('should handle generic errors from health service', async () => {
      const error = new Error('Service unavailable');
      (healthService.check as jest.Mock).mockRejectedValue(error);

      await expect(controller.healthCheck()).rejects.toThrow(error);
    });

    it('should handle async errors from health service', async () => {
      const errorMessage = 'Async operation failed';
      (healthService.check as jest.Mock).mockImplementation(async () => {
        throw new Error(errorMessage);
      });

      await expect(controller.healthCheck()).rejects.toThrow(errorMessage);
    });

    it('should handle health service returning undefined', async () => {
      (healthService.check as jest.Mock).mockResolvedValue(undefined);

      const result = await controller.healthCheck();

      expect(result).toBeUndefined();
      expect(healthService.check).toHaveBeenCalledTimes(1);
    });

    it('should handle health service returning non-ResponseResult object', async () => {
      const customResponse = {
        status: 'healthy',
        timestamp: Date.now(),
      };

      (healthService.check as jest.Mock).mockResolvedValue(customResponse);

      const result = await controller.healthCheck();

      expect(result).toEqual(customResponse);
      expect(healthService.check).toHaveBeenCalledTimes(1);
    });
  });

  describe('Method properties and metadata', () => {
    it('should have healthCheck method', () => {
      expect(typeof controller.healthCheck).toBe('function');
    });

    it('should call healthCheck without parameters', async () => {
      const mockResult = new ResponseResult({
        message: 'OK',
        data: { uptime: 12345 },
      });

      (healthService.check as jest.Mock).mockResolvedValue(mockResult);

      // Verify the method can be called without any arguments
      const result = await controller.healthCheck();

      expect(result).toBeDefined();
      expect(healthService.check).toHaveBeenCalledWith();
    });
  });

  describe('Error handling edge cases', () => {
    it('should handle health service throwing non-Error objects', async () => {
      const errorObject = { code: 500, message: 'Internal error' };
      (healthService.check as jest.Mock).mockRejectedValue(errorObject);

      await expect(controller.healthCheck()).rejects.toEqual(errorObject);
    });

    it('should handle health service throwing string errors', async () => {
      const errorString = 'String error message';
      (healthService.check as jest.Mock).mockRejectedValue(errorString);

      await expect(controller.healthCheck()).rejects.toBe(errorString);
    });

    it('should handle multiple consecutive calls', async () => {
      const mockResults = [
        new ResponseResult({ message: 'OK', data: { uptime: 1000 } }),
        new ResponseResult({ message: 'OK', data: { uptime: 2000 } }),
        new ResponseResult({ message: 'OK', data: { uptime: 3000 } }),
      ];

      (healthService.check as jest.Mock)
        .mockResolvedValueOnce(mockResults[0])
        .mockResolvedValueOnce(mockResults[1])
        .mockResolvedValueOnce(mockResults[2]);

      const results = await Promise.all([
        controller.healthCheck(),
        controller.healthCheck(),
        controller.healthCheck(),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual(mockResults[0]);
      expect(results[1]).toEqual(mockResults[1]);
      expect(results[2]).toEqual(mockResults[2]);
      expect(healthService.check).toHaveBeenCalledTimes(3);
    });
  });
});
