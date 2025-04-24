import { Pane } from "tweakpane";
import { Application, sayHello, isWebGLSupported, Container, Rectangle, Ticker, Point, Graphics } from "pixi.js";
import Layer from "./layer";
import Blob from "./blob";
import Options from "./options";

const app: Application = new Application();
const appContainer: HTMLElement | null = document.getElementById("pixi-container");
const canvas: Container = new Container({ label: "Canvas" });
const layersContainer: Container = new Container({ label: "Layers Container" });
const hitter: Graphics = new Graphics({ label: "Hitter" });

const options: Options = new Options();

let tweakpane!: Pane;
let state: string = "init";
let type: string = "WebGL";
let layers: Array<Layer> = [];
let blobs: Array<Blob> = [];

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

	layersContainer.x = app.screen.width * 0.5 - options.screenWidth * 0.5;
	layersContainer.y = app.screen.height * 0.5 - options.screenHeight * 0.5;

	hitter.clear();
	hitter.rect(layersContainer.x, layersContainer.x, options.screenWidth, options.screenHeight).fill({ color: 0x000000, alpha: 0 });

	blobs.forEach((blob: Blob) => {
		blob.destroy();
	});

	blobs = [];
	for (let i: number = 0; i < options.totalBlobs; i++) {
		blobs.push(new Blob(layersContainer, options.blobsMinSize + Math.random() * (options.blobsMaxSize - options.blobsMinSize), new Point(Math.random() * options.screenWidth, Math.random() * options.screenHeight), 1 - Math.random() * 2, 1 - Math.random() * 2, options.blobsSpeedFactor));
	}

	layers.forEach((layers: Layer) => {
		layers.destroy();
	});

	layers = [];
	for (let i: number = 0; i < options.totalLayers; i++) {
		layers.push(new Layer(layersContainer, options.resolution, (i + 1), new Rectangle(0, 0, options.screenWidth, options.screenHeight), blobs));
	}

	state = "ready";
};

const render = (ticker: Ticker) => {
	if (state != "ready")
		return;

	options.FPS = app.ticker.FPS;

	layers.forEach((layer: Layer) => {
		layer.draw(options);
	});

	blobs.forEach((blob: Blob, i) => {
		if (options.useCursor && i == 0) {
		} else {
			blob.move(new Rectangle(0, 0, options.screenWidth, options.screenHeight));
		}
		blob.draw(options);
	});

}

(async () => {

	//@ts-ignore
	globalThis.__PIXI_APP__ = app;
	//

	await app.init({
		resizeTo: window,
		resolution: window.devicePixelRatio || 1,
		autoDensity: true,
		antialias: false,
		preference: "webgl",
		useBackBuffer: false,
		backgroundColor: 0x343434,
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

	app.stage.addChild(hitter);
	app.stage.addChild(canvas);
	app.stage.addChild(layersContainer);

	resizeHandler();

	app.stage.interactive = true;
	app.stage.on('mousemove', function (event) {
		if (options.useCursor) {
			blobs[0].pos.x = event.global.x - layersContainer.x;
			blobs[0].pos.y = event.global.y - layersContainer.y;
		}
	});


	app.ticker.add((ticker) => {
		render(ticker);
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

	tweakpane.addBinding(options, "debug");
	tweakpane.addBinding(options, "fullCanvasSize").on("change", () => {
		resizeHandler();
	});;
	tweakpane.addBinding(options, "useCursor");
	tweakpane.addBinding(options, "interpolation");

	tweakpane.addBinding(options, "resolution", {
		min: 10,
		max: 60,
		step: 1,
	}).on("change", (evt) => {
		resizeHandler();
	});

})();


