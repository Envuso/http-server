import {AsyncLocalStorage} from "async_hooks";
import {Request} from "./Request";
import {Response} from "./Response";

const ContextStore = new AsyncLocalStorage<Context>();

export class Context {

	public testId: number = 0;
	public requestId: number;
	public requestUuid: string;

	constructor(
		public request: Request,
		public response: Response
	) {
		this.requestId   = request.requestId;
		this.requestUuid = request.requestUuid;
	}

	static get(): Context {
		return ContextStore.getStore();
	}

	static create(request: Request, response: Response, callback: (...args: any[]) => any) {
		const ctx = new Context(request, response);

		ContextStore.run(ctx, () => {
			callback(ctx);
		});
	}
}
