<script module>
	const COLOR_SCALE = ['bg-card', 'bg-[#1B4721]', 'bg-[#2B6A30]', 'bg-[#46954A]', 'bg-[#6bc46d]'];
</script>

<script lang="ts">
	import { page } from '$app/state';
	import type { Restaurant } from '$lib/types';
	import { onMount } from 'svelte';
	import { SvelteDate, SvelteMap } from 'svelte/reactivity';
	import { fade } from 'svelte/transition';

	let restaurants = $derived(page.data.restaurants as Restaurant[]);
	const locale = page.data.locale ?? 'en-US';

	const now = new Date();
	const months = Array.from({ length: 12 }, (_, i) => {
		const month = new Date(0, i);
		return {
			name: month.toLocaleString(locale, { month: 'short' }),
			longName: month.toLocaleString(locale, { month: 'long' }),
			nbWeeks: Math.ceil(new Date(now.getFullYear(), i + 1, 0).getDate() / 7)
		};
	});
	const nbWeeksInYear = Math.ceil(months.reduce((acc, month) => acc + month.nbWeeks, 0));
	let tooltip = $state({
		date: null as Date | null,
		contributions: 0,
		pos: { x: 0, y: 0 }
	});

	const weekStartDay = 1; // 0 = Sunday, 1 = Monday
	const thisWeekStart = new SvelteDate(now);
	thisWeekStart.setDate(now.getDate() - now.getDay() + weekStartDay);
	thisWeekStart.setHours(0, 0, 0, 0);

	const gridStart = new SvelteDate(thisWeekStart);
	gridStart.setDate(thisWeekStart.getDate() - (nbWeeksInYear - 1) * 7);
	gridStart.setHours(0, 0, 0, 0);

	interface HeaderMonth {
		name: string;
		longName: string;
		colspan: number;
	}

	// build header months aligned to the grid columns (each column is a week)
	const headerMonths = (() => {
		const map = new SvelteMap<string, HeaderMonth>();
		const order: string[] = [];
		for (let w = 0; w < nbWeeksInYear; w++) {
			const weekDate = new SvelteDate(gridStart);
			weekDate.setDate(gridStart.getDate() + w * 7);
			const key = `${weekDate.getFullYear()}-${weekDate.getMonth()}`;
			if (!map.has(key)) {
				map.set(key, {
					name: weekDate.toLocaleString(locale, { month: 'short' }),
					longName: weekDate.toLocaleString(locale, { month: 'long' }),
					colspan: 0
				});
				order.push(key);
			}
			map.get(key)!.colspan++;
		}
		return order.map((k) => map.get(k)).filter((v) => v !== undefined) as HeaderMonth[];
	})();

	let maxContrib = $derived.by(() => {
		let max = 0;
		for (let week = 0; week < nbWeeksInYear; week++) {
			for (let day = 0; day < 7; day++) {
				const contribs = getNbContributionsForDay(week, day);
				if (contribs.contributions > max) {
					max = contribs.contributions;
				}
			}
		}
		return max;
	});

	function getNbContributionsForDay(weekNb: number, dayNb: number) {
		// derive the cell date from the precomputed gridStart
		const date = new SvelteDate(gridStart);
		date.setDate(gridStart.getDate() + weekNb * 7 + dayNb);

		const contributions = restaurants.filter((r) => {
			const reviews = r.reviews || [];
			return reviews.some((review) => {
				const reviewDate = new Date(review.date);
				return (
					reviewDate.getFullYear() === date.getFullYear() &&
					reviewDate.getMonth() === date.getMonth() &&
					reviewDate.getDate() === date.getDate()
				);
			});
		}).length;

		return { date, contributions };
	}

	const getColor = (nbContributions: number) => {
		if (nbContributions === 0) return COLOR_SCALE[0];
		const ratio = nbContributions / maxContrib;
		if (ratio < 0.25) return COLOR_SCALE[1];
		if (ratio < 0.5) return COLOR_SCALE[2];
		if (ratio < 0.75) return COLOR_SCALE[3];
		return COLOR_SCALE[4];
	};

	const getWeekdayName = (dayNb: number) => {
		const date = new SvelteDate(gridStart);
		date.setDate(gridStart.getDate() + dayNb);
		return date.toLocaleDateString(locale, { weekday: 'short' });
	};

	function onMouseMove(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (
			target &&
			target.dataset &&
			target.dataset.date &&
			target.classList.contains('contribution-square')
		) {
			const dateStr = parseInt(target.dataset.date);
			const date = new Date(dateStr);
			const contributions = restaurants.filter((r) => {
				const reviews = r.reviews || [];
				return reviews.some((review) => {
					const reviewDate = new Date(review.date);
					return (
						reviewDate.getFullYear() === date.getFullYear() &&
						reviewDate.getMonth() === date.getMonth() &&
						reviewDate.getDate() === date.getDate()
					);
				});
			}).length;

			if (contributions > 0) {
				const box = target.getBoundingClientRect();

				tooltip = {
					date,
					contributions,
					pos: { x: box.left + box.width / 2, y: box.top }
				};
				return;
			}
		}
		tooltip = {
			date: null,
			contributions: 0,
			pos: { x: 0, y: 0 }
		};
	}

	onMount(() => {
		document.addEventListener('mousemove', onMouseMove);
		return () => {
			document.removeEventListener('mousemove', onMouseMove);
		};
	});
</script>

{#if tooltip.date}
	<div
		class="pointer-events-none absolute z-10 flex -translate-x-1/2 flex-row gap-2 rounded border border-border bg-card px-2 py-1 font-mono text-sm transition-all duration-200"
		style="top: {tooltip.pos.y - 40}px; left: {tooltip.pos.x}px;"
		transition:fade={{ duration: 200 }}
	>
		{tooltip.contributions} review{tooltip.contributions !== 1 ? 's' : ''} on
		{tooltip.date.toLocaleDateString(locale, {
			month: 'long',
			day: 'numeric',
			year: tooltip.date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
		})}
	</div>
{/if}

<section class="no-scrollbar w-full overflow-x-auto">
	<table class="mx-auto w-max border-separate border-spacing-1">
		<caption class="sr-only">Your annual reviews in a Github like contribution table</caption>
		<thead>
			<tr class="h-4">
				<td></td>
				{#each headerMonths as { name, colspan, longName }}
					<th scope="col" class="relative" {colspan}>
						<span class="sr-only">
							{longName}
						</span>
						<span class="absolute top-0 left-0 text-sm font-medium">{name}</span>
					</th>
				{/each}
			</tr>
		</thead>

		<tbody>
			{#each Array(7), i}
				<tr>
					<td class="relative h-3 w-7">
						{#if i % 2 === 0}
							<span class="absolute top-1/2 left-0 -translate-y-1/2 text-xs"
								>{getWeekdayName(i)}</span
							>
						{/if}
					</td>
					{#each Array(nbWeeksInYear), j}
						{@const contributions = getNbContributionsForDay(j, i)}
						{#if now >= contributions.date}
							<td
								tabindex={0}
								class="contribution-square size-3 rounded-[3px] {getColor(
									contributions.contributions
								)}"
								style="shape-rendering: geometricPrecision;"
								data-date={contributions.date.getTime()}
							></td>
						{:else}
							<td class="size-3"></td>
						{/if}
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</section>
