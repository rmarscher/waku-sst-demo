"use client";

import { createStore, Provider } from "jotai";
import type { ReactNode } from "react";

const store = createStore();

export const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
	return <Provider store={store}>{children}</Provider>;
};
