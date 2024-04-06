// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

import {
  CommittedTransactionInfo,
  Configuration, GatewayStatusResponse,
  StateApi,
  StatusApi, StreamApi, StreamTransactionsResponse,
  TransactionApi,
  TransactionStatus,
  TransactionStatusResponse,
  TransactionSubmitResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import {
  address, bucket,
  Convert,
  decimal, enumeration,
  generateRandomNonce, KnownAddresses,
  ManifestBuilder,
  NetworkId,
  PrivateKey,
  RadixEngineToolkit,
  TransactionBuilder,
} from "@radixdlt/radix-engine-toolkit";
import type {StateEntityFungiblesPageRequest, StreamTransactionsRequest} from "@radixdlt/babylon-gateway-api-sdk/dist/generated/models";
import {
  FungibleResourcesCollectionItemGloballyAggregated
} from "@radixdlt/babylon-gateway-api-sdk/dist/generated/models/FungibleResourcesCollectionItemGloballyAggregated";
import type {FungibleResourcesCollectionItem} from "@radixdlt/babylon-gateway-api-sdk/dist/generated/models/FungibleResourcesCollectionItem";
import type {TransactionIntentStatus} from "@radixdlt/babylon-gateway-api-sdk/dist/generated/models/TransactionIntentStatus";

const NetworkConfiguration = {
  gatewayBaseUrl: "https://mainnet.radixdlt.com",
  networkId: NetworkId.Mainnet,
};

const RESOURCE_DOGECUBE: string = "resource_rdx1t4qfgjm35dkwdrpzl3d8pc053uw9v4pj5wfek0ffuzsp73evye6wu6";
const TARGET_ADDRESS: string = "account_rdx169j02tdr9tugccczttttzfln63plduzr3rg8azlmz4jzy9w864cen3";

const getCurrentEpoch = async (statusApi: StatusApi): Promise<number> =>
  statusApi.gatewayStatus().then((output: GatewayStatusResponse) => output.ledger_state.epoch);

const getCurrentStateVersion = async (statusApi: StatusApi): Promise<number> =>
    statusApi.gatewayStatus().then((output: GatewayStatusResponse) => output.ledger_state.state_version);


const submitTransaction = async (
  transactionApi: TransactionApi,
  compiledTransaction: Uint8Array
): Promise<TransactionSubmitResponse> =>
  transactionApi.transactionSubmit({
    transactionSubmitRequest: {
      notarized_transaction_hex:
        Convert.Uint8Array.toHexString(compiledTransaction),
    },
  });


/**
 * Loads the balances of an address. The API returns one page at a time (max 100 tokens), so need to aggregate all pages.
 * */
const getBalances = async(address: string): Promise<Record<string, string>> => {
  const apiConfiguration = new Configuration({
    basePath: NetworkConfiguration.gatewayBaseUrl,
  });

  const stateApi = new StateApi(apiConfiguration);

  const allBalances: Record<string, string> = {};

  // params for pagination
  let stateVersion = 0;
  let cursor: string | null | undefined = "";

  while (stateVersion == 0 || cursor) {
    let request: StateEntityFungiblesPageRequest = {
      address: address
    }
    if (cursor) {
      request = {
        address: address,
        cursor: cursor,
        at_ledger_state: {state_version: stateVersion},
      }
    }
    const data = await   stateApi.entityFungiblesPage({
      stateEntityFungiblesPageRequest: request
    })

    cursor = data.next_cursor;
    stateVersion = data.ledger_state.state_version;

    data.items.forEach((item: FungibleResourcesCollectionItem) => {
      allBalances[item.resource_address] = (<FungibleResourcesCollectionItemGloballyAggregated>item).amount;
    });

  }

  return allBalances;
}

const loadBalance = async() => {
  const privateKey = new PrivateKey.Secp256k1(
      "1df0292c520543a4d8e43e230c29e4c7b49669ec71940fea1b87be3224bc6442"
  );

  const accountAddress = await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      privateKey.publicKey(),
      NetworkConfiguration.networkId
  );
  console.log("Account address: " + accountAddress);

  const balances = await getBalances(TARGET_ADDRESS);
  // const balances = await getBalances(accountAddress);
  console.log("Balances: " + JSON.stringify(balances));
}


