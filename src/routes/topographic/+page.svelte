<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Pane, FolderApi } from "tweakpane";

	import {
		Application,
		sayHello,
		isWebGLSupported,
		Container,
		Rectangle,
		Point,
		Graphics,
	} from "pixi.js";
	import { map } from "./utils";
	import Layer from "./layer";
	import Blob from "./blob";
	import Label from "./label";
	import { ColorSteps } from "./colorSteps";
	import type { Config } from "./config";

	const app: Application = new Application();
	const debugContainer: Container = new Container({ label: "Debug Container" });
	const dotsContainer: Container = new Container({ label: "Dots Container" });
	const layersContainer: Container = new Container({
		label: "Layers Container",
	});
	const hitter: Graphics = new Graphics({ label: "Hitter" });
	const background: Graphics = new Graphics({ label: "Background" });

	const config: Config = {
		FPS: 0,
		screenWidth: 0,
		screenHeight: 0,
		maxFPS: 60,
		layerWidth: 800,
		layerHeight: 800,
		debug: false,
		fullCanvas: true,
		useCursor: true,
		interpolation: true,
		resolution: 10,
		layers: 7,
		blobs: 3,
		blobsMinSize: 15,
		blobsMaxSize: 30,
		blobsSpeed: 3,
		distance: 1.4,
		strokeMaxSize: 10,
		strokeMinSize: 2,
	};

	let appContainer: HTMLElement | null = null;
	let tweakpane!: Pane;
	let mousePressed: boolean = false;
	let state: string = "init";
	let type: string = "WebGL";
	let layers: Array<Layer> = [];
	let blobs: Array<Blob> = [];
	let labels: Array<Label> = [];

	const resizeHandler = () => {
		state = "resizing";
		app.renderer.resize(
			Math.floor(window.innerWidth / 2) * 2,
			Math.floor(window.innerHeight / 2) * 2,
		);

		if (config.fullCanvas) {
			config.screenWidth = app.screen.width;
			config.screenHeight = app.screen.height;
		} else {
			config.screenWidth = config.layerWidth;
			config.screenHeight = config.layerHeight;
		}

		dotsContainer.x =
			debugContainer.x =
			layersContainer.x =
				app.screen.width * 0.5 - config.screenWidth * 0.5;
		dotsContainer.y =
			debugContainer.y =
			layersContainer.y =
				app.screen.height * 0.5 - config.screenHeight * 0.5;

		hitter.clear();
		hitter
			.rect(
				layersContainer.x,
				layersContainer.y,
				config.screenWidth,
				config.screenHeight,
			)
			.fill({ color: 0x000000, alpha: 1 });

		background.clear();
		background
			.rect(
				layersContainer.x,
				layersContainer.y,
				config.screenWidth,
				config.screenHeight,
			)
			.fill({ color: 0xfff9e6, alpha: 1 });

		blobs.forEach((blob: Blob) => {
			blob.destroy();
		});

		dotsContainer.removeChildren();

		blobs = [];
		for (let i: number = 0; i < config.blobs; i++) {
			blobs.push(
				new Blob(
					dotsContainer,
					new Point(
						Math.random() * config.screenWidth,
						Math.random() * config.screenHeight,
					),
				),
			);
		}

		blobs.forEach((blob: Blob) => {
			blob.setRadius(config);
			blob.setVelocity(config);
		});
		blobs[0].setRadius(config, config.blobsMaxSize);

		layers.forEach((layer: Layer) => {
			layer.destroy();
		});
		layers = [];

		const colors: Array<string> = ColorSteps.getColorSteps(
			"#f7dd87",
			"#de710c",
			config.layers,
		);

		for (let i: number = 0; i < config.layers; i++) {
			const color = colors[i];
			layers.push(
				new Layer(
					layersContainer,
					config.resolution,
					i + 1,
					new Rectangle(0, 0, config.screenWidth, config.screenHeight),
					blobs,
					color,
				),
			);
		}

		const layer: Layer = layers[0];

		labels.forEach((label: Label) => {
			label.destroy();
		});

		const labelFreq: number = Math.round(
			map(config.resolution, 15, 40, 6, 1, true),
		);

		labels = [];

		if (config.debug) {
			for (let y = 0; y < layer.inputValues.length; y++) {
				for (let x = 0; x < layer.inputValues[y].length; x++) {
					if (x % labelFreq == 0 && y % labelFreq == 0) {
						labels.push(
							new Label(
								debugContainer,
								config,
								y,
								x,
								new Point(x * config.resolution + 4, y * config.resolution + 4),
								new Rectangle(0, 0, config.screenWidth, config.screenHeight),
							),
						);
					}
				}
			}
		}
		state = "ready";
	};

	const render = () => {
		config.FPS = app.ticker.FPS;

		if (state != "ready") return;

		if (mousePressed) {
			if (config.useCursor) {
				blobs[0].wave(config);
			}
		}

		layers.forEach((layer: Layer) => {
			layer.draw(config);
		});

		blobs.forEach((blob: Blob, i) => {
			if (config.useCursor && i == 0) {
				// TODO
			} else {
				blob.move(new Rectangle(0, 0, config.screenWidth, config.screenHeight));
			}
			blob.draw(config);
		});

		const layer: Layer = layers[0] as Layer;

		if (labels) {
			labels.forEach((label: Label) => {
				label.draw(
					layer.inputValues[label.y][label.x].toFixed(1),
					layer.inputValues[label.y][label.x] > 1 ? true : false,
				);
			});
		}
	};

	onDestroy(() => {
		app.destroy();
		window.removeEventListener("resize", resizeHandler);
	});

	onMount(async () => {
		const el = document.getElementById("pixi-container");
		if (el) {
			appContainer = document.getElementById("pixi-container");
		}
		//@ts-expect-error No need to use unknown type
		globalThis.__PIXI_APP__ = app;

		await app.init({
			resizeTo: window,
			resolution: window.devicePixelRatio || 1,
			autoDensity: true,
			antialias: false,
			preference: "webgl",
			useBackBuffer: false,
			backgroundColor: 0x222222,
		});

		app.ticker.maxFPS = config.maxFPS;

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
		app.stage.on("mousemove", function (event) {
			if (config.useCursor) {
				blobs[0].pos.x = event.global.x - layersContainer.x;
				blobs[0].pos.y = event.global.y - layersContainer.y;
			}
		});

		app.stage.on("mousedown", function () {
			mousePressed = true;
		});

		app.stage.on("mouseup", function () {
			mousePressed = false;
		});

		resizeHandler();

		app.ticker.add(() => {
			render();
		});

		const paneContainer = document.getElementById("tweakpane");

		tweakpane = new Pane({
			container: paneContainer ? paneContainer : undefined,
		});

		tweakpane.on("change", () => {
			const preset = tweakpane.exportState();
			const str = typeof preset === "string" ? preset : JSON.stringify(preset);
			localStorage.setItem(window.location.pathname, str);
		});

		const folderInfo = (tweakpane as FolderApi).addFolder({
			title: "Info",
			expanded: true,
		});

		folderInfo.addBinding(config, "FPS", {
			readonly: true,
		});

		folderInfo.addBinding(config, "screenWidth", {
			readonly: true,
		});

		folderInfo.addBinding(config, "screenHeight", {
			readonly: true,
		});

		const folderTweaks = (tweakpane as FolderApi).addFolder({
			title: "Tweaks",
			expanded: true,
		});

		folderTweaks.addBinding(config, "debug").on("change", () => {
			resizeHandler();
		});

		folderTweaks.addBinding(config, "fullCanvas").on("change", () => {
			resizeHandler();
		});
		folderTweaks.addBinding(config, "useCursor");
		folderTweaks.addBinding(config, "interpolation");

		folderTweaks
			.addBinding(config, "resolution", {
				min: 10,
				max: 30,
				step: 1,
			})
			.on("change", () => {
				resizeHandler();
			});

		folderTweaks
			.addBinding(config, "blobs", {
				min: 2,
				max: 10,
				step: 1,
			})
			.on("change", () => {
				resizeHandler();
			});

		folderTweaks
			.addBinding(config, "blobsMinSize", {
				min: 5,
				max: 20,
				step: 1,
			})
			.on("change", () => {
				blobs.forEach((blob: Blob) => {
					blob.setRadius(config);
				});
				blobs[0].setRadius(config, config.blobsMaxSize);
			});

		folderTweaks
			.addBinding(config, "blobsMaxSize", {
				min: 0,
				max: 100,
				step: 1,
			})
			.on("change", () => {
				blobs.forEach((blob: Blob) => {
					blob.setRadius(config);
				});
				blobs[0].setRadius(config, config.blobsMaxSize);
			});

		folderTweaks
			.addBinding(config, "blobsSpeed", {
				min: 1,
				max: 10,
				step: 1,
			})
			.on("change", () => {
				blobs.forEach((blob: Blob) => {
					blob.setVelocity(config);
				});
			});

		folderTweaks
			.addBinding(config, "layers", {
				min: 1,
				max: 20,
				step: 1,
			})
			.on("change", () => {
				resizeHandler();
			});

		folderTweaks.addBinding(config, "distance", {
			min: 0,
			max: 5,
			step: 0.1,
		});

		const saved = localStorage.getItem(window.location.pathname);
		if (saved) {
			const parsed = JSON.parse(saved);
			if (typeof tweakpane.importState === "function") {
				tweakpane.importState(parsed);
			}
		}

		resizeHandler();
	});
</script>

<svelte:head>
	<title>Topographic</title>
</svelte:head>

<div id="app">
	<div id="pixi-container"></div>
	<div id="tweakpane"></div>
</div>
