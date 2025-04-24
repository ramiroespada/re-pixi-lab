
import { Container, Rectangle, Point, Graphics } from "pixi.js";

import Blob from "./blob";
import { binaryToType, lerp } from "./utils";
import Label from "./label";
import Options from "./options";

export default class Layer {

	private _index: number = 1;
	private _container!: Container;
	private _wrapper!: Container;
	private _graphics!: Graphics;
	private _area!: Rectangle;

	private _blobs: Array<Blob>;

	private _inputValues!: Array<Array<number>>;
	private _gridValues!: Array<Array<number>>;
	private _resolution!: number;

	public get inputValues(): Array<Array<number>> {
		return this._inputValues;
	}

	constructor(container: Container, resolution: number, index: number, area: Rectangle, blobs: Array<Blob>) {

		this._resolution = resolution;
		this._index = index;

		this._container = container;
		this._wrapper = new Container({ label: "Layer Wrapper" });
		this._graphics = new Graphics({ label: "Graphics" });

		this._container.addChild(this._wrapper);
		this._wrapper.addChild(this._graphics);
		this._area = area;
		this._blobs = blobs;

		this.resize(area);

	}

	private startMap() {
		this._inputValues = [];
		const totalInputValuesHeight: number = Math.ceil(1 + this._area.height / this._resolution);
		const totalInputValuesWidth: number = Math.ceil(1 + this._area.width / this._resolution);

		for (let i: number = 0; i < totalInputValuesHeight; i++) {
			this._inputValues.push(new Array(totalInputValuesWidth));
		}

		this._gridValues = [];
		const totalGridValues: number = this._inputValues.length - 1;
		for (let i: number = 0; i < totalGridValues; i++) {
			this._gridValues.push(new Array(this._inputValues[0].length - 1));
		}
	}

	private lineTo(from: Array<number>, to: Array<number>) {

		this._graphics.moveTo(from[0], from[1]);
		this._graphics.lineTo(to[0], to[1]).stroke({ color: 0xFF00FF, alpha: 1, width: 2 });

	}

	public resize(area: Rectangle) {
		this._area = area;
		this.startMap();
	}


	public draw(options: Options) {
		if (this._area) {

			// Update Grid Points
			for (var y = 0; y < this._inputValues.length; y++) {
				for (var x = 0; x < this._inputValues[y].length; x++) {
					var addedDistances = 0;
					var rx = x * this._resolution;
					var ry = y * this._resolution;
					this._blobs.forEach((blob: Blob) => {
						addedDistances +=
							(blob.r2 * (this._index * options.layersDistanceFactor)) / ((blob.pos.y - ry) ** 2 + (blob.pos.x - rx) ** 2);
					});
					this._inputValues[y][x] = addedDistances;
				}
			}

			for (var y = 0; y < this._gridValues.length; y++) {
				for (var x = 0; x < this._gridValues[y].length; x++) {
					this._gridValues[y][x] = binaryToType(
						this._inputValues[y][x] > 1,
						this._inputValues[y][x + 1] > 1,
						this._inputValues[y + 1][x + 1] > 1,
						this._inputValues[y + 1][x] > 1
					);
				}
			}

			// Draw Lines
			this._graphics.clear();

			for (var y = 0; y < this._gridValues.length; y++) {
				for (var x = 0; x < this._gridValues[y].length; x++) {

					let a: Array<number> = [x * this._resolution + this._resolution / 2, y * this._resolution];
					let b: Array<number> = [x * this._resolution + this._resolution, y * this._resolution + this._resolution / 2];
					let c: Array<number> = [x * this._resolution + this._resolution / 2, y * this._resolution + this._resolution];
					let d: Array<number> = [x * this._resolution, y * this._resolution + this._resolution / 2];

					if (options.interpolation) {
						const nw: number = this._inputValues[y][x];
						const ne: number = this._inputValues[y][x + 1];
						const se: number = this._inputValues[y + 1][x + 1];
						const sw: number = this._inputValues[y + 1][x];
						a = [x * this._resolution + this._resolution * lerp(1, nw, ne), y * this._resolution];
						b = [
							x * this._resolution + this._resolution,
							y * this._resolution + this._resolution * lerp(1, ne, se),
						];
						c = [
							x * this._resolution + this._resolution * lerp(1, sw, se),
							y * this._resolution + this._resolution,
						];
						d = [x * this._resolution, y * this._resolution + this._resolution * lerp(1, nw, sw)];
					}


					switch (this._gridValues[y][x]) {
						case 1:
						case 14:
							this.lineTo(d, c);
							break;
						case 2:
						case 13:
							this.lineTo(b, c);
							break;
						case 3:
						case 12:
							this.lineTo(d, b);
							break;
						case 11:
						case 4:
							this.lineTo(a, b);
							break;
						case 5:
							this.lineTo(d, a);
							this.lineTo(c, b);
							break;
						case 6:
						case 9:
							this.lineTo(c, a);
							break;
						case 7:
						case 8:
							this.lineTo(d, a);
							break;
						case 10:
							this.lineTo(a, b);
							this.lineTo(c, d);
							break;
						default:
							break;
					}


				}
			}

		}
	}

	public destroy() {
		this._container.removeChild(this._wrapper);
		this._inputValues = [];
		this._gridValues = [];
	}
}




