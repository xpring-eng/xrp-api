/**
 * Express/OpenAPI types
 */
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

/**
 * XRP Ledger types
 */
interface ApiMemo {
  MemoData?: string;
  MemoType?: string;
  MemoFormat?: string;
}

interface TransactionCommonFields {
  Account: string;
  TransactionType: string;
  Fee: string;
  Sequence: number;
  AccountTxnID?: string;
  Flags?: number;
  LastLedgerSequence?: number;
  Memos?: {Memo: ApiMemo}[];
  Signers?: {
    Signer: {
      Account: string;
      TxnSignature: string;
      SigningPubKey: string;
    };
  }[];
  SourceTag?: number;
  SigningPubKey?: string; // Automatically added when signing
  TxnSignature?: string; // Automatically added when signing
}

export interface AppliedTransaction extends TransactionCommonFields {
  date: number;
  hash: string;
  inLedger?: number; // (Deprecated) Alias for ledger_index.
  ledger_index: number;
  meta: {
    AffectedNodes: object[];
    DeliveredAmount?: string | object; // To avoid errors when reading transactions, instead use the delivered_amount field, which is provided for all Payment transactions, partial or not.
    TransactionIndex: number;
    TransactionResult: string;
    delivered_amount?: string | object;
  };
  validated: boolean;
}
