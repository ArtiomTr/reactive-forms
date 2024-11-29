import React from 'react';
import ReactiveForm, { createPluginArray, FormPlugins, FormProxyProvider } from '@reactive-forms/core';
import { renderHook } from '@testing-library/react-hooks';
import { createPxth, Pxth } from 'pxth';
import { MappingProxy } from 'stocked';

import { privilegesPlugin } from '../src/plugin';
import { defaultPrivileges, useFieldPrivileges } from '../src/useFieldPrivileges';

const renderUseFieldPrivilegesWithProxy = (pxth: Pxth<unknown>) => {
    const proxy = new MappingProxy(
        {
            F1: createPxth(['values', 'real', 'R1']),
            F2: createPxth(['values', 'real', 'hello']),
            F3: createPxth(['values', 'real', '123', '/././.'])
        },
        createPxth(['values', 'proxy'])
    );

    proxy.activate();

    return renderHook(() => useFieldPrivileges(pxth), {
        wrapper: ({ children }) => (
            <FormPlugins plugins={createPluginArray(privilegesPlugin)}>
                <ReactiveForm
                    initialValues={{
                        values: {
                            real: {
                                R1: 42,
                                hello: {
                                    asdf: 'string',
                                    fdsa: 123
                                }
                            }
                        }
                    }}
                    privileges={{
                        fields: {
                            values: {
                                real: {
                                    isEditable: false,
                                    visible: false,
                                    disabled: true,

                                    R1: {
                                        isEditable: false,
                                        visible: true,
                                        disabled: true
                                    },

                                    hello: {
                                        asdf: {
                                            isEditable: false,
                                            visible: true,
                                            disabled: false
                                        }
                                    }
                                }
                            }
                        }
                    }}
                >
                    {() => <FormProxyProvider proxy={proxy}>{() => children}</FormProxyProvider>}
                </ReactiveForm>
            </FormPlugins>
        )
    });
};

describe('UseFieldPrivileges', () => {
    it('should throw an error', () => {
        const { result } = renderHook(() => useFieldPrivileges(createPxth(['asdf'])), {
            wrapper: ({ children }) => <ReactiveForm initialValues={{}}>{() => children}</ReactiveForm>
        });

        expect(result.error).toBeDefined();
    });

    it('should return default privileges', () => {
        const { result } = renderHook(() => useFieldPrivileges(createPxth(['asdf'])), {
            wrapper: ({ children }) => (
                <FormPlugins plugins={createPluginArray(privilegesPlugin)}>
                    <ReactiveForm initialValues={{}}>{() => children}</ReactiveForm>
                </FormPlugins>
            )
        });

        expect(result.current).toStrictEqual(defaultPrivileges);
    });

    it('should return merged privileges', () => {
        const { result } = renderHook(() => useFieldPrivileges(createPxth(['some/', 'nested.', ']path['])), {
            wrapper: ({ children }) => (
                <FormPlugins plugins={createPluginArray(privilegesPlugin)}>
                    <ReactiveForm
                        initialValues={{
                            'some/': {
                                'nested.': {
                                    ']path[': 42
                                }
                            }
                        }}
                        privileges={{
                            fields: {
                                disabled: true,
                                'some/': {
                                    isEditable: false,
                                    visible: false,
                                    'nested.': {
                                        ']path[': {
                                            visible: true
                                        }
                                    }
                                }
                            }
                        }}
                    >
                        {() => children}
                    </ReactiveForm>
                </FormPlugins>
            )
        });

        expect(result.current).toStrictEqual({
            visible: true,
            isEditable: false,
            disabled: true
        });
    });

    it('should return privileges for exact match of proxied path', () => {
        const { result } = renderUseFieldPrivilegesWithProxy(createPxth(['values', 'proxy', 'F1']));

        expect(result.current).toStrictEqual({
            isEditable: false,
            visible: true,
            disabled: true
        });
    });

    it('should return privileges for longest common path', () => {
        const { result } = renderUseFieldPrivilegesWithProxy(createPxth(['values', 'proxy']));

        expect(result.current).toStrictEqual({
            isEditable: false,
            visible: false,
            disabled: true
        });
    });

    it('should return privileges for nested path of proxy', () => {
        const { result } = renderUseFieldPrivilegesWithProxy(createPxth(['values', 'proxy', 'F2', 'asdf']));

        expect(result.current).toStrictEqual({
            isEditable: false,
            visible: true,
            disabled: false
        });
    });
});
