import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';

const mockUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'XXX',
};

const mockUserRecord = {
  id: 'user-id',
  ...mockUser,
};

describe('UserRepository', () => {
  let repository: UserRepository;

  const mockUserModel = {
    findById: jest.fn(() => ({
      exec: jest.fn(() => mockUserModel.findById._execResult),
    })),
    findByIdAndUpdate: jest.fn(() => ({
      exec: jest.fn(() => mockUserModel.findByIdAndUpdate._execResult),
    })),
    findOne: jest.fn(() => ({
      exec: jest.fn(() => mockUserModel.findOne._execResult),
    })),
    save: jest.fn(),
    create: jest.fn(),
    // For controlling exec() result in tests
    _setExecResult(method, result) {
      this[method]._execResult = result;
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    const userId = 'test-user-id';

    it('should find user by id successfully', async () => {
      // Arrange
      const expectedUser = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      mockUserModel._setExecResult('findById', Promise.resolve(expectedUser));

      // Act
      const result = await repository.findUserById(userId);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockUserModel.findById).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockUserModel._setExecResult('findById', Promise.resolve(null));

      // Act
      const result = await repository.findUserById(userId);

      // Assert
      expect(result).toBeNull();
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockUserModel._setExecResult('findById', Promise.reject(dbError));

      // Act & Assert
      await expect(repository.findUserById(userId)).rejects.toThrow('Database connection failed');
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });

    // Mongoose findById does not support select fields directly, so skip this test or refactor as needed.
  });

  describe('updateUserById', () => {
    const userId = 'test-user-id';
    const updateData = {
      name: 'Updated Name',
    };

    it('should update user by id successfully', async () => {
      // Arrange
      const expectedUpdatedUser = {
        id: userId,
        name: 'Updated Name',
        email: 'john@example.com',
      };
      mockUserModel._setExecResult('findByIdAndUpdate', Promise.resolve(expectedUpdatedUser));

      // Act
      const result = await repository.updateUserById(userId, updateData);

      // Assert
      expect(result).toEqual(expectedUpdatedUser);
    });

    it('should handle user not found during update', async () => {
      // Arrange
      const notFoundError = new Error('Record to update not found');
      mockUserModel._setExecResult('findByIdAndUpdate', Promise.reject(notFoundError));

      // Act & Assert
      await expect(repository.updateUserById(userId, updateData)).rejects.toThrow(
        'Record to update not found',
      );
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, {
        new: true,
      });
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const dbError = new Error('Database transaction failed');
      mockUserModel._setExecResult('findByIdAndUpdate', Promise.reject(dbError));

      // Act & Assert
      await expect(repository.updateUserById(userId, updateData)).rejects.toThrow(
        'Database transaction failed',
      );
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateData, {
        new: true,
      });
    });

    it('should work with partial update data', async () => {
      // Arrange
      const partialUpdateData = {
        name: 'Partial Update',
      };
      const expectedUser = {
        id: userId,
        name: 'Partial Update',
        email: 'existing@example.com',
      };
      mockUserModel._setExecResult('findByIdAndUpdate', Promise.resolve(expectedUser));

      // Act
      const result = await repository.updateUserById(userId, partialUpdateData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, partialUpdateData, {
        new: true,
      });
    });

    it('should work with empty update data', async () => {
      // Arrange
      const emptyUpdateData = {};
      const expectedUser = {
        id: userId,
        name: 'Unchanged Name',
        email: 'unchanged@example.com',
      };
      mockUserModel._setExecResult('findByIdAndUpdate', Promise.resolve(expectedUser));

      // Act
      const result = await repository.updateUserById(userId, emptyUpdateData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, emptyUpdateData, {
        new: true,
      });
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      mockUserModel.create.mockResolvedValue(mockUserRecord);
      const result = await repository.createUser(mockUser);
      expect(mockUserModel.create).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUserRecord);
    });

    it('should handle database errors during creation', async () => {
      const dbError = new Error('Database error');
      mockUserModel.create.mockRejectedValueOnce(dbError);
      await expect(repository.createUser(mockUser)).rejects.toThrow('Database error');
      expect(mockUserModel.create).toHaveBeenCalledWith(mockUser);
    });

    it('should handle invalid user data', async () => {
      // Invalid user with empty strings
      const invalidUser = {
        email: '',
        name: '',
        password: '',
      };
      const dbError = new Error('Invalid data');
      mockUserModel.create.mockRejectedValueOnce(dbError);
      await expect(repository.createUser(invalidUser)).rejects.toThrow('Invalid data');
      expect(mockUserModel.create).toHaveBeenCalledWith(invalidUser);
    });
  });

  describe('findOneByCondition', () => {
    it('should find a user by condition', async () => {
      const condition = { email: mockUser.email };
      mockUserModel._setExecResult('findOne', Promise.resolve(mockUserRecord));
      const result = await repository.findOneByCondition(condition);
      expect(mockUserModel.findOne).toHaveBeenCalledWith(condition);
      expect(result).toEqual(mockUserRecord);
    });

    it('should return null if no user matches condition', async () => {
      mockUserModel._setExecResult('findOne', Promise.resolve(null));
      const condition = { email: 'notfound@example.com' };
      const result = await repository.findOneByCondition(condition);
      expect(mockUserModel.findOne).toHaveBeenCalledWith(condition);
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      mockUserModel._setExecResult('findOne', Promise.reject(dbError));
      const condition = { email: mockUser.email };
      await expect(repository.findOneByCondition(condition)).rejects.toThrow('Database error');
      expect(mockUserModel.findOne).toHaveBeenCalledWith(condition);
    });

    it('should handle invalid condition', async () => {
      const invalidCondition: Record<string, unknown> = { invalidField: 'value' };
      const dbError = new Error('Invalid condition');
      mockUserModel._setExecResult('findOne', Promise.reject(dbError));
      await expect(repository.findOneByCondition(invalidCondition)).rejects.toThrow(
        'Invalid condition',
      );
      expect(mockUserModel.findOne).toHaveBeenCalledWith(invalidCondition);
    });
  });
});
