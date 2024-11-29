import React, { createContext, PropsWithChildren } from 'react';
import merge from 'lodash/merge';

export type IntegerFieldI18n = {
	required: string;
	invalidInput: string;
	minValue: (value: number) => string;
	maxValue: (value: number) => string;
};

export const defaultIntegerFieldI18n: IntegerFieldI18n = {
	required: 'Field is required',
	invalidInput: 'Must be integer',
	minValue: (min: number) => `Value should not be less than ${min.toFixed(0)}`,
	maxValue: (max: number) => `Value should not be greater than ${max.toFixed(0)}`,
};

export const IntegerFieldI18nContext = createContext<IntegerFieldI18n>(defaultIntegerFieldI18n);

export type IntegerFieldI18nContextProviderProps = PropsWithChildren<{
	i18n?: Partial<IntegerFieldI18n>;
}>;

export const IntegerFieldI18nContextProvider = ({ children, i18n }: IntegerFieldI18nContextProviderProps) => {
	return (
		<IntegerFieldI18nContext.Provider value={merge(defaultIntegerFieldI18n, i18n)}>
			{children}
		</IntegerFieldI18nContext.Provider>
	);
};
