export const TABLES = {
	WINES: 'wines',
	SCORING_RULES: 'scoringRules',
	INTERACTIONS: 'interactions',
	WINE_FEEDBACK: 'wineFeedback',
	AUTH_STATE: 'authState',
	IMPORT_LOGS: 'importLogs',
} as const;

export const INDEX_BY = {
	WINE_PRICE: { name: 'by_price', field: 'price' } as const,
	WINE_STOCK: { name: 'by_stock', field: 'stock' } as const,
	WINE_COLOR: { name: 'by_color', field: 'color' } as const,
	WINE_PRODUCER: { name: 'by_producer', field: 'producer' } as const,
	WINE_PRODUCER_NAME: { name: 'by_producer_name', field: 'producer' } as const,
	WINE_FLAG: { name: 'by_flag', field: 'isNewArrival' } as const,
	SCORING_RULES_PRIORITY: { name: 'by_priority', field: 'priority' } as const,
	SCORING_RULES_ACTIVE: { name: 'by_active', field: 'isActive' } as const,
	INTERACTIONS_SESSION: { name: 'by_session', field: 'sessionId' } as const,
	INTERACTIONS_DATE: { name: 'by_date', field: 'createdAt' } as const,
	INTERACTIONS_OUTCOME: { name: 'by_outcome', field: 'outcome' } as const,
	WINE_FEEDBACK_WINE: { name: 'by_wine', field: 'wineId' } as const,
	WINE_FEEDBACK_DATE: { name: 'by_date', field: 'createdAt' } as const,
	AUTH_SINGLETON: { name: 'by_singleton', field: 'singleton' } as const,
	IMPORT_LOGS_DATE: { name: 'by_date', field: 'importedAt' } as const,
} as const;
