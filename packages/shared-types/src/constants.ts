export const WINE_COLOR = {
	RED: 'red',
	WHITE: 'white',
	ROSE: 'rose',
	SPARKLING: 'sparkling',
	FORTIFIED: 'fortified',
	SPIRIT: 'spirit',
} as const;

export const WINE_SWEETNESS = {
	DRY: 'dry',
	SEMI_DRY: 'semi_dry',
	SEMI_SWEET: 'semi_sweet',
	SWEET: 'sweet',
} as const;

export const WINE_BODY = {
	LIGHT: 'light',
	MEDIUM: 'medium',
	FULL: 'full',
} as const;

export const DATA_PROVENANCE = {
	T1_PRODUCER: 't1_producer',
	T2_INFERRED: 't2_inferred',
	T3_WORDPRESS: 't3_wordpress',
} as const;

export const RULE_OPERATOR = {
	EQ: 'eq',
	LT: 'lt',
	GT: 'gt',
	GTE: 'gte',
	LTE: 'lte',
	IN: 'in',
} as const;

export const RULE_ACTION_TYPE = {
	ADJUST_SCORE: 'adjust_score',
	FILTER_OUT: 'filter_out',
	BOOST_PRIORITY: 'boost_priority',
} as const;

export const RULE_TARGET = {
	BASE_SCORE: 'base_score',
	MARGIN_BOOST: 'margin_boost',
	NEW_ARRIVAL_BOOST: 'new_arrival_boost',
	CLEARANCE_BOOST: 'clearance_boost',
} as const;

export const INTERACTION_OUTCOME = {
	SOLD: 'sold',
	DECLINED: 'declined',
	ESCALATED: 'escalated',
	ABANDONED: 'abandoned',
} as const;
