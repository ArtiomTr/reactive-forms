import { useCallback, useEffect, useRef, useState } from 'react';
import { FieldConfig, FieldContext, FieldError, FieldTouched, useField, useFieldValidator } from '@reactive-forms/core';
import isObject from 'lodash/isObject.js';

export class ConversionError extends Error {
	public constructor(errorMessage: string) {
		super(errorMessage);
	}
}

export type ValueConverter<T> = {
	parse: (value: string) => T;
	format: (value: T) => string;
};

export type ConverterFieldConfig<T> = ValueConverter<T> & FieldConfig<T>;

export type ConverterFieldBag<T> = {
	text: string;
	onTextChange: (text: string) => void;
	onFocus: () => void;
	onBlur: () => void;
} & FieldContext<T>;

export const useConverterField = <T>({
	parse,
	format,
	...fieldConfig
}: ConverterFieldConfig<T>): ConverterFieldBag<T> => {
	const fieldBag = useField(fieldConfig);

	const {
		value,
		control: { setValue, setError, setTouched },
	} = fieldBag;

	const [isFocused, setIsFocused] = useState(false);
	const [text, setText] = useState(() => format(value));
	const textRef = useRef(text);
	textRef.current = text;

	const [hasConversionError, setHasConversionError] = useState(false);

	const tryConvert = useCallback(
		(text: string) => {
			try {
				const value = parse(text); // this could throw in case of conversion error
				setValue(value);
				setHasConversionError(false);
			} catch (error) {
				if (isObject(error) && error instanceof ConversionError) {
					setHasConversionError(true);
					setError({
						$error: error.message,
					} as FieldError<T>);
				} else {
					throw error;
				}
			}
		},
		[parse, setError, setValue],
	);

	const onTextChange = useCallback(
		(newText: string) => {
			textRef.current = newText;
			setText(newText);
			tryConvert(newText);
		},
		[tryConvert],
	);

	const onFocus = useCallback(() => {
		setIsFocused(true);
	}, []);

	const onBlur = useCallback(() => {
		setIsFocused(false);
		setTouched({ $touched: true } as FieldTouched<T>);
		tryConvert(text);
	}, [setTouched, text, tryConvert]);

	const forceSetValue = useCallback(
		(value: T) => {
			onTextChange(format(value));
			setValue(value);
		},
		[format, onTextChange, setValue],
	);

	useFieldValidator({
		name: fieldConfig.name,
		validator: () => {
			try {
				parse(textRef.current);
			} catch (error) {
				if (isObject(error) && error instanceof ConversionError) {
					return error.message;
				}

				throw error;
			}

			return undefined;
		},
	});

	useEffect(() => {
		if (isFocused || hasConversionError) {
			return;
		}

		const formattedValue = format(value);
		textRef.current = formattedValue;
		setText(formattedValue);
	}, [value, format, hasConversionError, isFocused]);

	const tryConvertRef = useRef(tryConvert);

	useEffect(() => {
		if (tryConvertRef.current !== tryConvert) {
			tryConvert(textRef.current); // Parse text again when parse function changes
		}

		tryConvertRef.current = tryConvert;
	}, [tryConvert]);

	return {
		text,
		onTextChange,
		onFocus,
		onBlur,
		...fieldBag,
		control: { ...fieldBag.control, setValue: forceSetValue },
	};
};
