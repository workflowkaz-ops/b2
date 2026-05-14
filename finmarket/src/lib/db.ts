import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
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
