
import { Container, Point, TextStyle, Text, Rectangle } from "pixi.js";

export default class Label {

	public x!: number;
	public y!: number;

	private _container!: Container;
	private _text!: Text;
	private _style!: TextStyle;

	private _area!: Rectangle;

	constructor(container: Container, y: number, x: number, pos: Point, area: Rectangle) {

		this.x = x;
		this.y = y;
		this._area = area;
		this._container = container;
		this._style = new TextStyle({ align: "right", fill: 0x999999, fontFamily: 'Arial', fontSize: 10 })
		this._text = new Text({ text: "0", style: this._style });

		this._text.x = pos.x;
		this._text.y = pos.y;
		this._container.addChild(this._text);
	}

	public hide() {
		this._text.visible = false;
	}

	public show() {
		this._text.visible = true;
	}

	public draw(value: string, selected: boolean) {
		this._text.style.fill = selected ? 0xFF00FF : Number(value) < 0.3 ? 0x444444 : 0x666666;
		this._text.text = value;
		if (this._text.x > this._area.width || this._text.y > this._area.height) {
			this._text.visible = false;
		}
	}

	public destroy() {
		this._container.removeChild(this._text);
	}

}