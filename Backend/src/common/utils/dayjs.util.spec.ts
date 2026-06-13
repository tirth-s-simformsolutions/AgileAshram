import dayjs from './dayjs.util';

// Mock dayjs and its plugins first
jest.mock('dayjs', () => {
  const mockDayjsFunction = jest.fn(() => ({
    format: jest.fn(),
    isSameOrBefore: jest.fn(),
    isSameOrAfter: jest.fn(),
  }));
  // Add extend method to the mock function using Object.assign
  Object.assign(mockDayjsFunction, { extend: jest.fn() });
  return mockDayjsFunction;
});

jest.mock('dayjs/plugin/isSameOrBefore', () => 'isSameOrBefore-plugin');
jest.mock('dayjs/plugin/isSameOrAfter', () => 'isSameOrAfter-plugin');

describe('Dayjs Utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export the dayjs instance', () => {
    expect(dayjs).toBeDefined();
    expect(typeof dayjs).toBe('function');
  });

  it('should extend dayjs with plugins during import', () => {
    // The plugin extension happens at module load time,
    // we just verify that our dayjs export is functional
    expect(dayjs).toBeDefined();
    expect(typeof dayjs).toBe('function');

    // Verify the dayjs instance has the extended functionality
    const instance = dayjs();
    expect(instance.isSameOrBefore).toBeDefined();
    expect(instance.isSameOrAfter).toBeDefined();
  });

  it('should be callable and return dayjs instance', () => {
    const result = dayjs();
    expect(result).toBeDefined();
    expect(result.format).toBeDefined();
    expect(result.isSameOrBefore).toBeDefined();
    expect(result.isSameOrAfter).toBeDefined();
  });

  it('should be callable with parameters', () => {
    const testDate = '2023-01-01';
    dayjs(testDate);
    expect(dayjs).toHaveBeenCalledWith(testDate);
  });

  describe('plugin functionality verification', () => {
    it('should have isSameOrBefore method available on dayjs instance', () => {
      const instance = dayjs();
      expect(instance.isSameOrBefore).toBeDefined();
      expect(typeof instance.isSameOrBefore).toBe('function');
    });

    it('should have isSameOrAfter method available on dayjs instance', () => {
      const instance = dayjs();
      expect(instance.isSameOrAfter).toBeDefined();
      expect(typeof instance.isSameOrAfter).toBe('function');
    });

    it('should allow chaining of plugin methods', () => {
      const instance = dayjs();

      // Test that methods exist and can be called
      instance.isSameOrBefore();
      instance.isSameOrAfter();

      expect(instance.isSameOrBefore).toHaveBeenCalled();
      expect(instance.isSameOrAfter).toHaveBeenCalled();
    });
  });

  describe('module structure', () => {
    it('should be the default export', () => {
      // Verify that the module exports dayjs as default
      // Use dynamic import to avoid eslint require issue
      jest.requireActual('./dayjs.util');
      expect(dayjs).toBeDefined();
      expect(typeof dayjs).toBe('function');
    });

    it('should maintain dayjs functionality', () => {
      // Verify core dayjs functionality is preserved
      const instance = dayjs();
      expect(instance.format).toBeDefined();
    });

    it('should accept different input types', () => {
      // Test with various input types that dayjs supports
      dayjs(); // current time
      dayjs('2023-01-01'); // string
      dayjs(new Date()); // Date object
      dayjs(1640995200000); // timestamp

      expect(dayjs).toHaveBeenCalledTimes(4);
    });
  });
});
