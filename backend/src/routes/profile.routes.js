import { Router } from 'express';
import { changePassword, getProfile, updateProfile } from '../controllers/profile.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';
import { passwordChangeSchema, profileSchema } from '../validators/customer.validator.js';
import { listFavorites, toggleFavorite } from '../controllers/favorite.controller.js';

const router = Router();
router.use(authenticate);
router.get('/me', getProfile);
router.patch('/me', validate(profileSchema), updateProfile);
router.patch('/me/password', validate(passwordChangeSchema), changePassword);
router.get('/me/favorites', listFavorites);
router.put('/me/favorites/:bookId', toggleFavorite);

export default router;
