import { Request, Response, NextFunction } from "express";
import { Operations } from '../../types';

interface OpenAPIRequest extends Request {
  apiDoc?: object;
  operationDoc?: object;
}

export default function (): Operations {
  function get(req: OpenAPIRequest, res: Response, _next: NextFunction): void {
    res.json(req.apiDoc);
  }

  const operations = {
    get
  };

  return operations;
}
