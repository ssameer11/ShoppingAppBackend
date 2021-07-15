import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { handleError } from "../exceptions/httpException";
import User from "../model/user";
import { AuthResponse } from "../shared/authResponse";
import sgMail from '@sendgrid/mail';
import randomize from 'randomatic';
import * as  keys from "../keys/keys";

sgMail.setApiKey(keys.SG_MAIL_KEY);

interface OtpTokenData {
    email: string,
    name: string,
    password: string,
    otp: string,
    expiresIn: Date
}



export const TOKEN_EXPIRES_IN = 1;

export const OTP_EXPIRATION = 15;

function generateToken(userId: string,email: string): string {
    const signedToken = jwt.sign({
        userId: userId,
        email: email
    },'thesecretkey',{expiresIn: `${TOKEN_EXPIRES_IN}h`});
    
    return signedToken;
}

export const GetOtp = async (req: Request,res: Response,next: NextFunction) => {
    const error = validationResult(req);
    try {
        if(!error.isEmpty()) {
            handleError(error.array()[0].msg,500);
        }
        const email = req.body.email;
        const password = req.body.password;
        const name = req.body.name;

        const hashedPassword = await bcrypt.hash(password,12);
        const otp = randomize('0',6);

        sgMail.send({
            from: keys.SENDGRID_EMAIL,
            to: email,
            subject: 'THIS IS THE OTP FOR YOUR SIGNUP',
            html: `<h1>Your OTP for Signup is ${otp} </h1>`
        }).then(result => {
        }).catch(err => {
        })

        const expiresIn = new Date();
        expiresIn.setMinutes(expiresIn.getMinutes() + OTP_EXPIRATION);

        const data: OtpTokenData = {
            email: email,
            name: name,
            password: hashedPassword,
            otp: otp,
            expiresIn: expiresIn
        };
     
        const dataToken = jwt.sign(data,'thesecretkey');
        
        res.status(200).json({
            otpToken: dataToken
        })

    } catch(err) {
        next(err)
    }
}

export const Signup = async (req: Request,res: Response,next: NextFunction) => {
    const otpToken = req.body.otpToken;
    const enteredOtp = req.body.enteredOtp;

    try {

         const decodedToken = await (jwt.verify(otpToken,'thesecretkey') as OtpTokenData);
        if(!decodedToken) {
            handleError('Serverside Error',500);
        }
        
        const email = decodedToken.email;
        const hashedPassword = decodedToken.password;
        const name = decodedToken.name;
        const expiresIn = new Date(decodedToken.expiresIn);

        if(new Date() > expiresIn) {
            handleError('OTP EXPIRED!',401);
        }

        if(decodedToken.otp.toString() !== enteredOtp.toString()) {
            handleError('OTP DOESNT MATCH ',201);
        }


        const user = new User({
            email: email,
            password: hashedPassword,
            name: name
        });

        const savedUser = await user.save();

        if(!savedUser) {
            handleError('Saving User Failed',500);
        }

        const savedEmail = savedUser.email;


        const token = generateToken((savedUser!._id!).toString(),savedEmail);
        if(!token) {
            handleError('TOKEN generation failed',500);
        }
        
        const tokenExpirationDate = new Date();

        tokenExpirationDate.setHours(tokenExpirationDate.getHours()+TOKEN_EXPIRES_IN);
        const userResponse: AuthResponse = {
            email: savedEmail,
            userId: savedUser._id!.toString(),
            _token: token,
            _tokenExpirationDate: tokenExpirationDate
        }

        const message = {
            from: keys.SENDGRID_EMAIL,
            to: savedEmail,
            subject: 'THE SIGNUP EMAIL! SIGNUP SUCCESSFULL THIS IS THE LATEST ONE ',
            html: '<h1>HELLO FROM SAMMER</h1>'
        }

        sgMail.send(message).then(result => {
        }).catch(err=> {
        });

        res.status(200).json(userResponse);
    } catch(err) {
        next(err)
    }
}

export const login = async (req: Request,res: Response,next: NextFunction) => {
    const error = validationResult(req);
    try {
        if(!error.isEmpty()) {
            handleError(error.array()[0].msg,500);
        }

        const email = req.body.email;
        const password = req.body.password;

        const fetchedUser = await User.findOne({email});

        if(!fetchedUser) {
            handleError('NO USER WITH THIS CREDENTIALS FOUND!',401);
        }

        const isEqual = await bcrypt.compare(password,fetchedUser!.password);
        if(!isEqual) {
            handleError('PASSWORD DOESNT MATCH!',401);
        }

        const token = generateToken((fetchedUser!._id)!.toString(),fetchedUser!.email);

        if(!token) {
            handleError('token generation failed',500);
        }

        const tokenExpirationDate = new Date();
        tokenExpirationDate.setHours(tokenExpirationDate.getHours() + TOKEN_EXPIRES_IN);
        const responseData: AuthResponse = {
            email: fetchedUser!.email,
            userId: fetchedUser!._id!.toString(),
            _token: token,
            _tokenExpirationDate: tokenExpirationDate
        }

        res.status(200).json(responseData);

    } catch(err) {
        next(err);
    }
}