import React from 'react';
import { act, renderHook, RenderHookResult } from '@testing-library/react-hooks';
import { MappingProxy, StockProxy } from 'stocked';

import { FormProxyProvider, FormShared, ReactiveFormProvider, useForm, useFormContext } from '../../src';
import { FormControlConfig } from '../../src/hooks/useFormControl';

const renderFormContextWithProxy = <T extends object>(
    config: FormControlConfig<T>,
    proxy: StockProxy
): [RenderHookResult<undefined, FormShared<object>>, FormShared<T>] => {
    const {
        result: { current: bag }
    } = renderHook(() => useForm(config));

    const wrapper = ({ children }) => (
        <ReactiveFormProvider formBag={bag as unknown as FormShared<object>}>
            <FormProxyProvider proxy={proxy}>{children}</FormProxyProvider>
        </ReactiveFormProvider>
    );

    return [renderHook(() => useFormContext(), { wrapper }), bag];
};

const proxy = new MappingProxy(
    {
        name: 'sessionInfo.currentUser.firstName',
        surname: 'sessionInfo.currentUser.lastName'
    },
    'user'
);

proxy.activate();

const initialValues = {
    sessionInfo: {
        currentUser: {
            firstName: 'Hello',
            lastName: 'World'
        }
    },
    c: {
        b: ''
    },
    value: {
        b: 'Hl'
    }
};

describe('values control', () => {
    it('setValues', () => {
        const [{ result }, bag] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        act(() => {
            result.current.setValues({
                user: {
                    name: 'Hello',
                    surname: 'World'
                },
                c: {
                    b: ''
                },
                value: {
                    b: 'Hl'
                }
            });
        });

        expect(bag.values.getValues()).toStrictEqual({
            sessionInfo: {
                currentUser: {
                    firstName: 'Hello',
                    lastName: 'World'
                }
            },
            c: {
                b: ''
            },
            value: {
                b: 'Hl'
            }
        });

        expect(result.current.values.getValues()).toStrictEqual({
            c: {
                b: ''
            },
            sessionInfo: {
                currentUser: {
                    firstName: 'Hello',
                    lastName: 'World'
                }
            },
            value: {
                b: 'Hl'
            },
            user: {
                name: 'Hello',
                surname: 'World'
            }
        });
    });
    it('setFieldValue', () => {
        const [{ result }, bag] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        act(() => {
            result.current.setFieldValue('user.name', 'New name');
        });

        expect(bag.values.getValues()).toStrictEqual({
            sessionInfo: {
                currentUser: {
                    firstName: 'New name',
                    lastName: 'World'
                }
            },
            c: {
                b: ''
            },
            value: {
                b: 'Hl'
            }
        });
    });

    it('getFieldValue', () => {
        const [{ result }] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        expect(result.current.getFieldValue('user.name')).toBe('Hello');
        expect(result.current.getFieldValue('user.surname')).toBe('World');
        expect(result.current.getFieldValue('user')).toStrictEqual({
            name: 'Hello',
            surname: 'World'
        });
    });
});
describe('errors control', () => {
    it('setErrors', () => {
        const [{ result }, bag] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        act(() => {
            result.current.setErrors({ user: { name: { $error: 'Nested error' } } } as any);
        });

        expect(bag.errors.getValues()).toStrictEqual({
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $error: 'Nested error'
                    },
                    lastName: undefined
                }
            }
        });

        expect(result.current.errors.getValues()).toStrictEqual({
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $error: 'Nested error'
                    },
                    lastName: undefined
                }
            },
            user: {
                name: {
                    $error: 'Nested error'
                },
                surname: undefined
            }
        });
    });

    it('setFieldError', () => {
        const [{ result }] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        act(() => {
            result.current.setFieldError('user.name', { $error: 'hello' });
        });

        expect(result.current.errors.getValues()).toStrictEqual({
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $error: 'hello'
                    }
                }
            },
            user: {
                name: {
                    $error: 'hello'
                },
                surname: undefined
            }
        });
    });

    it('getFieldError', () => {
        const [{ result }] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {
                    sessionInfo: {
                        currentUser: {
                            firstName: {
                                $error: 'asdf'
                            }
                        },
                        $error: 'hello'
                    }
                },
                initialTouched: {}
            },
            proxy
        );

        expect(result.current.getFieldError('user.name')).toStrictEqual({ $error: 'asdf' });
        expect(result.current.getFieldError('sessionInfo')).toStrictEqual({
            currentUser: {
                firstName: {
                    $error: 'asdf'
                }
            },
            $error: 'hello'
        });
    });
});

describe('touched control', () => {
    it('setTouched', () => {
        const [{ result }, bag] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        act(() => {
            result.current.setTouched({
                user: {
                    name: {
                        $touched: false
                    }
                },
                $touched: true
            } as any);
        });

        expect(result.current.touched.getValues()).toStrictEqual({
            user: {
                name: {
                    $touched: false
                },
                surname: undefined
            },
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $touched: false
                    },
                    lastName: undefined
                }
            },
            $touched: true
        });

        expect(bag.touched.getValues()).toStrictEqual({
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $touched: false
                    },
                    lastName: undefined
                }
            },
            $touched: true
        });
    });

    it('setFieldTouched', () => {
        const [{ result }] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {}
            },
            proxy
        );

        act(() => {
            result.current.setFieldTouched('user.name', { $touched: true });
        });

        expect(result.current.touched.getValues()).toStrictEqual({
            user: {
                name: {
                    $touched: true
                },
                surname: undefined
            },
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $touched: true
                    }
                }
            }
        });

        act(() => {
            result.current.setFieldTouched('sessionInfo.currentUser.firstName', { $touched: true });
        });

        expect(result.current.touched.getValues()).toStrictEqual({
            user: {
                name: {
                    $touched: true
                },
                surname: undefined
            },
            sessionInfo: {
                currentUser: {
                    firstName: {
                        $touched: true
                    }
                }
            }
        });
    });

    it('getFieldTouched', () => {
        const [{ result }] = renderFormContextWithProxy(
            {
                initialValues,
                initialErrors: {},
                initialTouched: {
                    sessionInfo: {
                        currentUser: {
                            firstName: {
                                $touched: true
                            }
                        }
                    }
                }
            },
            proxy
        );

        expect(result.current.getFieldTouched('sessionInfo.currentUser.firstName')).toStrictEqual({
            $touched: true
        });
        expect(result.current.getFieldTouched('user.name')).toStrictEqual({ $touched: true });
        expect(result.current.getFieldTouched('user')).toStrictEqual({
            name: {
                $touched: true
            },
            surname: undefined
        });
    });
});
