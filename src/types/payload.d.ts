// src/types/payload.d.ts
import { User as DefaultUser } from 'payload/auth';

declare module 'payload' {
  export interface User extends DefaultUser {
    xp?: number;
    xpSpent?: number;
    xpEarnedThisWeek?: number;
    lastXPUpdateAt?: string;
    level?: number;
  }

  export interface Collections {
    users: User; // ✅ binds your 'users' slug to the extended type
  }
}