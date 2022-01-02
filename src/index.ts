import {Route} from "./Routing/Route/Route";
import {HttpMethod} from "./Routing/RouterTypes";
import {Request} from "./Http/Request";
import {Response} from "./Http/Response";
import {HttpServer} from "./Server";

const server = new HttpServer();

const testHandler = async (request: Request, response: Response) => {
	return {
		message : 'Hello World!'
	};
};

Route.prefix('yeet').middleware('yeet').get('/hello', testHandler);

Route.get('/hello', testHandler).middleware('yeet');

Route.get('/register', async (request: Request, response: Response) => {

	server.getRouter().registerRoute(
		Route.get('/registered', async (request: Request, response: Response) => {
			return {message : 'Hello from registered.'};
		})
	)

	return {success : Route.hasRoute(HttpMethod.GET, '/registered')};
});

Route.get('/is-registered', async (request: Request, response: Response) => {
	return {status : Route.hasRoute(HttpMethod.GET, '/registered')};
});

Route.get('/remove', async (request: Request, response: Response) => {
	Route.removeRoute(HttpMethod.GET, '/registered');

	return {status : Route.hasRoute(HttpMethod.GET, '/registered')};
});


server.listen(3333);
