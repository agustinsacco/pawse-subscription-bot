import puppeteer, { Page } from 'puppeteer';
import { Subscription } from '../entities/subscription';
import { getCheckoutFrame, getInputInFrame, getPaymentIframe } from '../utils/frame';
import { wait } from '../utils/wait';


export class PawsePurchase {
    private subscription: Subscription;
    private screenshotsEnabled: boolean = false;
    
    constructor(subscription: Subscription) {
        this.subscription = subscription;
    }

    public async run(): Promise<void> {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: true,
            defaultViewport: null,
            args: [
                '--no-sandbox'
            ]
        });

        try {
            /* ------------- SETUP ------------- */
            console.log(`------ Subscription "${this.subscription.name}" is starting ------- `);
            console.log('Creating incognito browser context...');
            const context = await browser.createIncognitoBrowserContext();
            const page = await context.newPage();

            /* ------------- LOGIN PAGE ------------- */
            console.log('Login process started...');

            await page.goto('https://boutique.pawse.ca/en/account/login/');
            await wait(1);

            await page.type('input[name=email]', this.subscription.credentials.email, { delay: 20 });
            await page.type('input[name=password]', this.subscription.credentials.password, { delay: 20 });
            await page.click('#gui-form > div > div.gui-block-content > div > div.gui-buttons > div.gui-right > a');

            console.log('Login process complete...');
            await this.takeScreenshot(page, '/code/screenshots/login-process.png');

            await wait(2);

            /* ------------- PRODUCT PAGE ------------- */
            console.log('Add to cart process started...');

            // Add items to cart
            for (const product of this.subscription.products) {
                // Navigate to page
                await page.goto(product.url);
                await wait(3);
                // Set quantity
                await page.$eval('input[name=quantity]', (el: any, value: any) => el.value = value, product.quantity.toString());
                // Click add to cart
                await page.click('.cart a.btn');
            }
            console.log('Add to cart process complete...');
            await this.takeScreenshot(page, '/code/screenshots/addtocart-process.png');
            
            /* ------------- CHECKOUT PAGE ------------- */

            console.log('Checkout process started...');
            await page.goto('https://boutique.pawse.ca/en/checkouts/');
            await wait(7);

            await this.takeScreenshot(page, '/code/screenshots/checkout-process-1.png');

            // Find checkout frame
            const checkoutFrame = await getCheckoutFrame(page);

            if (!checkoutFrame) {
                console.log('Checkout frame not found');
                await browser.close();
                return;
            }

            await wait(10);
            // Set delivery shipping
            await checkoutFrame.click('[data-testid="external|liquid-delivery|delivery_schedule_1070_148"]');
            await wait(1);
            await checkoutFrame.click('section[data-testid="shippingMethod"] button');

            await this.takeScreenshot(page, '/code/screenshots/checkout-process-2.png');

            await wait(2);

            // Open credit card form
            await checkoutFrame.click('[data-testid="lightspeedpayments-creditcard"]');
            await wait(6);

            // Get payment frame
            const paymentFrame = await getPaymentIframe(checkoutFrame);
            if (!paymentFrame) {
                console.log('Payment frame not found');
                await browser.close();
                return;
            }

            const creditCardInputHandle = await getInputInFrame(paymentFrame, 'cardnumber');
            if (!creditCardInputHandle) {
                console.log('Credit card input not found');
                await browser.close();
                return;
            }
            await creditCardInputHandle.type(this.subscription.creditCard.cardNumber, { delay: 20 });

            const expiryInputHandle = await getInputInFrame(paymentFrame, 'exp-date');
            if (!expiryInputHandle) {
                console.log('Expiry input not found');
                await browser.close();
                return;
            }
            await expiryInputHandle.type(this.subscription.creditCard.expiry, { delay: 20 });

            const cvcInputHandle = await getInputInFrame(paymentFrame, 'cvc');
            if (!cvcInputHandle) {
                console.log('Cvc input not found');
                await browser.close();
                return;
            }
            await cvcInputHandle.type(this.subscription.creditCard.cvc, { delay: 20 });

            await this.takeScreenshot(page, '/code/screenshots/checkout-process-3.png');

            await wait(1);

            console.log('Checkout submit process started...');

            // Submit checkout on checkout frame
            await checkoutFrame.click('button[type="submit"]');
            await this.takeScreenshot(page, '/code/screenshots/checkout-process-4.png');


            await wait(10);
            await this.takeScreenshot(page, '/code/screenshots/checkout-process-5.png');

            console.log('Checkout submit process complete...');
            console.log(`------ Subscription "${this.subscription.name}" is complete! ------- `);
            await browser.close();
        } catch (err) {
            console.log(err);
            await browser.close();
        }
        
    }

    private async takeScreenshot(page: Page, path: string): Promise<void> {
        if (this.screenshotsEnabled) {
            await page.screenshot({ path: path });
        }
    }
}