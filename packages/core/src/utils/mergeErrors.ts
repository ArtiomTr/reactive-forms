import isPlainObject from 'lodash/isPlainObject';
import mergeWith from 'lodash/mergeWith';

const errorsMergeCustomizer = (target: unknown, source: unknown): unknown => {
	if (Array.isArray(target) && isPlainObject(source)) {
		return mergeWith(target, Object.assign([], source), errorsMergeCustomizer);
	}
	if (Array.isArray(source) && isPlainObject(target)) {
		return mergeWith(source, Object.assign([], target), errorsMergeCustomizer);
	}
};

export const mergeErrors = (target: unknown, ...sources: unknown[]) =>
	mergeWith(target, ...sources, errorsMergeCustomizer);
