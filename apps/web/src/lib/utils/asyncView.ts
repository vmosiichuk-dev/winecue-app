export type AsyncView<T> =
	| { status: 'loading' }
	| { status: 'error'; message: string }
	| { status: 'empty' }
	| { status: 'data'; value: T };

export function asyncViewFromStore<T>(
	data: T[],
	loading: boolean,
	error: string | null
): AsyncView<T[]> {
	if (loading) return { status: 'loading' };
	if (error) return { status: 'error', message: error };
	if (data.length === 0) return { status: 'empty' };
	return { status: 'data', value: data };
}

export function asyncViewFromValue<T>(
	data: T | null | undefined,
	loading: boolean,
	error: string | null
): AsyncView<T> {
	if (loading) return { status: 'loading' };
	if (error) return { status: 'error', message: error };
	if (data === null || data === undefined) return { status: 'empty' };
	return { status: 'data', value: data };
}
