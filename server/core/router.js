class Router {
  constructor(basePath = '') {
    this.basePath = basePath;
    this.routes = [];
  }

  add(method, path, ...handlers) {
    const fullPath = (this.basePath + path).replace(/\/+/g, '/') || '/';
    const keys = [];
    // Convert :param to regex group
    const pattern = fullPath.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
      keys.push(key);
      return '([^/]+)';
    });
    const regex = new RegExp(`^${pattern}$`);
    const handler = handlers.pop();
    const middlewares = handlers.flat();
    this.routes.push({
      method: method.toUpperCase(),
      fullPath,
      regex,
      keys,
      middlewares,
      handler
    });
  }

  get(path, ...handlers) {
    this.add('GET', path, ...handlers);
  }

  post(path, ...handlers) {
    this.add('POST', path, ...handlers);
  }

  put(path, ...handlers) {
    this.add('PUT', path, ...handlers);
  }

  delete(path, ...handlers) {
    this.add('DELETE', path, ...handlers);
  }

  use(prefix, subRouter) {
    if (!subRouter || !subRouter.routes) return;
    for (const route of subRouter.routes) {
      const combinedPath = (prefix + (route.fullPath === '/' ? '' : route.fullPath)).replace(/\/+/g, '/') || '/';
      const keys = [];
      const pattern = combinedPath.replace(/:([a-zA-Z0-9_]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      });
      const regex = new RegExp(`^${pattern}$`);
      this.routes.push({
        method: route.method,
        fullPath: combinedPath,
        regex,
        keys,
        middlewares: route.middlewares,
        handler: route.handler
      });
    }
  }

  match(method, pathname) {
    const reqMethod = method.toUpperCase();
    for (const route of this.routes) {
      if (route.method !== reqMethod) continue;
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        for (let idx = 0; idx < route.keys.length; idx++) {
          const key = route.keys[idx];
          const rawVal = match[idx + 1];
          try {
            params[key] = decodeURIComponent(rawVal);
          } catch (e) {
            params[key] = rawVal;
          }
        }
        return { route, params };
      }
    }
    return null;
  }
}

function createRouter(basePath = '') {
  return new Router(basePath);
}

module.exports = {
  Router,
  createRouter
};
