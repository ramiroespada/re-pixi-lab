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
		saturation: 1.5,
		contrast: 1.2,
		brightness: 0.2,
	});

	const config: Config = {
		FPS: 0,
		screenWidth: 0,
		screenHeight: 0,
		maxFPS: 60,
		scale: 1,
		source: "picture",
		imageX: 0,
		imageY: 0,
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

		thumbnail.width = 275;
		thumbnail.height = texture.height * (275 / texture.width);
		thumbnail.x = screenWidth - 275 - 20;
		thumbnail.y = 20;

		if (paneContainer) {
			paneContainer.style.top = thumbnail.height + 20 + 10 + "px";
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

	const updateFilers = async () => {
		if (config.source == "webcam") {
			if (!stream) {
				await getWebcamStream();
			}
			if (video) {
				texture = Texture.from(video);
			}
		} else if (config.source == "picture") {
			texture = await Assets.load({
				src: "/bg2.jpg",
			});

			texture.source.style.addressMode = "clamp-to-edge";
			texture.source.update();
		}

		thumbnail.texture = texture;
		image.texture = texture;

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
				},
			},
			resolution: window.devicePixelRatio || 1,
		});
		(image as any).filters = [adjustmentFilter, glslFilter];
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
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
		}
		if (video) {
			video.srcObject = null;
			document.body.removeChild(video);
			video = null;
		}

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

		updateFilers();

		app.ticker.add(() => {
			render();
		});

		paneContainer = document.getElementById("tweakpane");

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

		const folderAdjustment = (tweakpane as FolderApi).addFolder({
			title: "Color Adjustment",
			expanded: true,
		});

		folderAdjustment
			.addBinding(config, "source", {
				options: [
					{ text: "picture", value: "picture" },
					{ text: "webcam", value: "webcam" },
				],
			})
			.on("change", () => {
				updateFilers();
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
				updateFilers();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "saturation", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilers();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "contrast", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilers();
			});

		folderAdjustment
			.addBinding(adjustmentFilter, "brightness", {
				min: 0,
				max: 5,
				step: 0.1,
			})
			.on("change", () => {
				updateFilers();
			});

		const folder = (tweakpane as FolderApi).addFolder({
			title: "Sketch",
		});

		const saved = localStorage.getItem(window.location.pathname);
		if (saved) {
			const parsed = JSON.parse(saved);
			if (typeof tweakpane.importState === "function") {
				tweakpane.importState(parsed);
			}
		}
		updateFilers();
	});
</script>

<svelte:head>
	<title>Sketch Shader</title>
</svelte:head>

<div id="app">
	<div id="pixi-container"></div>
	<div id="tweakpane"></div>
</div>
