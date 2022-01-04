import {ObjectContainer} from "@envuso/object-container";
import {IncomingHttpHeaders, IncomingMessage} from "http";
import {nanoid} from "nanoid";
import type {Route} from "../Routing/Route/Route";
import {HttpMethod} from "../Routing/RouterTypes";

export class Request {

	private _currentRoute: Route;

	public headers: ObjectContainer<IncomingHttpHeaders>;

	public requestId: number   = -1;
	public requestUuid: string = null;

	constructor(public raw: IncomingMessage) {
		this.headers = new ObjectContainer(raw.headers, {
			convertAllKeysToLowerCase   : true,
			convertAllValuesToLowerCase : false,
		});
	}

	setRequestId(id: number) {
		this.requestId   = id;
		this.requestUuid = String(this.headers.get('x-request-id', nanoid()));

		return this;
	}

	method(): HttpMethod {
		return HttpMethod[this.raw.method.toUpperCase()] || null;
	}

	url(): string {
		return this.raw.url;
	}

	setCurrentRoute(route: Route) {
		this._currentRoute = route;

		return this;
	}

	route(): Route | undefined {
		return this._currentRoute;
	}
}
