import {HTTPMethod} from "find-my-way";
import http, {Server, IncomingMessage, ServerResponse} from 'http';
import {HttpRouter} from "./Routing/HttpRouter";

let instance: HttpServer = null;

export class HttpServer {
	private server: Server;
	private router: HttpRouter = new HttpRouter();

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

	getRouteRegistrar() {
		return this.router.getRouteRegistrar();
	}

	getRouter() {
		return this.router;
	}

	handle(req: IncomingMessage, res: ServerResponse) {
		const route = this.router.get().find(<HTTPMethod>req.method, req.url);

		if (!route) {
			res.writeHead(404, {'content-type' : 'application/json'});
			res.write(Buffer.from(JSON.stringify({message : 'Not found'})));
			res.end();
			return;
		}


		try {
			route.handler(req, res, route.params, {});
		} catch (error) {
			res.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');
		}

		console.log(req.url);

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

		this.getRouter().initialiseRoutes();
	}

}


