import { createPxth } from 'pxth';

import { getFieldPrivileges } from '../src/getFieldPrivileges';
import { defaultPrivileges } from '../src/useFieldPrivileges';

describe('getFieldPrivileges', () => {
    it('should merge privileges from upper nodes', () => {
        const privileges = getFieldPrivileges<number, { some: { nested: { path: number } } }>(
            createPxth(['some', 'nested', 'path']),
            {
                fields: {
                    disabled: true,
                    isEditable: false,
                    some: {
                        isEditable: true,
                        nested: {
                            disabled: false,
                            path: {
                                visible: true
                            }
                        }
                    }
                }
            }
        );

        expect(privileges).toStrictEqual({
            isEditable: true,
            disabled: false,
            visible: true
        });
    });

    it('should combine privileges with default privileges', () => {
        const privileges = getFieldPrivileges<number, { some: { nested: { path: number } } }>(
            createPxth(['some', 'nested', 'path']),
            {
                fields: {
                    some: {
                        nested: {
                            isEditable: false,
                            path: {
                                visible: true
                            }
                        }
                    }
                }
            }
        );

        expect(privileges.disabled).toBe(defaultPrivileges.disabled);
    });
});
