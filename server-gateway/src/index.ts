import { App } from './app';

export const app = new App
app.init().catch(console.error);
