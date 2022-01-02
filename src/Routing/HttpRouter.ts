import is from '@sindresorhus/is';
import Router from "find-my-way";
import {IncomingMessage, ServerResponse} from "http";
import {Request} from "../Http/Request";
import {Response} from "../Http/Response";
import {RouteRegistrar} from "./RouteRegistrar";
import {HttpMethod, RequestHandlerMethod} from "./RouterTypes";
import {Route} from "./Route/Route";

const FindMyWay = require('find-my-way');

export class HttpRouter {

	private static routes = {};

	private registrar: RouteRegistrar = new RouteRegistrar();

	private findMyWay: Router.Instance<Router.HTTPVersion.V1>;

	constructor() {
		this.findMyWay = FindMyWay({});
	}

	public getRouteRegistrar() {
		return this.registrar;
	}

	public get() {
		return this.findMyWay;
	}

	public has(method: HttpMethod, path: string) {
		const found = this.findMyWay.find(method, path);

		return !!found;
	}

	public remove(method: HttpMethod, path: string) {
		if (this.has(method, path)) {
			this.findMyWay.off(method, path);
		}
	}

	public initialiseRoutes() {
		for (let route of this.registrar.routes) {
			this.registerRoute(route);
		}
	}

	public registerRoute(route: Route) {
		this.findMyWay.on(route.method, route.getPath(), (rawRequest: IncomingMessage, rawResponse: ServerResponse) => {
			const request    = new Request(rawRequest);
			const response   = new Response();
			response.request = request;
			response.raw     = rawResponse;

			const handlerResult = route.getHandler()(request, response);

			const handleResponse = (value) => {
				if (value instanceof Response) {
					if (!value.isSetup()) {
						// In-case we return a custom response object.
						response.request = request;
						response.raw     = rawResponse;
					}

					value.send();

					return;
				}

				if (is.object(value)) {
					response.data = value;
					response.send();

					return;
				}

				throw new Error('Response can only be an instance of Response or plain js object.');
			};

			if (is.asyncFunction(handlerResult) || is.promise(handlerResult)) {
				handlerResult.then(value => {
					handleResponse(value);
				});
				return;
			}
		});

		console.log(`${route.method.toString().toUpperCase()} route registered for: ${route.getPath()} - with middlewares: ${route.getMiddlewares().join(', ')}`);
	}

	public addRoute(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod) {

		const route = new Route(method, path);

		this.findMyWay.on(route.method, route.path, (rawRequest: IncomingMessage, rawResponse: ServerResponse) => {
			const request    = new Request(rawRequest);
			const response   = new Response();
			response.request = request;
			response.raw     = rawResponse;

			const handlerResult = route.getHandler()(request, response);

			const handleResponse = (value) => {
				if (value instanceof Response) {
					if (!value.isSetup()) {
						// In-case we return a custom response object.
						response.request = request;
						response.raw     = rawResponse;
					}

					value.send();

					return;
				}

				if (is.object(value)) {
					response.data = value;
					response.send();

					return;
				}

				throw new Error('Response can only be an instance of Response or plain js object.');
			};

			if (is.asyncFunction(handlerResult) || is.promise(handlerResult)) {
				handlerResult.then(value => {
					handleResponse(value);
				});
				return;
			}

		});
	}

}
