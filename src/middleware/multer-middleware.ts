import { Request } from 'express';
import multer from 'multer';
import path from 'path';

const fileStorage = multer.diskStorage({
    destination: (req: Request,file: any,cb: Function) => {
        cb(null,'./dist/images');
    },
    filename: (req: Request,file: any,cb: Function) => {
        cb(null,new Date().toISOString().replace(/:/g,'-') + '-'+file.originalname);
    }
})

const fileFilter = (req: Request,file: {mimetype: string},cb: Function) => {
    if( file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/png') {
            cb(null,true);
    } else {
        cb(null,false);
    }
}

export const multerUpload = multer({storage: fileStorage, fileFilter: fileFilter}).single('image');
// const upload = multer()