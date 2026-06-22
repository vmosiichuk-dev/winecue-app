import { z } from 'zod';

export const AuthStateSchema = z.object({
	id: z.string(),
	pinHash: z.string().describe('Bcrypt hash of 4–6 digit PIN'),
	lastAuthenticated: z.number().optional(),
	failedAttempts: z.number().default(0),
	lockedUntil: z.number().optional().describe('Unix timestamp'),
});

export type AuthState = z.infer<typeof AuthStateSchema>;
