import {Route} from "../Routing/Route/Route";

export class RouteRegistrationFailed extends Error {
	constructor(route: Route) {
		super(`Cannot register route "${route.getPath()}" with method "${route.getMethods().join(', ')}"; it's already registered.`);
	}
}
