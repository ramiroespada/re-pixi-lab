export type Config = {
	FPS: number;
	screenWidth: number;
	screenHeight: number;
	maxFPS: number;
	scale: number;
	source: "picture" | "webcam";
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
