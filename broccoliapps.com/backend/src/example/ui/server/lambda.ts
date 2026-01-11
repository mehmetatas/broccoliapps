import { app } from "../../app"; // init app
import "./handlers"; // register handlers to app

export const handler = app.lambdaHandler();
