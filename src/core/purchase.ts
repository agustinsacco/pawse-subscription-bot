import { retry } from 'async-retry-decorator';
import puppeteer, { Browser, Page } from 'puppeteer';
import { Subscription } from '../entities/subscription';
import { CartContextError, CheckoutContextError, CreateContextError, LoginContextError } from '../utils/errors';
import { getCheckoutFrame, getInputInFrame, getPaymentIframe } from '../utils/frame';
import { cleanScreenshots } from '../utils/fs';
import { wait } from '../utils/wait';


export class PawsePurchase {
    private subscription: Subscription;
    private couponCode: string;
    private screenshotsEnabled: boolean = true;
    private headless: boolean = true;
    private logsEnabled: boolean = false;

    constructor(subscription: Subscription, couponCode: string) {
        this.subscription = subscription;
        this.couponCode = couponCode;
    }

    private async createContext(): Promise<{ browser: Browser, page: Page }> {
        try {
            const browser = await puppeteer.launch({
                executablePath: '/usr/bin/google-chrome',
                headless: this.headless,
                defaultViewport: null,
                args: [
                    '--no-sandbox',
                    '--start-fullscreen'
                ]
            });

            const context = await browser.createIncognitoBrowserContext();
            const page = await context.newPage();

            const deviceWidth = 1920;
            const deviceHeight = 1080;
            await page.setViewport({width: deviceWidth, height: deviceHeight})
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');        

            // Log errors on console
            if (this.logsEnabled) {
                page
                    .on('console', message =>
                        console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`))
                    .on('pageerror', ({ message }) => console.log(message))
                    .on('requestfailed', request =>
                        console.log(`${request.failure().errorText} ${request.url()}`))
            }

            return { browser, page };
        } catch (err) {
            console.log(err)
            throw new CreateContextError('Cloud not create browser context');
        }
    }

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

    private async runCart(page: Page): Promise<void> {
        try {
            // First lets clear the cart
            // Search for first element to remove items from cart
            let removeBtns = await page.$$('.gui-action-delete');
            // Keep removing first item until removeBtns is null (after last render)
            while (removeBtns && removeBtns.length > 0) {
                // Click first item to remove from cart
                await removeBtns[0].click();
                await page.waitForNavigation({ waitUntil: 'networkidle2' });
                // Find buttons again
                removeBtns = await page.$$('.gui-action-delete');
            }

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
            // await this.takeScreenshot(page, 'cart-process-error.png');
            console.log(err);
            throw new CartContextError('Could not add items to cart')
        }
    }

    private async runCheckout(page: Page): Promise<void> {
        try {
            console.log('Checkout process started...');
            await page.goto('https://boutique.pawse.ca/en/checkouts/');
            await wait(5);

            await this.takeScreenshot(page, 'checkout-process-1.png');

            // Find checkout frame
            const checkoutFrame = await getCheckoutFrame(page);

            if (!checkoutFrame) {
                throw new CheckoutContextError('Main checkout iframe not found.');
            }

            await wait(10);

            // Add coupon code
            // Find coupon code dropdown link by xpath
            const couponDropdownBtn = await checkoutFrame.$x("//h4[contains(text(), 'Add a discount code or gift card')]");
            await couponDropdownBtn[0].click();
            await checkoutFrame.type('aside input[placeholder="Enter discount code"]', this.couponCode, { delay: 20 });
            await checkoutFrame.click('aside button[type="button"]');

            await wait(5);

            // Set delivery shipping
            // First check if delivery is already pre-set
            let deliveryOption = await page.$$('[data-testid="external|liquid-delivery|delivery_schedule_1070_148"]');
            if (!deliveryOption) {
                console.log('delivery option does not exist, must alread be set');
                await checkoutFrame.click('[data-testid="external|liquid-delivery|delivery_schedule_1070_148"]');
                await wait(5);
                await checkoutFrame.click('section[data-testid="shippingMethod"] button');
            }
            console.log('Set shipping method as delivery...');
            await this.takeScreenshot(page, 'checkout-process-2.png');

            await wait(3);

            // Open credit card form
            await checkoutFrame.click('[data-testid="lightspeedpayments-creditcard"]');
            console.log('Clicked credit card payment option...');

            await wait(5);
            // Get payment frame
            const paymentFrame = await getPaymentIframe(checkoutFrame);
            if (!paymentFrame) {
                throw new CheckoutContextError('Payment frame within checkout frame was not found.');
            }

            console.log('Clicked credit card payment frame opened. Entering data...');

            await wait(6);
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


    @retry({
        retries: 0,
        onRetry: (error: any, attempt: any) => {
            console.log(`Retry (${attempt}) on error running purchase. Retrying now`, error.message);
        },
    })
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
                    path: `./screenshots/${filename}`,
                    fullPage: true
                });
            }
        } catch (err) {
            console.log('error taking screenshot', err)
        }

    }
}