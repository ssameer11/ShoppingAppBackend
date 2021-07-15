import { NextFunction, Response } from "express";
import { IRequest } from "../middleware/is-auth";
import Outfit from '../model/outfit';
import { Types } from 'mongoose';
import { validationResult } from "express-validator";
import { handleError } from "../exceptions/httpException";
import User from "../model/user";
import { getTheFilteredCart } from "../utility/utility-functions";

export const getOutfits  = async (req: IRequest,res: Response,next: NextFunction) => {
    const page = +req.query.page! || 1;
    const itemsPerPage = +req.query.itemsPerPage! || 5;
    const filters:{[key: string]: any} = {};
    if(req.query.title) {
        filters.title = new RegExp(`^${req.query.title}$`, 'i');
    }

    if(req.query.category) {
        filters.category = req.query.category;
    }

    try {
        const totalOutfits = await Outfit.countDocuments(filters);
        const lastPage = Math.ceil(totalOutfits/itemsPerPage);
        const outfits = await Outfit.find(filters).skip(itemsPerPage*(page-1)).limit(itemsPerPage).sort({createdAt: -1});
        res.status(200).json({
            outfits: outfits,
            lastPage: lastPage
        })
    }catch(err) {
        next(err)
    }
}

export const addToCart = async (req: IRequest,res: Response,next: NextFunction) => {
    const error = validationResult(req);
    try {
        if(req.error) {
            throw req.error;
        }
        if(!error.isEmpty()) {
            handleError(error.array()[0].msg,500);
        }

        const outfitId = req.body.outfitId;
        const count: number = +req.body.count;
        const userId = req.userId;
        const user = await User.findOne({_id: userId});
        const outfit = await Outfit.findOne({_id: outfitId});
        
        if(!user || !outfit) {
            handleError('USER OR OUTFIT NOT FOUND ',401);
        }

        
        let cartItem = {
            outfit: outfit!,
            count: count
        }

        let found = false;
        for(let i = 0; i< user!.cart.length; i++) {
            let c = user!.cart[i];
            if(c.outfit._id.toString() == outfitId) {
                c.count += count
                found = true;
                break;
            }
        }

        if(!found) {
            user!.cart.push(cartItem);
        }

     

        const savedUser = user?.save();
        res.status(200).json({
            message: 'SOMETHING WENT RIGHT OR WRONG I DONT KNOW ',
            user: savedUser
        })

    }catch(err) {
        next(err);
    }
}


export const getCart = async (req: IRequest,res: Response,next: NextFunction) => {
    const userId = req.userId;
    try {
        if(req.error) {
            throw req.error;
        }

        const result = await User.aggregate([
            {"$match": {_id: Types.ObjectId(userId)}},
            {
                "$unwind":"$cart"
            },
            {
                "$sort": {
                    "cart.updatedAt": -1
                }
            },
            {
                "$group": {
                    "_id":"$_id",
                    "cart": {
                        "$push": "$cart"
                    }
                }
            }
        ])

        const populatedData = (await Outfit.populate(result,{path: 'cart.outfit'}))[0] as any;
        let populatedCart = [];
        if(populatedData) {
            populatedCart = populatedData.cart;
        }
        if(!populatedCart) {
           handleError('USER NOT FOUND !',404);
        }


        res.status(200).json({
            cart: populatedCart,
            message: 'this is the cart '
        })
    } catch(err) {
        next(err);
    }

}

export const updateCart = async (req: IRequest,res: Response,next: NextFunction) => {
    const itemsToBeUpdated = req.body.itemsToBeUpdated as {[key: string]: {updatedCount: number}};
    const userId = req.userId;
    if(!itemsToBeUpdated) {
        return res.send();
    }

    try {
        if(req.error) {
            throw req.error;
        }
        const user = await User.findOne({_id: userId}).populate({path: 'cart'});
        if(!user) {
            handleError('USER NOT FOUND !',404);
        }
        const cart = user!.cart;

        for(let i = 0; (i < cart.length && Object.keys(itemsToBeUpdated).length !== 0); i++) {
            let currentItem = cart[i];
            let currentId = (cart[i]._id)!.toString();
            if(itemsToBeUpdated[currentId]) {
                currentItem.count = itemsToBeUpdated[currentId].updatedCount;
                delete itemsToBeUpdated[currentId];
            }
        }
        

        const savedUser = await user!.save();

        res.json({
            message: 'CART UPDATED SUCCESSFULLY !'
        })
    } catch(err) {
        next(err);
    }
    
}

export const removeFromCart = async (req: IRequest,res: Response,next: NextFunction) => { 
    const userId = req.userId;
    const itemsToBeRemovedIds: {[key: string]: boolean} = req.body.id;
    try {
        if(req.error) {
            throw req.error;
        }
        const user = await User.findOne({_id: userId}).populate({path: 'cart.outfit'});
        if(!user) {
            handleError('USER NOT FOUND ',404);
        }

        const newCart = getTheFilteredCart(user!.cart,itemsToBeRemovedIds);
        const theResult = await user!.populate({path: 'cart',options: {sort: "-updatedAt"}})
        user!.cart = newCart;

        const savedUser = await user?.save();
        res.json({message: 'ITEM SUCCESSFULLY REMOVED !' , cart: savedUser?.cart});
        
    }catch(err) {
        next(err);
    }
}