export interface Message {
	role: 'system' | 'user' | 'model';
	content: string;
}

export interface GenerationUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

export interface GenerateTextResult {
	text: string;
	usage: GenerationUsage;
}

export interface GenerateStructuredResult<T> {
	data: T;
	usage: GenerationUsage;
}

export interface StreamChunk {
	text: string;
	done: boolean;
}

export interface AIClient {
	generateText(
		messages: Message[],
		temperature?: number,
		maxTokens?: number
	): Promise<GenerateTextResult>;
	generateStructured<T>(
		messages: Message[],
		schema: unknown,
		temperature?: number,
		maxTokens?: number
	): Promise<GenerateStructuredResult<T>>;
	generateStream(
		messages: Message[],
		temperature?: number,
		maxTokens?: number
	): AsyncIterable<StreamChunk>;
	generateEmbedding(text: string): Promise<number[]>;
}
