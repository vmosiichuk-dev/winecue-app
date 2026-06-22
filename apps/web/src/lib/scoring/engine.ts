import type { Wine } from '@winecue/shared-types';

interface RuleCondition {
	field: string;
	operator: 'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in';
	value: string | number | boolean | string[];
}

interface RuleAction {
	type: 'adjust_score' | 'filter_out' | 'boost_priority';
	target: 'base_score' | 'margin_boost' | 'new_arrival_boost' | 'clearance_boost';
	value: number;
}

export interface ScoringRule {
	_id: string;
	name: string;
	condition: RuleCondition;
	action: RuleAction;
	priority: number;
	isActive: boolean;
	createdAt: number;
}

export interface WineScoreContext {
	wine: Wine;
	query?: {
		priceMin?: number;
		priceMax?: number;
		color?: string;
		sweetness?: string;
		body?: string;
	};
}

export interface ScoreBreakdown {
	baseScore: number;
	marginBoost: number;
	newArrivalBoost: number;
	clearanceBoost: number;
	finalScore: number;
}

export interface ScoredWine extends Wine {
	scoreBreakdown: ScoreBreakdown;
	filtered: boolean;
}

function resolveField(ctx: WineScoreContext, fieldPath: string): unknown {
	const fieldMap: Record<string, unknown> = {
		'wine.name': ctx.wine.name,
		'wine.producer': ctx.wine.producer,
		'wine.price': ctx.wine.price,
		'wine.stock': ctx.wine.stock,
		'wine.costPrice': ctx.wine.costPrice,
		'wine.marginPercent': ctx.wine.marginPercent,
		'wine.color': ctx.wine.color,
		'wine.sweetness': ctx.wine.sweetness,
		'wine.body': ctx.wine.body,
		'wine.vintage': ctx.wine.vintage,
		'wine.isNewArrival': ctx.wine.isNewArrival,
		'wine.isClearance': ctx.wine.isClearance,
		'wine.isPriorityStock': ctx.wine.isPriorityStock,
		'query.priceMin': ctx.query?.priceMin,
		'query.price_min': ctx.query?.priceMin,
		'query.priceMax': ctx.query?.priceMax,
		'query.price_max': ctx.query?.priceMax,
		'query.color': ctx.query?.color,
		'query.sweetness': ctx.query?.sweetness,
		'query.body': ctx.query?.body,
	};
	return fieldMap[fieldPath];
}

function evaluateCondition(condition: RuleCondition, ctx: WineScoreContext): boolean {
	const fieldValue = resolveField(ctx, condition.field);
	if (fieldValue === undefined || fieldValue === null) return false;

	const { operator, value } = condition;

	switch (operator) {
		case 'eq':
			return fieldValue === value;
		case 'lt':
		case 'gt':
		case 'lte':
		case 'gte': {
			if (typeof fieldValue !== 'number' || typeof value !== 'number') {
				return false;
			}
			if (operator === 'lt') return fieldValue < value;
			if (operator === 'gt') return fieldValue > value;
			if (operator === 'lte') return fieldValue <= value;
			return fieldValue >= value;
		}
		case 'in':
			return Array.isArray(value) && typeof fieldValue === 'string' && value.includes(fieldValue);
		default:
			return false;
	}
}

const STOCK_BONUSES = [
	{ threshold: 10, bonus: 10 },
	{ threshold: 5, bonus: 5 },
	{ threshold: 0, bonus: 2 },
];

const MARGIN_BONUSES = [
	{ threshold: 40, bonus: 10 },
	{ threshold: 25, bonus: 5 },
];

function computeBaseScore(wine: Wine): number {
	let score = 50;

	for (const { threshold, bonus } of STOCK_BONUSES) {
		if (wine.stock > threshold) {
			score += bonus;
			break;
		}
	}

	for (const { threshold, bonus } of MARGIN_BONUSES) {
		if (wine.marginPercent && wine.marginPercent > threshold) {
			score += bonus;
			break;
		}
	}

	if (wine.description && wine.description.length > 50) score += 5;
	if (wine.structuredDimensions) score += 5;
	if (wine.tastingNotes.length > 0) score += 3;

	return Math.min(100, score);
}

export function applyScoringRules(
	wines: Wine[],
	rules: ScoringRule[],
	query?: WineScoreContext['query']
): ScoredWine[] {
	const activeRules = rules.filter((r) => r.isActive).sort((a, b) => b.priority - a.priority);

	return wines.map((wine) => {
		const ctx: WineScoreContext = { wine, query };
		const breakdown: ScoreBreakdown = {
			baseScore: computeBaseScore(wine),
			marginBoost: 0,
			newArrivalBoost: 0,
			clearanceBoost: 0,
			finalScore: 0,
		};

		let filtered = false;

		for (const rule of activeRules) {
			if (!evaluateCondition(rule.condition, ctx)) continue;

			switch (rule.action.type) {
				case 'filter_out':
					filtered = true;
					break;
				case 'adjust_score':
				case 'boost_priority': {
					const boost = rule.action.value;
					switch (rule.action.target) {
						case 'base_score':
							breakdown.baseScore += boost;
							break;
						case 'margin_boost':
							breakdown.marginBoost += boost;
							break;
						case 'new_arrival_boost':
							breakdown.newArrivalBoost += boost;
							break;
						case 'clearance_boost':
							breakdown.clearanceBoost += boost;
							break;
					}
					break;
				}
			}
		}

		if (wine.isNewArrival) breakdown.newArrivalBoost += 5;
		if (wine.isClearance) breakdown.clearanceBoost += 8;
		if (wine.marginPercent && wine.marginPercent > 35) breakdown.marginBoost += 3;

		breakdown.finalScore = Math.max(
			0,
			Math.min(
				100,
				breakdown.baseScore +
					breakdown.marginBoost +
					breakdown.newArrivalBoost +
					breakdown.clearanceBoost
			)
		);

		return { ...wine, scoreBreakdown: breakdown, filtered };
	});
}
