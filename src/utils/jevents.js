export class JEvents {
  constructor() {
    this.name2handlers = {};
  }
  on(name, handlerFn) {
    this.name2handlers[name] ??= [];
    this.name2handlers[name].push(handlerFn);
  }
  off(name, handlerFn) {
    this.name2handlers[name] = this.name2handlers[name].filter(
      (f) => f !== handlerFn,
    );
  }
  emit(name, ...args) {
    console.log('[Action]', name, ...args)
    this.name2handlers[name]?.forEach((handlerFn) => {
      handlerFn(...args);
    });
  }
}
