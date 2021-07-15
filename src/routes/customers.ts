import {NextFunction, Request, Response, Router} from 'express';
import { body } from 'express-validator';
import * as customersController from '../controller/customers';
import isAuth from '../middleware/is-auth';

const router = Router();

router.get('/outfit-list',(customersController.getOutfits as any));

router.post('/outfit/add-to-cart',(isAuth as any),[body('outfitId').trim().isLength({min: 1}),body('count').isNumeric()],(customersController.addToCart as any));

router.get('/shopping-cart',(isAuth as any),(customersController.getCart as any));

router.patch('/shopping-cart',(isAuth as any),(customersController.updateCart as any));
// router.get('/something',(isAuth as any),(customersController.removeFromCart as any));
router.patch('/shopping-cart/delete',(isAuth as any),(customersController.removeFromCart as any));
export default router;
// customers/shopping-cart