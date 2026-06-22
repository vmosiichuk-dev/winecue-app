import { z } from 'zod';

export const RuleOperator = z.enum(['eq', 'lt', 'gt', 'lte', 'gte', 'in']);
export const RuleActionType = z.enum(['adjust_score', 'filter_out', 'boost_priority']);
export const RuleTarget = z.enum([
	'base_score',
	'margin_boost',
	'new_arrival_boost',
	'clearance_boost',
]);

export const ScoringRuleSchema = z.object({
	id: z.string(),
	name: z.string().min(1).describe('Human-readable rule name'),
	condition: z.object({
		field: z.string().describe('e.g., "wine.stock", "query.price_max", "customer.type"'),
		operator: RuleOperator,
		value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string())]),
	}),
	action: z.object({
		type: RuleActionType,
		target: RuleTarget,
		value: z.number().describe('Points adjustment or multiplier'),
	}),
	priority: z.number().int().default(0).describe('Higher = evaluated first'),
	isActive: z.boolean().default(true),
	createdAt: z.number(),
});

export type ScoringRule = z.infer<typeof ScoringRuleSchema>;
export type RuleOperatorType = z.infer<typeof RuleOperator>;
export type RuleActionTypeValue = z.infer<typeof RuleActionType>;
export type RuleTargetValue = z.infer<typeof RuleTarget>;
