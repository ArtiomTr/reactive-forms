import React, { createContext, PropsWithChildren } from 'react';
import merge from 'lodash/merge';

import { formatDecimal } from './formatDecimal';

export type DecimalFieldI18n = {
	required: string;
	invalidInput: string;
	minValue: (value: number, precision: number) => string;
	maxValue: (value: number, precision: number) => string;
};

export const defaultDecimalFieldI18n: DecimalFieldI18n = {
	required: 'Field is required',
	invalidInput: 'Must be decimal',
	minValue: (min: number, precision: number) => `Value should not be less than ${formatDecimal(min, precision)}`,
	maxValue: (max: number, precision: number) => `Value should not be greater than ${formatDecimal(max, precision)}`,
};

export const DecimalFieldI18nContext = createContext<DecimalFieldI18n>(defaultDecimalFieldI18n);

export type DecimalFieldI18nContextProviderProps = PropsWithChildren<{ i18n?: Partial<DecimalFieldI18n> }>;

export const DecimalFieldI18nContextProvider = ({ i18n, children }: DecimalFieldI18nContextProviderProps) => {
	return (
		<DecimalFieldI18nContext.Provider value={merge(defaultDecimalFieldI18n, i18n)}>
			{children}
		</DecimalFieldI18nContext.Provider>
	);
};
