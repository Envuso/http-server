import {Route} from "./Route/Route";
import {HttpMethod, RequestHandlerMethod} from "./RouterTypes";

export class RouteRegistrar {

	public routes: Route[] = [];

	add(route: Route) {
		const index = this.routes.push(route);
		return this.routes[index - 1];
	}

	addRoute(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod): Route {
		return this.add(this.createRoute(method, path, handler));
	}

	hasRoute(method: HttpMethod | HttpMethod[], path: string) {
		return this.routes.some(route => route.getPath() === path && route.isMethod(method));
	}

	removeRoute(method: HttpMethod | HttpMethod[], path: string) {
		const index = this.routes.findIndex(route => route.getPath() === path && route.isMethod(method));

		if (index === -1) {
			return false;
		}

		this.routes.splice(index, 1);

		return true;
	}

	private createRoute(method: HttpMethod | HttpMethod[], path: string, handler: RequestHandlerMethod): Route {
		return new Route(method, path).setHandler(handler);
	}

}
