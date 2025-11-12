<script lang="ts">
	import { onMount } from "svelte";
	import Game from "@/lib/game";

	let container: HTMLDivElement;
	let gameInstance: Game;
	let io: IntersectionObserver | null = null;
	let resizeTimer: number | NodeJS.Timeout | undefined;

	onMount(() => {
		// Guard against SSR / non-browser environments
		if (typeof window === "undefined") return;

		// Initialize game
		gameInstance = new Game(container);
		gameInstance.start();

		// Create IntersectionObserver only on client
		if (typeof IntersectionObserver !== "undefined") {
			io = new IntersectionObserver(
				(entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							gameInstance?.resume();
						} else {
							gameInstance?.pause();
							reset();
						}
					});
				},
				{ threshold: 0.1 },
			);

			if (container) io.observe(container);
		}

		const onResize = () => {
			clearTimeout(resizeTimer as number);
			resizeTimer = setTimeout(() => gameInstance?.resize(), 150);
		};
		window.addEventListener("resize", onResize);

		return () => {
			io?.disconnect();
			window.removeEventListener("resize", onResize);
			gameInstance?.stop();
		};
	});

	let isActive = $state(false);

	function elevate() {
		if (isActive) return;

		isActive = true;
		container.style.zIndex = "2";
	}

	function reset() {
		isActive = false;
		container.style.zIndex = "";
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	onmousedown={elevate}
	ontouchstart={elevate}
	class={[
		"absolute bottom-0 left-0 right-0 w-full h-[120lvh]",
		"cursor-grab touch-pan-y",
	]}
	bind:this={container}
></div>

<!-- Spacer -->
<div class="w-0 h-[120px] md:h-[200px] -z-1"></div>

<!-- Close Button -->
{#if isActive}
	<button
		onclick={reset}
		class={[
			"fixed top-0 right-0 m-5 z-5",
			"bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg cursor-pointer",
		]}
	>
		<svg
			class="w-5 h-5 sm:w-6 sm:h-6"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			role="img"
			aria-labelledby="matter-close-title"
		>
			<title id="matter-close-title">Close</title>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M6 18L18 6M6 6l12 12"
			></path>
		</svg>
	</button>
{/if}
