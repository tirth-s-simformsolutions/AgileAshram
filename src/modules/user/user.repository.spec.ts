import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../database/prisma.service';
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
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn().mockResolvedValue(mockUserRecord),
      findFirst: jest.fn().mockResolvedValue(mockUserRecord),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    const userId = 'test-user-id';
    const selectFields = {
      id: true,
      name: true,
      email: true,
    };

    it('should find user by id successfully', async () => {
      // Arrange
      const expectedUser = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.findUserById(userId, selectFields);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: selectFields,
      });
      expect(prismaService.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await repository.findUserById(userId, selectFields);

      // Assert
      expect(result).toBeNull();
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: selectFields,
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      const dbError = new Error('Database connection failed');
      mockPrismaService.user.findUnique.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.findUserById(userId, selectFields)).rejects.toThrow(
        'Database connection failed',
      );
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: selectFields,
      });
    });

    it('should work with different select fields', async () => {
      // Arrange
      const differentSelectFields = {
        id: true,
        email: true,
      };
      const expectedUser = {
        id: userId,
        email: 'john@example.com',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.findUserById(userId, differentSelectFields);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: differentSelectFields,
      });
    });
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
      mockPrismaService.user.update.mockResolvedValue(expectedUpdatedUser);

      // Act
      const result = await repository.updateUserById(userId, updateData);

      // Assert
      expect(result).toEqual(expectedUpdatedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
      expect(prismaService.user.update).toHaveBeenCalledTimes(1);
    });

    it('should handle user not found during update', async () => {
      // Arrange
      const notFoundError = new Error('Record to update not found');
      mockPrismaService.user.update.mockRejectedValue(notFoundError);

      // Act & Assert
      await expect(repository.updateUserById(userId, updateData)).rejects.toThrow(
        'Record to update not found',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
      });
    });

    it('should handle database errors during update', async () => {
      // Arrange
      const dbError = new Error('Database transaction failed');
      mockPrismaService.user.update.mockRejectedValue(dbError);

      // Act & Assert
      await expect(repository.updateUserById(userId, updateData)).rejects.toThrow(
        'Database transaction failed',
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateData,
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
      mockPrismaService.user.update.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.updateUserById(userId, partialUpdateData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: partialUpdateData,
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
      mockPrismaService.user.update.mockResolvedValue(expectedUser);

      // Act
      const result = await repository.updateUserById(userId, emptyUpdateData);

      // Assert
      expect(result).toEqual(expectedUser);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: emptyUpdateData,
      });
    });
  });

  describe('createUser', () => {
    it('should create a user', async () => {
      const result = await repository.createUser(mockUser);
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: mockUser });
      expect(result).toEqual(mockUserRecord);
    });

    it('should handle database errors during creation', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.user.create.mockRejectedValueOnce(dbError);
      await expect(repository.createUser(mockUser)).rejects.toThrow('Database error');
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: mockUser });
    });

    it('should handle invalid user data', async () => {
      // Invalid user with empty strings
      const invalidUser = {
        email: '',
        name: '',
        password: '',
      };
      const dbError = new Error('Invalid data');
      mockPrismaService.user.create.mockRejectedValueOnce(dbError);
      await expect(repository.createUser(invalidUser)).rejects.toThrow('Invalid data');
      expect(prismaService.user.create).toHaveBeenCalledWith({ data: invalidUser });
    });
  });

  describe('findOneByCondition', () => {
    it('should find a user by condition', async () => {
      const condition = { email: mockUser.email };
      const result = await repository.findOneByCondition(condition);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({ where: condition });
      expect(result).toEqual(mockUserRecord);
    });

    it('should return null if no user matches condition', async () => {
      mockPrismaService.user.findFirst.mockResolvedValueOnce(null);
      const condition = { email: 'notfound@example.com' };
      const result = await repository.findOneByCondition(condition);
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({ where: condition });
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database error');
      mockPrismaService.user.findFirst.mockRejectedValueOnce(dbError);
      const condition = { email: mockUser.email };
      await expect(repository.findOneByCondition(condition)).rejects.toThrow('Database error');
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({ where: condition });
    });

    it('should handle invalid condition', async () => {
      const invalidCondition: Record<string, unknown> = { invalidField: 'value' };
      const dbError = new Error('Invalid condition');
      mockPrismaService.user.findFirst.mockRejectedValueOnce(dbError);
      await expect(repository.findOneByCondition(invalidCondition)).rejects.toThrow(
        'Invalid condition',
      );
      expect(prismaService.user.findFirst).toHaveBeenCalledWith({ where: invalidCondition });
    });
  });
});
