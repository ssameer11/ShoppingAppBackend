import {Schema , model, Model,Document, Types} from 'mongoose';
import User, { IUser } from './user';

export interface IOutfit extends Document {
    title: string,
    description: string,
    imageUrl: string,
    price: number,
    stockCount: number,
    rating: number,
    instructions: [string,string][],
    category: string,
    createdAt: any,
    updatedAt: any,
    creator: IUser
}

export interface IOutfitModel extends Model<IOutfit> {

}

const outfitSchema = new Schema<IOutfit>({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stockCount: {
        type: Number,
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    instructions: [
        [{type: String},{type: String}]
    ],
    category: {
        type: String,
        required: true
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
},{timestamps: true})


// const Outfit: Model<IOutfit> = 

const Outfit: Model<IOutfit> = model('Outfit',outfitSchema);

export default Outfit;

// export default model('Outfit',outfitSchema);;