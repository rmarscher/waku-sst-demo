import "@/globals.css";
import { Providers } from "@/components/providers";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<head />
			<body>
				<Providers>
					{/* this head element will be hoisted https://waku.gg/#metadata */}
					<link rel="icon" type="image/png" href="/favicon.ico" />
					{children}
				</Providers>
			</body>
		</html>
	);
}

export const getConfig = async () => {
	return {
		render: "static",
	};
};
