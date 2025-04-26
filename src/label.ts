
import { Container, Point, TextStyle, Text, Rectangle } from "pixi.js";
import Options from "./options";

export default class Label {

	public x!: number;
	public y!: number;

	private _container!: Container;
	private _text!: Text;
	private _style!: TextStyle;

	private _area!: Rectangle;

	constructor(container: Container, options: Options, y: number, x: number, pos: Point, area: Rectangle) {

		this.x = x;
		this.y = y;
		this._area = area;
		this._container = container;

		this._style = new TextStyle({ align: "right", fill: 0xffd799, fontFamily: 'Arial', fontSize: 10 })
		this._text = new Text({ text: "0", style: this._style });
		this._text.x = pos.x;
		this._text.y = pos.y;
		this._container.addChild(this._text);

	}

	public hide() {
		if (this._text) {
			this._text.visible = false;
		}
	}

	public show() {
		if (this._text) {
			this._text.visible = true;
		}
	}

	public draw(value: string, selected: boolean) {

		const color = selected ? 0x28a5df : Number(value) < 0.2 ? 0xffd799 : 0x9ccd8b;
		if (this._text) {
			this._text.style.fill = color;
			if (Number(value) > 0.2) {
				this._text.text = value;
			}
			if (this._text.x > this._area.width || this._text.y > this._area.height) {
				this._text.visible = false;
			}
		}
	}

	public destroy() {
		this._container.removeChild(this._text);
	}

}