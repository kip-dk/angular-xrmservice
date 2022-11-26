import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class XrmStateService {
  private statechanged$: BehaviorSubject<boolean>;

  constructor() {
    this.statechanged$ = new BehaviorSubject<boolean>(false);
  }

  public statechanged(): BehaviorSubject<boolean> {
    return this.statechanged$;
  }

  private runnings = [];

  private _running: boolean = false;


  /**
   * @deprecated You should subscribe to statechanged() instead of targeting this property directly
   */
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

    var current = this._running;

    this._running = this.runnings.length > 0;

    if (current != this._running) {
      this.statechanged$.next(this._running);
    }

    if (error) {
      this._error++;
    } else {
      this._success++;
    }
  }
}
