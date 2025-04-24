export default class Options {
	//
	FPS: number = 0;
	screenWidth: number = 0;
	screenHeight: number = 0;
	tweaksExpanded: boolean = true;
	maxFPS: number = 60;
	//
	debug: boolean = true;
	fullCanvasSize: boolean = false;
	useCursor: boolean = false;
	interpolation: boolean = true;
	layerWidth: number = 800;
	layerHeight: number = 800;
	resolution: number = 32;
	totalLayers: number = 7;
	totalBlobs: number = 8;
	blobsMinSize: number = 20;
	blobsMaxSize: number = 30;
	blobsSpeedFactor: number = 3;
	layersDistanceFactor: number = 1.25;
}


