import { useCallback, useContext } from 'react';
import { FieldConfig, FieldContext, useField, useFieldValidator } from '@reactive-forms/core';

import { StringFieldI18nContext } from './StringFieldI18n';

export type StringFieldConfig = FieldConfig<string | undefined | null> & {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
};

export type StringFieldBag = FieldContext<string | undefined | null> & {
	onBlur: () => void;
};

export const useStringField = ({ name, validator, schema, required, maxLength, minLength }: StringFieldConfig) => {
	const fieldBag = useField({ name, validator, schema });

	const {
		control: { setTouched },
	} = fieldBag;

	const i18n = useContext(StringFieldI18nContext);

	useFieldValidator({
		name,
		validator: (value: string | undefined | null) => {
			const isValueEmpty = !value || value.trim().length === 0;

			if (required && isValueEmpty) {
				return i18n.required;
			}

			const valueLength = value?.length ?? 0;

			if (typeof minLength === 'number' && valueLength < minLength) {
				return i18n.minLength(minLength);
			}

			if (typeof maxLength === 'number' && valueLength > maxLength) {
				return i18n.maxLength(maxLength);
			}

			return undefined;
		},
	});

	const onBlur = useCallback(() => {
		setTouched({ $touched: true });
	}, [setTouched]);

	return {
		onBlur,
		...fieldBag,
	};
};
