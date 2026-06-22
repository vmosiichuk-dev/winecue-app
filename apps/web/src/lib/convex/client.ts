import { ConvexClient } from 'convex/browser';
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server';
import { getContext, setContext } from 'svelte';
import { type Readable, readable } from 'svelte/store';

const CONVEX_CONTEXT_KEY = 'convex-client';

let client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient {
	if (!client) {
		const url = import.meta.env.PUBLIC_CONVEX_URL;
		if (!url) {
			throw new Error('PUBLIC_CONVEX_URL environment variable is not set');
		}
		client = new ConvexClient(url);
	}
	return client;
}

export function setConvexContext(): ConvexClient {
	const client = getConvexClient();
	setContext(CONVEX_CONTEXT_KEY, client);
	return client;
}

export function useConvexClient(): ConvexClient {
	return getContext<ConvexClient>(CONVEX_CONTEXT_KEY);
}

export function convexQuery<Query extends FunctionReference<'query'>>(
	queryRef: Query,
	args: FunctionArgs<Query>
): Readable<FunctionReturnType<Query> | undefined> {
	const client = getConvexClient();
	return readable<FunctionReturnType<Query> | undefined>(undefined, (set) => {
		return client.onUpdate(queryRef, args, (data) => {
			set(data);
		});
	});
}
