import type { Doc, Id } from '../../../convex/_generated/dataModel';
import type { TABLES } from '../../../convex/tables';

export type WineId = Id<typeof TABLES.WINES>;
export type ScoringRuleId = Id<typeof TABLES.SCORING_RULES>;
export type InteractionId = Id<typeof TABLES.INTERACTIONS>;
export type WineFeedbackId = Id<typeof TABLES.WINE_FEEDBACK>;
export type AuthStateId = Id<typeof TABLES.AUTH_STATE>;
export type ImportLogId = Id<typeof TABLES.IMPORT_LOGS>;

export type ConvexDoc<ID> = {
	_id: ID;
	_creationTime: number;
};

export type WineDoc = Doc<typeof TABLES.WINES>;
export type ScoringRuleDoc = Doc<typeof TABLES.SCORING_RULES>;
export type InteractionDoc = Doc<typeof TABLES.INTERACTIONS>;
export type WineFeedbackDoc = Doc<typeof TABLES.WINE_FEEDBACK>;
export type AuthStateDoc = Doc<typeof TABLES.AUTH_STATE>;
export type ImportLogDoc = Doc<typeof TABLES.IMPORT_LOGS>;
