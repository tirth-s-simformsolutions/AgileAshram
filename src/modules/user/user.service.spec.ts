import { Test, TestingModule } from '@nestjs/testing';
import { SUCCESS_MSG } from './messages';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';

// Mock the utils module
jest.mock('../../common/utils', () => ({
  handleError: jest.fn(error => {
    throw error;
  }),
}));

describe('User Service', () => {
  let service: UserService;
  let userRepository: UserRepository;

  const mockUserRepository = {
    createUser: jest.fn(),
    findUserById: jest.fn(),
    findOneByCondition: jest.fn(),
    updateUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should handle repository error during getProfile', async () => {
      const userId = '123';
      const mockError = new Error('User not found');

      mockUserRepository.findUserById.mockRejectedValue(mockError);

      await expect(service.getProfile(userId)).rejects.toThrow(mockError);
      expect(userRepository.findUserById).toHaveBeenCalledWith(userId, {
        id: true,
        name: true,
        email: true,
      });
    });

    it('should return user profile with correct message and status code', async () => {
      const userId = '456';
      const mockUser = {
        id: userId,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
      };

      mockUserRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId, {
        id: true,
        name: true,
        email: true,
      });
      expect(result.message).toBe(SUCCESS_MSG.GET_PROFILE);
      expect(result.data).toEqual(mockUser);
    });

    it('should handle null user data from repository', async () => {
      const userId = '789';

      mockUserRepository.findUserById.mockResolvedValue(null);

      const result = await service.getProfile(userId);

      expect(userRepository.findUserById).toHaveBeenCalledWith(userId, {
        id: true,
        name: true,
        email: true,
      });
      expect(result.data).toBeNull();
      expect(result.message).toBe(SUCCESS_MSG.GET_PROFILE);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const userId = '123';
      const updateData = {
        name: 'Updated Name',
      };

      mockUserRepository.updateUserById.mockResolvedValue(undefined);

      const result = await service.updateProfile(userId, updateData);

      expect(userRepository.updateUserById).toHaveBeenCalledWith(userId, {
        name: updateData.name,
      });
      expect(result.message).toBe(SUCCESS_MSG.UPDATE_PROFILE);
      expect(result.data).toBeUndefined();
    });

    it('should handle repository error during profile update', async () => {
      const userId = '123';
      const updateData = {
        name: 'Updated Name',
      };
      const mockError = new Error('Database connection failed');

      mockUserRepository.updateUserById.mockRejectedValue(mockError);

      await expect(service.updateProfile(userId, updateData)).rejects.toThrow(mockError);
      expect(userRepository.updateUserById).toHaveBeenCalledWith(userId, {
        name: updateData.name,
      });
    });
  });
});
