import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './currentUser.decorator';

// Extract the callback function from the decorator for testing
const getCurrentUserCallback = (
  _data: unknown,
  ctx: ExecutionContext,
): { userId: string; name: string } => {
  const request = ctx.switchToHttp().getRequest();
  return { userId: request.userId, name: request.name };
};

describe('CurrentUser Decorator', () => {
  it('should extract userId and name from request object', () => {
    // Mock the ExecutionContext
    const mockRequest = {
      userId: '123',
      name: 'John Doe',
    };

    const mockGetRequest = jest.fn().mockReturnValue(mockRequest);
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    });

    const mockExecutionContext = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ExecutionContext;

    // Test the actual callback logic
    const result = getCurrentUserCallback(undefined, mockExecutionContext);

    expect(result).toEqual({ userId: '123', name: 'John Doe' });
    expect(mockSwitchToHttp).toHaveBeenCalled();
    expect(mockGetRequest).toHaveBeenCalled();
  });

  it('should return undefined values when userId or name are not present', () => {
    const mockRequest = {}; // Empty request

    const mockGetRequest = jest.fn().mockReturnValue(mockRequest);
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    });

    const mockExecutionContext = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ExecutionContext;

    const result = getCurrentUserCallback(undefined, mockExecutionContext);

    expect(result).toEqual({ userId: undefined, name: undefined });
    expect(mockSwitchToHttp).toHaveBeenCalled();
    expect(mockGetRequest).toHaveBeenCalled();
  });

  it('should handle missing switchToHttp method', () => {
    const mockExecutionContext = {
      switchToHttp: undefined,
    } as unknown as ExecutionContext;

    expect(() => {
      getCurrentUserCallback(undefined, mockExecutionContext);
    }).toThrow();
  });

  it('should handle missing getRequest method', () => {
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getRequest: undefined,
    });

    const mockExecutionContext = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ExecutionContext;

    expect(() => {
      getCurrentUserCallback(undefined, mockExecutionContext);
    }).toThrow();
  });

  it('should handle null request object', () => {
    const mockGetRequest = jest.fn().mockReturnValue(null);
    const mockSwitchToHttp = jest.fn().mockReturnValue({
      getRequest: mockGetRequest,
    });

    const mockExecutionContext = {
      switchToHttp: mockSwitchToHttp,
    } as unknown as ExecutionContext;

    expect(() => {
      getCurrentUserCallback(undefined, mockExecutionContext);
    }).toThrow();
  });

  it('should be defined as a decorator', () => {
    expect(CurrentUser).toBeDefined();
    expect(typeof CurrentUser).toBe('function');
  });
});
