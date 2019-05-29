import { Request, Response, NextFunction } from "express";

export default function () {
  const operations = {
    GET
  }

  function GET(req: Request, res: Response, next: NextFunction) {
    return res.status(200).json();
  }

  return operations;
}
