import {IncomingMessage} from "http";

export class Request {

	constructor(public raw: IncomingMessage) {

	}

}
