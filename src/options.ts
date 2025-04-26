export default class Options {
	//
	FPS: number = 0;
	screenWidth: number = 0;
	screenHeight: number = 0;
	tweaksExpanded: boolean = true;
	maxFPS: number = 60;
	layerWidth: number = 800;
	layerHeight: number = 800;
	//
	debug: boolean = true;
	fullCanvasSize: boolean = true;
	useCursor: boolean = true;
	interpolation: boolean = true;
	resolution: number = 20;
	totalLayers: number = 7;
	totalBlobs: number = 5;
	blobsMinSize: number = 15;
	blobsMaxSize: number = 30;
	blobsSpeedFactor: number = 3;
	layersDistanceFactor: number = 1.4;
	strokeMaxSize: number = 12;
	strokeMinSize: number = 2;
}


