import { PrismaClient } from '@prisma/client';

export const createQueryExtension = () => ({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }: { model: string, operation: string, args: any, query: (args: any) => Promise<any> }) {
        const start = performance.now();
        const result = await query(args);
        const end = performance.now();
        const duration = end - start;

        // Automatically log slow queries (> 100ms)
        if (duration > 100) {
          console.warn(`[Slow Query] ${model}.${operation} took ${duration.toFixed(2)}ms`);
        }

        return result;
      },
    },
  },
});

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(createQueryExtension());
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
