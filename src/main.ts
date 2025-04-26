import { Pane } from "tweakpane";
import { Application, sayHello, isWebGLSupported, Container, Rectangle, Point, Graphics } from "pixi.js";
import { map } from "./utils";
import Layer from "./layer";
import Blob from "./blob";
import Options from "./options";
import Label from "./label";

import { ColorSteps } from "./colorSteps";

const app: Application = new Application();
const appContainer: HTMLElement | null = document.getElementById("pixi-container");
const debugContainer: Container = new Container({ label: "Debug Container" });
const dotsContainer: Container = new Container({ label: "Dots Container" });
const layersContainer: Container = new Container({ label: "Layers Container" });
const hitter: Graphics = new Graphics({ label: "Hitter" });
const background: Graphics = new Graphics({ label: "Background" });

const options: Options = new Options();

let tweakpane!: Pane;
let state: string = "init";
let type: string = "WebGL";
let layers: Array<Layer> = [];
let blobs: Array<Blob> = [];
let labels: Array<Label> = [];
//let dots: Array<Dot> = [];

const resizeHandler = () => {

	state = "resizing";
	app.renderer.resize(Math.floor(window.innerWidth / 2) * 2, Math.floor(window.innerHeight / 2) * 2);

	if (options.fullCanvasSize) {
		options.screenWidth = app.screen.width;
		options.screenHeight = app.screen.height;
	} else {
		options.screenWidth = options.layerWidth;
		options.screenHeight = options.layerHeight;
	}

	dotsContainer.x = debugContainer.x = layersContainer.x = app.screen.width * 0.5 - options.screenWidth * 0.5;
	dotsContainer.y = debugContainer.y = layersContainer.y = app.screen.height * 0.5 - options.screenHeight * 0.5;

	hitter.clear();
	hitter.rect(layersContainer.x, layersContainer.y, options.screenWidth, options.screenHeight).fill({ color: 0x000000, alpha: 1 });

	background.clear();
	background.rect(layersContainer.x, layersContainer.y, options.screenWidth, options.screenHeight).fill({ color: 0xfff9e6, alpha: 1 });

	blobs.forEach((blob: Blob) => {
		blob.destroy();
	});

	dotsContainer.removeChildren();

	blobs = [];
	for (let i: number = 0; i < options.totalBlobs; i++) {
		blobs.push(new Blob(dotsContainer, new Point(Math.random() * options.screenWidth, Math.random() * options.screenHeight)));
	}

	blobs.forEach((blob: Blob) => {
		blob.setRadius(options);
		blob.setVelocity(options);
	});
	blobs[0].setRadius(options, options.blobsMaxSize);

	layers.forEach((layer: Layer) => {
		layer.destroy();
	});
	layers = [];
	const colors: Array<string> = ColorSteps.getColorSteps("#de710c", "#f7dd87", options.totalLayers);
	console.log("RE / [main.ts:74]: colors: ", colors);
	for (let i: number = 0; i < options.totalLayers; i++) {
		const color = colors[i];
		layers.push(new Layer(layersContainer, options.resolution, (i + 1), new Rectangle(0, 0, options.screenWidth, options.screenHeight), blobs, Number(color)));
	}

	const layer: Layer = layers[0];

	labels.forEach((label: Label) => {
		label.destroy();
	});

	/*
	dots.forEach((dot: Dot) => {
		dot.destroy();
	});
	*/

	const labelFreq: number = Math.round(map(options.resolution, 15, 40, 10, 1, true));
	const dotFreq: number = Math.round(map(options.resolution, 15, 40, 4, 2, true));

	labels = [];

	if (options.debug) {
		for (let y = 0; y < layer.inputValues.length; y++) {
			for (let x = 0; x < layer.inputValues[y].length; x++) {
				if (x % labelFreq == 0 && y % labelFreq == 0) {
					labels.push(new Label(debugContainer, options, y, x, new Point(x * options.resolution + 4, y * options.resolution + 4), new Rectangle(0, 0, options.screenWidth, options.screenHeight),));
				}

				if (x % dotFreq == 0 && y % dotFreq == 0) {
					//dots.push(new Dot(dotsContainer, options, y, x, new Point(x * options.resolution + rad, y * options.resolution + rad), rad));
				}

			}
		}
	}
	state = "ready";

};

