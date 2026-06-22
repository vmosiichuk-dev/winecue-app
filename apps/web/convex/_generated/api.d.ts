/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as feedback from "../feedback.js";
import type * as helpers from "../helpers.js";
import type * as importLogs from "../importLogs.js";
import type * as interactions from "../interactions.js";
import type * as lib_gemini from "../lib/gemini.js";
import type * as lib_prompts_compare from "../lib/prompts/compare.js";
import type * as lib_prompts_infer from "../lib/prompts/infer.js";
import type * as lib_prompts_recommend from "../lib/prompts/recommend.js";
import type * as recommendation from "../recommendation.js";
import type * as rules from "../rules.js";
import type * as tables from "../tables.js";
import type * as wines from "../wines.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  feedback: typeof feedback;
  helpers: typeof helpers;
  importLogs: typeof importLogs;
  interactions: typeof interactions;
  "lib/gemini": typeof lib_gemini;
  "lib/prompts/compare": typeof lib_prompts_compare;
  "lib/prompts/infer": typeof lib_prompts_infer;
  "lib/prompts/recommend": typeof lib_prompts_recommend;
  recommendation: typeof recommendation;
  rules: typeof rules;
  tables: typeof tables;
  wines: typeof wines;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
