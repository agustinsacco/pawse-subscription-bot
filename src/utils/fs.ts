import fs from 'fs';

export const cleanScreenshots = () => {
    fs.rmSync('./screenshots', { recursive: true });
    fs.mkdirSync('./screenshots');
}