const getTransactionStatus = async(transactionId: string): Promise<TransactionStatus> => {
  const apiConfiguration = new Configuration({
    basePath: NetworkConfiguration.gatewayBaseUrl,
  });
  const transactionApi = new TransactionApi(apiConfiguration);

  // There will be some time needed for the transaction to be propagated to nodes and then processed
  // by the network. We will poll the transaction status until the transaction is eventually
  // committed
  let transactionStatus: TransactionStatusResponse | undefined = undefined;
  while (
      transactionStatus === undefined ||
      transactionStatus?.status === TransactionStatus.Pending
      ) {
    transactionStatus = await transactionApi.transactionStatus({
      transactionStatusRequest: {
        intent_hash: transactionId,
      },
    });

    if (transactionStatus.intent_status === "LikelyButNotCertainRejection") {
      // Could be because of insufficient balance - might want to handle this
      // (or just wait for 5 minutes until the TX gets permanently rejected and we are out of the while loop)
      console.log("Likely TX will fail:\n" + JSON.stringify(transactionStatus, null, 2));
    }
    if (transactionStatus.status === TransactionStatus.Pending) {
      console.log("waiting....");
      await new Promise((r) => setTimeout(r, 1000));
    }

  }
  return transactionStatus.status;
}

const loadTransactionStatus = async() => {
  const transactionStatus = await getTransactionStatus("txid_rdx1nynuk56w6yvuhm0s76z2dpfm0e9nx0t8kv3348slkddgslcm6u7s6xcaw5");
  console.log("Transaction Status:", transactionStatus);
}

const getTransactionDetails = async(transactionId: string): Promise<CommittedTransactionInfo> => {
  const apiConfiguration = new Configuration({
    basePath: NetworkConfiguration.gatewayBaseUrl,
  });
  const transactionApi = new TransactionApi(apiConfiguration);


  let response = await transactionApi.transactionCommittedDetails({
    transactionCommittedDetailsRequest: {
      intent_hash: transactionId,
      opt_ins: {
        balance_changes: true
      }
    },
  });
  return response.transaction;
}

const loadTransactionDetails = async() => {
  const transactionInfo = await getTransactionDetails("txid_rdx1nynuk56w6yvuhm0s76z2dpfm0e9nx0t8kv3348slkddgslcm6u7s6xcaw5");
  console.log("Transaction Balance Changes:", transactionInfo.balance_changes);
}

const getAccountTransactions = async(account: string, fromVersion: number | null): Promise<StreamTransactionsResponse> => {
  const apiConfiguration = new Configuration({
    basePath: NetworkConfiguration.gatewayBaseUrl,
  });
  const streamApi = new StreamApi(apiConfiguration);


  const request: StreamTransactionsRequest = {
    limit_per_page: 10,
    affected_global_entities_filter: [account],
    opt_ins: {
      balance_changes: true
    }
  }

  if (fromVersion) {
    request.from_ledger_state = {state_version: fromVersion};
  }

  // merge all items from all consecutive pages into the first page response object.
  const firstResponse: StreamTransactionsResponse = await streamApi.streamTransactions({
    streamTransactionsRequest: request
  });
  request.cursor = firstResponse.next_cursor;

  while (request.cursor) {
    const response: StreamTransactionsResponse = await streamApi.streamTransactions({
      streamTransactionsRequest: request
    });
    firstResponse.items.push(...response.items);
    request.cursor = response.next_cursor;
  }

  return firstResponse;
}

const loadAccountTransactions = async () => {
  let response = await getAccountTransactions(TARGET_ADDRESS, null);
  console.log(`Address ${TARGET_ADDRESS} has ${response.items.length} transactions.`);

  const lastCheckedVersion = response.ledger_state.state_version;

  await new Promise((r) => setTimeout(r, 2000));
  let newResponse = await getAccountTransactions(TARGET_ADDRESS, lastCheckedVersion);
  console.log(`Address ${TARGET_ADDRESS} has ${newResponse.items.length} new transactions since 2 seconds ago.`);
}


