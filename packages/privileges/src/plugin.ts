import { FormConfig, FormShared, Plugin } from '@reactive-forms/core';

export const privilegesPlugin: Plugin = {
    token: Symbol.for('privileges'),
    useBagDecorator: <T extends object>(shared: FormShared<T>, config: FormConfig<T>) => ({
        ...shared,
        privileges: config.privileges
    }),
    useConfigDecorator: (config) => config
};
