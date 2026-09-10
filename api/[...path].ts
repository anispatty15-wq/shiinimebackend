import app from '../src/app';

export default (req: any, res: any) => {
	if (req.url && !req.url.startsWith('/api')) {
		req.url = `/api${req.url}`;
	}

	return app(req, res);
};