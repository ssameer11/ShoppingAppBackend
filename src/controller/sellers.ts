import { NextFunction, Request, Response } from "express";
import { validationResult } from 'express-validator';
import { handleError, HttpException } from "../exceptions/httpException";
import Outfit , {IOutfit} from '../model/outfit';
import {IRequest} from '../middleware/is-auth';
import User,{IUser} from '../model/user';
import mongoose from "mongoose";
import fs from 'fs';
import path from 'path';
import {Stripe} from 'stripe';
import { getTheFilteredCart } from "../utility/utility-functions";
import { STRIPE_KEY } from "../keys/keys";
const stripe = new Stripe(STRIPE_KEY,{apiVersion: "2020-08-27"});

export const CreateOutfit = async (req: IRequest, res: Response,next: NextFunction) => {
    const error = validationResult(req);
    try {
        if(req.error) {
            throw req.error;
        }
        if(!error.isEmpty()) {
            handleError(error.array()[0].msg,400);
        }

        if(!req.file) {
            handleError('File Upload Failed',400);
        }

        const title = req.body.title;
        const description = req.body.description;
        const url = req.file!.path;
        const imageUrl = url.replace(/\\/g,"/")
        const price = +req.body.price;
        const stockCount = +req.body.stockCount;
        const rating = +req.body.rating;
        const category = req.body.category;
        const instructions = JSON.parse(req.body.instructions);
        const userId = req.userId;
        
        const outfit:IOutfit = new Outfit({
            title,
            description,
            imageUrl,
            price,
            stockCount,
            rating,
            category,
            instructions,
            creator: userId
        });

        await outfit.save();
        const user = await User.findOne({_id: userId}) as IUser;
        user.outfits.push(outfit);
        const savedUser = await user.save();

        res.status(201).json({
            message: "Outfit Created Successfully!",
            outfit: outfit,
            creator: {_id: savedUser._id,name: savedUser.name}
        })

        
    }catch (err) {
        next(err);
    }
}

export const updateOutfit = async(req: IRequest,res: Response,next: NextFunction) => {

    let outfitId = req.params.id;
    const error = validationResult(req);
    try {
        if(req.error) {
            throw req.error;
        }
        if(!error.isEmpty()) {
            handleError(error.array()[0].msg,500);
        }

        let url: (null | string) = null;
        if(req.file) {
            url = req.file.path;
        }

        const title = req.body.title;
        const description = req.body.description;
        const price = +req.body.price;
        const stockCount = +req.body.stockCount;
        const rating = +req.body.rating;
        const category = req.body.category;
        const instructions = JSON.parse(req.body.instructions);
        const userId = req.userId;

        let existingOutfit = await Outfit.findById(outfitId).populate('creator') as IOutfit;

        if(!existingOutfit) {
            handleError('POST DOESNT EXIST !',404);
        }

        if(userId.toString() !== ((existingOutfit.creator as any)._id).toString()) {
            handleError('USER NOT AUTHORIZED !',402)
        }

        let newImageUrl = existingOutfit.imageUrl;
        if(url) {
            newImageUrl = url.replace(/\\/g,"/");
        }

        if(newImageUrl !== existingOutfit.imageUrl) {
            clearFile(existingOutfit.imageUrl);
            existingOutfit.imageUrl = newImageUrl;
        }

        existingOutfit.title = title;
        existingOutfit.description = description;
        existingOutfit.instructions = instructions;
        existingOutfit.price = price;
        existingOutfit.rating = rating;
        existingOutfit.stockCount = stockCount;
        existingOutfit.category = category;

        const savedOutfit = await existingOutfit.save();

        res.status(200).json({
            outfit: savedOutfit,
            message: 'Post Updated!'
        })
    } catch (err) {
        next(err);
    }
}

export const getOutfits = async (req: IRequest,res: Response,next: NextFunction) => {
    const page = +req.query.page! || 1;
    const itemsPerPage = +req.query.itemsPerPage! || 5;
    const filters:{[key: string]: any} = {};
    if(req.query.searchString && req.query.searchString !== 'undefined') {
        filters.title = new RegExp(`^${req.query.searchString}$`, 'i');
    }

    if(req.query.category) {
        filters.category = {$eq: req.query.category};
    }

    try {
        if(req.error) {
            throw req.error;
        }
        const userId = req.userId;
        const totalOutfits = await User.aggregate([
            {$match: {_id: mongoose.Types.ObjectId(userId)}},
            {
               $project: {
                  totalOutfits: { $cond: { if: { $isArray: "$outfits" }, then: { $size: "$outfits" }, else: "NA"} }
               }
            }
         ] )
         const lastPage = Math.ceil(totalOutfits[0].totalOutfits/itemsPerPage);
        const user = await User.findOne({_id: userId}).populate({path: 'outfits',match: filters,options: {sort: '-createdAt',limit: itemsPerPage,skip: itemsPerPage*(page-1)}});
        
        res.status(200).json({
            outfits: user?.outfits,
            lastPage: lastPage
        })
    }catch(err) {
        next(err)
    }
}

