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
  AnalyzeManifestRequest,
  ConvertManifestRequest,
  DecodeAddressRequest,
  DecompileNotarizedTransactionIntentRequest,
  DecompileSignedTransactionIntentRequest,
  DecompileTransactionIntentRequest,
  DecompileUnknownTransactionIntentRequest,
  DeriveBabylonAddressFromOlympiaAddressRequest,
  DeriveVirtualAccountAddressRequest,
  DeriveVirtualIdentityAddressRequest,
  EncodeAddressRequest,
  EntityAddress,
  InformationRequest,
  InstructionList,
  KnownEntityAddressesRequest,
  NotarizedTransaction,
  PublicKey,
  SborDecodeRequest,
  SborValue,
  SignedTransactionIntent,
  StaticallyValidateTransactionRequest,
  StaticallyValidateTransactionResponseInvalid,
  TransactionIntent,
  TransactionManifest,
  ValidationConfig,
} from "../models";
import { resolveBytes } from "../utils";
import { RawRadixEngineToolkit } from "./raw";

export class RadixEngineToolkit {
  /**
   * Returns information on the Radix Engine Toolkit library used by the wrapper.
   * @returns Information on the Radix Engine Toolkit library in use. More specifically, the library
   * version as well as the Git hash of the last commit are returned.
   */
  static async information(): Promise<LibraryInformation> {
    return RawRadixEngineToolkit.information(new InformationRequest()).then(
      ({ packageVersion, lastCommitHash }) => {
        return {
          libraryVersion: packageVersion,
          lastCommitHash: lastCommitHash,
        };
      }
    );
  }

  /**
   * Converts the instructions of a transaction manifest from one format the another. The supported
   * formats are: `String` and `Parsed`.
   * @param manifest The transaction manifest to convert from one format to another.
   * @param outputInstructionKind The instruction kind to convert the transaction manifest to
   * @param networkId The network id to use for the transaction manifest conversion and the network
   * id validation
   * @returns The converted transaction manifest.
   */
  static async convertManifest(
    manifest: TransactionManifest,
    outputInstructionKind: InstructionList.Kind,
    networkId: number
  ): Promise<TransactionManifest> {
    return RawRadixEngineToolkit.convertManifest(
      new ConvertManifestRequest(networkId, outputInstructionKind, manifest)
    );
  }

  /**
   * Analyzes the manifest to determine the set of included addresses.
   * @param manifest The transaction manifest to analyze the addresses for
   * @param networkId The network id of the network that the manifest is meant for. This is used for
   * the network validation as well as the Bech32m encoding.
   * @returns An Address analysis on the manifest
   */
  static async analyzeManifest(
    manifest: TransactionManifest,
    networkId: number
  ): Promise<AddressAnalysis> {
    return RawRadixEngineToolkit.analyzeManifest(
      new AnalyzeManifestRequest(networkId, manifest)
    ).then(
      ({
        packageAddresses,
        componentAddresses,
        resourceAddresses,
        accountAddresses,
        accountsRequiringAuth,
        accountsWithdrawnFrom,
        accountsDepositedInto,
      }) => {
        return {
          packageAddresses: packageAddresses.map(({ address }) => address),
          componentAddresses: componentAddresses.map(({ address }) => address),
          resourceAddresses: resourceAddresses.map(({ address }) => address),
          accountAddresses: accountAddresses.map(({ address }) => address),
          accountsRequiringAuth: accountsRequiringAuth.map(
            ({ address }) => address
          ),
          accountsWithdrawnFrom: accountsWithdrawnFrom.map(
            ({ address }) => address
          ),
          accountsDepositedInto: accountsDepositedInto.map(
            ({ address }) => address
          ),
        };
      }
    );
  }

  /**
   * Compiles the `TransactionIntent` by calling the Radix Engine Toolkit and SBOR Encoding it.
   * @param transactionIntent The transaction intent to compile
   * @returns The compiled transaction intent
   */
  static async compileTransactionIntent(
    transactionIntent: TransactionIntent
  ): Promise<Uint8Array> {
    return RawRadixEngineToolkit.compileTransactionIntent(
      transactionIntent
    ).then(({ compiledIntent }) => compiledIntent);
  }

