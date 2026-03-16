export type Config = {
	FPS: number;
	screenWidth: number;
	screenHeight: number;
	maxFPS: number;
	scale: number;
	source: "anna" | "bike" | "couple" | "erik" | "moon" | "valley" | "webcam";
	imageX: number;
	imageY: number;
	blurStrength: number;
	totalLines: number;
	linesColor: string;
	inverted: boolean;
	pattern: "left-to-right" | "right-to-left" | "quad";
};
