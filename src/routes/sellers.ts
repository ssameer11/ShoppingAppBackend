import {Router} from 'express';
import * as sellersController from '../controller/sellers';
import isAuth from '../middleware/is-auth';
import {body} from 'express-validator';
import { multerUpload } from '../middleware/multer-middleware';
const router = Router();
// ,(isAuth as any)
router.post('/outfit',(isAuth as any),multerUpload,[body('title').trim().isLength({min: 5})],(sellersController.CreateOutfit as any));

router.post('/outfit/:id',(isAuth as any),multerUpload,[body('title').trim().isLength({min: 5})],(sellersController.updateOutfit as any));

router.delete('/outfit/:id',(isAuth as any),(sellersController.deleteOutfit as any));

router.get('/outfit-list',(isAuth as any),(sellersController.getOutfits as any));

router.post('/payment/cart',(isAuth as any),(sellersController.makeCartPayment as any))

router.post('/payment/:id',(isAuth as any),(sellersController.makePayment as any));

export default router;