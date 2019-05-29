import { Request, Response, NextFunction } from "express";

interface OpenAPIRequest extends Request {
  apiDoc?: object,
  operationDoc?: object
}

export default function () {
  const operations = {
    GET
  }

  function GET(req: OpenAPIRequest, res: Response, next: NextFunction) {
    return res.json(req.apiDoc);
  }

  return operations;
}
