import * as express from "express";
import { NextFunction, Request, Response, Express } from "express-serve-static-core";
import * as http from "http";
import Config from '../utils/Config';
import Logger from '../utils/Logger';
import * as historyApiFallback from 'connect-history-api-fallback';

export default class HTTPServer {

	private app:Express;

	constructor(public port:number) {
		this.app = <Express>express();

		this.app.use(historyApiFallback({
			index:'/'+Config.SERVER_NAME+"/index.html",
			publicPath: Config.PUBLIC_PATH,
			// verbose:true,
			rewrites: [
				{
					//Avoiding rewrites for API calls and socket
					from: /.*\/(api|sock)\/?.*$/,
					to: function(context) {
						return context.parsedUrl.pathname;
					}
				}
			],
		}));
		
		this.doPrepareApp();
	}

	protected initError(error: any): void {
		Logger.error("Error happened !", error);
	}

	protected doPrepareApp(): void {
		let server = new http.Server(<any>this.app);
		server.listen(this.port, "localhost", null, ()=> {
			Logger.success("Server ready on port " + Config.SERVER_PORT + " :: server name \"" + Config.SERVER_NAME + "\"");
		});

		let publicFolder = Config.PUBLIC_PATH;
		this.app.use(Config.SERVER_NAME+"/", express.static(publicFolder));//static files
		
		this.app.use((error : any, request : Request, result : Response, next : NextFunction) => {
			this.errorHandler(error , request, result, next)
		});
	}


	protected errorHandler(error: any, req: Request, res: Response, next: NextFunction): any {
		Logger.error("Express error");
		console.log(error)
	}

	private onReady(): void {
		
	}
}