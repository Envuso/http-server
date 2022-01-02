import type {Request} from "../Http/Request";
import type {Response} from "../Http/Response";

export enum HttpMethod {
	GET    = 'GET',
	HEAD   = 'HEAD',
	DELETE = 'DELETE',
	PATCH  = 'PATCH',
	POST   = 'POST',
	PUT    = 'PUT',
}


export type HandlerMethodResponse = Response | object;

export type RequestHandlerMethod = (request: Request, response: Response) => Promise<HandlerMethodResponse>;
