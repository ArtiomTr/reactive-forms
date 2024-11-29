import React, { createContext, PropsWithChildren } from 'react';
import merge from 'lodash/merge';

export type BooleanFieldI18n = {
	required: string;
};

export const defaultBooleanFieldI18n: BooleanFieldI18n = {
	required: 'Field is required',
};

export const BooleanFieldI18nContext = createContext<BooleanFieldI18n>(defaultBooleanFieldI18n);

export type BooleanFieldI18nContextProviderProps = PropsWithChildren<{ i18n?: Partial<BooleanFieldI18n> }>;

export const BooleanFieldI18nContextProvider = ({ i18n, children }: BooleanFieldI18nContextProviderProps) => {
	return (
		<BooleanFieldI18nContext.Provider value={merge(defaultBooleanFieldI18n, i18n)}>
			{children}
		</BooleanFieldI18nContext.Provider>
	);
};
