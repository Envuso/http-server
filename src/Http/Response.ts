import {ObjectContainer} from "@envuso/object-container";
import is from "@sindresorhus/is";
import {Buffer} from "buffer";
import {OutgoingHttpHeader, OutgoingHttpHeaders, ServerResponse} from "http";
import {nanoid} from "nanoid";
import type {Request} from "./Request";
import {StatusCodes} from "./StatusCodes";

const CONTENT_TYPE = {
	JSON  : 'application/json; charset=utf-8',
	PLAIN : 'text/plain; charset=utf-8',
	OCTET : 'application/octet-stream'
};

export type HeadersValueType = OutgoingHttpHeader;

export class Response {

	private _id: string = null;

	public raw: ServerResponse = null;
	public request: Request    = null;

	public headers: ObjectContainer<OutgoingHttpHeaders>;

	public data: any = null;
	public statusCode: StatusCodes;


	private sent: boolean  = false;
	private ended: boolean = false;

	constructor(code: StatusCodes = StatusCodes.OK) {
		this._id        = nanoid();
		this.headers    = new ObjectContainer({}, {
			convertAllKeysToLowerCase   : true,
			convertAllValuesToLowerCase : false,
		});
		this.statusCode = code;
	}

	public id(): string {
		return this._id;
	}

	public is(response: Response): boolean {
		return this._id === response._id;
	}

	public isSent(): boolean {
		return this.sent;
	}

	public hasEnded() {
		return this.ended;
	}

	public canSend() {
		return !this.sent && !this.ended;
	}

	public hasHeaders(): boolean {
		return this.headers.empty() !== false;
	}

	public isSetup(): boolean {
		return this.raw !== null && this.request !== null;
	}

	public withData(data: any) {
		this.data = data;

		return this;
	}

	//	private setHeaders() {
	//		for (let key in this.headers.all()) {
	//			this.raw.setHeader(key, this.headers.get(key));
	//		}
	//	}

	public send(): void {

		//		if (!this.hasHeaders()) {
		//			this.headers.put('content-type', 'application/json');
		//		}

		if (!this.canSend()) {
			throw new Error('Request has ended or already been sent.');
		}

		this.headers.put('x-request-id', this.request.requestUuid);

		if (!this.headers.has('content-type')) {
			if (Buffer.isBuffer(this.data) || typeof this.data.pipe === 'function') {
				this.headers.put('content-type', CONTENT_TYPE.OCTET);
			} else if (typeof this.data === 'string') {
				this.headers.put('content-type', CONTENT_TYPE.PLAIN);
			} else if (is.object(this.data)) {
				this.headers.put('content-type', CONTENT_TYPE.JSON);
			}
		}

		//		this.setHeaders();

		let payload = null;

		switch (true) {
			case is.buffer(this.data):
				payload = this.data;
				break;
			case is.string(this.data):
				payload = Buffer.from(this.data);
				break;
			case is.object(this.data) :
				payload = Buffer.from(JSON.stringify(this.data));
				break;
		}

		if (!this.headers.has('content-length')) {
			this.headers.put('content-length', '' + Buffer.byteLength(payload));
		} else if (this.request.raw.method !== 'HEAD' && Number(this.headers.get('content-length')) !== Buffer.byteLength(payload)) {
			this.headers.put('content-length', '' + Buffer.byteLength(payload));
		}

		this.raw.writeHead(this.statusCode, this.headers.all());
		this.raw.write(payload);

		this.raw.end(() => {
			this.ended = true;
			this.sent  = true;
			//			console.log('sent?');
		});

	}

	public setFrom(custom: Response, response: Response, request: Request): void {
		if (custom.is(response)) {
			return;
		}

		this.headers    = custom.headers;
		this.data       = custom.data;
		this.statusCode = custom.statusCode;
		this.sent       = custom.sent;
		this.ended      = custom.ended;
	}
}
