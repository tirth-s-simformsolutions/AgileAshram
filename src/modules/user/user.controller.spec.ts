import { Test, TestingModule } from '@nestjs/testing';
import { UpdateProfileDto } from './dtos';
import { UserController } from './user.controller';
import { UserService } from './user.service';

// Define proper types to avoid "any"
interface MockCurrentUser {
  userId: string;
  name: string;
}

interface MockServiceResponse {
  message: string;
  data?: unknown;
  statusCode?: number;
}

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile successfully', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '123',
        name: 'Test User',
      };
      const mockResponse: MockServiceResponse = {
        message: 'Profile retrieved successfully',
        data: {
          id: '123',
          name: 'Test User',
          email: 'test@example.com',
        },
        statusCode: 200,
      };
      mockUserService.getProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getProfile(mockCurrentUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(userService.getProfile).toHaveBeenCalledWith('123');
      expect(userService.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when getting profile', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '123',
        name: 'Test User',
      };
      const mockError = new Error('User not found');
      mockUserService.getProfile.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.getProfile(mockCurrentUser)).rejects.toThrow(mockError);
      expect(userService.getProfile).toHaveBeenCalledWith('123');
    });

    it('should call userService.getProfile with correct userId', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '456',
        name: 'Another User',
      };
      const mockResponse: MockServiceResponse = {
        message: 'Profile retrieved successfully',
        data: { id: '456', name: 'Another User', email: 'another@example.com' },
        statusCode: 200,
      };
      mockUserService.getProfile.mockResolvedValue(mockResponse);

      // Act
      await controller.getProfile(mockCurrentUser);

      // Assert
      expect(userService.getProfile).toHaveBeenCalledWith('456');
      expect(userService.getProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle different user IDs correctly', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: 'user-uuid-123',
        name: 'UUID User',
      };
      const mockResponse: MockServiceResponse = {
        message: 'Profile retrieved successfully',
        data: {
          id: 'user-uuid-123',
          name: 'UUID User',
          email: 'uuid@example.com',
        },
        statusCode: 200,
      };
      mockUserService.getProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getProfile(mockCurrentUser);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(userService.getProfile).toHaveBeenCalledWith('user-uuid-123');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '123',
        name: 'Test User',
      };
      const updateData: UpdateProfileDto = { name: 'Updated User' };
      const mockResponse: MockServiceResponse = {
        message: 'Profile updated successfully',
      };
      mockUserService.updateProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateProfile(mockCurrentUser, updateData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(userService.updateProfile).toHaveBeenCalledWith('123', updateData);
      expect(userService.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when updating profile', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '123',
        name: 'Test User',
      };
      const updateData: UpdateProfileDto = { name: 'Updated User' };
      const mockError = new Error('Update failed');
      mockUserService.updateProfile.mockRejectedValue(mockError);

      // Act & Assert
      await expect(controller.updateProfile(mockCurrentUser, updateData)).rejects.toThrow(
        mockError,
      );
      expect(userService.updateProfile).toHaveBeenCalledWith('123', updateData);
    });

    it('should call userService.updateProfile with correct parameters', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '789',
        name: 'Another User',
      };
      const updateData: UpdateProfileDto = { name: 'New Name' };
      const mockResponse: MockServiceResponse = { message: 'Success' };
      mockUserService.updateProfile.mockResolvedValue(mockResponse);

      // Act
      await controller.updateProfile(mockCurrentUser, updateData);

      // Assert
      expect(userService.updateProfile).toHaveBeenCalledWith('789', updateData);
      expect(userService.updateProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle update with only name field', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '123',
        name: 'Test User',
      };
      const updateData: UpdateProfileDto = { name: 'Only Name Update' };
      const mockResponse: MockServiceResponse = { message: 'Profile updated' };
      mockUserService.updateProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateProfile(mockCurrentUser, updateData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(userService.updateProfile).toHaveBeenCalledWith('123', updateData);
    });

    it('should handle validation errors from DTO', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: '123',
        name: 'Test User',
      };
      const updateData: UpdateProfileDto = { name: '' }; // Invalid empty name
      const validationError = new Error('Validation failed');
      mockUserService.updateProfile.mockRejectedValue(validationError);

      // Act & Assert
      await expect(controller.updateProfile(mockCurrentUser, updateData)).rejects.toThrow(
        validationError,
      );
      expect(userService.updateProfile).toHaveBeenCalledWith('123', updateData);
    });

    it('should handle different user IDs in update', async () => {
      // Arrange
      const mockCurrentUser: MockCurrentUser = {
        userId: 'different-user-id',
        name: 'Different User',
      };
      const updateData: UpdateProfileDto = { name: 'Different User' };
      const mockResponse: MockServiceResponse = { message: 'Profile updated' };
      mockUserService.updateProfile.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateProfile(mockCurrentUser, updateData);

      // Assert
      expect(result).toEqual(mockResponse);
      expect(userService.updateProfile).toHaveBeenCalledWith('different-user-id', updateData);
    });
  });
});
