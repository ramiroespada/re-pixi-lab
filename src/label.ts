
import { Container, Point, TextStyle, Text } from "pixi.js";

export default class Label {

	public x!: number;
	public y!: number;

	private _container!: Container;
	private _text!: Text;
	private _style!: TextStyle;

	constructor(container: Container, y: number, x: number, pos: Point) {

		this.x = x;
		this.y = y;
		this._container = container;
		this._style = new TextStyle({ align: "right", fill: 0x999999, fontFamily: 'Arial', fontSize: 10 })
		this._text = new Text({ text: "0", style: this._style });

		this._text.x = pos.x;
		this._text.y = pos.y;
		this._container.addChild(this._text);
	}


	public draw(value: string, selected: boolean) {
		this._text.style.fill = selected ? 0xFF00FF : 0x999999;
		this._text.text = value;
	}

	public destroy() {
		this._container.removeChild(this._text);
	}

}