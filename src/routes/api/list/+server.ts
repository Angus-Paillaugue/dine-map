import { ListDAO } from '$lib/server/db/ListDAO';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ListZ, NewListZ } from '$lib/types';

export const GET: RequestHandler = async ({ url, locals }) => {
	const params = url.searchParams;
	const user = locals.user!;
	const id = params.get('id');
	if (id) {
		const isOwner = await ListDAO.checkOwnership(id, user.id);
		if (!isOwner) {
			return json({ error: 'Unauthorized' }, { status: 403 });
		}
		const list = await ListDAO.getListById(id);
		if (!list) {
			return json({ error: 'List not found' }, { status: 404 });
		}
		return json(list);
	} else {
		const allLists = await ListDAO.getAllLists(user.id);
		return json(allLists);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const schema = NewListZ.omit({ createdBy: true });
	const body = await request.json();
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const user = locals.user!;
	const newList = { ...parseResult.data, createdBy: user.id };
	const createdList = await ListDAO.createList(newList);
	return json(createdList, { status: 201 });
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	const schema = ListZ.omit({ createdAt: true, restaurants: true, createdBy: true });
	const body = await request.json();
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const { id, name, description, icon } = parseResult.data;
	const user = locals.user!;
	const isOwner = await ListDAO.checkOwnership(id, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	const updatedList = await ListDAO.updateList(id, { name, description, icon });
	if (!updatedList) {
		return json({ error: 'List not found' }, { status: 404 });
	}
	return json(updatedList);
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const body = await request.json();
	const schema = ListZ.pick({ id: true });
	const parseResult = schema.safeParse(body);
	if (!parseResult.success) {
		return json({ error: 'Invalid request body', details: parseResult.error }, { status: 400 });
	}
	const { id } = parseResult.data;
	const user = locals.user!;
	const isOwner = await ListDAO.checkOwnership(id, user.id);
	if (!isOwner) {
		return json({ error: 'Unauthorized' }, { status: 403 });
	}
	await ListDAO.deleteList(id);
	return json({ success: true });
};