  /**
   * Compiles the `SignedTransactionIntent` by calling the Radix Engine Toolkit and SBOR Encoding it.
   * @param signedTransactionIntent The signed transaction intent to compile
   * @returns The compiled signed transaction intent
   */
  static async compileSignedTransactionIntent(
    signedTransactionIntent: SignedTransactionIntent
  ): Promise<Uint8Array> {
    return RawRadixEngineToolkit.compileSignedTransactionIntent(
      signedTransactionIntent
    ).then(({ compiledIntent }) => compiledIntent);
  }

  /**
   * Compiles the `NotarizedTransaction` by calling the Radix Engine Toolkit and SBOR Encoding it.
   * @param notarizedTransactionIntent The signed transaction intent to compile
   * @returns The compiled signed transaction intent
   */
  static async compileNotarizedTransactionIntent(
    notarizedTransactionIntent: NotarizedTransaction
  ): Promise<Uint8Array> {
    return RawRadixEngineToolkit.compileNotarizedTransactionIntent(
      notarizedTransactionIntent
    ).then(({ compiledIntent }) => compiledIntent);
  }

  /**
   * Decompiles a transaction intent from a byte array of compiled transaction intent
   * @param compiledIntent A `Uint8Array` compiled intent or a `string` of the hex encoded intent
   * @param instructionsOutputKind The format of instructions to use in the manifest. This is either
   * `String` or `Parsed`.
   * @returns A `TransactionIntent` decompiled from the passed intent
   */
  static async decompileTransactionIntent(
    compiledIntent: Uint8Array | string,
    instructionsOutputKind: InstructionList.Kind = InstructionList.Kind.String
  ): Promise<TransactionIntent> {
    return RawRadixEngineToolkit.decompileTransactionIntent(
      new DecompileTransactionIntentRequest(
        instructionsOutputKind,
        resolveBytes(compiledIntent)
      )
    );
  }

  /**
   * Decompiles a signed transaction intent from a byte array of compiled transaction intent
   * @param compiledIntent A `Uint8Array` compiled signed intent or a `string` of the hex encoded
   * intent
   * @param instructionsOutputKind The format of instructions to use in the manifest. This is either
   * `String` or `Parsed`.
   * @returns A `SignedTransactionIntent` decompiled from the passed intent
   */
  static async decompileSignedTransactionIntent(
    compiledIntent: Uint8Array | string,
    instructionsOutputKind: InstructionList.Kind = InstructionList.Kind.String
  ): Promise<SignedTransactionIntent> {
    return RawRadixEngineToolkit.decompileSignedTransactionIntent(
      new DecompileSignedTransactionIntentRequest(
        instructionsOutputKind,
        resolveBytes(compiledIntent)
      )
    );
  }

  /**
   * Decompiles a notarized transaction intent from a byte array of compiled transaction intent
   * @param compiledIntent A `Uint8Array` compiled notarized intent or a `string` of the hex encoded
   * intent
   * @param instructionsOutputKind The format of instructions to use in the manifest. This is either
   * `String` or `Parsed`.
   * @returns A `NotarizedTransactionIntent` decompiled from the passed intent
   */
  static async decompileNotarizedTransactionIntent(
    compiledIntent: Uint8Array | string,
    instructionsOutputKind: InstructionList.Kind = InstructionList.Kind.String
  ): Promise<NotarizedTransaction> {
    return RawRadixEngineToolkit.decompileNotarizedTransactionIntent(
      new DecompileNotarizedTransactionIntentRequest(
        instructionsOutputKind,
        resolveBytes(compiledIntent)
      )
    );
  }

