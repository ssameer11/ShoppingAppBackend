import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { HttpException, handleError } from "../exceptions/httpException";

export interface IRequest extends Request {
    userId: string,
    error: HttpException
}

const isAuth = async (req: IRequest, res: Response,next: NextFunction) => {
    const authHeader = req.get('Authorization');
    let decryptedToken = null;
    try {
        
        if(!authHeader) {
            handleError('NO AUTHORIZATION TOKEN!',401);
        }
    
        const token = authHeader!.split(' ')[1];
        decryptedToken = jwt.verify(token,'thesecretkey') as {userId: string,email: string};
        
    } catch(err) {
        req.error = err;
        return next();
    }

    // if(!decryptedToken) {
    //     // handleError('TOKEN DECRYPTION FAILED!',401)
    //     const err = new HttpException('Token Decryption Failed',401);
    //     req.error = err;
    //     return next(err);
    // }

    req.userId = decryptedToken!.userId;

    // console.log('her e (((((((((((((',req.userId)
    next();
}

export default isAuth;