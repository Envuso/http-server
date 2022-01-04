import {AsyncLocalStorage} from "async_hooks";
import {HTTPMethod} from "find-my-way";
import http, {Server, IncomingMessage, ServerResponse} from 'http';
import {Context} from "./Http/Context";
import {Request} from "./Http/Request";
import {Response} from "./Http/Response";
import {Router} from "./Routing/Router";

let instance: HttpServer = null;

export class HttpServer {

	private server: Server;

	private requestId: number = 0;

	constructor() {
		if (instance) {
			return instance;
		}

		this.server = http.createServer(this.handle.bind(this));

		instance = this;
	}

	public static getInstance(): HttpServer {
		return instance;
	}

	handle(req: IncomingMessage, res: ServerResponse) {
		this.requestId++;

		const request = new Request(req);
		request.setRequestId(this.requestId);

		const response   = new Response();
		response.request = request;
		response.raw     = res;

		const route = Router.getHandlerForRequest(request);

		if (!route) {
			res.writeHead(404, {'content-type' : 'application/json'});
			res.write(Buffer.from(JSON.stringify({message : 'Not found'})));
			res.end();
			return;
		}

		try {
			Context.create(request, response, () => {
				route.handleRequest(request, response);
			});
		} catch (error) {
			res.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
		}
	}

	listen(port: number) {
		this.server.listen(port);
		this.server.on('error', (error) => console.error(`Server error handler: `, error));
		this.server.on('clientError', (err, socket) => {
			socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
		});
		this.server.on('listening', () => {
			const address = this.server.address();
			console.log(`Running on: http://127.0.0.1:${port}`, address);
		});

		Router.initialiseRoutes();
	}

}


