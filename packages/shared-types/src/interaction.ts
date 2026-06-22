import { z } from 'zod';
import { DataProvenance, WineBody, WineColor, WineSweetness } from './wine.js';

export const RecommendedWineSchema = z.object({
	wineId: z.string(),
	name: z.string(),
	producer: z.string(),
	price: z.number(),
	confidence: z.number().min(0).max(1),
	reasoning: z.string().describe('Why this wine was recommended'),
	provenanceTags: z.array(DataProvenance),
	scoreBreakdown: z
		.object({
			baseScore: z.number(),
			marginBoost: z.number(),
			newArrivalBoost: z.number(),
			clearanceBoost: z.number(),
			finalScore: z.number(),
		})
		.optional(),
});

export const InteractionOutcome = z.enum(['sold', 'declined', 'escalated', 'abandoned']);

export const InteractionSchema = z.object({
	id: z.string(),
	sessionId: z.string().describe('Ephemeral session UUID'),
	query: z.string().describe('Raw customer request text'),
	filters: z
		.object({
			color: WineColor.optional(),
			sweetness: WineSweetness.optional(),
			body: WineBody.optional(),
			priceMin: z.number().optional(),
			priceMax: z.number().optional(),
			tastingNotes: z.array(z.string()).optional(),
		})
		.optional(),
	recommendations: z.array(RecommendedWineSchema),
	selectedWineId: z.string().optional(),
	outcome: InteractionOutcome.optional(),
	feedback: z.string().optional().describe('Associate or customer feedback'),
	aiModel: z.string().describe('Identifier of the AI model used'),
	usedFallback: z.boolean().default(false),
	responseTimeMs: z.number().describe('Total server processing time'),
	promptTokens: z.number().optional().describe('Tokens consumed by the prompt'),
	completionTokens: z.number().optional().describe('Tokens generated in the response'),
	totalTokens: z.number().optional().describe('Total tokens consumed'),
	promptVersion: z.string().optional().describe('Version hash of the prompt template used'),
	createdAt: z.number(),
});

export type Interaction = z.infer<typeof InteractionSchema>;
export type RecommendedWine = z.infer<typeof RecommendedWineSchema>;
export type InteractionOutcomeType = z.infer<typeof InteractionOutcome>;
