import { Game } from "./Game";

export interface System {
  name?: string;
  fullName?: string;
  coreName?: string;
  corePath?: string;
  extension?: string;
  cover?: string;
  coverDark?: string;
  games: Game[];
}