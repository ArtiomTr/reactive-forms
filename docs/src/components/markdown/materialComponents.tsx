import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { Components } from '@mdx-js/react';

import { Code } from './Code';
import { createHeadingComponent } from './Heading';
import { Link } from './Link';
import { Paragraph } from './Paragraph';

export const materialComponents: Components = {
    a: Link,
    h1: createHeadingComponent(1),
    h2: createHeadingComponent(2),
    h3: createHeadingComponent(3),
    h4: createHeadingComponent(4),
    h5: createHeadingComponent(5),
    h6: createHeadingComponent(6),
    table: Table,
    tr: TableRow,
    tbody: TableBody,
    thead: TableHead,
    th: ({ children }) => <TableCell>{children}</TableCell>,
    td: ({ children, ...oth }) => <TableCell>{children}</TableCell>,
    p: Paragraph,
    code: Code,
    pre: ({ children }) => <React.Fragment>{children}</React.Fragment>
};
