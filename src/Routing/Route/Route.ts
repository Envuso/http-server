import is from "@sindresorhus/is";
import path from "path";
import {HttpServer} from "../../Server";
import {HttpMethod, RequestHandlerMethod} from "../RouterTypes";

export class Route {

	public method: HttpMethod | HttpMethod[] = HttpMethod.GET;

	public _prefix: string = '/';

	public path: string = '';

	public middlewares: any[] = [];

	private handler: RequestHandlerMethod = null;

	constructor(
		method?: HttpMethod | HttpMethod[],
		path?: string,
	) {
		if (method) {
			this.method = method;
		}
		if (path) {
			this.path = path;
		}
	}

	public prefix(prefix: string) {
		this._prefix = prefix;

		return prefix;
	}

	public middleware(middlewares: any | any[]) {
		if (!is.array(middlewares)) {
			middlewares = [middlewares];
		}

		this.middlewares.push(...middlewares);

		return this;
	}

	public static prefix(prefix: string) {
		const route   = new Route();
		route._prefix = prefix;

		return route;
	}

	private create(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod) {
		this.path    = path;
		this.handler = handler;
		this.method  = method;

		return HttpServer.getInstance().getRouteRegistrar().add(this);
	}

	public get(path: string, handler: RequestHandlerMethod) {
		return this.create(HttpMethod.GET, path, handler);
	}

	public static get(path: string, handler: RequestHandlerMethod) {
		return HttpServer.getInstance().getRouteRegistrar().addRoute(HttpMethod.GET, path, handler);
	}

	public static post(path: string, handler: RequestHandlerMethod) {
		return HttpServer.getInstance().getRouteRegistrar().addRoute(HttpMethod.POST, path, handler);
	}

	public static head(path: string, handler: RequestHandlerMethod) {
		return HttpServer.getInstance().getRouteRegistrar().addRoute(HttpMethod.HEAD, path, handler);
	}

	public static delete(path: string, handler: RequestHandlerMethod) {
		return HttpServer.getInstance().getRouteRegistrar().addRoute(HttpMethod.DELETE, path, handler);
	}

	public static patch(path: string, handler: RequestHandlerMethod) {
		return HttpServer.getInstance().getRouteRegistrar().addRoute(HttpMethod.PATCH, path, handler);
	}

	public static put(path: string, handler: RequestHandlerMethod) {
		return HttpServer.getInstance().getRouteRegistrar().addRoute(HttpMethod.PUT, path, handler);
	}

	public static hasRoute(method: HttpMethod | HttpMethod[], path: string) {
		return HttpServer.getInstance().getRouteRegistrar().hasRoute(method, path);
	}

	public static removeRoute(method: HttpMethod | HttpMethod[], path: string): void {
		if (HttpServer.getInstance().getRouteRegistrar().removeRoute(method, path)) {
			HttpServer.getInstance().getRouter().remove(is.array(method) ? method[0] : method, path);
			console.log(`De registered route ${method} : ${path}`);
		}
	}

	public setHandler(handler: RequestHandlerMethod): Route {
		this.handler = handler;

		return this;
	}

	public getHandler() {
		return this.handler;
	}

	public getPath() {
		let routePath = path.join(this._prefix, this.path);

		if (!routePath.startsWith('/')) {
			routePath = '/' + routePath;
		}

		return routePath;
	}

	public getMiddlewares(): any {
		return this.middlewares;
	}

	public isMethod(method: HttpMethod | HttpMethod[]): boolean {
		let routeMethods = this.method;

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

}
