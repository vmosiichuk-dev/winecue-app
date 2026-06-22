import { z } from 'zod';

export const AuthStateSchema = z.object({
	id: z.string(),
	pinHash: z.string().describe('Bcrypt hash of 4–6 digit PIN'),
	lastAuthenticated: z.number().int().nonnegative().optional(),
	failedAttempts: z.number().int().nonnegative().default(0),
	lockedUntil: z.number().int().nonnegative().optional().describe('Unix timestamp'),
});

export type AuthState = z.infer<typeof AuthStateSchema>;
