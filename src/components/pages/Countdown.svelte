<script lang="ts">
	import { SvelteDate } from "svelte/reactivity";

	const date = new SvelteDate();

	$effect(() => {
		const interval = setInterval(() => {
			date.setTime(Date.now());
		}, 1000);

		return () => {
			clearInterval(interval);
		};
	});

	// 25 Dec 25, 12:00 AM IST
	const targetTime = new Date("2025-12-25T00:00:00+05:30").getTime();

	const time = $derived.by(() => {
		const currentTime = date.getTime();

		let diff = targetTime - currentTime;

		if (diff < 0) {
			diff = 0;
		}

		const dayMs = 24 * 60 * 60 * 1000;
		const hourMs = 60 * 60 * 1000;
		const minMs = 60 * 1000;

		const days = Math.floor(diff / dayMs);
		diff %= dayMs;
		const hours = Math.floor(diff / hourMs);
		diff %= hourMs;
		const minutes = Math.floor(diff / minMs);
		diff %= minMs;
		const seconds = Math.floor(diff / 1000);

		return [
			{ label: "Days", value: days },
			{ label: "Hours", value: hours },
			{ label: "Minutes", value: minutes },
			{ label: "Seconds", value: seconds },
		];
	});
</script>

<div class="grid grid-cols-19 font-angry tracking-widest text-center">
	{#each time as { label, value }, index}
		<!-- Time Unit -->
		<div class="col-span-4 flex flex-col">
			<p
				class="text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl m-0!"
			>
				{String(value).padStart(2, "0")}
			</p>
			<p
				class="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl m-0!"
			>
				{label}
			</p>
		</div>
		<!-- Separator -->
		{#if index < time.length - 1}
			<div class="col-span-1">
				<p
					class="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl m-0!"
				>
					:
				</p>
			</div>
		{/if}
	{/each}
</div>
