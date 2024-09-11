import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
	return {
		ssr: {
			// vite tries to bundle the whole thing for SSR by default
			external: [
				"sst",
				/// append-vite-external-slot
			],
		},
		plugins: [
			react({
				/// start-react-compiler-slot
				/// end-react-compiler-slot
			}),
			tsconfigPaths({
				root: fileURLToPath(new URL(".", import.meta.url)),
			}),
			/// append-vite-plugin-slot
		],
	};
});
