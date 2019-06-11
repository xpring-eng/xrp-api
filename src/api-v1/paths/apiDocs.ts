import { Request, Response, NextFunction } from "express";
import { Operations } from '../../types';

interface OpenAPIRequest extends Request {
  apiDoc?: object;
  operationDoc?: object;
}

export default function (): Operations {
  function GET(req: OpenAPIRequest, res: Response, _next: NextFunction): void {
    res.json(req.apiDoc);
  }

  const operations = {
    GET
  };

  return operations;
}
