export type Config = {
	FPS: number;
	screenWidth: number;
	screenHeight: number;
	maxFPS: number;
	scale: number;
	source: "anna" | "bike" | "couple" | "erik" | "moon" | "valley" | "webcam";
	imageX: number;
	imageY: number;
	contour: number;
	spacing: number;
	hatchLimit: number;
	smoothness: number;
	blur: number;
	renderMode: "lines" | "dots";
	jitter: number;
};