const transferTokensTransaction = async() => {
  // Setting up the Gateway Sub-APIs that will be used in this example. We will be utilizing two sub
  // APIs: the Status API to get the current epoch and the transaction API to submit and query the
  // status of transactions on the network.
  const apiConfiguration = new Configuration({
    basePath: NetworkConfiguration.gatewayBaseUrl,
  });
  const statusApi = new StatusApi(apiConfiguration);
  const transactionApi = new TransactionApi(apiConfiguration);

  // Setting up the private key of the transaction notary.
  const notaryPrivateKey = new PrivateKey.Secp256k1(
      "1df0292c520543a4d8e43e230c29e4c7b49669ec71940fea1b87be3224bc6442"
  );

  const accountAddress = await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
      notaryPrivateKey.publicKey(),
      NetworkConfiguration.networkId
  );
  console.log("Account address: " + accountAddress);

  // Building the manifest to transfer 50 DOGECUBE to {TARGET_ADDRESS}.
  let manifest = new ManifestBuilder()
      .callMethod(accountAddress, "lock_fee", [
        decimal(1) // max 1 XRD will be spent on the tx fees.
      ]).callMethod(
          accountAddress,
          "withdraw",
          [
            address(RESOURCE_DOGECUBE),
            decimal(50)
          ]
      ).takeAllFromWorktop(
          RESOURCE_DOGECUBE, (builder: ManifestBuilder, bucketId: number): ManifestBuilder => {
            return builder.callMethod(
                TARGET_ADDRESS,
                "try_deposit_or_abort",
                [bucket(bucketId), enumeration(0)]
            );
          }
      ).build();

  // With the manifest constructed above, we may now construct the complete transaction. Part of the
  // transaction construction requires knowledge of the ledger state, more specifically, we need to
  // have knowledge of the current epoch of the network to set the epoch bounds in the transaction
  // header. This information can be obtained from the gateway API through the status API.
  const currentEpoch = await getCurrentEpoch(statusApi);
  const notarizedTransaction = await TransactionBuilder.new().then((builder: TransactionBuilder) =>
      builder
          .header({
            networkId: NetworkConfiguration.networkId,
            startEpochInclusive: currentEpoch,
            endEpochExclusive: currentEpoch + 1,
            nonce: generateRandomNonce(),
            notaryPublicKey: notaryPrivateKey.publicKey(),
            notaryIsSignatory: true,
            tipPercentage: 0,
          })
          .manifest(manifest)
          .notarize(notaryPrivateKey)
  );
  // After the transaction has been built, we can get the transaction id (transaction hash) which is
  // the identifier used to get information on this transaction through the gateway.
  const transactionId =
      await RadixEngineToolkit.NotarizedTransaction.intentHash(
          notarizedTransaction
      );
  console.log("Transaction ID:", transactionId.id);

  // After the transaction has been built, it can be printed to the console as a JSON string if the
  // developer wishes to inspect it visually in any way.
  console.log("Transaction:", notarizedTransaction);

  // To submit the transaction to the Gateway API, it must first be compiled or converted from its
  // human-readable format down to an array of bytes that can be consumed by the gateway. This can
  // be done by calling the compile method on the transaction object.
  const compiledTransaction =
      await RadixEngineToolkit.NotarizedTransaction.compile(notarizedTransaction);
  console.log(
      "Compiled Transaction:",
      Convert.Uint8Array.toHexString(compiledTransaction)
  );

  // Now that we have the compiled transaction, we can submit it to the Gateway API.
  console.log("Will submit now");
  const submissionResult = await submitTransaction(
      transactionApi,
      compiledTransaction
  );
  console.log("Transaction submission result:", submissionResult);

  const transactionStatus = await getTransactionStatus(transactionId.id);
  console.log("Transaction Status:", transactionStatus);
}



const main = async () => {
  await loadBalance();
  await loadTransactionStatus();
  await loadTransactionDetails();
  await loadAccountTransactions();
  // this won't work because the account is empty
  // await transferTokensTransaction();
};


main();
