import { z } from 'zod';

export const AIResponseSchema = z.object({
	wines: z.array(
		z.object({
			wineId: z.string(),
			confidence: z.number().min(0).max(1),
			reasoning: z.string(),
		})
	),
	queryInterpretation: z.object({
		detectedColor: z.string().optional(),
		detectedSweetness: z.string().optional(),
		detectedBody: z.string().optional(),
		detectedPriceRange: z.object({ min: z.number(), max: z.number() }).optional(),
		detectedTastingNotes: z.array(z.string()).optional(),
	}),
});

export type AIResponse = z.infer<typeof AIResponseSchema>;
