import { File } from "../interfaces/File";
import { System } from "../interfaces/System";

export class Save {
    files: File[] = [];
  
    system?:    string;
    game?:      string;
    extension?: string;
  
    constructor(file: File) {
      this.files.push(file);
  
      this.system    = this.match(1);
      this.game      = this.match(2);
      this.extension = this.match(3);
    }
  
    isMapped(systems: System[]) {
      const system = systems.find(system => system.name == this.system);
      if (!system)
        return false;
  
      const game = system.games.find(game => game.rom == `${this.game}.${system.extension}`)
      if (!game)
        return false;
  
      return true;
    }
  
    private match(index: number) {
      const matches = this.files[0].path.match(/\/save\/(.*)\/(.*)\.(.*)/);
  
      if (!matches)
        return undefined;
  
      return matches[index];
    }
  }