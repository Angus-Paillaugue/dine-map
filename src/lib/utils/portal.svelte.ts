import { tick } from 'svelte';

export function portal(el: HTMLElement, target?: HTMLElement | string) {
	target ??= 'body';
	let targetEl: HTMLElement | null = null;

	// Temporarily hide the element to prevent layout shift
	el.style.position = 'absolute';
	el.style.opacity = '0';
	el.style.pointerEvents = 'none';

	async function update(newTarget: HTMLElement | string) {
		target = newTarget;
		if (typeof target === 'string') {
			targetEl = document.querySelector(target);
			if (targetEl === null) {
				await tick();
				targetEl = document.querySelector(target);
			}
			if (targetEl === null) {
				throw new Error(`No element found matching css selector: "${target}"`);
			}
		} else if (target instanceof HTMLElement) {
			targetEl = target;
		} else {
			throw new TypeError(
				`Unknown portal target type: ${
					target === null ? 'null' : typeof target
				}. Allowed types: string (CSS selector) or HTMLElement.`
			);
		}

		// Append the element to the target and restore its visibility
		targetEl.appendChild(el);
		el.style.position = '';
		el.style.opacity = '';
		el.style.pointerEvents = '';
		el.hidden = false;
	}

	function destroy() {
		if (el.parentNode) {
			el.parentNode.removeChild(el);
		}
	}

	update(target);
	return {
		update,
		destroy
	};
}