export const deleteOutfit = async (req: IRequest,res: Response,next: NextFunction) => {
    try {
        if(req.error) {
            throw req.error;
        }
        const outfitId = req.params.id;
        const userId = req.userId;
        const outfit = await Outfit.findById(outfitId);

        if(!outfit) {
            handleError('OUTFIT DOESNT EXIST ',404);
        }

        if(userId.toString() !== outfit!.creator._id!.toString()) {
            handleError('USER NOT AUTHORISED ',401);
        }

        clearFile(outfit!.imageUrl);

        await User.findOneAndUpdate({_id: userId},{$pull: {'outfits': {_id: outfitId}}})
        await Outfit.deleteOne({_id: outfitId});

        res.status(200).json({
            outfit: outfit,
            message: 'OUTFIT DELETED!'
        })
    } catch(err) {
        next(err)
    }
}


function clearFile(filePath: string) {
    const thePath = path.join(__dirname,'..','..',filePath);
    fs.unlink(thePath,(err) => {
    })
}


export const makePayment = async (req: IRequest,res:Response,next: NextFunction) => {
    try {
        if(req.error) {
            throw req.error;
        }
        const outfitId = req.params.id;
        // if the item is from the cart and there are multiple items to be bought
        let user = null; 
        const cartItemId = req.body.cartItemId ? req.body.cartItemId.toString() : null;
        const amount = +req.body.amount;
        let count = +req.body.count || 1;

        if(cartItemId) {
            user = await User.findOne({_id: req.userId}).populate({path: 'cart'});
            let found = false;
            for(let i = 0; i< user!.cart.length; i++) {
                let c = user!.cart[i];
                if(c._id!.toString() === cartItemId) {
                    found = c.outfit._id.toString() == outfitId;
                    break;
                }
            }
            if(!found) handleError('Something Went Wrong!',401);
        }
        const outfit = await Outfit.findOne({_id: outfitId});
        
        if(!outfit) handleError("Item doesn't exist!",404);

        const calculatedAmount = count*+outfit!.price;
          
        if(amount !== calculatedAmount) {
            handleError("Something Went Wrong",500);
        }
        payWithStripe(amount,req.body.token);

        if(cartItemId) {
            const itemsToBeRemovedIds: {[key: string]: boolean} = {};
            itemsToBeRemovedIds[cartItemId] = true;
            const newCart = getTheFilteredCart(user!.cart,itemsToBeRemovedIds);
            user!.cart = newCart;
            await user!.save()
        } 

        res.json({success: true, status: 'Payment Completed'});
        
    } catch(err) {
        next(err);
    }
}

export const makeCartPayment = async (req: IRequest,res:Response,next: NextFunction) => {
    try {
        if(req.error) {
            throw req.error;
        }
        const userId = req.userId;
        const user = await User.findOne({_id: userId}).populate({path: 'cart.outfit'});
        const cart = user!.cart;
        const itemsMoreThanInStock: {[key: string]: boolean} = {};
        let totalPrice = 0;
        for(let item of cart) {
            if(item.count > item.outfit.stockCount) {
                itemsMoreThanInStock[item._id!.toString()] = true;
            } else {
                totalPrice += +item.count*(+item.outfit.price);
            }
        }
        if(+req.body.amount !== totalPrice) {
            handleError('Something Went Wrong!',401);
        }

        payWithStripe(totalPrice,req.body.token);

        const newCart = cart.filter(c => {
            return itemsMoreThanInStock[c._id!.toString()];
        })

        user!.cart = newCart;

        await user?.save();

        res.status(200).json({success: true, status: 'Payment Completed'});
    } catch(err) {
        next(err);
    }
}


const payWithStripe = async (amount: number,token: any) => {
    const result = await stripe.charges.create({
        amount: amount*100,
        currency: 'INR',
        description: 'Payment For the Item',
        source: token.id
    })

    return result;
}
