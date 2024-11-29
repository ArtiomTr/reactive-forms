import { useContext } from 'react';
import { FormProxyContext, useFormContext, usePluginAssertion } from '@reactive-forms/core';
import { Pxth } from 'pxth';

import { FieldPrivileges } from './typings/FieldPrivileges';
import { getFieldPrivileges } from './getFieldPrivileges';
import { privilegesPlugin } from './plugin';

export const defaultPrivileges: FieldPrivileges = {
    disabled: false,
    isEditable: true,
    visible: true
};

export const useFieldPrivileges = <V>(path: Pxth<V>): FieldPrivileges => {
    usePluginAssertion(
        privilegesPlugin,
        'Privileges plugin is required to use privileges. Please add privilegesPlugin to <FormPlugins>.'
    );

    const context = useFormContext();
    const proxyContext = useContext(FormProxyContext);

    if (!context.privileges) {
        return defaultPrivileges;
    }

    if (proxyContext) {
        path = proxyContext.getNormalPath(path);
    }

    return getFieldPrivileges(path, context.privileges);
};
