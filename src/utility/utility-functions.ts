
export const getTheFilteredCart = (cart: any[],itemsToBeRemovedIds: {[key: string]: boolean}) => {
    const newCart = cart.filter(item => {
        return !itemsToBeRemovedIds[(item._id)!.toString()];
        // return item._id!.toString() !== cartItemId;
    })
    return newCart;
}