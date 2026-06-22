import { z } from 'zod';

export const WineFeedbackSchema = z.object({
	id: z.string(),
	wineId: z.string(),
	feedback: z.string().min(1).describe('Associate note about customer reaction'),
	interactionId: z.string().optional(),
	createdAt: z.number(),
});

export type WineFeedback = z.infer<typeof WineFeedbackSchema>;
