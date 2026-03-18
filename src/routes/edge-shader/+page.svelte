<script lang="ts">
	import vertex from "./vertex.glsl?raw";
	import fragment from "./fragment.glsl?raw";
	import { onMount, onDestroy } from "svelte";
	import { Pane, FolderApi } from "tweakpane";
	import {
		Application,
		sayHello,
		isWebGLSupported,
		Graphics,
		Assets,
		Container,
		Sprite,
		Texture,
		Filter,
		BlurFilter,
		GlProgram,
	} from "pixi.js";
	import { gsap } from "gsap";

	//@ts-ignore
	import { AdjustmentFilter } from "pixi-filters";

	import type { Config } from "./config";
	import { hexToRgb, hexToRgbNormalized } from "$lib/utils";

	const app: Application = new Application();
	const container: Container = new Container({ label: "Container" });
	const background: Graphics = new Graphics({ label: "Background" });

	let glslFilter: Filter;
	let image: Sprite;
	let thumbnail: Sprite;
	let texture: Texture;
	let appContainer: HTMLElement | null = null;
	let paneContainer: HTMLElement | null = null;
	let type: string = "WebGL";
	let tweakpane: Pane;
	let stream: MediaStream | null = null;
	let video: HTMLVideoElement | null = null;

	let adjustmentFilter: AdjustmentFilter = new AdjustmentFilter({
		gamma: 1,
		saturation: 0,
		contrast: 0.8,
		brightness: 1,
	});

	const config: Config = {
		FPS: 0,
		screenWidth: 0,
		screenHeight: 0,
		maxFPS: 60,
		scale: 1,
		source: "bike",
		imageX: 0,
		imageY: 0,
		edgeThreshold: 0.016,
		edgeThickness: 0.00001,
		edgeColor: "#242424",
		edgeOpacity: 1.0,
		isoThreshold: 0.5,
		isoRadius: 2,
		isoDarkRatio: 0.5,
		invertEdges: false,
		onlyEdges: true,
		useLum: false,
		blurStrength: 4,
	};

	const setImagePositionFromNormalized = (nx: number, ny: number) => {
		const extraW = Math.max(0, image.width - config.screenWidth);
		const extraH = Math.max(0, image.height - config.screenHeight);

		const centerX = Math.round((config.screenWidth - image.width) / 2);
		const centerY = Math.round((config.screenHeight - image.height) / 2);

		nx = Math.max(0, Math.min(1, nx));
		ny = Math.max(0, Math.min(1, ny));

		const offsetX = (0.5 - nx) * extraW;
		const offsetY = (0.5 - ny) * extraH;

		config.imageX = Math.round(centerX + offsetX);
		config.imageY = Math.round(centerY + offsetY);
		updateImage();
	};

	const updateImage = () => {
		gsap.to(image, {
			duration: 1,
			x: config.imageX,
			y: config.imageY,
			ease: "power3.out",
		});
	};

	const updateCursor = (e: PointerEvent) => {
		const nx = e.clientX / config.screenWidth;
		const ny = e.clientY / config.screenHeight;
		setImagePositionFromNormalized(nx, ny);
	};

	const resizeHandler = () => {
		if (!texture) return;

		app.renderer.resize(
			Math.floor(window.innerWidth / 2) * 2,
			Math.floor(window.innerHeight / 2) * 2,
		);

		const screenWidth = app.screen.width;
		const screenHeight = app.screen.height;

		config.screenWidth = screenWidth;
		config.screenHeight = screenHeight;

		const scale = Math.max(
			screenWidth / texture.width,
			screenHeight / texture.height,
		);

		image.scale.set(scale * config.scale);
		image.x = Math.round((screenWidth - image.width) / 2);
		image.y = Math.round((screenHeight - image.height) / 2);

		if (screenWidth <= 600) {
			thumbnail.width = 0;
			thumbnail.height = 0;
		} else {
			thumbnail.width = 300;
			thumbnail.height = texture.height * (thumbnail.width / texture.width);
			thumbnail.x = screenWidth - thumbnail.width;
			thumbnail.y = 0;
		}

		if (paneContainer) {
			paneContainer.style.top = thumbnail.height + "px";
		}

		background.clear();
		background
			.rect(0, 0, screenWidth, screenHeight)
			.fill({ color: 0x000000, alpha: 1 });

		glslFilter.resources.customUniforms.uniforms.uResolution = [
			screenWidth,
			screenHeight,
		];
	};

	const render = () => {
		config.FPS = app.ticker.FPS;
	};

	const updateFilters = async () => {
		if (config.source == "webcam") {
			if (!stream) {
				await getWebcamStream();
			}
			if (video) {
				texture = Texture.from(video);
			}
		} else {
			texture = await Assets.load({
				src: "/images/" + config.source + ".jpg",
			});

			texture.source.style.addressMode = "clamp-to-edge";
			texture.source.update();
		}

		thumbnail.texture = texture;
		image.texture = texture;

		const color = hexToRgbNormalized(config.edgeColor);

		glslFilter = new Filter({
			glProgram: new GlProgram({
				fragment,
				vertex,
			}),
			resources: {
				customUniforms: {
					uTime: { value: 0.0, type: "f32" },
					uResolution: {
						value: [app.renderer.screen.width, app.renderer.screen.height],
						type: "vec2<f32>",
					},

					uEdgeThreshold: { value: config.edgeThreshold, type: "f32" },
					uEdgeThickness: { value: config.edgeThickness, type: "f32" },
					uEdgeColor: { value: [color.r, color.g, color.b], type: "vec3<f32>" },
					uEdgeOpacity: { value: config.edgeOpacity, type: "f32" },
					uIsoThreshold: { value: config.isoThreshold, type: "f32" },
					uIsoRadius: { value: config.isoRadius, type: "i32" },
					uIsoDarkRatio: { value: config.isoDarkRatio, type: "f32" },
					uInvertEdges: { value: config.invertEdges ? 1 : 0, type: "i32" },
					uOnlyEdges: { value: config.onlyEdges ? 1 : 0, type: "i32" },
					uUseLum: { value: config.useLum ? 1 : 0, type: "i32" },
				},
			},
			resolution: window.devicePixelRatio || 1,
		});

		const blur: Filter = new BlurFilter({ strength: config.blurStrength });

		(image as any).filters = [blur, adjustmentFilter, glslFilter];
		(thumbnail as any).filters = [adjustmentFilter];

		resizeHandler();
	};

	const getWebcamStream = async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: true });
			if (!stream) return null;

			if (!video) {
				video = document.createElement("video");
				video.id = window.location.pathname;
				video.srcObject = stream;
				video.autoplay = true;
				video.muted = true;
				video.playsInline = true;
				video.style.display = "none";
				document.body.appendChild(video);
			}

			return new Promise((resolve) => {
				if (!video) return;
				video.onloadedmetadata = () => {
					if (!video) return;
					video.play();
					resolve(video);
				};
			});
		} catch (error) {
			console.error("Error accessing webcam: ", error);
		}
	};

	onDestroy(() => {
		try {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
			if (video) {
				video.srcObject = null;
				document.body.removeChild(video);
				video = null;
			}
			tweakpane.dispose();
			app.destroy();
			window.removeEventListener("resize", resizeHandler);
		} catch (e) {
			console.log("RE / e:", e);
		}
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

		image = new Sprite();
		thumbnail = new Sprite();

		if (appContainer) {
			appContainer.appendChild(app.canvas);
			window.addEventListener("resize", resizeHandler);
		}
		app.stage.addChild(container);
		container.addChild(background);
		container.addChild(image);
		container.addChild(thumbnail);

		image.interactive = false;
		background.interactive = true;
		background.on("pointerdown", updateCursor);

		updateFilters();

		app.ticker.add(() => {
			render();
		});

		paneContainer = document.getElementById("tweakpane");

		tweakpane = new Pane({
			container: paneContainer ? paneContainer : undefined,
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

		const folderAdjustment = (tweakpane as FolderApi).addFolder({
			title: "Color Adjustment",
			expanded: true,
		});

		folderAdjustment
			.addBinding(config, "source", {
				options: [
					{ text: "anna", value: "anna" },
					{ text: "bike", value: "bike" },
					{ text: "couple", value: "couple" },
					{ text: "erik", value: "erik" },
					{ text: "moon", value: "moon" },
					{ text: "valley", value: "valley" },
					{ text: "webcam", value: "webcam" },
				],
			})
			.on("change", () => {
				updateFilters();
			});

		folderAdjustment
			.addBinding(config, "scale", {
				min: 0.1,
				max: 2,
				step: 0.1,
			})
			.on("change", () => {
				resizeHandler();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "gamma", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilters();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "saturation", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilters();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "contrast", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilters();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "brightness", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilters();
			});

		const folder = (tweakpane as FolderApi).addFolder({
			title: "Edge",
		});

		folder
			.addBinding(config, "edgeThreshold", {
				min: 0,
				max: 0.025,
				step: 0.00001,
			})
			.on("change", () => {
				updateFilters();
			});

		folder
			.addBinding(config, "edgeThickness", {
				min: 0.000000001,
				max: 0.00009,
				step: 0.000001,
			})
			.on("change", () => {
				updateFilters();
			});

		folder
			.addBinding(config, "edgeOpacity", {
				min: 0,
				max: 1,
				step: 0.1,
			})
			.on("change", () => {
				updateFilters();
			});

		folder.addBinding(config, "edgeColor").on("change", () => {
			updateFilters();
		});

		folder
			.addBinding(config, "isoThreshold", {
				min: 0,
				max: 1,
				step: 0.01,
			})
			.on("change", () => {
				updateFilters();
			});

		folder
			.addBinding(config, "isoRadius", {
				min: 0,
				max: 2,
				step: 1,
			})
			.on("change", () => {
				updateFilters();
			});

		folder
			.addBinding(config, "isoDarkRatio", {
				min: 0,
				max: 1,
				step: 0.01,
			})
			.on("change", () => {
				updateFilters();
			});

		folder.addBinding(config, "invertEdges").on("change", () => {
			updateFilters();
		});

		folder.addBinding(config, "onlyEdges").on("change", () => {
			updateFilters();
		});

		folder.addBinding(config, "useLum").on("change", () => {
			updateFilters();
		});

		folder
			.addBinding(config, "blurStrength", {
				min: 0,
				max: 12,
				step: 1,
			})
			.on("change", () => {
				updateFilters();
			});

		updateFilters();
	});
</script>

<svelte:head>
	<title>Edge Shader</title>
</svelte:head>

<div id="app">
	<div id="pixi-container"></div>
	<div id="tweakpane"></div>
</div>
