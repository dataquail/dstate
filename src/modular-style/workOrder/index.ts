import { createModel } from 'src/modular-style/createModel';
import {
  approved,
  pendingApproval,
  start,
} from 'src/modular-style/workOrder/variants';

export const workOrderModel = createModel({
  start,
  pendingApproval,
  approved,
});
