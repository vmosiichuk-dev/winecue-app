/// <reference types="@sveltejs/kit" />
/// <reference types="vite/client" />

declare global {
	namespace App {
		interface Error {
			message: string;
			code?: string;
		}
		interface Locals {
			sessionId?: string;
		}
		interface PageData {}
		interface PageState {}
		interface Platform {}
	}
}

export {};
