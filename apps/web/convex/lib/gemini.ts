import type { Schema } from '@google/generative-ai';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { z } from 'zod';

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

export const DEFAULT_TEXT_MODEL = 'gemini-2.0-flash';
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-004';

function toGeminiContents(messages: Message[]) {
	const systemMessages = messages.filter((m) => m.role === 'system');
	const systemInstruction =
		systemMessages.length > 0 ? systemMessages.map((m) => m.content).join('\n\n') : undefined;

	const contents = messages
		.filter((m) => m.role !== 'system')
		.map((m) => ({
			role: m.role === 'model' ? ('model' as const) : ('user' as const),
			parts: [{ text: m.content }],
		}));

	return { systemInstruction, contents };
}

function convertZodNode(def: unknown): Record<string, unknown> {
	const d = def as Record<string, unknown>;
	switch (d.typeName) {
		case 'ZodString':
			return { type: SchemaType.STRING };
		case 'ZodNumber':
			return { type: SchemaType.NUMBER };
		case 'ZodBoolean':
			return { type: SchemaType.BOOLEAN };
		case 'ZodArray': {
			const items = convertZodNode((d.type as z.ZodType)._def);
			return { type: SchemaType.ARRAY, items };
		}
		case 'ZodObject': {
			const shape = d.shape as Record<string, z.ZodType>;
			const properties: Record<string, unknown> = {};
			const required: string[] = [];
			for (const [key, value] of Object.entries(shape)) {
				properties[key] = convertZodNode(value._def);
				if (!value.isOptional()) {
					required.push(key);
				}
			}
			return {
				type: SchemaType.OBJECT,
				properties,
				...(required.length > 0 ? { required } : {}),
			};
		}
		case 'ZodOptional':
			return convertZodNode((d.innerType as z.ZodType)._def);
		case 'ZodEnum': {
			const values = d.values as string[];
			return { type: SchemaType.STRING, enum: values };
		}
		case 'ZodLiteral':
			return { type: SchemaType.STRING, enum: [d.value] };
		case 'ZodUnion': {
			const options = d.options as z.ZodType[];
			const converted = options.map((o) => convertZodNode(o._def));
			if (converted.every((c) => c.type === SchemaType.STRING && c.enum)) {
				const allEnums = converted.flatMap((c) => c.enum as string[]);
				return { type: SchemaType.STRING, enum: allEnums };
			}
			return converted[0] ?? { type: SchemaType.STRING };
		}
		default:
			return { type: SchemaType.STRING };
	}
}

function zodToGeminiSchema(zodSchema: z.ZodType): Schema {
	return convertZodNode(zodSchema._def) as unknown as Schema;
}

export class GeminiClient {
	private genAI: GoogleGenerativeAI;
	private textModel: string;
	private embeddingModel: string;

	constructor(apiKey: string, textModel?: string, embeddingModel?: string) {
		this.genAI = new GoogleGenerativeAI(apiKey);
		this.textModel = textModel ?? DEFAULT_TEXT_MODEL;
		this.embeddingModel = embeddingModel ?? DEFAULT_EMBEDDING_MODEL;
	}

	async generateText(
		messages: Message[],
		temperature = 0.7,
		maxTokens = 2048
	): Promise<GenerateTextResult> {
		const { systemInstruction, contents } = toGeminiContents(messages);
		const model = this.genAI.getGenerativeModel({
			model: this.textModel,
			...(systemInstruction ? { systemInstruction } : {}),
		});

		const result = await model.generateContent({
			contents,
			generationConfig: { temperature, maxOutputTokens: maxTokens },
		});

		const response = result.response;
		return {
			text: response.text(),
			usage: {
				promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
				completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
				totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
			},
		};
	}

	async generateStructured<T extends z.ZodType>(
		messages: Message[],
		schema: T,
		temperature = 0.3,
		maxTokens = 4096
	): Promise<GenerateStructuredResult<z.infer<T>>> {
		const { systemInstruction, contents } = toGeminiContents(messages);
		const geminiSchema = zodToGeminiSchema(schema);

		const model = this.genAI.getGenerativeModel({
			model: this.textModel,
			...(systemInstruction ? { systemInstruction } : {}),
		});

		const result = await model.generateContent({
			contents,
			generationConfig: {
				temperature,
				maxOutputTokens: maxTokens,
				responseMimeType: 'application/json',
				responseSchema: geminiSchema,
			},
		});

		const response = result.response;
		const rawText = response.text();
		const parsed = schema.parse(JSON.parse(rawText));

		return {
			data: parsed,
			usage: {
				promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
				completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
				totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
			},
		};
	}

	async generateEmbedding(text: string): Promise<number[]> {
		const model = this.genAI.getGenerativeModel({ model: this.embeddingModel });
		const result = await model.embedContent({
			content: { role: 'user', parts: [{ text }] },
		});
		return result.embedding.values;
	}
}
