import { retry } from 'async-retry-decorator';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Subscription } from '../entities/subscription';
import { CartContextError, CheckoutContextError, CreateContextError, LoginContextError } from '../utils/errors';
import { getCheckoutFrame, getInputInFrame, getPaymentIframe } from '../utils/frame';
import { cleanScreenshots } from '../utils/fs';
import { wait } from '../utils/wait';


export class PawsePurchase {
    private subscription: Subscription;
    private screenshotsEnabled: boolean = true;
    private headless: boolean = true;

    constructor(subscription: Subscription) {
        this.subscription = subscription;
    }

    @retry({
        retries: 2,
        onRetry: (error: any, attempt: any) => {
            console.log(`Retry (${attempt}) on error within createContext`, error.message);
        },
    })
    private async createContext(): Promise<{ browser: Browser, page: Page }> {
        try {
            const browser = await puppeteer.launch({
                executablePath: '/usr/bin/chromium',
                headless: this.headless,
                defaultViewport: null,
                args: [
                    '--no-sandbox'
                ]
            });

            const context = await browser.createIncognitoBrowserContext();
            const page = await context.newPage();
            return { browser, page }
        } catch (err) {
            throw new CreateContextError('Cloud not create browser context');
        }
    }

    @retry({
        retries: 2,
        onRetry: (error: any, attempt: any) => {
            console.log(`Retry (${attempt}) on error within runLogin`, error.message);
        },
    })
    private async runLogin(page: Page): Promise<void> {
        try {
            console.log('Login process started...');
            await page.goto('https://boutique.pawse.ca/en/account/login/');
            await wait(2);

            await page.type('input[name=email]', this.subscription.credentials.email, { delay: 20 });
            await page.type('input[name=password]', this.subscription.credentials.password, { delay: 20 });
            await page.click('#gui-form > div > div.gui-block-content > div > div.gui-buttons > div.gui-right > a');

            console.log('Login process complete...');
            await wait(2);
            await this.takeScreenshot(page, 'login-process.png');
        } catch (err) {
            await this.takeScreenshot(page, 'login-process-error.png');
            throw new LoginContextError('Could not login');
        }
    }

    @retry({
        retries: 2,
        onRetry: (error: any, attempt: any) => {
            console.log(`Retry (${attempt}) on error within runCart`, error.message);
        },
    })
    private async runCart(page: Page): Promise<void> {
        try {
            for (const product of this.subscription.products) {
                // Navigate to page
                await page.goto(product.url);
                await wait(3);
                // Set quantity
                await page.$eval('input[name=quantity]', (el: any, value: any) => el.value = value, product.quantity.toString());
                // Click add to cart
                await page.click('.cart a.btn');
                await wait(1);
            }
            await this.takeScreenshot(page, 'cart-process.png');
        } catch (err) {
            await this.takeScreenshot(page, 'cart-process-error.png');
            throw new CartContextError('Could not add items to cart')
        }
    }

    @retry({
        retries: 2,
        onRetry: (error: any, attempt: any) => {
            console.log(`Retry (${attempt}) on error within runCheckout`, error.message);
        },
    })
    private async runCheckout(page: Page): Promise<void> {
        try {
            console.log('Checkout process started...');
            await page.goto('https://boutique.pawse.ca/en/checkouts/');
            await wait(15);

            await this.takeScreenshot(page, 'checkout-process-1.png');

            // Find checkout frame
            const checkoutFrame = await getCheckoutFrame(page);

            if (!checkoutFrame) {
                throw new CheckoutContextError('Main checkout iframe not found.');
            }

            await wait(15);
            // Set delivery shipping
            await checkoutFrame.click('[data-testid="external|liquid-delivery|delivery_schedule_1070_148"]');
            await wait(5);
            await checkoutFrame.click('section[data-testid="shippingMethod"] button');

            await this.takeScreenshot(page, 'checkout-process-2.png');

            await wait(5);

            // Open credit card form
            await checkoutFrame.click('[data-testid="lightspeedpayments-creditcard"]');
            await wait(15);

            // Get payment frame
            const paymentFrame = await getPaymentIframe(checkoutFrame);
            if (!paymentFrame) {
                throw new CheckoutContextError('Check payment frame within checkout frame was not found.');

            }

            // Credit card
            const creditCardInputHandle = await getInputInFrame(paymentFrame, 'cardnumber');
            if (!creditCardInputHandle) {
                throw new CheckoutContextError('Credit card iframe within payment frame not found.');

            }
            await creditCardInputHandle.type(this.subscription.creditCard.cardNumber, { delay: 20 });

            // Expiry date
            const expiryInputHandle = await getInputInFrame(paymentFrame, 'exp-date');
            if (!expiryInputHandle) {
                throw new CheckoutContextError('Expiry iframe within payment frame not found.');
            }
            await expiryInputHandle.type(this.subscription.creditCard.expiry, { delay: 20 });

            // CVC
            const cvcInputHandle = await getInputInFrame(paymentFrame, 'cvc');
            if (!cvcInputHandle) {
                throw new CheckoutContextError('CVC iframe within payment frame not found.');
            }
            await cvcInputHandle.type(this.subscription.creditCard.cvc, { delay: 20 });

            await this.takeScreenshot(page, 'checkout-process-3.png');
            await wait(2);

            console.log('Checkout submit process started...');

            // Submit checkout on checkout frame
            await checkoutFrame.click('button[type="submit"]');
            await this.takeScreenshot(page, 'checkout-process-4.png');
            await wait(1);


            await wait(10);
            await this.takeScreenshot(page, 'checkout-process-5.png');
            await wait(1);

            console.log('Checkout submit process complete...');

        } catch (err) {
            await this.takeScreenshot(page, 'checkout-process-error.png');
            throw err;
        }
    }


    public async run(): Promise<void> {
        let browser: Browser = null;
        let page: Page = null;

        try {
            // Clean screenshots before run
            cleanScreenshots();

            const context = await this.createContext();
            browser = context.browser;
            page = context.page;

            await this.runLogin(page);
            await this.runCart(page);
            await this.runCheckout(page);

            // Clean up
            await browser.close();
        } catch (err: any) {
            if (browser) {
                await browser.close();
            }
            throw err;
        }
    }

    private async takeScreenshot(page: Page, filename: string): Promise<void> {
        try {
            if (this.screenshotsEnabled) {
                await page.screenshot({ 
                    path: `./screenshots/${filename}` ,
                    fullPage: true
                });
            }
        } catch (err) {
            console.log('error taking screenshot', err)
        }

    }
}