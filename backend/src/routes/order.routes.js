import { Router } from 'express';
import { cancelOrder, checkout, getOrder, listOrders } from '../controllers/order.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { checkoutSchema } from '../validators/customer.validator.js';

const router = Router();
router.use(authenticate);
router.get('/', listOrders);
router.post('/', validate(checkoutSchema), checkout);
router.get('/:orderId', getOrder);
router.post('/:orderId/cancel', cancelOrder);

export default router;
