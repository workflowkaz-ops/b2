import Ably from 'ably';

const ABLY_API_KEY = process.env.ABLY_API_KEY || '';

let ablyInstance: Ably.Realtime | null = null;

export const getAblyClient = () => {
  if (typeof window === 'undefined') {
    // В Node.js (API Routes) мы можем использовать REST или Realtime.
    // Для отправки сообщений из API предпочтительнее REST клиент, но так как ably ^2.x:
    if (!ablyInstance) {
       ablyInstance = new Ably.Realtime({ key: ABLY_API_KEY });
    }
    return ablyInstance;
  }

  if (!ablyInstance) {
    ablyInstance = new Ably.Realtime({ key: ABLY_API_KEY });
  }
  return ablyInstance;
};
