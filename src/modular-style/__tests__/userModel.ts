import { z } from 'zod';

import { createVariant } from 'src/modular-style/createVariant';

// Variants
export const salesManagerUser = createVariant(
  z.object({
    id: z.string(),
    name: z.string(),
    role: z.literal('sales manager'),
  }),
);
export type SalesManagerUser = ReturnType<
  (typeof salesManagerUser)['schema']['parse']
>;

export const salesRepUser = createVariant(
  z.object({
    id: z.string(),
    name: z.string(),
    role: z.literal('sales representative'),
  }),
);
export type SalesRepUser = ReturnType<(typeof salesRepUser)['schema']['parse']>;

export type SalesUser = SalesManagerUser | SalesRepUser;

// Utils
export const isSalesRepUser = (user: SalesUser): user is SalesRepUser =>
  user.role === 'sales representative';

export const isSalesManagerUser = (user: SalesUser): user is SalesManagerUser =>
  user.role === 'sales manager';
