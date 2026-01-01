// ---------------------------------------------------------
// --  This file is made to execute database migrations.  --
// --  It reads SQL files from the migrations directory   --
// --  and applies them to the database if they have not  --
// --  already been done.                                 --
// ---------------------------------------------------------

import { HERE } from '../shared.ts';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { sql } from 'bun';

const getAppliedMigrations = async (): Promise<Set<string>> => {
	const rows = await sql<{ name: string }[]>`SELECT name FROM migrations`;
	return new Set(rows.map((row) => row.name));
};

async function applyMigration(name: string) {
	const migrationPath = join(HERE, `../sql/migrations/${name}`);
	await sql.file(migrationPath);
	const timeStamp = name.match(/migration\.(\d+)\.sql/);
	const migrationTime = new Date(parseInt(timeStamp![1], 10));
	// Update migrations table
	await sql`INSERT INTO migrations (name, created_at) VALUES (${name}, ${migrationTime})`;
	console.log(`Migration ${name} applied successfully.`);
}

const appliedMigrations = await getAppliedMigrations();
console.log(`Applied migrations: ${appliedMigrations.size}`);

const availableMigrations = (await readdir(join(HERE, '../sql/migrations')))
	.filter((f) => f.match(/migration\.(\d+)\.sql/))
	.sort((a, b) => {
		const timeA = parseInt(a.match(/migration\.(\d+)\.sql/)![1], 10);
		const timeB = parseInt(b.match(/migration\.(\d+)\.sql/)![1], 10);
		return timeA - timeB;
	});

const newMigrations = availableMigrations.filter((file) => !appliedMigrations.has(file));
console.log(`Available migrations: ${availableMigrations.length}`);
console.log(`New migrations to apply: ${newMigrations.length}`);

for (const migration of newMigrations) {
	try {
		await applyMigration(migration);
	} catch (error) {
		console.error(`Failed to apply migration ${migration}:`, error);
		process.exit(1);
	}
}

process.exit(0);
