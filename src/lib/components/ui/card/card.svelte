<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn(
		"bg-card text-card-foreground flex flex-col gap-5 overflow-hidden rounded-xl border py-5 shadow-sm sm:py-6 has-[>[data-slot=card-header].border-b]:pt-0 has-[>[data-slot=card-footer].border-t]:pb-0",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
