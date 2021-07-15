import {Schema, model, Document, Model, Types} from 'mongoose';
import { IOutfit } from './outfit';

export interface IUser extends Document{
    email: string,
    password: string,
    name: string,
    outfits: IOutfit[],
    cart: {outfit: IOutfit,count: number,_id?: Types.ObjectId}[],
    _id?: Types.ObjectId
}

export interface IUserModel extends Model<IUser> {

}


const userSchema = new Schema<IUser>({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    outfits: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Outfit'
        }
    ],
    cart: [
        {
            type: new Schema({
                outfit: {
                    type: Schema.Types.ObjectId,
                    ref: 'Outfit'
                },
                count: {
                    type: Number
                }
            },{timestamps: true})
        }
    ]
},{timestamps: true})

const User: Model<IUser> = model('User',userSchema);

export default User;