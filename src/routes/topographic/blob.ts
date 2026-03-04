import { Container, Graphics, Point, Rectangle } from "pixi.js";
import type { Config } from "./config";
//import { Ease } from "pixi-ease";

export default class Blob {
	public pos!: Point;
	public r2!: number;

	private _container!: Container;
	private _wrapper!: Container;
	private _graphics!: Graphics;
	private _radius!: number;
	private _velocity!: Point;
	//private _ease?: Ease;
	private _waveFactor: number = 0;

	private _initRad?: number;

	constructor(container: Container, pos: Point) {
		this._container = container;
		this._wrapper = new Container({ label: "Layer" });
		this._graphics = new Graphics({ label: "Graphics" });

		this._container.addChild(this._wrapper);
		this._wrapper.addChild(this._graphics);
		this.pos = new Point(pos.x, pos.y);
	}

	public setRadius(config: Config, rad: number = 0) {
		if (rad == 0) {
			this._radius =
				config.blobsMinSize +
				Math.random() * (config.blobsMaxSize - config.blobsMinSize);
		} else {
			this._radius = rad;
		}
		this._waveFactor = this._radius;

		const r: number = this._radius + this._radius;
		this.r2 = r * r;
	}

	public setVelocity(config: Config) {
		this._velocity = new Point(1 - Math.random() * 2, 1 - Math.random() * 2);
		this._velocity.x *= config.blobsSpeed;
		this._velocity.y *= config.blobsSpeed;
	}

	public wave(config: Config) {
		if (!this._initRad) {
			this._initRad = this._radius;
		}

		/*
		if (this._ease) {
			this._ease.destroy();
		}


		this._ease = new Ease({
			duration: 200,
			ease: "easeOutQuad",
		});
		*/

		let rad = this._radius * 1.2;
		if (rad >= config.screenWidth / 4 || rad >= config.screenHeight / 4) {
			rad = this._radius;
		}

		/*
		this._ease
			.add(this, { _waveFactor: rad }, { repeat: false, reverse: false })
			.on("each", () => {
				this.setRadius(options, this._waveFactor);
			})
			.once("complete", () => {
				this._ease = new Ease({
					duration: 1000,
					ease: "easeOutElastic",
				});

				this._ease
					.add(
						this,
						{ _waveFactor: this._initRad },
						{ repeat: false, reverse: false },
					)
					.on("each", () => {
						this.setRadius(options, this._waveFactor);
					});
			});
		 */
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

	public draw(config: Config) {
		this._graphics.clear();
		if (config.debug) {
			this._graphics
				.ellipse(this.pos.x, this.pos.y, this._radius * 2, this._radius * 2)
				.fill({ color: 0xe0eddd, width: config.strokeMinSize });
		}
	}

	public destroy() {
		this._graphics.clear();
		this._container.removeChild(this._wrapper);
	}
}
