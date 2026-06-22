import { ConvexHttpClient } from 'convex/browser';
import { env } from '$env/dynamic/public';
import { api as database } from '../../../convex/_generated/api';

const CONVEX_URL = env.PUBLIC_CONVEX_URL;
if (!CONVEX_URL) throw new Error('Missing PUBLIC_CONVEX_URL environment variable');

export function convexHttpCallout(): ConvexHttpClient {
	return new ConvexHttpClient(CONVEX_URL);
}

export { database };
