import { notifications } from '@mantine/notifications';

export const notifySuccess = (message: string, title?: string) =>
	notifications.show({ color: 'green', title, message, autoClose: 2500 });

export const notifyError = (message: string, title = 'Something went wrong') =>
	notifications.show({ color: 'red', title, message });

export async function copyText(text: string, successMessage = 'Copied to clipboard') {
	try {
		await navigator.clipboard.writeText(text);
		notifySuccess(successMessage);
	} catch {
		notifyError('Your browser blocked clipboard access.', 'Could not copy');
	}
}

/** Native share sheet on phones, clipboard elsewhere. */
export async function shareLink(title: string, url: string = window.location.href) {
	const canShare = typeof navigator.share === 'function' && window.matchMedia('(pointer: coarse)').matches;
	if (canShare) {
		try {
			await navigator.share({ title, url });
			return;
		} catch (err) {
			if (err instanceof DOMException && err.name === 'AbortError') return;
		}
	}
	await copyText(url, 'Link copied');
}
