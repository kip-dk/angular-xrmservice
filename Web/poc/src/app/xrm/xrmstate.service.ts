import { Injectable } from '@angular/core';

@Injectable()
export class XrmStateService {
    constructor() { }

    private runnings = [];

    private _running: boolean = false;
    public get running() { return this._running };

    private _success: number = 0;
    public get success() { return this._success };

    private _error: number = 0;
    public get error() { return this._error };

    private add(x: number): void {
        this.runnings.push(x);
        this._running = true;
    }

    private remove(x: number, error: boolean): void {
        let pos = this.runnings.indexOf(x);
        this.runnings.splice(pos, 1);
        this._running = this.runnings.length > 0;

        if (error) {
            this._error++;
        } else {
            this._success++;
        }
    }
}
