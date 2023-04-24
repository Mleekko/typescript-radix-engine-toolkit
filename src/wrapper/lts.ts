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

import Decimal from "decimal.js";
import {
  CompiledNotarizedTransaction,
  CompiledSignedTransactionIntent,
} from "../builders";
import {
  Instruction,
  InstructionList,
  ManifestAstValue,
  NotarizedTransaction,
  PublicKey,
  SignedTransactionIntent,
  TransactionIntent,
} from "../models";
import { hash } from "../utils";
import { OlympiaToBabylonAddressMapping, RadixEngineToolkit } from "./default";

export namespace LTSRadixEngineToolkit {
  /**
   * A sub-API for transaction related functions.
   */
  export class Transaction {
    /**
     * Given a transaction intent of any type, this function compiles the transaction intent
     * returning a byte array of the compiled intent.
     * @param intent A `TransactionIntent`, `SignedTransactionIntent`, or
     * `NotarizedTransactionIntent`, to compile.
     * @returns The compiled intent
     */
    static async compile(
      intent: TransactionIntent | SignedTransactionIntent | NotarizedTransaction
    ): Promise<Uint8Array> {
      if (intent instanceof TransactionIntent) {
        return Transaction.compileTransactionIntent(intent);
      } else if (intent instanceof SignedTransactionIntent) {
        return Transaction.compileSignedTransactionIntent(intent);
      } else if (intent instanceof NotarizedTransaction) {
        return Transaction.compileNotarizedTransactionIntent(intent);
      } else {
        throw TypeError(
          "Expected argument of type `TransactionIntent | SignedTransactionIntent | NotarizedTransaction`."
        );
      }
    }

    /**
     * Compiles the `TransactionIntent` by calling the Radix Engine Toolkit and SBOR Encoding it.
     * @param transactionIntent The transaction intent to compile
     * @returns The compiled transaction intent
     */
    static async compileTransactionIntent(
      transactionIntent: TransactionIntent
    ): Promise<Uint8Array> {
      return RadixEngineToolkit.compileTransactionIntent(transactionIntent);
    }

    /**
     * Compiles the `SignedTransactionIntent` by calling the Radix Engine Toolkit and SBOR Encoding it.
     * @param signedTransactionIntent The signed transaction intent to compile
     * @returns The compiled signed transaction intent
     */
    static async compileSignedTransactionIntent(
      signedTransactionIntent: SignedTransactionIntent
    ): Promise<Uint8Array> {
      return RadixEngineToolkit.compileSignedTransactionIntent(
        signedTransactionIntent
      );
    }

    /**
     * Compiles the `NotarizedTransaction` by calling the Radix Engine Toolkit and SBOR Encoding it.
     * @param notarizedTransactionIntent The signed transaction intent to compile
     * @returns The compiled signed transaction intent
     */
    static async compileNotarizedTransactionIntent(
      notarizedTransactionIntent: NotarizedTransaction
    ): Promise<Uint8Array> {
      return RadixEngineToolkit.compileNotarizedTransactionIntent(
        notarizedTransactionIntent
      );
    }

    /**
     * Decompiles and summarizes a compiled intent extracting information such as locked fees,
     * deposits, and withdrawals.
     * @param compiledIntent The compiled intent to produce a summary for. This function accepts
     * compiled signed intents and compiled notarized transactions.
     * @returns A summary on the transaction of the various withdraws, deposits, and locked fees
     * that can be statically obtained from the manifest.
     *
     * @remarks
     * This function only works for manifests that perform simple transfers which were created
     * through the SimpleTransactionBuilder class and will not work for any other more complex
     * transactions since this information might not be available to obtain statically from the
     * manifest.
     */
    static async summarizeTransaction(
      compiledIntent:
        | CompiledNotarizedTransaction
        | CompiledSignedTransactionIntent
    ): Promise<TransactionSummary> {
      return summarizeTransaction(compiledIntent);
    }
  }

  /**
   * A sub-API for derivation related functions.
   */
  export class Derive {
    /**
     * Given a public key and network id, this function deterministically calculates the address of
     * the virtual account component address associated with the public key.
     * @param publicKey An Ecdsa Secp256k1 or EdDSA Ed25519 public key to derive the virtual account
     * address for.
     * @param networkId The network that the virtual account address is meant for. This will be used
     * for the Bech32m encoding of the address.
     * @returns The address of the virtual account as a string.
     */
    static async virtualAccountAddress(
      publicKey: PublicKey.PublicKey,
      networkId: number
    ): Promise<string> {
      return RadixEngineToolkit.deriveVirtualAccountAddress(
        publicKey,
        networkId
      );
    }

