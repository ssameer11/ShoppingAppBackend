import {Router} from 'express';
import * as authController from '../controller/auth';
import {body} from 'express-validator';
import User from '../model/user';
const router = Router();

router.post('/otp',[
    body('email').trim().isEmail().normalizeEmail().notEmpty().custom((value,{req}) => {
        return User.findOne({email: value}).then(user => {
            if(user) {
                return Promise.reject('EMAIL ALREADY EXISTS!')
            }
        })
    }),
    body('password').isLength({min: 5}).notEmpty(),
    body('name').trim().isString(),
    ],authController.GetOtp);

router.put('/signup',authController.Signup);

router.post('/login',[
                    body('email').trim().isEmail().normalizeEmail().notEmpty(),
                    body('password').isLength({min: 5}).notEmpty()
                    ]
                    ,authController.login);

export default router;