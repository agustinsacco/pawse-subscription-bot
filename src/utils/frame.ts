import { Frame, Page } from "puppeteer";

export const getCheckoutFrame = async (page: Page) => {
    for (const f of page.mainFrame().childFrames()) {
        const title = await f.title();
        if (title.includes('Lightspeed Checkout')) {
            return f;
        }
    }
}

export const getPaymentIframe = async (frame: Frame) => {
    for (const f of frame.childFrames()) {
        const title = await f.title();
        const name = await f.name();
        const url = await f.url();
        if (title.includes('Payment Card Tokenization Service')) {
            return f;
        }
    }
}

export const getInputInFrame = async (frame: Frame, inputName: string) => {
    for (const f of frame.childFrames()) {
        const input = await f.$(`input[name=${inputName}]`);
        if (input) {
            return input;
        }
    }
};