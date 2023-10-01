import { z } from 'zod';

import {
  salesManagerUser,
  salesRepUser,
} from 'src/modular-style/__tests__/userModel';
import { createVariant } from 'src/modular-style/createVariant';
import { APPROVE, CREATE } from 'src/modular-style/workOrder/transitions';

// Variants
export const startVariant = createVariant(z.undefined());
export type Start = ReturnType<(typeof startVariant)['schema']['parse']>;

export const pendingApprovalVariant = createVariant(
  z.object({
    id: z.string(),
    createdBy: salesRepUser.schema,
    createdAt: z.date(),
  }),
);
export type PendingApproval = ReturnType<
  (typeof pendingApprovalVariant)['schema']['parse']
>;

export const approvedVariant = createVariant(
  z.object({
    id: z.string(),
    createdBy: salesManagerUser.schema,
    createdAt: z.date(),
    approvedBy: salesManagerUser.schema,
    approvedAt: z.date(),
  }),
);
export type Approved = ReturnType<(typeof approvedVariant)['schema']['parse']>;

// Utils
export const isPendingApproval = (workOrder: PendingApproval | Approved) =>
  pendingApprovalVariant.schema.safeParse(workOrder).success;

export const isApproved = (workOrder: PendingApproval | Approved) =>
  approvedVariant.schema.safeParse(workOrder).success;

// Variant Transition Manifests
export const start = startVariant.createManifest([
  {
    transition: { CREATE },
    onResult: [
      { if: isPendingApproval, goTo: 'pendingApproval' },
      { if: isApproved, goTo: 'approved' },
    ],
  },
]);

export const pendingApproval = pendingApprovalVariant.createManifest([
  { transition: { APPROVE }, onResult: [{ goTo: 'approved' }] },
]);

export const approved = approvedVariant.createManifest();
