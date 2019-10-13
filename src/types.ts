import { Request, Response, NextFunction } from "express";
import { Operation } from "express-openapi";

export interface ValidatableOperation /*extends OperationFunction*/ {
  // tslint:disable-next-line callable-types (This is extended from and can't extend from a type alias in ts<2.2
  (req: Request, res: ValidatableResponse, next: NextFunction): Promise<void>;
}

export interface Operations {
  get?: ValidatableOperation | Operation;
  post?: ValidatableOperation | Operation;
}

export interface ValidatableResponse extends Response {
  validateResponse: (statusCode: number, response: object) => object;
}
