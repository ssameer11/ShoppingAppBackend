import express, {json,NextFunction,Request,Response,urlencoded} from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { HttpException } from './exceptions/httpException';
import { MONGOOSE_DATABASE_KEY } from './keys/keys';
import authRoutes from './routes/auth';
import sellersRoutes from './routes/sellers';
import path from 'path';
import customersRoutes from './routes/customers';
import sharedRoutes from './routes/shared';

const app = express();

app.use('/static',express.static(path.join(__dirname,'images')));
app.use(json());
app.use(urlencoded());
app.use(cors());
app.use('/auth',authRoutes);
app.use('/sellers',sellersRoutes);
app.use('/customers',customersRoutes);
app.use('/shared',sharedRoutes);

app.use((error: HttpException,req: Request,res: Response,next: NextFunction) => {
    let statusCode = error.statusCode | 500;
    res.status(statusCode).json({
        message: error.message
    })
})

async function dbConnect() {
    try {
        const connection = await mongoose.connect(MONGOOSE_DATABASE_KEY);
        app.listen(3000);
        console.log('SERVER STARTED! from the await funtion ');
    } catch(err) {
        console.log(err)
    }
}

dbConnect();