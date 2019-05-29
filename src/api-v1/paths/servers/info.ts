// GET /v1/servers/info

import { RippleAPI } from "ripple-lib";
import { Request, Response, NextFunction } from "express";
import { Operation } from "express-openapi";

export default function(api: RippleAPI, log: Function) {
  const operations: {
    GET: Operation
  } = {
    GET
  };

  async function GET(req: Request, res: Response, next: NextFunction) {
    const rippled_servers: any[] = [];
    if (api.isConnected()) {
      rippled_servers.push(await api.getServerInfo());
    }
    const info = {
      server_version: process.env.npm_package_version,
      rippled_servers
    };

    // TODO: validate all responses
    if (process.env.NODE_ENV != 'production') {
      const validation = (res as any).validateResponse(200, info);
      if (validation) {
        // red
        log('\x1b[31m%s\x1b[0m', 'validation:', validation);
      } else {
        // green
        log('\x1b[32m%s\x1b[0m', 'response validated');
      }
    }
    res.status(200).json(info);
  }

  return operations;
}
