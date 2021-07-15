import {Router} from 'express';
import isAuth from '../middleware/is-auth';
import * as sharedController from '../controller/shared';
const router = Router();

router.get('/outfit/:id',(sharedController.getOutfit as any))


export default router;