import { Public } from './public.decorator';

describe('Public Decorator', () => {
  it('should return a CustomDecorator', () => {
    const result = Public();
    expect(typeof result).toBe('function');
  });
});
