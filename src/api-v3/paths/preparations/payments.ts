// GET /v3/preparations/payments

import { RippleAPI } from "ripple-lib";
import { Request, NextFunction } from "express";
import { Operations, ValidatableResponse } from "../../../types";
import { ERRORS, XrpApiError } from "../../../errors";
import { isValidXAddress, xAddressToClassicAddress } from "ripple-address-codec";
import * as log4js from 'log4js';
import { TransactionJSON } from "ripple-lib/dist/npm/transaction/types";
const out_all = {
  appenders: ['out'],
  level: 'all'
};
const enable_categories = process.env.NODE_DEBUG?.split(',');
if (enable_categories) {
  const categories: {
    [category: string]: { appenders: string[]; level: string; enableCallStack?: boolean | undefined };
  } = {
    default: out_all
  };
  enable_categories.forEach(cat => {
    categories[cat] = out_all;
  });
  log4js.configure({
    appenders: {
      'out': {
        type: 'stdout'
      }
    },
    categories
  });
}
const logger = log4js.getLogger('prp/pmt');

/**
 * Given an address (account), get the classic account and tag.
 * If an `expectedTag` is provided:
 * 1. If the `Account` is an X-address, validate that the tags match.
 * 2. If the `Account` is a classic address, return `expectedTag` as the tag.
 *
 * @param Account The address to parse.
 * @param expectedTag If provided, and the `Account` is an X-address,
 *                    this method throws an error if `expectedTag`
 *                    does not match the tag of the X-address.
 * @returns {ClassicAccountAndTag}
 *          The classic account and tag.
 */
function getClassicAccountAndTag(
  Account: string,
  expectedTag?: number
): ClassicAccountAndTag {
  if (isValidXAddress(Account)) {
    const classic = xAddressToClassicAddress(Account);
    if (expectedTag !== undefined && classic.tag !== expectedTag) {
      throw new Error(
        'address includes a tag that does not match the tag specified in the transaction'
      );
    }
    return {
      classicAccount: classic.classicAddress,
      tag: classic.tag
    };
  } else {
    return {
      classicAccount: Account,
      tag: expectedTag
    };
  }
}

