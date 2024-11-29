import { useCallback, useContext } from 'react';
import { FieldConfig, useFieldValidator } from '@reactive-forms/core';

import { DecimalFieldI18nContext } from './DecimalFieldI18n';
import { formatDecimal } from './formatDecimal';
import { ConversionError, ConverterFieldBag, useConverterField, ValueConverter } from './useConverterField';

const DECIMAL_REGEX = /^\d*\.?\d*$/;
export const defaultPrecision = 2;

export type DecimalFieldConfig = FieldConfig<number | null | undefined> & {
	required?: boolean;
	min?: number;
	max?: number;

	precision?: number;
} & Partial<ValueConverter<number | null | undefined>>;

export type DecimalFieldBag = ConverterFieldBag<number | null | undefined>;

export const useDecimalField = ({
	name,
	validator,
	schema,
	required,
	min,
	max,
	format: customFormat,
	parse: customParse,
	precision = defaultPrecision,
}: DecimalFieldConfig): DecimalFieldBag => {
	const i18n = useContext(DecimalFieldI18nContext);

	const parse = useCallback(
		(text: string) => {
			text = text.trim();

			if (customParse) {
				return customParse(text);
			}

			if (text.length === 0) {
				return null;
			}

			if (!DECIMAL_REGEX.test(text)) {
				throw new ConversionError(i18n.invalidInput);
			}

			const value = Number.parseFloat(text);

			if (Number.isNaN(value)) {
				throw new ConversionError(i18n.invalidInput);
			}

			return value;
		},
		[customParse, i18n.invalidInput],
	);

	const format = useCallback(
		(value: number | null | undefined) => {
			if (customFormat) {
				return customFormat(value);
			}

			return formatDecimal(value, precision);
		},
		[customFormat, precision],
	);

	const decimalBag = useConverterField({
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
				return i18n.minValue(min, precision);
			}

			if (typeof max === 'number' && value > max) {
				return i18n.maxValue(max, precision);
			}

			return undefined;
		},
	});

	return decimalBag;
};
