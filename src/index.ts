import {Context} from "./Http/Context";
import {Request} from "./Http/Request";
import {Response} from "./Http/Response";
import {StatusCodes} from "./Http/StatusCodes";
import {TestingMiddleware} from "./Middleware/TestingMiddleware";
import {Router} from "./Routing/Router";
import {HttpMethod} from "./Routing/RouterTypes";
import {HttpServer} from "./Server";

const server = new HttpServer();

const testHandler = async (request: Request, response: Response) => {
	return {
		message : 'Hello World!'
	};
};

Router
	.get('/hello', (request: Request, response: Response) => {
		return {
			message       : `Hello world from non async handler.`,
			testRequestId : Context.get().testId,
		};
	})
	.middleware(TestingMiddleware);

Router.get('/hello/:name?', async (request: Request, response: Response) => {
	return {message : `Hello ${request.route().parameter('name', 'World!!!')}`};
});

Router.get('/register', async (request: Request, response: Response) => {
	try {
		Router.register(
			Router.get('/registered', async (request: Request, response: Response) => {
				return {message : 'Hello from registered.'};
			})
		);
	} catch (error) {
		return new Response(StatusCodes.BAD_REQUEST).withData({message : error.message});
	}

	return {success : Router.has(HttpMethod.GET, '/registered')};
});

Router.get('/is-registered', async (request: Request, response: Response) => {
	return {status : Router.has(HttpMethod.GET, '/registered')};
});

Router.get('/remove', async (request: Request, response: Response) => {
	Router.removeRouteRegistration(HttpMethod.GET, '/registered');

	return {status : Router.has(HttpMethod.GET, '/registered')};
});


server.listen(3333);
