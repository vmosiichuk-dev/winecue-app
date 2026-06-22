import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async () => {
	return json(
		{
			success: false,
			error: { code: 'NOT_IMPLEMENTED', message: 'Import endpoint not yet implemented' },
		},
		{ status: 501 }
	);
};
