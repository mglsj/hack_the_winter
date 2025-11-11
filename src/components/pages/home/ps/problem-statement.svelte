<script lang="ts">
	import {
		currentStatements,
		pastStatements,
		type Statement,
	} from "./statements";

	interface Props {
		matildaImageSrc: string;
		boardImageSrc: string;
	}

	const { matildaImageSrc, boardImageSrc }: Props = $props();

	let activeTab: "current" | "past" = $state("current");
	let currentIndex = $state(0);
</script>

{#snippet statementsStack(statements: Statement[])}
	<div class="flex items-center justify-center h-full w-full relative">
		{#if statements.length > 0}
			{#if statements.length > 1}
				<!-- Navigation Arrows -->
				<button
					type="button"
					class={[
						"absolute left-0 top-1/2 z-2",
						"bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg cursor-pointer",
						"transform -translate-y-1/2 -translate-x-4 transition-all duration-300",
					]}
					aria-label="Previous Statement"
					onclick={() => {
						if (currentIndex > 0) {
							currentIndex -= 1;
						} else {
							currentIndex = statements.length - 1;
						}
					}}
				>
					<svg
						class="w-5 h-5 sm:w-6 sm:h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						role="img"
					>
						<title>Previous</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
				</button>

				<button
					type="button"
					class={[
						"absolute right-0 top-1/2 z-2",
						"bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg cursor-pointer",
						"transform -translate-y-1/2 translate-x-4 transition-all duration-300",
					]}
					aria-label="Next Statement"
					onclick={() => {
						currentIndex += 1;
						currentIndex %= statements.length;
					}}
				>
					<svg
						class="w-5 h-5 sm:w-6 sm:h-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						role="img"
					>
						<title>Next</title>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</button>

				<!-- Statement Counter -->
				<div
					class="absolute bottom-1.5 lg:botton-4 left-1/2 transform -translate-x-1/2 bg-white/90 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold"
				>
					{currentIndex + 1} / {statements.length}
				</div>
			{/if}

			<!-- Statement Image -->
			{@const statement = statements[currentIndex]}
			<div class="p-[6%] w-full h-full">
				<a
					href={statement.link}
					title={statement.title}
					target="_blank"
					rel="noopener noreferrer"
					class="shadow-lg"
				>
					<iframe
						src={statement.link}
						title={statement.title}
						class="w-full h-full border-0 pointer-events-none bg-[#f9fbfd]"
						loading="lazy"
					></iframe>
				</a>
			</div>
		{:else}
			<div class="text-center text-white px-4">
				<p
					class={[
						"m-0!",
						"drop-shadow-lg font-angry italic tracking-wide",
						"text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl",
					]}
				>
					Releasing Soon!
				</p>
				<p
					class={[
						"text-sm sm:text-base md:text-lg",
						"drop-shadow-md",
					]}
				>
					Stay tuned for exciting challenges coming your way.
				</p>
			</div>
		{/if}
	</div>
{/snippet}

{#snippet tabSelectorButton(tab: "current" | "past")}
	<button
		type="button"
		class={[
			"x-4 py-2 md:px-6 md:py-3 rounded-xl font-angry",
			"text-normal md:text-xl lg:text-2xl xl:text-3xl",
			"transition-all duration-300 transform",
			activeTab === tab
				? "bg-white text-red-900 shadow-inner"
				: "bg-transparent text-white opacity-70 hover:opacity-100 cursor-pointer",
		]}
		onclick={() => {
			activeTab = tab;
			currentIndex = 0;
		}}
	>
		{tab === "current" ? "Current" : "Past"}
	</button>
{/snippet}

<section class="problem-statement-section pb-32 lg:pb-8">
	<!-- Button Row -->
	<div class="flex justify-center gap-2 p-2">
		{@render tabSelectorButton("current")}
		{@render tabSelectorButton("past")}
	</div>

	<!-- Statement Display -->
	<div class="relative w-full max-w-6xl mx-auto">
		<div class="flex flex-col lg:flex-row justify-center items-end">
			<!-- Desktop Image -->
			<div class="shrink-0 hidden lg:block relative z-1">
				<img
					src={matildaImageSrc}
					alt="Master Matilda"
					class="w-120 h-auto xl:w-xl 2xl:w-2xl"
					loading="lazy"
					decoding="async"
				/>
			</div>

			<div class="relative shrink-0 lg:-ml-32 xl:-ml-40 2xl:-ml-48">
				<!-- Board Image -->
				<div class="relative">
					<img
						src={boardImageSrc}
						alt="Problem Statement Board"
						class="w-full max-w-2xl xl:max-w-3xl h-auto"
						loading="lazy"
						decoding="async"
					/>
					<div class="absolute top-0 left-0 w-full h-full">
						{#if activeTab === "current"}
							{@render statementsStack(currentStatements)}
						{:else}
							{@render statementsStack(pastStatements)}
						{/if}
					</div>
				</div>

				<!-- Mobile Image -->
				<div class="absolute -bottom-48 -left-4 lg:hidden z-1">
					<img
						src={matildaImageSrc}
						alt="Master Matilda"
						class="w-96 h-auto sm:w-md"
						loading="lazy"
						decoding="async"
					/>
				</div>
			</div>
		</div>
	</div>
</section>
