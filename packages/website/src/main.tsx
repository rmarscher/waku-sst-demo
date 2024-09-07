import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { Root, Slot } from "waku/client";

const rootElement = (
	<StrictMode>
		<Root>
			<Slot id="App" />
		</Root>
	</StrictMode>
);

if ((globalThis as Record<string, unknown>).__WAKU_HYDRATE__) {
	hydrateRoot(document, rootElement);
} else {
	createRoot(document).render(rootElement);
}
