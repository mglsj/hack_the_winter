<script lang="ts">
	import { onMount } from "svelte";

	interface Props {
		item: {
			title: string;
			href: string;
			hevc: string;
			webm: string;
		};
		isCurrent: boolean;
	}

	const { item, isCurrent }: Props = $props();

	let video: HTMLVideoElement;

	function primeVideo() {
		// Force source selection after DOM swap/cloning (Safari/Firefox)
		if (video.readyState < 2) {
			try {
				video.load();
			} catch {}
		}

		const paintFirstFrame = () => {
			try {
				// Safari sometimes won't paint frame 0; seek a tiny offset
				if (video.currentTime === 0) video.currentTime = 0.001;
			} catch {}
		};

		paintFirstFrame();
	}

	onMount(() => {
		primeVideo();
	});

	function enter() {
		video.loop = true;

		if (video.readyState < 2) {
			try {
				video.load();
			} catch {}
		}

		video.play().catch(() => {});
	}

	function exit() {
		video.loop = false;
	}
</script>

<a
	href={isCurrent ? null : item.href}
	class="flex flex-col align-middle items-center mb-8 hover:text-shadow-lg/50"
	onmouseenter={enter}
	onmouseleave={exit}
>
	<video
		bind:this={video}
		muted
		playsinline
		class="h-20 w-20 sm:h-24 sm:w-24 md:h-28 md:w-28 lg:h-32 lg:w-32 xl:h-36 xl:w-36 object-contain"
		autoplay={isCurrent ? true : undefined}
	>
		<source src={item.hevc} type={`video/mp4; codecs="hvc1"`} />
		<source src={item.webm} type="video/webm" />
		Your browser does not support the video tag.
	</video>

	<p
		class={[
			"text-lg md:text-xl lg:text-2xl xl:text-3xl",
			"text-center font-angry tracking-wider text-shadow-md/50",
			isCurrent ? "italic text-white/90 " : "",
		]}
	>
		{item.title}
	</p>
</a>
