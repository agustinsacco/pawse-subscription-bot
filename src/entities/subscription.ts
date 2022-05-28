export type Subscription = {
    name: string;
    schedule: string[];
    credentials: {
        email: string;
        password: string;
    },
    creditCard: {
        cardNumber: string;
        expiry: string;
        cvc: string;
    },
    products: Product[]
}

export type Product = {
    url: string;
    quantity: number;
}