export default function(api: RippleAPI, log: Function): Operations {
  async function get(req: Request, res: ValidatableResponse, _next: NextFunction): Promise<void> {
    logger.trace('GET /v3/preparations/payments');

    const options = Object.assign({},
      req.query
    );

    type AmountInDrops = string | undefined;
    let Amount: AmountInDrops;
    if (options.currency === 'XRP') {
      Amount = api.xrpToDrops(options.value);
    } else if (options.currency === 'drops') {
      Amount = options.value;
    } else if (options.currency === undefined) {
      // Ensure `value` is not set
      if (options.value !== undefined) {
        const error: XrpApiError = new Error('Since `value` is provided, `currency` is required');
        error.code = ERRORS.CODES.UNSUPPORTED_CURRENCY;
        error.name = 'Missing `currency`';
        res.status(400).json(error);
        return;
      }
      Amount = undefined;
    } else {
      const error: XrpApiError = new Error('If provided, `currency` must be `XRP` or `drops`');
      error.code = ERRORS.CODES.UNSUPPORTED_CURRENCY;
      error.name = 'Unsupported currency';
      res.status(400).json(error);
      return;
    }

    if (options.destination) {
      if (!api.isValidAddress(options.destination)) {
        throw {
          status: 400,
          message: 'Invalid `destination` address'
        };
      }
      const destination = getClassicAccountAndTag(options.destination);
      const destinationHasNoTag = destination.tag === undefined;

      const baseReserve = await api.connection.getReserveBase();
      const amountLessThanBaseReserve = Amount && BigInt(Amount) < baseReserve;

      if (destinationHasNoTag || amountLessThanBaseReserve) {

        // The balance in XRP drops, or `undefined` if the account does not exist.
        const {
          destinationAccountBalance,
          destinationRequiresTag
        }: {
          destinationAccountBalance?: string;
          destinationRequiresTag?: boolean;
        } = await api.request('account_info', {
          account: destination.classicAccount,
          ledger_index: 'current'
        }).then(res => {
          const flags = api.parseAccountFlags(res.account_data.Flags);
          return {
            destinationAccountBalance: res.account_data.Balance,
            destinationRequiresTag: flags.requireDestinationTag === true
          };
        }).catch(error => {
          if (error.data.error === 'actNotFound') {
            logger.info(error.data);
            return {};
          } else {
            // If desired, we could add an option to skip pre-flight checks
            error.message = 'Failed to pre-flight payment. Unable to retrieve destination account_info';
            throw error; // Handled in server.ts (Error handler for business logic)
          }
        });

        // [Pre-flight 1/2] If:
        // - `destination` has no tag AND
        // - Destination account exists AND
        // - Destination account requires a destination tag
        // Then:
        // - Fail because the Destination account requires a destination tag, and one was not provided

        if (destinationHasNoTag && destinationAccountBalance && destinationRequiresTag) {
          const error = {
            // Missing required input (destination tag)
            // https://stackoverflow.com/questions/3050518
            status: 422,

            // If we permitted this payment, it would ultimately fail with:
            // tecDST_TAG_NEEDED:	The Payment transaction omitted a destination tag,
            // but the destination account has the lsfRequireDestTag flag enabled.
            message: 'Destination requires a destination tag, and one was not provided',

            errors: [
              {
                code: ERRORS.CODES.DESTINATION_TAG_NEEDED,
                message: 'Destination account has the RequireDest (requireDestinationTag) flag enabled',
                hint: 'Set a destination tag or use an X-address that contains a tag',
                url: 'https://xrpl.org/source-and-destination-tags.html#requiring-tags',
                ref: 'tecDST_TAG_NEEDED'
              }
            ]
          };
          throw error;
        }

        // [Pre-flight 2/2] If:
        // - `amount` is less than the base reserve (currently 20 XRP) AND
        // - Destination account does NOT exist
        // Then:
        // - Fail because the Destination account has not been funded and this payment is not large enough to fund it

        if (amountLessThanBaseReserve && destinationAccountBalance === undefined) {
          const error = {
            // Refuse to prepare payment because amount is insufficient to fund destination
            status: 422,

            // If we permitted this payment, it would ultimately fail with:
            // tecNO_DST_INSUF_XRP:	The account on the receiving end of the transaction does not exist,
            // and the transaction is not sending enough XRP to create it.
            // https://xrpl.org/tec-codes.html
            message: 'Destination account does not exist, and payment would not send enough XRP to create it',

            errors: [
              {
                code: ERRORS.CODES.NO_DESTINATION_INSUFFICIENT_XRP,
                message: 'The account on the receiving end of the payment does not exist',
                hint: 'Send enough XRP to create the account',
                url: 'https://xrpl.org/reserves.html',
                ref: 'tecNO_DST_INSUF_XRP'
              }
            ]
          };
          throw error;
        }
      }
    }

    const removeUndefined = (obj: {
      [key: string]: string | object | undefined;
    }): object => {
      Object.keys(obj).forEach(key => obj[key] === undefined && delete obj[key]);
      return obj;
    };
    const transaction = removeUndefined({
      TransactionType: "Payment",
      Account: options.source,
      Destination: options.destination,
      Amount
    }) as TransactionJSON;

    try {
      logger.trace('Preparing', transaction);
      const prepared = await api.prepareTransaction(transaction);
      const response = JSON.parse(prepared.txJSON);
      res.status(200).json(Object.assign(response, {
        min_ledger: await api.getLedgerVersion(),
        max_ledger: response.LastLedgerSequence
      }));
    } catch(error) {
      logger.warn(error);
      // e.g. ValidationError(instance.Account is not exactly one from <xAddress>,<classicAddress>)

      const status = 400;
      let message = error.data && error.data.error_message ? error.data.error_message : error.name || 'Error';
      if (message === 'Account not found.') {
        message = 'Source account not found.';
      }
      if (error.data && error.name) {
        error.data.name = error.name; // e.g. "RippledError"
      }
      error = error.data || error;
      if (error.code === undefined) {
        error.code = ERRORS.CODES.GET_PREPARATIONS_PAYMENTS;
      }

      // Make the error easier to understand
      error.message = error.message?.replace('instance.', '');

      const response = {
        message,
        errors: [error],
        Transaction: transaction
      };
      res.status(status).json(response);
    }
  }

  const operations = {
    get
  };

  return operations as Operations;
}

export interface ClassicAccountAndTag {
  classicAccount: string;
  tag: number | false | undefined;
}
