import {Context} from "../Http/Context";
import {Request} from "../Http/Request";
import {Response} from "../Http/Response";

export class Middleware {

	async before(request: Request, response: Response, context: Context): Promise<[Request, Response]> {
		return [request, response];
	}

	async after(request: Request, response: Response, context: Context): Promise<[Request, Response]> {
		return [request, response];
	}

}
