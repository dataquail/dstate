import { v4 } from 'uuid';

import {
  SalesManagerUser,
  SalesUser,
} from 'src/modular-style/__tests__/userModel';
import { createTransition } from 'src/modular-style/createTransition';
import {
  Approved,
  PendingApproval,
  approvedVariant,
  pendingApprovalVariant,
} from 'src/modular-style/workOrder/variants';

export const CREATE = createTransition(
  (salesUser: SalesUser): PendingApproval | Approved => {
    const id = v4();
    const createdAt = new Date();
    const createdBy = salesUser;

    if (salesUser.role === 'sales representative') {
      return pendingApprovalVariant.schema.parse({
        id,
        createdAt,
        createdBy: salesUser,
      });
    } else {
      return approvedVariant.schema.parse({
        id,
        createdAt,
        createdBy,
        approvedBy: createdBy,
        approvedAt: createdAt,
      });
    }
  },
);

export const APPROVE = createTransition(
  (
    pendingApproval: PendingApproval,
    salesManagerUser: SalesManagerUser,
  ): Approved => {
    return approvedVariant.schema.parse({
      ...pendingApproval,
      approvedAt: new Date(),
      approvedBy: salesManagerUser,
    });
  },
);
