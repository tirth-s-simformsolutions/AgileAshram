import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UserStatus } from '@prisma/client';
import { Response } from 'express';
import * as utils from '../../common/utils';
import { UserRepository } from '../user/user.repository';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, SignupDto } from './dtos';
import { SUCCESS_MSG } from './messages';

// Mock the utils module
jest.mock('../../common/utils', () => ({
  handleError: jest.fn(error => {
    throw error;
  }),
  compareHash: jest.fn(),
  createHash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let mockResponse: Partial<Response>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        'jwt.accessToken.secretKey': 'test-access-secret',
        'jwt.refreshToken.secretKey': 'test-refresh-secret',
        'jwt.accessToken.expire': '15m',
        'jwt.refreshToken.expire': '7d',
      };
      return config[key];
    }),
  };

  const mockUserRepository = {
    createUser: jest.fn(),
    findUserById: jest.fn(),
    findOneByCondition: jest.fn(),
    updateUserById: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);

    // Mock Express Response
    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    const signupDto: SignupDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashed_password_123';
      const createdUser = {
        id: 1,
        email: signupDto.email,
        name: signupDto.name,
      };
      const userInfo = { id: 1, email: signupDto.email, name: signupDto.name };
      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_123';

      // Mock dependencies
      mockUserRepository.findOneByCondition.mockResolvedValue(null); // User doesn't exist
      (utils.createHash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.createUser.mockResolvedValue(createdUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);
      mockUserRepository.findUserById.mockResolvedValueOnce(userInfo);

      const result = await service.signup(signupDto, mockResponse as Response);

      expect(userRepository.findOneByCondition).toHaveBeenCalledWith({
        email: signupDto.email,
      });
      expect(utils.createHash).toHaveBeenCalledWith(signupDto.password);
      expect(userRepository.createUser).toHaveBeenCalledWith({
        email: signupDto.email,
        password: hashedPassword,
        name: signupDto.name,
        status: UserStatus.active,
      });
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({
        userInfo,
      });
      expect(result.message).toBe(SUCCESS_MSG.USER.CREATED);
      expect(result.statusCode).toBe(201);
    });

    it('should throw ConflictException if user already exists', async () => {
      const existingUser = { id: 1, email: signupDto.email };
      mockUserRepository.findOneByCondition.mockResolvedValue(existingUser);

      await expect(service.signup(signupDto, mockResponse as Response)).rejects.toThrow(
        ConflictException,
      );
      expect(userRepository.findOneByCondition).toHaveBeenCalledWith({
        email: signupDto.email,
      });
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user successfully', async () => {
      const user = {
        id: 1,
        email: loginDto.email,
        password: 'hashed_password',
        status: UserStatus.active,
      };
      const accessToken = 'access_token_123';
      const refreshToken = 'refresh_token_123';
      const userInfo = { id: 1, email: loginDto.email, name: 'Test User' };

      mockUserRepository.findOneByCondition.mockResolvedValue(user);
      (utils.compareHash as jest.Mock).mockResolvedValue(true);
      mockJwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);
      mockUserRepository.findUserById.mockResolvedValue(userInfo);

      const result = await service.login(loginDto, mockResponse as Response);

      expect(userRepository.findOneByCondition).toHaveBeenCalledWith({
        email: loginDto.email,
      });
      expect(utils.compareHash).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result.data).toEqual({
        userInfo,
      });
      expect(result.message).toBe(SUCCESS_MSG.USER.LOGIN);
    });

    it('should throw BadRequestException for invalid credentials', async () => {
      mockUserRepository.findOneByCondition.mockResolvedValue(null);

      await expect(service.login(loginDto, mockResponse as Response)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for wrong password', async () => {
      const user = {
        id: 1,
        email: loginDto.email,
        password: 'hashed_password',
        status: UserStatus.active,
      };

      mockUserRepository.findOneByCondition.mockResolvedValue(user);
      (utils.compareHash as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto, mockResponse as Response)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw UnprocessableEntityException for inactive user', async () => {
      const user = {
        id: 1,
        email: loginDto.email,
        password: 'hashed_password',
        status: UserStatus.deactive,
      };

      mockUserRepository.findOneByCondition.mockResolvedValue(user);
      (utils.compareHash as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto, mockResponse as Response)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });

  describe('validateUserBeforeCreate', () => {
    it('should not throw error if user does not exist', async () => {
      mockUserRepository.findOneByCondition.mockResolvedValue(null);

      await expect(
        service.validateUserBeforeCreate({ email: 'test@example.com' }),
      ).resolves.not.toThrow();
    });

    it('should throw ConflictException if user exists', async () => {
      const existingUser = { id: 1, email: 'test@example.com' };
      mockUserRepository.findOneByCondition.mockResolvedValue(existingUser);

      await expect(service.validateUserBeforeCreate({ email: 'test@example.com' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getTokenExpiry', () => {
    it('should convert minutes correctly', () => {
      const result = service['getTokenExpiry']('15m');
      expect(result).toBe(15 * 60 * 1000);
    });

    it('should convert hours correctly', () => {
      const result = service['getTokenExpiry']('2h');
      expect(result).toBe(2 * 60 * 60 * 1000);
    });

    it('should convert days correctly', () => {
      const result = service['getTokenExpiry']('7d');
      expect(result).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should handle numeric values', () => {
      const result = service['getTokenExpiry'](3600);
      expect(result).toBe(3600 * 1000);
    });

    it('should handle invalid units by returning default expiry', () => {
      const result = service['getTokenExpiry']('10z');
      expect(result).toBe(15 * 60 * 1000); // default 15 minutes
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid_refresh_token';

    it('should refresh tokens successfully', async () => {
      const tokenData = { userId: '1' };
      const userInfo = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        status: UserStatus.active,
      };
      const newAccessToken = 'new_access_token';
      const newRefreshToken = 'new_refresh_token';

      mockJwtService.verifyAsync.mockResolvedValue(tokenData);
      mockUserRepository.findUserById.mockResolvedValue(userInfo);
      mockJwtService.signAsync
        .mockResolvedValueOnce(newAccessToken)
        .mockResolvedValueOnce(newRefreshToken);

      const result = await service.refreshToken(refreshToken, mockResponse as Response);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: 'test-refresh-secret',
      });
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith('1');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result.message).toBe(SUCCESS_MSG.USER.REFRESH_TOKEN);
      expect(result.data).toBeNull();
    });

    it('should throw UnauthorizedException for missing token', async () => {
      await expect(service.refreshToken('', mockResponse as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshToken(refreshToken, mockResponse as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for TokenExpiredError', async () => {
      const tokenExpiredError = new Error('jwt expired');
      tokenExpiredError.name = 'TokenExpiredError';
      mockJwtService.verifyAsync.mockRejectedValue(tokenExpiredError);

      await expect(service.refreshToken(refreshToken, mockResponse as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for JsonWebTokenError', async () => {
      const jsonWebTokenError = new Error('invalid token');
      jsonWebTokenError.name = 'JsonWebTokenError';
      mockJwtService.verifyAsync.mockRejectedValue(jsonWebTokenError);

      await expect(service.refreshToken(refreshToken, mockResponse as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for missing userId in token payload', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({});

      await expect(service.refreshToken(refreshToken, mockResponse as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const tokenData = { userId: '1' };
      const userInfo = {
        id: '1',
        status: UserStatus.deactive,
      };

      mockJwtService.verifyAsync.mockResolvedValue(tokenData);
      mockUserRepository.findUserById.mockResolvedValue(userInfo);

      await expect(service.refreshToken(refreshToken, mockResponse as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await service.logout(mockResponse as Response);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result.message).toBe(SUCCESS_MSG.USER.LOGOUT);
      expect(result.data).toBeNull();
    });

    it('should handle errors during logout', async () => {
      // Mock clearCookie to throw an error
      const mockError = new Error('Cookie clearing error');
      (mockResponse.clearCookie as jest.Mock).mockImplementationOnce(() => {
        throw mockError;
      });

      // Spy on handleError function
      const handleErrorSpy = jest.spyOn(utils, 'handleError');

      await expect(service.logout(mockResponse as Response)).rejects.toThrow();

      // Verify handleError was called with the thrown error
      expect(handleErrorSpy).toHaveBeenCalledWith(mockError);
    });
  });

  describe('changePassword', () => {
    const userId = '1';
    const changePasswordDto: ChangePasswordDto = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    it('should change password successfully', async () => {
      const userInfo = { password: 'hashed_old_password' };
      const newPasswordHash = 'hashed_new_password';

      mockUserRepository.findUserById.mockResolvedValue(userInfo);
      (utils.compareHash as jest.Mock).mockResolvedValue(true);
      (utils.createHash as jest.Mock).mockResolvedValue(newPasswordHash);

      const result = await service.changePassword(userId, changePasswordDto);

      expect(mockUserRepository.findUserById).toHaveBeenCalledWith(userId, {
        password: true,
      });
      expect(utils.compareHash).toHaveBeenCalledWith(
        changePasswordDto.oldPassword,
        userInfo.password,
      );
      expect(utils.createHash).toHaveBeenCalledWith(changePasswordDto.newPassword);
      expect(mockUserRepository.updateUserById).toHaveBeenCalledWith(userId, {
        password: newPasswordHash,
      });
      expect(result.message).toBe(SUCCESS_MSG.USER.CHANGE_PASSWORD);
    });

    it('should throw BadRequestException for same password', async () => {
      const samePasswordDto = {
        oldPassword: 'samePassword123',
        newPassword: 'samePassword123',
      };

      await expect(service.changePassword(userId, samePasswordDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException for invalid old password', async () => {
      const userInfo = { password: 'hashed_old_password' };

      mockUserRepository.findUserById.mockResolvedValue(userInfo);
      (utils.compareHash as jest.Mock).mockResolvedValue(false);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateAccessToken', () => {
    const accessToken = 'valid_access_token';

    it('should validate access token successfully', async () => {
      const tokenData = { userId: '1' };
      const userInfo = {
        id: '1',
        name: 'Test User',
        status: UserStatus.active,
      };

      mockJwtService.verifyAsync.mockResolvedValue(tokenData);
      mockUserRepository.findUserById.mockResolvedValue(userInfo);

      const result = await service.validateAccessToken(accessToken);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(accessToken, {
        secret: 'test-access-secret',
      });
      expect(mockUserRepository.findUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        userId: '1',
        name: 'Test User',
      });
    });

    it('should throw UnauthorizedException for missing token', async () => {
      await expect(service.validateAccessToken('')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.validateAccessToken(accessToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for TokenExpiredError', async () => {
      const tokenExpiredError = new Error('jwt expired');
      tokenExpiredError.name = 'TokenExpiredError';
      mockJwtService.verifyAsync.mockRejectedValue(tokenExpiredError);

      await expect(service.validateAccessToken(accessToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for JsonWebTokenError', async () => {
      const jsonWebTokenError = new Error('invalid token');
      jsonWebTokenError.name = 'JsonWebTokenError';
      mockJwtService.verifyAsync.mockRejectedValue(jsonWebTokenError);

      await expect(service.validateAccessToken(accessToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for missing userId in token payload', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({});

      await expect(service.validateAccessToken(accessToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      const tokenData = { userId: '1' };

      mockJwtService.verifyAsync.mockResolvedValue(tokenData);
      mockUserRepository.findUserById.mockResolvedValue(null);

      await expect(service.validateAccessToken(accessToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const tokenData = { userId: '1' };
      const userInfo = {
        id: '1',
        name: 'Test User',
        status: UserStatus.deactive,
      };

      mockJwtService.verifyAsync.mockResolvedValue(tokenData);
      mockUserRepository.findUserById.mockResolvedValue(userInfo);

      await expect(service.validateAccessToken(accessToken)).rejects.toThrow(UnauthorizedException);
    });
  });
});
