
import { Container, Graphics, Point, Rectangle } from "pixi.js";
import Options from "./options";

export default class Blob {

	public pos!: Point;
	public r2!: number;

	private _container!: Container;
	private _wrapper!: Container;
	private _graphics!: Graphics;
	private _radius!: number;
	private _velocity!: Point;

	constructor(container: Container, pos: Point) {

		this._container = container;
		this._wrapper = new Container({ label: "Layer" });
		this._graphics = new Graphics({ label: "Graphics" });

		this._container.addChild(this._wrapper);
		this._wrapper.addChild(this._graphics);
		this.pos = new Point(pos.x, pos.y);
	}

	public setRadius(options: Options, rad: number = 0) {
		if (rad == 0) {
			this._radius = options.blobsMinSize + Math.random() * (options.blobsMaxSize - options.blobsMinSize);
		} else {
			this._radius = rad;
		}
		const r: number = this._radius + this._radius;
		this.r2 = r * r;
	}

	public setVelocity(options: Options) {
		this._velocity = new Point(1 - Math.random() * 2, 1 - Math.random() * 2);
		this._velocity.x *= options.blobsSpeedFactor;
		this._velocity.y *= options.blobsSpeedFactor;
	}


	public move(area: Rectangle) {

		if (this.pos.x > area.width || this.pos.x < 0) {
			this._velocity.x *= -1;
		}

		if (this.pos.y > area.height || this.pos.y < 0) {
			this._velocity.y *= -1;
		}

		this.pos.x += this._velocity.x;
		this.pos.y += this._velocity.y;

	}

	public draw(options: Options) {
		this._graphics.clear();
		if (options.debug) {
			//this._graphics.ellipse(this.pos.x, this.pos.y, this._radius * 2, this._radius * 2).stroke({ color: 0xe0eddd, width: options.strokeMinSize });
		}
	}

	public destroy() {
		this._graphics.clear();
		this._container.removeChild(this._wrapper);
	}

}