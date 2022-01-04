import {Context} from "../Http/Context";
import {Request} from "../Http/Request";
import {Response} from "../Http/Response";
import {Middleware} from "./Middleware";

export class TestingMiddleware extends Middleware {

	async before(request: Request, response: Response, context: Context): Promise<[Request, Response]> {
		console.log('Hello from before', request.requestId, context.testId);
		console.log('New context request id: ', context.testId++);
		return [request, response];
	}

	async after(request: Request, response: Response, context: Context): Promise<[Request, Response]> {
		console.log('Hello from after', request.requestId, context.testId);
		console.log('New context request id is: ', context.testId);
		return [request, response];
	}

}
