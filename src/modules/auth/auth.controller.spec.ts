import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';
import { ICurrentUser } from '../../common/interfaces';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ChangePasswordDto, LoginDto, SignupDto } from './dtos';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  // Mock AuthService with all required methods
  const mockAuthService = {
    signup: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);

    // Mock Express Request and Response objects
    mockRequest = {
      cookies: {},
    };

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

    const mockSignupResponse = {
      statusCode: 201,
      message: 'User created successfully',
      data: {
        userInfo: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    };

    it('should create a new user successfully', async () => {
      // Arrange
      mockAuthService.signup.mockResolvedValue(mockSignupResponse);

      // Act
      const result = await controller.signup(signupDto, mockResponse as Response);

      // Assert
      expect(authService.signup).toHaveBeenCalledWith(signupDto, mockResponse);
      expect(authService.signup).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockSignupResponse);
    });

    it('should handle signup service errors', async () => {
      // Arrange
      const error = new Error('Email already exists');
      mockAuthService.signup.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.signup(signupDto, mockResponse as Response)).rejects.toThrow(
        'Email already exists',
      );
      expect(authService.signup).toHaveBeenCalledWith(signupDto, mockResponse);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    const mockLoginResponse = {
      statusCode: 200,
      message: 'Login successful',
      data: {
        userInfo: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
        },
      },
    };

    it('should login user successfully', async () => {
      // Arrange
      mockAuthService.login.mockResolvedValue(mockLoginResponse);

      // Act
      const result = await controller.login(loginDto, mockResponse as Response);

      // Assert
      expect(authService.login).toHaveBeenCalledWith(loginDto, mockResponse);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLoginResponse);
    });

    it('should handle login service errors', async () => {
      // Arrange
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.login(loginDto, mockResponse as Response)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(authService.login).toHaveBeenCalledWith(loginDto, mockResponse);
    });
  });

  describe('refreshToken', () => {
    const mockRefreshTokenResponse = {
      statusCode: 200,
      message: 'Tokens refreshed successfully',
      data: null,
    };

    it('should refresh tokens successfully with valid refresh token', async () => {
      // Arrange
      const refreshToken = 'valid_refresh_token_123';
      mockRequest.cookies = { refresh_token: refreshToken };
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshTokenResponse);

      // Act
      const result = await controller.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken, mockResponse);
      expect(authService.refreshToken).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockRefreshTokenResponse);
    });

    it('should handle missing refresh token in cookies', async () => {
      // Arrange
      mockRequest.cookies = {}; // No refresh token
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshTokenResponse);

      // Act
      const result = await controller.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(authService.refreshToken).toHaveBeenCalledWith(undefined, mockResponse);
      expect(result).toEqual(mockRefreshTokenResponse);
    });

    it('should handle refresh token service errors', async () => {
      // Arrange
      const refreshToken = 'invalid_refresh_token';
      mockRequest.cookies = { refresh_token: refreshToken };
      const error = new Error('Invalid refresh token');
      mockAuthService.refreshToken.mockRejectedValue(error);

      // Act & Assert
      await expect(
        controller.refreshToken(mockRequest as Request, mockResponse as Response),
      ).rejects.toThrow('Invalid refresh token');
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken, mockResponse);
    });

    it('should handle case when cookies object is undefined', async () => {
      // Arrange
      mockRequest.cookies = undefined;
      mockAuthService.refreshToken.mockResolvedValue(mockRefreshTokenResponse);

      // Act
      const result = await controller.refreshToken(
        mockRequest as Request,
        mockResponse as Response,
      );

      // Assert
      expect(authService.refreshToken).toHaveBeenCalledWith(undefined, mockResponse);
      expect(result).toEqual(mockRefreshTokenResponse);
    });
  });

  describe('logout', () => {
    const mockLogoutResponse = {
      statusCode: 200,
      message: 'Logout successful',
      data: null,
    };

    it('should logout successfully', async () => {
      // Arrange
      mockAuthService.logout.mockResolvedValue(mockLogoutResponse);

      // Act
      const result = await controller.logout(mockResponse as Response);

      // Assert
      expect(authService.logout).toHaveBeenCalledWith(mockResponse);
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLogoutResponse);
    });

    it('should handle logout service errors', async () => {
      // Arrange
      const error = new Error('Logout failed');
      mockAuthService.logout.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.logout(mockResponse as Response)).rejects.toThrow('Logout failed');
      expect(authService.logout).toHaveBeenCalledWith(mockResponse);
    });
  });

  describe('changePassword', () => {
    const mockCurrentUser: ICurrentUser = {
      userId: '1',
      name: 'Test User',
    };

    const changePasswordDto: ChangePasswordDto = {
      oldPassword: 'oldPassword123',
      newPassword: 'newPassword123',
    };

    const mockChangePasswordResponse = {
      statusCode: 200,
      message: 'Password changed successfully',
      data: null,
    };

    it('should change password successfully', async () => {
      // Arrange
      mockAuthService.changePassword.mockResolvedValue(mockChangePasswordResponse);

      // Act
      const result = await controller.changePassword(mockCurrentUser, changePasswordDto);

      // Assert
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        changePasswordDto,
      );
      expect(authService.changePassword).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockChangePasswordResponse);
    });

    it('should handle change password service errors', async () => {
      // Arrange
      const error = new Error('Old password is incorrect');
      mockAuthService.changePassword.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.changePassword(mockCurrentUser, changePasswordDto)).rejects.toThrow(
        'Old password is incorrect',
      );
      expect(authService.changePassword).toHaveBeenCalledWith(
        mockCurrentUser.userId,
        changePasswordDto,
      );
    });

    it('should handle different user IDs correctly', async () => {
      // Arrange
      const differentUser: ICurrentUser = {
        userId: '999',
        name: 'Different User',
      };
      mockAuthService.changePassword.mockResolvedValue(mockChangePasswordResponse);

      // Act
      const result = await controller.changePassword(differentUser, changePasswordDto);

      // Assert
      expect(authService.changePassword).toHaveBeenCalledWith(
        '999', // Should use the different user ID
        changePasswordDto,
      );
      expect(result).toEqual(mockChangePasswordResponse);
    });
  });

  describe('controller instantiation', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('should have authService injected', () => {
      expect(authService).toBeDefined();
      expect(authService).toBe(mockAuthService);
    });
  });
});
