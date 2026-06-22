import { z } from 'zod';
import { RULE_ACTION_TYPE, RULE_OPERATOR, RULE_TARGET } from './constants.js';
import { zodEnumFromConst } from './helpers.js';

export const RuleOperator = zodEnumFromConst(RULE_OPERATOR);
export const RuleActionType = zodEnumFromConst(RULE_ACTION_TYPE);
export const RuleTarget = zodEnumFromConst(RULE_TARGET);

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