  /**
   * Given an transaction intent which is of an unknown type (e.g. not known whether it is a
   * notarized intent, signed intent, or unsigned intent), this function decompiles the intent
   * into the appropriate intent type.
   * @param compiledIntent Either a `Uint8Array` of bytes or a `string` of the hex-encoded bytes.
   * These should be the bytes of the unknown intent.
   * @param instructionsOutputKind The format of instructions to use in the manifest. This is either
   * `String` or `Parsed`.
   * @returns A decompiled transaction intent which can either be a `TransactionIntent`,
   * `SignedTransactionIntent`, or `NotarizedTransaction`.
   */
  static async decompileUnknownTransactionIntent(
    compiledIntent: Uint8Array | string,
    instructionsOutputKind: InstructionList.Kind = InstructionList.Kind.String
  ): Promise<
    NotarizedTransaction | SignedTransactionIntent | TransactionIntent
  > {
    return RawRadixEngineToolkit.decompileUnknownTransactionIntent(
      new DecompileUnknownTransactionIntentRequest(
        instructionsOutputKind,
        resolveBytes(compiledIntent)
      )
    ).then(({ value }) => value);
  }

  /**
   * Applies Bech32m encoding on addresses given the address bytes.
   * @param addressBytes A `Uint8Array` or a hex-encoded `string` of the address bytes to Bech32m
   * encode
   * using the HRP set of the specified network.
   * @param networkId The id of the network to use when encoding the address
   * @returns The Bech32m encoded `EntityAddress`
   */
  static async encodeAddress(
    addressBytes: Uint8Array | string,
    networkId: number
  ): Promise<string> {
    return RawRadixEngineToolkit.encodeAddress(
      new EncodeAddressRequest(resolveBytes(addressBytes), networkId)
    ).then(({ address }) => address);
  }

  /**
   * Given an address string, this function returns information on the address such as it's network
   * id, logical network name, type of addressed entity, the encoded data, and the HRP.
   * @param address A string of the address to decode.
   * @returns An object containing information on the passed address
   */
  static async decodeAddress(address: string): Promise<AddressInformation> {
    return RawRadixEngineToolkit.decodeAddress(
      new DecodeAddressRequest(address)
    ).then(({ networkId, networkName, entityType, data, hrp }) => {
      return {
        networkId: networkId,
        networkName: networkName,
        entityType: entityType,
        data: data,
        hrp: hrp,
      };
    });
  }

  /**
   * SBOR Encodes a given value and returns a byte array of the encoded value.
   * @param value The value to SBOR encode.
   * @returns The SBOR encoded value
   */
  static async sborEncode(value: SborValue.Any): Promise<Uint8Array> {
    // TODO: Refactor so that this takes in any ManifestSborValue or ScryptoSborValue
    return RawRadixEngineToolkit.sborEncode(value).then(
      ({ encodedValue }) => encodedValue
    );
  }

  /**
   * Given a byte array of an SBOR encoded value and a network ID, this function decodes the SBOR
   * value and returns it.
   * @param encodedValue A `Uint8Array` or hex-encoded string of the bytes of the SBOR encoded value
   * @param networkId The ID the network that this SBOR value is meant for. This is primarily used
   * for the Bech32m encoding of addresses
   * @returns An SBOR Value which can either be of the following two SBOR flavours: Scrypto or
   * Manifest
   */
  static async sborDecode(
    encodedValue: Uint8Array | string,
    networkId: number
  ): Promise<SborValue.Any> {
    return RawRadixEngineToolkit.sborDecode(
      new SborDecodeRequest(resolveBytes(encodedValue), networkId)
    );
  }

  /**
   * Given a public key and network id, this function deterministically calculates the address of
   * the virtual account component address associated with the public key.
   * @param publicKey An Ecdsa Secp256k1 or EdDSA Ed25519 public key to derive the virtual account
   * address for.
   * @param networkId The network that the virtual account address is meant for. This will be used
   * for the Bech32m encoding of the address.
   * @returns The address of the virtual account as a string.
   */
  static async deriveVirtualAccountAddress(
    publicKey: PublicKey.Any,
    networkId: number
  ): Promise<string> {
    return RawRadixEngineToolkit.deriveVirtualAccountAddress(
      new DeriveVirtualAccountAddressRequest(networkId, publicKey)
    ).then(({ virtualAccountAddress }) => virtualAccountAddress.address);
  }

