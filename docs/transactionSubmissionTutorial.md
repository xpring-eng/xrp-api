# Reliable Transaction Submission

There are multiple ways to achieve reliable transaction submission and several choices and trade-offs that must be made according to the needs of your application.

XRP-API simplifies Reliable Transaction Submission into a three-step process that covers the most important use cases. The following is the recommended flow:

1. **Prepare** a transaction.
1. **Submit** a transaction to be signed and relayed to the network.
1. **Query** for the transaction's final status.

## Prepare

In this tutorial, we prepare an XRP payment. XRP-API auto-fills the Fee, Sequence, and LastLedgerSequence fields.

    GET /v3/preparations/payments?source={:source_address}&destination={:destination_address}&currency={:currency}&value={:amount}

XRP-API will automatically “pre-flight” your transaction:

- If the Destination requires a destination tag, then “destination” must be an X-address with tag.
- If the Destination does not exist, the amount must be greater than the base reserve (currently 20 XRP).

Take the response object and modify it as desired.

At this point, store the payment object in your application’s persistent storage so that you can recover from a crash or power failure.

## Submit

XRP-API signs your transaction and relays it to the XRP Ledger's peer-to-peer network.

    PUT /v3/payments

This is an idempotent PUT method. It is generally safe to submit the same request multiple times. If you do not get a 200 response back, you could repeat the same request until you do, with some limit (e.g. give up after 3 tries).

`Sequence` is required and serves as the idempotency key. If the PUT request's status is uncertain (e.g. network disconnection or power failure), you can safely resubmit the transaction with the same `Sequence`.

## Query

Since most transactions are validated within 4 seconds, we suggest waiting 4 seconds and then querying with the tx hash, min_ledger, and max_ledger values. This gives you the transaction's final status.

    GET /v3/transactions/{transaction_id}
