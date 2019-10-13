// GET /v1/servers/info

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../types";
import { GetServerInfoResponse } from "ripple-lib/dist/npm/common/serverinfo";

export default function(api: RippleAPI, log: Function): Operations {

  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    if (req.query.connect) {
      log('Connecting...');
      await api.connect();
    }
    const rippledServers: GetServerInfoResponse[] = [];
    if (api.isConnected()) {
      rippledServers.push(await api.getServerInfo());
    }
    const info = {
      'server_version': process.env.npm_package_version,
      'rippled_servers': rippledServers
    };

    // TODO: validate all responses
    if (process.env.NODE_ENV != 'production') {
      const validation = res.validateResponse(200, info);
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

  return {
    get
  };
}
