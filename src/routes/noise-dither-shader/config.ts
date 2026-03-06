export type Config = {
	FPS: number;
	screenWidth: number;
	screenHeight: number;
	maxFPS: number;
	scale: number;
	source: "picture" | "webcam";
	imageX: number;
	imageY: number;
};