    /**
     * Given an Olympia account address, this function deterministically calculates the address of
     * the associated virtual account on a Babylon network of a given network id.
     * @param olympiaAddress The Olympia account address to derive the associated Babylon virtual
     * account address for.
     * @param networkId The **Babylon** network id to derive the Babylon account address for. This is
     * primarily used for the Bech32m encoding of addresses. This argument defaults to `1` which is
     * the network id of the Babylon mainnet
     * @returns An object containing all of the mapping information of the address
     */
    static async babylonAccountAddressFromOlympiaAccountAddress(
      olympiaAddress: string,
      networkId: number
    ): Promise<OlympiaToBabylonAddressMapping> {
      return RadixEngineToolkit.deriveBabylonAddressFromOlympiaAddress(
        olympiaAddress,
        networkId
      );
    }

    /**
     * Derives the addresses of a set of known entities on the specified network.
     * @param networkId The network id to ge the known entity addresses for.
     * @returns An object containing the entity addresses on the network with the specified id.
     */
    static async knownAddresses(networkId: number): Promise<AddressBook> {
      return RadixEngineToolkit.knownEntityAddresses(networkId).then(
        ({
          faucetComponentAddress,
          faucetPackageAddress,
          accountPackageAddress,
          xrdResourceAddress,
          systemTokenResourceAddress,
          ecdsaSecp256k1TokenResourceAddress,
          eddsaEd25519TokenResourceAddress,
          packageTokenResourceAddress,
          epochManagerComponentAddress,
          clockComponentAddress,
        }) => {
          return {
            resources: {
              xrdResource: xrdResourceAddress,
              ecdsaSecp256k1Resource: ecdsaSecp256k1TokenResourceAddress,
              eddsaEd25519Resource: eddsaEd25519TokenResourceAddress,
              systemResource: systemTokenResourceAddress,
              packageBadgeResource: packageTokenResourceAddress,
            },
            components: {
              faucet: faucetComponentAddress,
              epochManager: epochManagerComponentAddress,
              clock: clockComponentAddress,
            },
            packages: {
              faucet: faucetPackageAddress,
              account: accountPackageAddress,
            },
          };
        }
      );
    }
  }

  /**
   * A sub-API for utility functions exposed by the toolkit.
   */
  export class Utils {
    /**
     * This function hashes a given byte array of data through the hashing algorithm used by the
     * Radix Engine and Scrypto. The hashing algorithm adopted by the Radix stack is Blake2b with 32
     * byte digests.
     * @param data The data to hash
     * @returns The hash of the data
     */
    static hash(data: Uint8Array): Uint8Array {
      return hash(data);
    }
  }
}

export interface AddressBook {
  resources: {
    xrdResource: string;
    ecdsaSecp256k1Resource: string;
    eddsaEd25519Resource: string;
    systemResource: string;
    packageBadgeResource: string;
  };
  components: {
    faucet: string;
    epochManager: string;
    clock: string;
  };
  packages: {
    faucet: string;
    account: string;
  };
}

export interface TransactionSummary {
  /// Information on which account this fee was locked against.
  feesLocked: {
    account: string;
    amount: Decimal;
  };

  /// A record of the withdrawn resources. Maps the account address to a mapping of the resource
  /// address and amount.
  withdraws: Record<string, Record<string, Decimal>>;

  /// A record of the deposited resources. Maps the account address to a mapping of the resource
  /// address and amount.
  deposits: Record<string, Record<string, Decimal>>;
}

