import { Request, Response, NextFunction } from "express";
import { Operations } from '../../types';

export default function (): Operations {
  function get(_req: Request, res: Response, _next: NextFunction): void {
    res.status(200).json();
  }

  const operations = {
    get
  };

  return operations;
}
