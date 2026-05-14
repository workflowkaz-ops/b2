import { createQueryExtension } from './db';

describe('Prisma slow query logging', () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset performance.now mock and spy on console.warn
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should not log when query is fast (<= 100ms)', async () => {
    const extension = createQueryExtension();
    // @ts-expect-error: Accessing internal structure for testing
    const operation = extension.query.$allModels.$allOperations;

    // Mock performance.now to simulate a fast query (e.g. 50ms)
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // start
      .mockReturnValueOnce(1050); // end

    const mockQuery = jest.fn().mockResolvedValue('result');

    const result = await operation({
      model: 'User',
      operation: 'findMany',
      args: {},
      query: mockQuery,
    });

    expect(result).toBe('result');
    expect(mockQuery).toHaveBeenCalledWith({});
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should log when query is slow (> 100ms)', async () => {
    const extension = createQueryExtension();
    // @ts-expect-error: Accessing internal structure for testing
    const operation = extension.query.$allModels.$allOperations;

    // Mock performance.now to simulate a slow query (e.g. 150ms)
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // start
      .mockReturnValueOnce(1150); // end

    const mockQuery = jest.fn().mockResolvedValue('result');

    const result = await operation({
      model: 'Post',
      operation: 'create',
      args: { data: {} },
      query: mockQuery,
    });

    expect(result).toBe('result');
    expect(mockQuery).toHaveBeenCalledWith({ data: {} });
    expect(warnSpy).toHaveBeenCalledWith('[Slow Query] Post.create took 150.00ms');
  });
});