  /**
   * Given a public key and network id, this function deterministically calculates the address of
   * the virtual identity component address associated with the public key.
   * @param publicKey An Ecdsa Secp256k1 or EdDSA Ed25519 public key to derive the virtual identity
   * address for.
   * @param networkId The network that the virtual identity address is meant for. This will be used
   * for the Bech32m encoding of the address.
   * @returns The address of the virtual identity as a string.
   */
  static async deriveVirtualIdentityAddress(
    publicKey: PublicKey.Any,
    networkId: number
  ): Promise<string> {
    return RawRadixEngineToolkit.deriveVirtualIdentityAddress(
      new DeriveVirtualIdentityAddressRequest(networkId, publicKey)
    ).then(({ virtualIdentityAddress }) => virtualIdentityAddress.address);
  }

  /**
   * Given an Olympia account address, this function deterministically calculates the address of the
   * associated virtual account on a Babylon network of a given network id.
   * @param olympiaAddress The Olympia account address to derive the associated Babylon virtual
   * account address for.
   * @param networkId The **Babylon** network id to derive the Babylon account address for. This is
   * primarily used for the Bech32m encoding of addresses. This argument defaults to `1` which is
   * the network id of the Babylon mainnet
   * @returns An object containing all of the mapping information of the address
   */
  static async deriveBabylonAddressFromOlympiaAddress(
    olympiaAddress: string,
    networkId: number
  ): Promise<OlympiaToBabylonAddressMapping> {
    return RawRadixEngineToolkit.deriveBabylonAddressFromOlympiaAddress(
      new DeriveBabylonAddressFromOlympiaAddressRequest(
        networkId,
        olympiaAddress
      )
    ).then(({ babylonAccountAddress, publicKey }) => {
      return {
        olympiaAccountAddress: olympiaAddress,
        babylonAccountAddress: babylonAccountAddress.address,
        publicKey: publicKey,
      };
    });
  }

  /**
   * Derives the addresses of a set of known entities on the specified network.
   * @param networkId The network id to ge the known entity addresses for.
   * @returns An object containing the entity addresses on the network with the specified id.
   */
  static async knownEntityAddresses(networkId: number): Promise<AddressBook> {
    return RawRadixEngineToolkit.knownEntityAddresses(
      new KnownEntityAddressesRequest(networkId)
    ).then(
      ({
        faucetComponentAddress,
        faucetPackageAddress,
        accountPackageAddress,
        xrdResourceAddress,
        systemTokenResourceAddress,
        ecdsaSecp256k1TokenResourceAddress,
        eddsaEd25519TokenResourceAddress,
        packageTokenResourceAddress,
        epochManagerSystemAddress,
        clockSystemAddress,
      }) => {
        return {
          faucetComponentAddress: faucetComponentAddress.address,
          faucetPackageAddress: faucetPackageAddress.address,
          accountPackageAddress: accountPackageAddress.address,
          xrdResourceAddress: xrdResourceAddress.address,
          systemTokenResourceAddress: systemTokenResourceAddress.address,
          ecdsaSecp256k1TokenResourceAddress:
            ecdsaSecp256k1TokenResourceAddress.address,
          eddsaEd25519TokenResourceAddress:
            eddsaEd25519TokenResourceAddress.address,
          packageTokenResourceAddress: packageTokenResourceAddress.address,
          epochManagerComponentAddress: epochManagerSystemAddress.address,
          clockComponentAddress: clockSystemAddress.address,
        };
      }
    );
  }

