import { Application, sayHello, isWebGLSupported, Container, Rectangle, Ticker } from "pixi.js";
import Layer from "./layer";

const app: Application = new Application();
const appContainer: HTMLElement | null = document.getElementById("pixi-container");

const canvas: Container = new Container({ label: "Canvas" });
const layersContainer: Container = new Container({ label: "Layers Container" });

let type: string = "WebGL";

let layerWidth: number = 800;
let layerHeight: number = 800;
const totalLayers: number = 1;
const layers: Array<Layer> = [];

const resizeHandler = () => {
	app.renderer.resize(window.innerWidth, window.innerHeight);

	/*
	layerWidth = app.screen.width;
	layerHeight = app.screen.height;
	*/

	layersContainer.x = app.screen.width * 0.5 - layerWidth * 0.5;
	layersContainer.y = app.screen.height * 0.5 - layerHeight * 0.5;

	for (let i: number = 0; i < totalLayers; i++) {
		layers.push(new Layer(layersContainer, new Rectangle(0, 0, layerWidth, layerHeight)));
	}
};

const render = (ticker: Ticker) => {
	layers.forEach((layer: Layer) => {
		layer.draw();
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

	app.ticker.maxFPS = 60;

	if (!isWebGLSupported()) {
		type = "canvas";
	}
	sayHello(type);

	if (appContainer) {
		appContainer.appendChild(app.canvas);
		window.addEventListener("resize", resizeHandler);

	}

	app.stage.addChild(canvas);
	app.stage.addChild(layersContainer);

	resizeHandler();

	app.ticker.add((ticker) => {
		render(ticker);
	});

})();


