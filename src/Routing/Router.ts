import is from "@sindresorhus/is";
import FindMyWay, * as FindMyWayRouter from "find-my-way";
import {RouteRegistrationFailed} from "../Exceptions/RouteRegistrationFailed";
import {Request} from "../Http/Request";
import {Route} from "./Route/Route";
import {HttpMethod, RequestHandlerMethod} from "./RouterTypes";

export class RouterInstance implements RouterProxy {

	private findMyWay: FindMyWayRouter.Instance<FindMyWayRouter.HTTPVersion.V1>;

	public routes: Route[] = [];

	constructor() {
		this.findMyWay = FindMyWay({});
	}

	hasRouteRegistration(method: HttpMethod, path: string) {
		const found = this.findMyWay.find(method, path);

		return !!found;
	}

	removeRouteRegistration(method: HttpMethod, path: string) {
		if (this.hasRouteRegistration(method, path)) {
			this.findMyWay.off(method, path);
			console.log(`${method} route removed for: ${path}`);
		}
		if (this.has(method, path)) {
			this.remove(method, path);
		}
	}

	register(route: Route) {
		for (let [method, path, handler] of route.getRoutesToRegister()) {
			if (this.hasRouteRegistration(method, path)) {
				throw new RouteRegistrationFailed(route);
			}

			this.findMyWay.on(method, path, handler, {path : path});

			console.log(`${method.toString().toUpperCase()} route registered for: ${path} - with middlewares: ${route.getMiddlewares().join(', ')}`);
		}

	}

	private createRoute(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod): Route {
		return new Route(method, path).setHandler(handler);
	}

	addRoute(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod): Route {
		return this.add(this.createRoute(method, path, handler));
	}

	add(route: Route) {
		const index = this.routes.push(route);
		return this.routes[index - 1];
	}

	has(method: HttpMethod | HttpMethod[], path: string) {
		return this.routes.some(route => route.matches(method, path));
	}

	find(method: HttpMethod | HttpMethod[], path: string): Route | undefined {
		return this.routes.find(route => route.matches(method, path));
	}

	/**
	 * This doesn't actually remove the registration from find my way - only the pre-registration version
	 *
	 * @param {HttpMethod | HttpMethod[]} method
	 * @param {string} path
	 * @returns {boolean}
	 */
	remove(method: HttpMethod | HttpMethod[], path: string) {
		const index = this.routes.findIndex(route => route.getPath() === path && route.isMethod(method));

		if (index === -1) {
			return false;
		}

		this.routes.splice(index, 1);

		return true;
	}

	initialiseRoutes() {
		for (let route of this.routes) {
			this.register(route);
		}
	}

	getHandlerForRequest(request: Request): Route | null {
		const findMyWayRoute = this.findMyWay.find(request.method(), request.url()) || null;
		if (!findMyWayRoute) {
			return null;
		}

		const route = this.find(request.method(), findMyWayRoute.store.path);
		if (!route) {
			return null;
		}

		route.setBindings(findMyWayRoute);

		request.setCurrentRoute(route);

		return route;
	}
}

interface RouterProxy {
	register(route: Route);

	hasRouteRegistration(method: HttpMethod, path: string);

	removeRouteRegistration(method: HttpMethod, path: string);

	addRoute(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod): Route;

	add(route: Route);

	has(method: HttpMethod | HttpMethod[], path: string);

	remove(method: HttpMethod | HttpMethod[], path: string);

	initialiseRoutes();

	getHandlerForRequest(request: Request): Route | null;

	// Dynamic methods accessed via the proxy
	get?(path: string, handler: RequestHandlerMethod): Route;

	post?(path: string, handler: RequestHandlerMethod): Route;

	head?(path: string, handler: RequestHandlerMethod): Route;

	delete?(path: string, handler: RequestHandlerMethod): Route;

	patch?(path: string, handler: RequestHandlerMethod): Route;

	put?(path: string, handler: RequestHandlerMethod): Route;

	name?(prefix: string): Route;

	prefix?(prefix: string): Route;

	middleware?(middlewares: any | any[]): Route;
}

const proxiedRouteMethodRegisters = ['get', 'post', 'head', 'delete', 'patch', 'put',];

export const Router = new Proxy(new RouterInstance(), {
	get(target: RouterInstance, p: string | symbol, receiver: any): any {
		if (Route.proxyableMethods().includes(String(p))) {
			return (...args) => {
				return Route.handleProxiedCall(p, args);
			};
		}

		if (proxiedRouteMethodRegisters.includes(String(p))) {
			return (...args) => {
				return target.addRoute(HttpMethod[p.toString().toUpperCase()], args[0], args[1]);
			};
		}

		if (is.function_(target[p])) {
			return (...args) => {
				return target[p].call(target, ...args);
			};
		}

		return target[p];
	},
	set(target: RouterInstance, p: string | symbol, value: any, receiver: any): boolean {
		console.log('ROUTER.TS PROXIED SETTER - ', target, p, value, receiver);
		return true;
	}
}) as RouterProxy;
