import { z } from 'zod';

export const ImportLogSchema = z.object({
	id: z.string(),
	fileName: z.string(),
	rowsProcessed: z.number(),
	rowsImported: z.number(),
	rowsFailed: z.number(),
	errors: z.array(
		z.object({
			row: z.number(),
			message: z.string(),
		})
	),
	importedAt: z.number(),
});

export type ImportLog = z.infer<typeof ImportLogSchema>;