const summarizeTransaction = async (
  intent: CompiledSignedTransactionIntent | CompiledNotarizedTransaction
): Promise<TransactionSummary> => {
  // Get the instructions contained in the passed compiled intent
  let instructions: Array<Instruction.Instruction> = [];
  if (intent instanceof CompiledSignedTransactionIntent) {
    let decompiledSignedIntent =
      await RadixEngineToolkit.decompileSignedTransactionIntent(
        intent.toByteArray(),
        InstructionList.Kind.Parsed
      );
    instructions = (
      decompiledSignedIntent.intent.manifest
        .instructions as InstructionList.ParsedInstructions
    ).value;
  } else if (intent instanceof CompiledNotarizedTransaction) {
    let decompiledNotarizedTransaction =
      await RadixEngineToolkit.decompileNotarizedTransactionIntent(
        intent.toByteArray(),
        InstructionList.Kind.Parsed
      );
    instructions = (
      decompiledNotarizedTransaction.signedIntent.intent.manifest
        .instructions as InstructionList.ParsedInstructions
    ).value;
  } else {
    throw new TypeError(
      "Invalid type passed in for resource movement resolution."
    );
  }

  // A map where the key is the bucket ID and the value is a tuple of the resource address and
  // amount.
  let bucketAmounts: Record<string, [string, Decimal]> = {};

  let feesLocked:
    | {
        account: string;
        amount: Decimal;
      }
    | undefined = undefined;
  let withdraws: Record<string, Record<string, Decimal>> = {};
  let deposits: Record<string, Record<string, Decimal>> = {};

  // Iterate over the instructions and resolve them
  for (const instruction of instructions) {
    switch (instruction.instruction) {
      case Instruction.Kind.TakeFromWorktopByAmount:
        const takeFromWorktopInstruction =
          instruction as Instruction.TakeFromWorktopByAmount;

        // Assuming that the bucket id is a string since this is what the LTS library produces and
        // because the non-string IDs are currently bugged in Scrypto.
        const bucketId = (
          takeFromWorktopInstruction.intoBucket
            .identifier as ManifestAstValue.String
        ).value;
        const resourceAddress =
          takeFromWorktopInstruction.resourceAddress.address;
        const amount = takeFromWorktopInstruction.amount.value;

        bucketAmounts[bucketId] = [resourceAddress, amount];
        break;

      case Instruction.Kind.CallMethod:
        const callMethodInstruction = instruction as Instruction.CallMethod;

        // Cases we support:
        // 1. Withdraw by amount
        // 2. Deposit by amount
        // 3. Lock fee

        // TODO: Support withdraw_and_lock_fee when the simple builder supports it

        // Case: Lock Fee
        if (
          callMethodInstruction.methodName.value === "lock_fee" &&
          callMethodInstruction.arguments?.length === 1 &&
          callMethodInstruction.arguments[0].type ===
            ManifestAstValue.Kind.Decimal
        ) {
          let lockFeeAccount = callMethodInstruction.componentAddress.address;
          let lockFeeAmount = (
            callMethodInstruction.arguments[0] as ManifestAstValue.Decimal
          ).value;

          feesLocked = {
            account: lockFeeAccount,
            amount: lockFeeAmount,
          };
        }

        // Case: Withdraw from account by amount
        else if (
          callMethodInstruction.methodName.value === "withdraw" &&
          callMethodInstruction.arguments?.length === 2 &&
          callMethodInstruction.arguments[0].type ===
            ManifestAstValue.Kind.Address &&
          callMethodInstruction.arguments[1].type ===
            ManifestAstValue.Kind.Decimal
        ) {
          let withdrawAccountAddress =
            callMethodInstruction.componentAddress.address;
          let withdrawResourceAddress = (
            callMethodInstruction.arguments[0] as ManifestAstValue.Address
          ).address;
          let withdrawAmount = (
            callMethodInstruction.arguments[1] as ManifestAstValue.Decimal
          ).value;

          if (withdraws?.[withdrawAccountAddress] === undefined) {
            withdraws[withdrawAccountAddress] = {};
          }
          if (
            withdraws[withdrawAccountAddress]?.[withdrawResourceAddress] ===
            undefined
          ) {
            withdraws[withdrawAccountAddress][withdrawResourceAddress] =
              new Decimal("0");
          }

          withdraws[withdrawAccountAddress][withdrawResourceAddress] =
            withdraws[withdrawAccountAddress][withdrawResourceAddress].add(
              withdrawAmount
            );
        }
        // Case: Deposit bucket into account
        else if (
          callMethodInstruction.methodName.value === "deposit" &&
          callMethodInstruction.arguments?.length === 1 &&
          callMethodInstruction.arguments[0].type ===
            ManifestAstValue.Kind.Bucket
        ) {
          let depositAccountAddress =
            callMethodInstruction.componentAddress.address;
          let depositBucketId = (
            (callMethodInstruction.arguments[0] as ManifestAstValue.Bucket)
              .identifier as ManifestAstValue.String
          ).value;
          let [depositResourceAddress, depositAmount] =
            bucketAmounts[depositBucketId];

          if (deposits?.[depositAccountAddress] === undefined) {
            deposits[depositAccountAddress] = {};
          }
          if (
            deposits[depositAccountAddress]?.[depositResourceAddress] ===
            undefined
          ) {
            deposits[depositAccountAddress][depositResourceAddress] =
              new Decimal("0");
          }

          deposits[depositAccountAddress][depositResourceAddress] =
            deposits[depositAccountAddress][depositResourceAddress].add(
              depositAmount
            );
        } else {
          throw new Error(
            `Unsupported CallMethod instruction: ${callMethodInstruction.toObject()}`
          );
        }
        break;

      default:
        throw new Error(
          `LTS resolution of resource movements does not support this instructions: ${instruction.instruction}`
        );
    }
  }

  if (feesLocked !== undefined) {
    return {
      feesLocked,
      withdraws,
      deposits,
    };
  } else {
    throw new Error("No lock_fee instruction found in the manifest");
  }
};
