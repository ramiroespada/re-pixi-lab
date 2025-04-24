import { Pane } from "tweakpane";
import { Application, sayHello, isWebGLSupported, Container, Rectangle, Ticker, Point, Graphics } from "pixi.js";
import Layer from "./layer";
import Blob from "./blob";
import Options from "./options";
import Label from "./label";

const app: Application = new Application();
const appContainer: HTMLElement | null = document.getElementById("pixi-container");
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
	hitter.rect(layersContainer.x, layersContainer.y, options.screenWidth, options.screenHeight).fill({ color: 0x000000, alpha: 1 });

	background.clear();
	background.rect(layersContainer.x, layersContainer.y, options.screenWidth, options.screenHeight).fill({ color: 0x343434, alpha: 1 });



	blobs.forEach((blob: Blob) => {
		blob.destroy();
	});

	blobs = [];
	for (let i: number = 0; i < options.totalBlobs; i++) {
		blobs.push(new Blob(layersContainer, new Point(Math.random() * options.screenWidth, Math.random() * options.screenHeight)));
	}

	blobs.forEach((blob: Blob) => {
		blob.setRadius(options);
		blob.setVelocity(options);
	});

	layers.forEach((layer: Layer) => {
		layer.destroy();
	});

	layers = [];
	for (let i: number = 0; i < options.totalLayers; i++) {
		layers.push(new Layer(layersContainer, options.resolution, (i + 1), new Rectangle(0, 0, options.screenWidth, options.screenHeight), blobs));
	}

	const layer: Layer = layers[0];

	labels.forEach((label: Label) => {
		label.destroy();
	});

	labels = [];
	if (options.resolution >= 32 && options.debug) {
		for (var y = 0; y < layer.inputValues.length; y++) {
			for (var x = 0; x < layer.inputValues[y].length; x++) {
				labels.push(new Label(layersContainer, y, x, new Point(x * options.resolution + 4, y * options.resolution + 4), new Rectangle(0, 0, options.screenWidth, options.screenHeight)));
			}
		}
	}

	state = "ready";

};

const render = (ticker: Ticker) => {
	options.FPS = app.ticker.FPS;

	if (state != "ready")
		return;

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

	if (labels) {
		const layer: Layer = layers[0] as Layer;
		labels.forEach((label: Label) => {
			label.draw(layer.inputValues[label.y][label.x].toFixed(1), layer.inputValues[label.y][label.x] > 1 ? true : false);
		});
	}

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
	app.stage.addChild(layersContainer);
	app.stage.addChild(hitter);

	layersContainer.mask = hitter;

	app.stage.interactive = true;
	app.stage.on('mousemove', function (event) {
		if (options.useCursor) {
			blobs[0].pos.x = event.global.x - layersContainer.x;
			blobs[0].pos.y = event.global.y - layersContainer.y;
		}
	});


	resizeHandler();

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

	tweakpane.addBinding(options, "totalBlobs", {
		min: 2,
		max: 20,
		step: 1,
	}).on("change", (evt) => {
		resizeHandler();
	});

	tweakpane.addBinding(options, "blobsMinSize", {
		min: 5,
		max: 20,
		step: 1,
	}).on("change", (evt) => {
		blobs.forEach((blob: Blob) => {
			blob.setRadius(options);
		});
	});

	tweakpane.addBinding(options, "blobsMaxSize", {
		min: 0,
		max: 100,
		step: 1,
	}).on("change", (evt) => {
		blobs.forEach((blob: Blob) => {
			blob.setRadius(options);
		});
	});

	tweakpane.addBinding(options, "blobsSpeedFactor", {
		min: 1,
		max: 10,
		step: 1,
	}).on("change", (evt) => {
		blobs.forEach((blob: Blob) => {
			blob.setVelocity(options);
		});
	});;

	tweakpane.addBinding(options, "totalLayers", {
		min: 1,
		max: 20,
		step: 1,
	}).on("change", (evt) => {
		resizeHandler();
	});

	tweakpane.addBinding(options, "layersDistanceFactor", {
		min: 0,
		max: 5,
		step: 0.1,
	});


})();

