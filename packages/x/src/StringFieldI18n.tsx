import React, { createContext, PropsWithChildren } from 'react';
import merge from 'lodash/merge';

export type StringFieldI18n = {
	required: string;
	minLength: (length: number) => string;
	maxLength: (length: number) => string;
};

export const defaultStringFieldI18n: StringFieldI18n = {
	required: 'Field is required',
	minLength: (minLength: number) => `String should not include less than ${minLength} character(s)`,
	maxLength: (maxLength: number) => `String should not include more than ${maxLength} character(s)`,
};

export const StringFieldI18nContext = createContext<StringFieldI18n>(defaultStringFieldI18n);

export type StringFieldI18nContextProviderProps = PropsWithChildren<{ i18n?: Partial<StringFieldI18n> }>;

export const StringFieldI18nContextProvider = ({ i18n, children }: StringFieldI18nContextProviderProps) => {
	return (
		<StringFieldI18nContext.Provider value={merge(defaultStringFieldI18n, i18n)}>
			{children}
		</StringFieldI18nContext.Provider>
	);
};
