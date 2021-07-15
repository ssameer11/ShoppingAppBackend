export class HttpException extends Error{
    message: string;
    statusCode: number;
    data?: any
    constructor(message: string,statusCode: number,data?: any) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.data = data
    }
}

export function handleError(message: string,statusCode: number,data?: any) {
    // throw new HttpException(message,statusCode);
    throw new HttpException(message,statusCode,data);
}