import { serializable } from 'serializr';

export class Position {

  @serializable
  x: number;
  @serializable
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
}

export class Size {

  @serializable
  width: number;
  @serializable
  height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }
}
