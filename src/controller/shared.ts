import {Response, NextFunction } from "express";
import { IRequest } from "../middleware/is-auth";
import Outfit from '../model/outfit';

export const getOutfit = async (req: IRequest,res: Response,next: NextFunction) => {
    const outfitId = req.params.id;
    try {
        const fetchedOutfit = await Outfit.findById(outfitId).populate('creator');

        res.status(200).json({
            outfit: fetchedOutfit!
        })
    } catch(err) {
        next(err)
    }
}