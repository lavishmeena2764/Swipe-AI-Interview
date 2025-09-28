import { Redis } from '@upstash/redis'
import { Session } from "../models/candidate";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const storage = {
  async saveSession(id: string, session: Session): Promise<void> {
    await redis.set(`session:${id}`,session);
  },
  async getSession(id: string): Promise<Session | null> {
    const data = await redis.get<Session>(`session:${id}`);
    if (!data) {
      return null;
    }
    return data;
  },

  async listSessions(): Promise<Session[]> {
    const keys = await redis.keys('session:*');
    if (keys.length === 0) {
      return [];
    }
    const sessions = await redis.mget<Session[]>(...keys);
    return sessions;
  },

  async deleteSession(id: string): Promise<void> {
    await redis.del(`session:${id}`);
  },
};