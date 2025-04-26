
import { Container, Point, Graphics } from "pixi.js";
import Options from "./options";
import { map } from "./utils";
import { Ease } from 'pixi-ease';

export default class Dot {

	public x!: number;
	public y!: number;

	private _container!: Container;
	private _wrapper!: Container;
	private _graphics!: Graphics;

	private _posX: number;
	private _posY: number;
	private _size: number;

	private _ease: Ease | null = null;

	constructor(container: Container, options: Options, y: number, x: number, pos: Point, size: number) {

		this._size = size;
		this._posX = pos.x;
		this._posY = pos.y;
		this.x = x;
		this.y = y;
		this._container = container;

		this._wrapper = new Container({ label: "Wrapper" });
		this._graphics = new Graphics({ label: "Graphics" });
		this._wrapper.addChild(this._graphics);
		this._wrapper.pivot.set(0.5, 0.5);
		this._container.addChild(this._wrapper);

	}



	public draw(value: string) {

		const color = 0xe0eddd;

		const size = map(Number(value), 2, 0.2, 2.5, 0.1, true);

		if (this._graphics) {
			this._graphics.clear();
			this._graphics.circle(0, 0, this._size).fill({ color });
			this._wrapper.x = this._posX;
			this._wrapper.y = this._posY;

			if (this._ease) {
				this._ease.destroy();
			}

			this._ease = new Ease({
				duration: 400,
				ease: 'easeOutBack'
			});

			this._ease.add(this._wrapper, { scale: size }, { repeat: false, reverse: false });

		}
	}

	public destroy() {
		this._container.removeChild(this._graphics);
	}

}