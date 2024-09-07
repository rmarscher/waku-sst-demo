import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
	return {
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
