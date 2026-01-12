/**
 * @file Adapter exports
 */

export { BaseAdapter } from './_shared/BaseAdapter.js';
export { ActionlintAdapter } from './actionlint/ActionlintAdapter.js';
export { AdapterFactory, defaultAdapterFactory, type AdapterRegistration } from './AdapterFactory.js';
export type {
    Adapter,
    AdapterConfig, AdapterResult, AdapterRunOptions, ToolDetection
} from './types.js';
export { ZizmorAdapter } from './zizmor/ZizmorAdapter.js';