  static async staticallyValidateTransaction(
    notarizedTransaction: Uint8Array | NotarizedTransaction,
    validationConfig: ValidationConfig
  ): Promise<TransactionValidity> {
    let compiledNotarizedTransaction: Uint8Array;
    if (notarizedTransaction instanceof NotarizedTransaction) {
      compiledNotarizedTransaction =
        await this.compileNotarizedTransactionIntent(notarizedTransaction);
    } else if (notarizedTransaction instanceof Uint8Array) {
      compiledNotarizedTransaction = notarizedTransaction;
    } else {
      throw new TypeError(
        "Expected `Uint8Array` or `NotarizedTransaction` but got a different type."
      );
    }

    return RawRadixEngineToolkit.staticallyValidateTransaction(
      new StaticallyValidateTransactionRequest(
        compiledNotarizedTransaction,
        validationConfig
      )
    ).then((response) => {
      if (response instanceof StaticallyValidateTransactionResponseInvalid) {
        return { isValid: false, errorMessage: response.error };
      } else {
        return { isValid: true, errorMessage: undefined };
      }
    });
  }
}

export interface LibraryInformation {
  /**
   * The version of the library that's currently in use.
   */
  libraryVersion: string;

  /**
   * The Git hash of commit used for building this build of the Radix Engine Toolkit.
   */
  lastCommitHash: Uint8Array;
}

export interface AddressInformation {
  /**
   * The id of the network that the address belongs to.
   */
  networkId: number;

  /**
   * The logical name of the network that the address belongs to.
   */
  networkName: string;

  /**
   * The type of entity that's referenced by the address.
   */
  entityType: EntityAddress.EntityType;

  /**
   * The data encoded in the address.
   */
  data: Uint8Array;

  /**
   * The HRP used to encode the address
   */
  hrp: string;
}

export interface OlympiaToBabylonAddressMapping {
  /**
   * The underling public key encoded in the Olympia account address.
   */
  publicKey: PublicKey.Any;

  /**
   * The Olympia account address associated with the given public key.
   */
  olympiaAccountAddress: string;

  /**
   * The Babylon account address associated with a given Olympia account address.
   */
  babylonAccountAddress: string;
}

interface AddressBook {
  /**
   * The address of the Faucet
   */
  faucetComponentAddress: string;

  /**
   * The address of the Faucet
   */
  faucetPackageAddress: string;

  /**
   * The address of the Account
   */
  accountPackageAddress: string;

  /**
   * The address of the Xrd
   */
  xrdResourceAddress: string;

  /**
   * The address of the System
   */
  systemTokenResourceAddress: string;

  /**
   * The address of the Ecdsa Secp256k1
   */
  ecdsaSecp256k1TokenResourceAddress: string;

  /**
   * The address of the EdDsa Ed25519
   */
  eddsaEd25519TokenResourceAddress: string;

  /**
   * The address of the Package token
   */
  packageTokenResourceAddress: string;

  /**
   * The address of the EpochManager component
   */
  epochManagerComponentAddress: string;

  /**
   * The address of the Clock component
   */
  clockComponentAddress: string;
}

export interface TransactionValidity {
  /**
   * A boolean that indicates whether or not the transaction is valid.
   */
  isValid: boolean;

  /**
   * An optional error message. This message only exists if the transaction is invalid.
   */
  errorMessage: string | undefined;
}

export interface AddressAnalysis {
  /**
   * An array of the `PackageAddress`es encountered in the manifest
   */
  packageAddresses: Array<string>;
  /**
   * An array of the `ComponentAddress`es encountered in the manifest
   */
  componentAddresses: Array<string>;
  /**
   * An array of the `ResourceAddress`es encountered in the manifest
   */
  resourceAddresses: Array<string>;
  /**
   * An array of the Account Addresses encountered in the manifest
   */
  accountAddresses: Array<string>;
  /**
   * An array of the Account `ComponentAddress`es requiring auth encountered in the manifest
   */
  accountsRequiringAuth: Array<string>;
  /**
   * An array of the Account `ComponentAddress`es withdrawn from encountered in the manifest
   */
  accountsWithdrawnFrom: Array<string>;
  /**
   * An array of the Account `ComponentAddress`es deposited into encountered in the manifest
   */
  accountsDepositedInto: Array<string>;
}
