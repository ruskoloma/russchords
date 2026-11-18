import { expect, test, type Page } from '@playwright/test';
import { setupDefaultMocks } from './fixtures/mock-api';
import { signIn } from './fixtures/session';

interface Song {
	id: number;
	name: string;
	artist: string | null;
	content: string;
	rootNote: string | null;
	authorId: string;
	tags: string[];
}

/** Tiny stateful backend so writes are reflected in later reads. */
async function mockBackend(page: Page) {
	const songs: Song[] = [1, 2, 3].map((id) => ({
		id,
		name: `Song ${id}`,
		artist: null,
		content: 'Verse:\nC G\nLyrics line',
		rootNote: 'C',
		authorId: 'user-1',
		tags: [],
	}));
	const playlist = {
		playlistId: 10,
		ownerId: 'user-1',
		title: 'Sunday',
		description: '',
		isPinned: false,
		memberRecordId: 1,
		songIds: [1, 2, 3],
	};
	const lite = (s: Song) => ({ id: s.id, name: s.name, artist: s.artist, rootNote: s.rootNote, tags: s.tags });
	const playlistDto = () => ({
		...playlist,
		songs: playlist.songIds.map((id) => lite(songs.find((s) => s.id === id)!)),
	});

	await page.route(/\/mock-api\//, async (route) => {
		const req = route.request();
		const path = new URL(req.url()).pathname.replace(/^.*\/mock-api/, '');
		const method = req.method();
		const json = (body: unknown) =>
			route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
		let m: RegExpMatchArray | null;
		if (method === 'GET' && path === '/song/my/light') return json(songs.map(lite));
		if (method === 'GET' && (m = path.match(/^\/song\/(\d+)$/))) return json(songs.find((s) => s.id === Number(m![1])));
		if (method === 'PUT' && (m = path.match(/^\/song\/(\d+)$/))) {
			Object.assign(songs.find((s) => s.id === Number(m![1]))!, req.postDataJSON());
			return route.fulfill({ status: 204 });
		}
		if (method === 'GET' && path === '/starred/my') return json([]);
		if (method === 'GET' && path === '/playlist/my') return json([playlistDto()]);
		if (method === 'GET' && path === '/playlist/10') return json(playlistDto());
		if (method === 'PUT' && path === '/playlist/10') return route.fulfill({ status: 204 });
		if ((m = path.match(/^\/playlist\/10\/songs\/(\d+)$/))) {
			const id = Number(m[1]);
			playlist.songIds =
				method === 'POST'
					? [...playlist.songIds.filter((x) => x !== id), id]
					: playlist.songIds.filter((x) => x !== id);
			return route.fulfill({ status: 204 });
		}
		if (method === 'POST' && path === '/playlist/10/reorder') {
			playlist.songIds = req.postDataJSON().songIds;
			return route.fulfill({ status: 204 });
		}
		return route.fulfill({ status: 500, body: `unmocked ${method} ${path}` });
	});
	return { songs, playlist };
}

test.describe('Editing (signed in)', () => {
	test.beforeEach(async ({ page }) => {
		await setupDefaultMocks(page);
		await signIn(page);
	});

	test('an edited song is shown right away, without a stale copy', async ({ page }) => {
		const backend = await mockBackend(page);
		await page.goto('/song/1');
		await page.getByRole('link', { name: 'Edit' }).click();
		await page.getByLabel('Name').fill('Song 1 (edited)');
		await page.getByRole('button', { name: 'Save' }).click();

		await expect(page.getByRole('heading', { level: 1, name: 'Song 1 (edited)' })).toBeVisible();
		expect(backend.songs[0].name).toBe('Song 1 (edited)');

		await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'My songs' }).click();
		await expect(page.getByText('Song 1 (edited)')).toBeVisible();
	});

	test('editing a playlist twice applies both changes', async ({ page }) => {
		const backend = await mockBackend(page);
		await page.goto('/playlist/10');

		await page.getByRole('button', { name: 'Edit', exact: true }).click();
		await page.getByRole('button', { name: 'Remove Song 3' }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
		expect(backend.playlist.songIds).toEqual([1, 2]);

		await page.getByRole('button', { name: 'Edit', exact: true }).click();
		await page.getByRole('button', { name: 'Add songs' }).click();
		await page
			.getByRole('dialog')
			.getByRole('checkbox', { name: /Song 3/ })
			.click();
		await page.getByRole('button', { name: 'Done' }).click();
		await page.getByRole('button', { name: 'Save' }).click();
		await expect(page.getByRole('button', { name: 'Edit', exact: true })).toBeVisible();
		expect(backend.playlist.songIds).toEqual([1, 2, 3]);
	});

	test('unsaved edits survive a reload as a draft', async ({ page }) => {
		await mockBackend(page);
		await page.goto('/song/edit/2');
		await page.getByLabel('Name').fill('Draft name');
		await page.waitForTimeout(800); // draft autosave is debounced

		page.on('dialog', (d) => d.accept());
		await page.reload();

		await expect(page.getByText('Unsaved changes restored')).toBeVisible();
		await expect(page.getByLabel('Name')).toHaveValue('Draft name');
	});
});
