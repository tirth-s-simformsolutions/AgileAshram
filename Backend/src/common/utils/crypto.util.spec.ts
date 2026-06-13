import { compareHash, createHash } from './crypto.util';

// Mock crypto functions
jest.mock('crypto', () => ({
  randomBytes: jest.fn(),
  pbkdf2: jest.fn(),
  timingSafeEqual: jest.fn(),
}));

const mockRandomBytes = jest.fn();
const mockPbkdf2 = jest.fn();
const mockTimingSafeEqual = jest.fn();

// Import the mocked crypto module
const crypto = jest.requireMock('crypto');
crypto.randomBytes = mockRandomBytes;
crypto.pbkdf2 = mockPbkdf2;
crypto.timingSafeEqual = mockTimingSafeEqual;

describe('Crypto Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createHash', () => {
    it('should create hash with default iteration rounds', async () => {
      const testValue = 'password123';
      const mockSalt = 'abc123def456';
      const mockHash = 'hashedvalue123456';

      // Mock randomBytes to return a buffer that converts to our mock salt
      const mockBuffer = Buffer.from(mockSalt, 'hex');
      mockBuffer.toString = jest.fn().mockReturnValue(mockSalt);
      mockRandomBytes.mockReturnValue(mockBuffer);

      // Mock pbkdf2 to call callback with success
      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        const mockDerivedKey = Buffer.from(mockHash, 'hex');
        mockDerivedKey.toString = jest.fn().mockReturnValue(mockHash);
        setImmediate(() => callback(null, mockDerivedKey));
      });

      const result = await createHash(testValue);

      expect(mockRandomBytes).toHaveBeenCalledWith(16);
      expect(mockPbkdf2).toHaveBeenCalledWith(
        testValue,
        mockSalt,
        100000, // default iteration rounds
        64,
        'sha512',
        expect.any(Function),
      );
      expect(result).toBe(`${mockHash}.${mockSalt}`);
    });

    it('should create hash with custom iteration rounds', async () => {
      const testValue = 'password123';
      const customIterations = 50000;
      const mockSalt = 'customsalt123';
      const mockHash = 'customhash456';

      const mockBuffer = Buffer.from(mockSalt, 'hex');
      mockBuffer.toString = jest.fn().mockReturnValue(mockSalt);
      mockRandomBytes.mockReturnValue(mockBuffer);

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        const mockDerivedKey = Buffer.from(mockHash, 'hex');
        mockDerivedKey.toString = jest.fn().mockReturnValue(mockHash);
        setImmediate(() => callback(null, mockDerivedKey));
      });

      const result = await createHash(testValue, customIterations);

      expect(mockPbkdf2).toHaveBeenCalledWith(
        testValue,
        mockSalt,
        customIterations,
        64,
        'sha512',
        expect.any(Function),
      );
      expect(result).toBe(`${mockHash}.${mockSalt}`);
    });

    it('should reject when pbkdf2 fails', async () => {
      const testValue = 'password123';
      const mockError = new Error('Crypto operation failed');

      const mockBuffer = Buffer.from('salt123', 'hex');
      mockBuffer.toString = jest.fn().mockReturnValue('salt123');
      mockRandomBytes.mockReturnValue(mockBuffer);

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(mockError, Buffer.alloc(0)));
      });

      await expect(createHash(testValue)).rejects.toThrow('Crypto operation failed');
    });

    it('should call randomBytes with correct length and format', async () => {
      const testValue = 'test';
      const mockSalt = 'testsalt';

      const mockBuffer = Buffer.from(mockSalt, 'hex');
      mockBuffer.toString = jest.fn().mockReturnValue(mockSalt);
      mockRandomBytes.mockReturnValue(mockBuffer);

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        const mockDerivedKey = Buffer.from('hash', 'hex');
        mockDerivedKey.toString = jest.fn().mockReturnValue('hash');
        setImmediate(() => callback(null, mockDerivedKey));
      });

      await createHash(testValue);

      expect(mockRandomBytes).toHaveBeenCalledWith(16);
      expect(mockBuffer.toString).toHaveBeenCalledWith('hex');
    });
  });

  describe('compareHash', () => {
    it('should return true for matching hash and value', async () => {
      const testValue = 'password123';
      const testHash = 'hash123';
      const testSalt = 'salt456';
      const hashedValue = `${testHash}.${testSalt}`;

      const mockDerivedKey = Buffer.from(testHash, 'hex');

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(null, mockDerivedKey));
      });

      // Mock Buffer.from calls
      jest
        .spyOn(Buffer, 'from')
        .mockReturnValueOnce(Buffer.from(testHash, 'hex'))
        .mockReturnValueOnce(mockDerivedKey);

      mockTimingSafeEqual.mockReturnValue(true);

      const result = await compareHash(testValue, hashedValue);

      expect(mockPbkdf2).toHaveBeenCalledWith(
        testValue,
        testSalt,
        100000,
        64,
        'sha512',
        expect.any(Function),
      );
      expect(mockTimingSafeEqual).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for non-matching hash and value', async () => {
      const testValue = 'password123';
      const testHash = 'hash123';
      const testSalt = 'salt456';
      const hashedValue = `${testHash}.${testSalt}`;

      const mockDerivedKey = Buffer.from('differenthash', 'hex');

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(null, mockDerivedKey));
      });

      jest
        .spyOn(Buffer, 'from')
        .mockReturnValueOnce(Buffer.from(testHash, 'hex'))
        .mockReturnValueOnce(mockDerivedKey);

      mockTimingSafeEqual.mockReturnValue(false);

      const result = await compareHash(testValue, hashedValue);

      expect(result).toBe(false);
    });

    it('should return false for invalid hash format (no salt)', async () => {
      const testValue = 'password123';
      const invalidHashedValue = 'hashwithoutdot';

      const result = await compareHash(testValue, invalidHashedValue);

      expect(result).toBe(false);
      expect(mockPbkdf2).not.toHaveBeenCalled();
    });

    it('should return false for invalid hash format (empty hash)', async () => {
      const testValue = 'password123';
      const invalidHashedValue = '.salt123';

      const result = await compareHash(testValue, invalidHashedValue);

      expect(result).toBe(false);
      expect(mockPbkdf2).not.toHaveBeenCalled();
    });

    it('should return false for invalid hash format (empty salt)', async () => {
      const testValue = 'password123';
      const invalidHashedValue = 'hash123.';

      const result = await compareHash(testValue, invalidHashedValue);

      expect(result).toBe(false);
      expect(mockPbkdf2).not.toHaveBeenCalled();
    });

    it('should reject when pbkdf2 fails', async () => {
      const testValue = 'password123';
      const hashedValue = 'hash123.salt456';
      const mockError = new Error('Crypto comparison failed');

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(mockError, Buffer.alloc(0)));
      });

      await expect(compareHash(testValue, hashedValue)).rejects.toThrow('Crypto comparison failed');
    });

    it('should return false when buffer lengths differ', async () => {
      const testValue = 'password123';
      const hashedValue = 'hash123.salt456';

      const mockHashBuffer = Buffer.alloc(32);
      const mockDerivedBuffer = Buffer.alloc(64);

      jest
        .spyOn(Buffer, 'from')
        .mockReturnValueOnce(mockHashBuffer)
        .mockReturnValueOnce(mockDerivedBuffer);

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(null, mockDerivedBuffer));
      });

      const result = await compareHash(testValue, hashedValue);

      expect(result).toBe(false);
      expect(mockTimingSafeEqual).not.toHaveBeenCalled();
    });

    it('should return false when timingSafeEqual throws an error', async () => {
      const testValue = 'password123';
      const hashedValue = 'hash123.salt456';

      const mockHashBuffer = Buffer.from('hash123', 'hex');
      const mockDerivedBuffer = Buffer.from('hash123', 'hex');

      jest
        .spyOn(Buffer, 'from')
        .mockReturnValueOnce(mockHashBuffer)
        .mockReturnValueOnce(mockDerivedBuffer);

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(null, mockDerivedBuffer));
      });

      mockTimingSafeEqual.mockImplementation(() => {
        throw new Error('Timing comparison failed');
      });

      const result = await compareHash(testValue, hashedValue);

      expect(result).toBe(false);
    });

    it('should use custom iteration rounds', async () => {
      const testValue = 'password123';
      const hashedValue = 'hash123.salt456';
      const customIterations = 50000;

      const mockHashBuffer = Buffer.from('hash123', 'hex');
      const mockDerivedBuffer = Buffer.from('hash123', 'hex');

      jest
        .spyOn(Buffer, 'from')
        .mockReturnValueOnce(mockHashBuffer)
        .mockReturnValueOnce(mockDerivedBuffer);

      mockPbkdf2.mockImplementation((value, salt, iterations, keylen, digest, callback) => {
        setImmediate(() => callback(null, mockDerivedBuffer));
      });

      mockTimingSafeEqual.mockReturnValue(true);

      await compareHash(testValue, hashedValue, customIterations);

      expect(mockPbkdf2).toHaveBeenCalledWith(
        testValue,
        'salt456',
        customIterations,
        64,
        'sha512',
        expect.any(Function),
      );
    });
  });
});
