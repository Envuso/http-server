import is from "@sindresorhus/is";
import {FindResult, HTTPVersion} from "find-my-way";
import {IncomingMessage, ServerResponse} from "http";
import path from "path";
import * as util from "util";
import {Context} from "../../Http/Context";
import {Request} from "../../Http/Request";
import {Response} from "../../Http/Response";
import {Middleware} from "../../Middleware/Middleware";
import {Router} from "../Router";
import {ArrayableHttpMethod, HttpMethod, RequestHandlerMethod} from "../RouterTypes";

export class Route {

	private _method: ArrayableHttpMethod                         = HttpMethod.GET;
	private _prefix: string                                      = '/';
	private _path: string                                        = '';
	private _middlewares: (new (...args: any[]) => Middleware)[] = [];
	private _name: string                                        = null;
	private _parameters: { [k: string]: string | undefined }     = {};
	private handler: RequestHandlerMethod                        = null;

	constructor(
		method?: HttpMethod | HttpMethod[],
		path?: string,
	) {
		if (method) {
			this._method = method;
		}
		if (path) {
			this._path = path;
		}
	}

	public prefix(prefix: string) {
		this._prefix = prefix;

		return prefix;
	}

	public middleware(...middlewares: (new (...args: any[]) => Middleware)[]) {
		if (!is.array(middlewares)) {
			middlewares = [middlewares];
		}

		this._middlewares.push(...middlewares);

		return this;
	}

	public name(name: string) {
		this._name = name;

		return this;
	}

	public setHandler(handler: RequestHandlerMethod): Route {
		this.handler = handler;

		return this;
	}

	/**
	 * This will return an array which contains the handler/path
	 * for each individual method used for this route.
	 */
	public getRoutesToRegister(): [HttpMethod, string, (rawRequest: IncomingMessage, rawResponse: ServerResponse) => any][] {
		return this.getMethods().map(method => [method, this.getPath(), this.handleRequest.bind(this)]);
	}

	public getMethod(): HttpMethod {
		return this.getMethods()[0];
	}

	public getMethods(): HttpMethod[] {
		return is.array(this._method) ? this._method : [this._method];
	}

	public getHandler() {
		return this.handler;
	}

	public getPath() {
		let routePath = path.join(this._prefix, this._path);

		if (!routePath.startsWith('/')) {
			routePath = '/' + routePath;
		}

		return routePath;
	}

	public getMiddlewares(): any {
		return this._middlewares;
	}

	public isMethod(method: HttpMethod | HttpMethod[]): boolean {
		let routeMethods = this._method;

		if (!is.array(routeMethods)) {
			routeMethods = [routeMethods];
		}

		if (!is.array(method)) {
			method = [method];
		}

		for (let httpMethod of method) {
			if (!routeMethods.includes(httpMethod)) {
				return false;
			}
		}

		return true;
	}

	public async runMiddlewares(type: 'before' | 'after', request: Request, response: Response): Promise<[Request, Response]> {
		for (let middlewareCtor of this._middlewares) {
			const middleware = new middlewareCtor();

			const [mwRequest, mwResponse] = await middleware[type](request, response, Context.get());

			request  = mwRequest;
			response = mwResponse;
		}

		return [request, response];
	}

	public async handleRequest(request: Request, response: Response) {

		const [mwBeforeRequest, mwBeforeResponse] = await this.runMiddlewares('before', request, response);
		request                                   = mwBeforeRequest;
		response                                  = mwBeforeResponse;

		const handler = this.getHandler();
		const value   = await handler(request, response);

		if (value instanceof Response) {
			response.setFrom(value, response, request);
		} else {
			if (is.object(value)) {
				response.data = value;
			}
		}

		const [mwAfterRequest, mwAfterResponse] = await this.runMiddlewares('after', request, response);
		request                                 = mwAfterRequest;
		response                                = mwAfterResponse;

		response.send();

	}

	private create(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod) {
		this._path   = path;
		this._method = method;
		this.setHandler(handler);

		return Router.add(this);
	}

	/**
	 * This allows us to first call middleware/prefix and define
	 * those, and then finally register the type of request
	 *
	 * @param {string} path
	 * @param {RequestHandlerMethod} handler
	 * @returns {Route}
	 */
	public get(path: string, handler: RequestHandlerMethod) {
		return this.create(HttpMethod.GET, path, handler);
	}

	public parameters() {
		return this._parameters;
	}

	public setParameters(params: { [k: string]: string | undefined }) {
		for (let key of Object.keys(params)) {
			const newKey = key.replace('?', '');

			this._parameters[newKey] = params[key];
		}

		return this;
	}

	public hasParameters() {
		return Object.keys(this._parameters)?.length > 0;
	}

	public hasParameter(name: string) {
		return !!this._parameters[name];
	}

	public parameter<T extends any>(name: string, _default: any = null): T {
		return this._parameters[name] ?? _default;
	}

	public setParameter(name: string, value: any) {
		this._parameters[name] = value;

		return this;
	}

	public forgetParameter(name: string) {
		delete this._parameters[name];

		return this;
	}

	public matches(method: ArrayableHttpMethod, path: string) {
		return this.getPath() === path && this.isMethod(method);
	}

	public static handleProxiedCall(p: string | symbol, args: any) {
		const route = new Route();

		switch (p) {
			case "prefix":
				route._prefix = args[0];
				return route;
			case "middleware":
				return route.middleware(args);
			default:
				console.log('unhandled Route.ts proxy call: ', p, args);
		}
	}

	public static proxyableMethods() {
		return ['prefix', 'middleware', 'name'];
	}

	public setBindings(findMyWayRoute: FindResult<HTTPVersion.V1>): void {
		this.setParameters(findMyWayRoute.params);

	}
}
