import { useContext } from 'react';
import { FieldConfig, FieldContext, useField, useFieldValidator } from '@reactive-forms/core';

import { BooleanFieldI18nContext } from './BooleanFieldI18n';

export type BooleanFieldConfig = FieldConfig<boolean | null | undefined> & {
	required?: boolean;
};

export type BooleanFieldBag = FieldContext<boolean | null | undefined> & {
	onBlur: () => void;
};

export const useBooleanField = ({ required, ...config }: BooleanFieldConfig) => {
	const fieldBag = useField(config);

	const {
		control: { setTouched },
	} = fieldBag;

	const i18n = useContext(BooleanFieldI18nContext);

	const onBlur = () => {
		setTouched({ $touched: true });
	};

	useFieldValidator({
		name: config.name,
		validator: (value) => {
			if (required && !value) {
				return i18n.required;
			}

			return undefined;
		},
	});

	return {
		...fieldBag,
		onBlur,
	};
};