const render = () => {
	options.FPS = app.ticker.FPS;

	if (state != "ready")
		return;

	layers.forEach((layer: Layer) => {
		layer.draw(options);
	});

	blobs.forEach((blob: Blob, i) => {
		if (options.useCursor && i == 0) {
			// TODO
		} else {
			blob.move(new Rectangle(0, 0, options.screenWidth, options.screenHeight));
		}
		blob.draw(options);
	});

	const layer: Layer = layers[0] as Layer;

	if (labels) {
		labels.forEach((label: Label) => {
			if (options.debug) {
				label.show();
				label.draw(layer.inputValues[label.y][label.x].toFixed(1), layer.inputValues[label.y][label.x] > 1 ? true : false);
			} else {
				label.hide();
			}
		});
	}

	/*
	if (dots) {
		dots.forEach((dot: Dot) => {
			if (options.debug) {
				dot.draw(layer.inputValues[dot.y][dot.x].toFixed(1), options);
			}
		});
	}
	*/

}

(async () => {

	//@ts-expect-error No need to use unknown type
	globalThis.__PIXI_APP__ = app;
	//

	await app.init({
		resizeTo: window,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true,
		antialias: false,
		preference: "webgl",
		useBackBuffer: false,
		backgroundColor: 0x222222,
	});

	app.ticker.maxFPS = options.maxFPS;

	if (!isWebGLSupported()) {
		type = "canvas";
	}
	sayHello(type);

	if (appContainer) {
		appContainer.appendChild(app.canvas);
		window.addEventListener("resize", resizeHandler);
	}

	app.stage.addChild(background);
	app.stage.addChild(dotsContainer);
	app.stage.addChild(debugContainer);
	app.stage.addChild(layersContainer);
	app.stage.addChild(hitter);

	dotsContainer.mask = debugContainer.mask = layersContainer.mask = hitter;

	app.stage.interactive = true;
	app.stage.on('mousemove', function (event) {
		if (options.useCursor) {
			blobs[0].pos.x = event.global.x - layersContainer.x;
			blobs[0].pos.y = event.global.y - layersContainer.y;
		}
	});


	resizeHandler();

	app.ticker.add(() => {
		render();
	});

	tweakpane = new Pane({
		title: "TWEAKS",
		expanded: options.tweaksExpanded,
	});

	tweakpane.addBinding(options, "FPS", {
		readonly: true,
	});

	tweakpane.addBinding(options, "screenWidth", {
		readonly: true,
	});

	tweakpane.addBinding(options, "screenHeight", {
		readonly: true,
	});

	// tweakpane.addBinding(options, "debug");

	tweakpane.addBinding(options, "fullCanvasSize").on("change", () => {
		resizeHandler();
	});;
	tweakpane.addBinding(options, "useCursor");
	tweakpane.addBinding(options, "interpolation");

	tweakpane.addBinding(options, "resolution", {
		min: 15,
		max: 60,
		step: 1,
	}).on("change", () => {
		resizeHandler();
	});

	tweakpane.addBinding(options, "totalBlobs", {
		min: 2,
		max: 20,
		step: 1,
	}).on("change", () => {
		resizeHandler();
	});

	tweakpane.addBinding(options, "blobsMinSize", {
		min: 5,
		max: 20,
		step: 1,
	}).on("change", () => {
		blobs.forEach((blob: Blob) => {
			blob.setRadius(options);
		});
		blobs[0].setRadius(options, options.blobsMaxSize);
	});

	tweakpane.addBinding(options, "blobsMaxSize", {
		min: 0,
		max: 100,
		step: 1,
	}).on("change", () => {
		blobs.forEach((blob: Blob) => {
			blob.setRadius(options);
		});
		blobs[0].setRadius(options, options.blobsMaxSize);

	});

	tweakpane.addBinding(options, "blobsSpeedFactor", {
		min: 1,
		max: 10,
		step: 1,
	}).on("change", () => {
		blobs.forEach((blob: Blob) => {
			blob.setVelocity(options);
		});
	});;

	tweakpane.addBinding(options, "totalLayers", {
		min: 1,
		max: 20,
		step: 1,
	}).on("change", () => {
		resizeHandler();
	});

	tweakpane.addBinding(options, "layersDistanceFactor", {
		min: 0,
		max: 5,
		step: 0.1,
	});


})();

