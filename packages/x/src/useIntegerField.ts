import { useCallback, useContext } from 'react';
import { FieldConfig, useFieldValidator } from '@reactive-forms/core';

import { formatInteger } from './formatInteger';
import { IntegerFieldI18nContext } from './IntegerFieldI18n';
import { ConversionError, ConverterFieldBag, useConverterField, ValueConverter } from './useConverterField';

const INTEGER_REGEX = /^-?\d+$/;

export type IntegerFieldConfig = FieldConfig<number | null | undefined> & {
	required?: boolean;
	min?: number;
	max?: number;
} & Partial<ValueConverter<number | null | undefined>>;

export type IntegerFieldBag = ConverterFieldBag<number | null | undefined>;

export const useIntegerField = ({
	name,
	validator,
	schema,
	required,
	min,
	max,
	parse: customParse,
	format = formatInteger,
}: IntegerFieldConfig): IntegerFieldBag => {
	const i18n = useContext(IntegerFieldI18nContext);

	const parse = useCallback(
		(text: string) => {
			text = text.trim();

			if (customParse) {
				return customParse(text);
			}

			if (text.length === 0) {
				return null;
			}

			if (!INTEGER_REGEX.test(text)) {
				throw new ConversionError(i18n.invalidInput);
			}

			const value = Number.parseInt(text);

			if (Number.isNaN(value)) {
				throw new ConversionError(i18n.invalidInput);
			}

			return value;
		},
		[customParse, i18n.invalidInput],
	);

	const integerBag = useConverterField({
		parse,
		format,
		name,
		validator,
		schema,
	});

	useFieldValidator({
		name,
		validator: (value) => {
			if (required && typeof value !== 'number') {
				return i18n.required;
			}

			if (typeof value !== 'number') {
				return undefined;
			}

			if (typeof min === 'number' && value < min) {
				return i18n.minValue(min);
			}

			if (typeof max === 'number' && value > max) {
				return i18n.maxValue(max);
			}

			return undefined;
		},
	});

	return integerBag;
};
