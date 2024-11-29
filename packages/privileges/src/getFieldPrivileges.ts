import { createPxth, deepGet, getPxthSegments, Pxth } from 'pxth';

import { FieldPrivileges } from './typings/FieldPrivileges';
import { FormPrivileges } from './typings/FormPrivileges';
import { defaultPrivileges } from './useFieldPrivileges';

const getParentPath = <V>(path: Pxth<V>) => {
    const pathSegments = getPxthSegments(path);

    if (pathSegments.length > 0) {
        pathSegments.pop();
    }

    return createPxth(pathSegments);
};

const mergePrivileges = (acc: FieldPrivileges, privileges: FieldPrivileges) => {
    acc.disabled ??= privileges.disabled;
    acc.isEditable ??= privileges.isEditable;
    acc.visible ??= privileges.visible;
};

export const getFieldPrivileges = <V, T extends object>(
    path: Pxth<V>,
    privileges: FormPrivileges<T>
): FieldPrivileges => {
    const mergedPrivileges: FieldPrivileges = {};

    let currentPath = path as Pxth<unknown>;

    while (getPxthSegments(currentPath).length > 0) {
        const currentPrivileges: FieldPrivileges | undefined = deepGet(privileges.fields, path);

        if (currentPrivileges) {
            mergePrivileges(mergedPrivileges, currentPrivileges);
        }

        currentPath = getParentPath(path);
    }

    mergePrivileges(mergedPrivileges, privileges.fields);
    mergePrivileges(mergedPrivileges, defaultPrivileges);

    return mergedPrivileges;
};
