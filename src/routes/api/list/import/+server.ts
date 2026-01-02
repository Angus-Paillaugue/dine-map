import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import z from 'zod';
import { importListFromTakeout } from '$lib/server/importTakeout';

export const POST: RequestHandler = async ({ request }) => {
	const schema = z.object({
		files: z.array(
			z
				.instanceof(File)
				.refine((file) => file.size > 0, { message: 'File is empty' })
				.refine((file) => file.type === 'text/csv', { message: 'File must be a CSV file' })
		)
	});
	const formData = await request.formData();
	const parseResult = schema.safeParse({
		files: formData.getAll('files[]')
	});
	if (!parseResult.success) {
		return json({ error: 'Invalid request formData', details: parseResult.error }, { status: 400 });
	}
	const { files } = parseResult.data;
	try {
		const listNames: string[] = [];
		for (const file of files) {
			const listName = await importListFromTakeout(file);
			listNames.push(listName);
		}
		return json({ success: true, listNames }, { status: 200 });
	} catch (error) {
		return json(
			{ error: 'Failed to import list', details: (error as Error).message },
			{ status: 500 }
		);
	}
};
