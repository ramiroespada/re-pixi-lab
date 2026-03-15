import type { isContainerBladeApi } from "@tweakpane/core";

export type Config = {
	FPS: number;
	screenWidth: number;
	screenHeight: number;
	maxFPS: number;
	scale: number;
	source: "anna" | "bike" | "couple" | "erik" | "moon" | "valley" | "webcam";
	imageX: number;
	imageY: number;
	edgeThreshold: number;
	edgeThickness: number;
	edgeColor: string;
	edgeOpacity: number;
	isoThreshold: number;
	isoRadius: number;
	isoDarkRatio: number;
	invertEdges: boolean;
	onlyEdges: boolean;
	useLum: boolean;
	blurStrength: number;
};
