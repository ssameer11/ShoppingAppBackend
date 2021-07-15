// export class User {
//     constructor(public email: string,
//                 public userId: string,
//                 public _token: string,
//                 public _tokenExpirationDate: Date
//                 ) {}

//     get token(): (string | null) {
//         if(!this._token || (new Date() > this._tokenExpirationDate)) {
//             return null
//         }
//         return this._token;
//     }
// }

export interface AuthResponse {
    email: string,
    userId: string,
    _token: string,
    _tokenExpirationDate: Date
}