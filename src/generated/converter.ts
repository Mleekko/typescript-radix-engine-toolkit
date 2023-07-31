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
  Convert,
  Expression,
  Instruction,
  ManifestAddress,
  OlympiaNetwork,
  PublicKey,
  Value,
  ValueKind,
} from "../index";
import {
  SerializableExpression,
  SerializableInstruction,
  SerializableManifestAddress,
  SerializableManifestValue,
  SerializableManifestValueKind,
  SerializableOlympiaNetwork,
  SerializablePublicKey,
} from "./generated";

/**
 * A class that provides functionality for converting the generated models to their hand-written
 * counterparts.
 */
export class GeneratedConverter {
  static PublicKey = class {
    static toGenerated(value: PublicKey): SerializablePublicKey {
      return {
        kind: value.kind,
        value: Convert.Uint8Array.toHexString(value.value),
      };
    }

    static fromGenerated(value: SerializablePublicKey): PublicKey {
      return {
        kind: value.kind,
        value: Convert.HexString.toUint8Array(value.value),
      };
    }
  };

  static OlympiaNetwork = class {
    static toGenerated(value: OlympiaNetwork): SerializableOlympiaNetwork {
      return SerializableOlympiaNetwork[OlympiaNetwork[value]];
    }

    static fromGenerated(value: SerializableOlympiaNetwork): OlympiaNetwork {
      return OlympiaNetwork[SerializableOlympiaNetwork[value]];
    }
  };

  static ManifestValueKind = class {
    static toGenerated(value: ValueKind): SerializableManifestValueKind {
      return SerializableManifestValueKind[ValueKind[value]];
    }

    static fromGenerated(value: SerializableManifestValueKind): ValueKind {
      return ValueKind[SerializableManifestValueKind[value]];
    }
  };

  static Expression = class {
    static toGenerated(value: Expression): SerializableExpression {
      return SerializableExpression[Expression[value]];
    }

    static fromGenerated(value: SerializableExpression): Expression {
      return Expression[SerializableExpression[value]];
    }
  };

  static ManifestAddress = class {
    static toGenerated(value: ManifestAddress): SerializableManifestAddress {
      switch (value.kind) {
        case "Named":
          return {
            kind: value.kind,
            value: Convert.Number.toString(value.value),
          };
        case "Static":
          return {
            kind: value.kind,
            value: value.value,
          };
      }
    }

    static fromGenerated(value: SerializableManifestAddress): ManifestAddress {
      switch (value.kind) {
        case "Named":
          return {
            kind: value.kind,
            value: Convert.String.toNumber(value.value),
          };
        case "Static":
          return {
            kind: value.kind,
            value: value.value,
          };
      }
    }
  };

  static ManifestValue = class {
    static toGenerated(value: Value): SerializableManifestValue {
      switch (value.kind) {
        case ValueKind.Bool:
          return {
            kind: value.kind,
            value: {
              value: value.value,
            },
          };
        /* Numeric Types converted to strings */
        case ValueKind.I8:
        case ValueKind.I16:
        case ValueKind.I32:
        case ValueKind.U8:
        case ValueKind.U16:
        case ValueKind.U32:
        case ValueKind.Bucket:
        case ValueKind.Proof:
        case ValueKind.AddressReservation:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.Number.toString(value.value),
            },
          };
        /* BigInt types converted to strings */
        case ValueKind.I64:
        case ValueKind.I128:
        case ValueKind.U64:
        case ValueKind.U128:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.BigInt.toString(value.value),
            },
          };
        /* String values */
        case ValueKind.Blob:
        case ValueKind.String:
        case ValueKind.NonFungibleLocalId:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: value.value,
            },
          };
        /* Decimal conversions */
        case ValueKind.Decimal:
        case ValueKind.PreciseDecimal:
          return {
            kind: ValueKind[value.kind],
            value: {
              value: Convert.Decimal.toString(value.value),
            },
          };
        /* Sum and Product Types */
        case ValueKind.Enum:
          return {
            kind: value.kind,
            value: {
              discriminator: Convert.Number.toString(value.discriminator),
              fields: value.fields.map(
                GeneratedConverter.ManifestValue.toGenerated
              ),
            },
          };
        case ValueKind.Array:
          return {
            kind: value.kind,
            value: {
              element_value_kind:
                SerializableManifestValueKind[value.elementValueKind],
              elements: value.elements.map(
                GeneratedConverter.ManifestValue.toGenerated
              ),
            },
          };
        case ValueKind.Tuple:
          return {
            kind: value.kind,
            value: {
              fields: value.fields.map(
                GeneratedConverter.ManifestValue.toGenerated
              ),
            },
          };
        case ValueKind.Map:
          return {
            kind: value.kind,
            value: {
              key_value_kind: SerializableManifestValueKind[value.keyValueKind],
              value_value_kind:
                SerializableManifestValueKind[value.valueValueKind],
              entries: value.entries.map((mapEntry) => {
                return {
                  key: GeneratedConverter.ManifestValue.toGenerated(
                    mapEntry.key
                  ),
                  value: GeneratedConverter.ManifestValue.toGenerated(
                    mapEntry.value
                  ),
                };
              }),
            },
          };
        /* Misc */
        case ValueKind.Address:
          return {
            kind: value.kind,
            value: {
              value: GeneratedConverter.ManifestAddress.toGenerated(
                value.value
              ),
            },
          };
        case ValueKind.Expression:
          return {
            kind: value.kind,
            value: {
              value: GeneratedConverter.Expression.toGenerated(value.value),
            },
          };
      }
    }

    static fromGenerated(value: SerializableManifestValue): Value {
      switch (value.kind) {
        case "Bool":
          return {
            kind: ValueKind.Bool,
            value: value.value.value,
          };
        case "I8":
        case "I16":
        case "I32":
        case "U8":
        case "U16":
        case "U32":
        case "Bucket":
        case "Proof":
        case "AddressReservation":
          return {
            kind: ValueKind[value.kind],
            value: Convert.String.toNumber(value.value.value),
          };
        case "I64":
        case "I128":
        case "U64":
        case "U128":
          return {
            kind: ValueKind[value.kind],
            value: Convert.String.toBigInt(value.value.value),
          };
        case "Blob":
        case "String":
        case "NonFungibleLocalId":
          return {
            kind: ValueKind[value.kind],
            value: value.value.value,
          };
        case "Decimal":
        case "PreciseDecimal":
          return {
            kind: ValueKind[value.kind],
            value: Convert.String.toDecimal(value.value.value),
          };
        case "Enum":
          return {
            kind: ValueKind.Enum,
            discriminator: Convert.String.toNumber(value.value.discriminator),
            fields: value.value.fields.map(
              GeneratedConverter.ManifestValue.fromGenerated
            ),
          };
        case "Array":
          return {
            kind: ValueKind.Array,
            elementValueKind: ValueKind[value.value.element_value_kind],
            elements: value.value.elements.map(
              GeneratedConverter.ManifestValue.fromGenerated
            ),
          };
        case "Tuple":
          return {
            kind: ValueKind.Tuple,
            fields: value.value.fields.map(
              GeneratedConverter.ManifestValue.fromGenerated
            ),
          };
        case "Map":
          return {
            kind: ValueKind.Map,
            keyValueKind: ValueKind[value.value.key_value_kind],
            valueValueKind: ValueKind[value.value.value_value_kind],
            entries: value.value.entries.map((entry) => {
              return {
                key: GeneratedConverter.ManifestValue.fromGenerated(entry.key),
                value: GeneratedConverter.ManifestValue.fromGenerated(
                  entry.value
                ),
              };
            }),
          };
        case "Address":
          return {
            kind: ValueKind.Address,
            value: GeneratedConverter.ManifestAddress.fromGenerated(
              value.value.value
            ),
          };
        case "Expression":
          return {
            kind: ValueKind.Expression,
            value: GeneratedConverter.Expression.fromGenerated(
              value.value.value
            ),
          };
      }
    }
  };

  static Instruction = class {
    static toGenerated(value: Instruction): SerializableInstruction {
      switch (value.kind) {
        case "TakeAllFromWorktop":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
            },
          };
        case "TakeFromWorktop":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "TakeNonFungiblesFromWorktop":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              ids: value.ids,
            },
          };
        case "ReturnToWorktop":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
            },
          };
        case "AssertWorktopContainsAny":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
            },
          };
        case "AssertWorktopContains":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "AssertWorktopContainsNonFungibles":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              ids: value.ids,
            },
          };
        case "PopFromAuthZone":
          return {
            kind: value.kind,
          };
        case "PushToAuthZone":
          return {
            kind: value.kind,
            value: {
              proof_id: Convert.Number.toString(value.proofId),
            },
          };
        case "ClearAuthZone":
          return {
            kind: value.kind,
          };
        case "CreateProofFromAuthZoneOfAmount":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "CreateProofFromAuthZoneOfNonFungibles":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
              ids: value.ids,
            },
          };
        case "CreateProofFromAuthZoneOfAll":
          return {
            kind: value.kind,
            value: {
              resource_address: value.resourceAddress,
            },
          };
        case "ClearSignatureProofs":
          return {
            kind: value.kind,
          };
        case "CreateProofFromBucketOfAmount":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
              amount: Convert.Decimal.toString(value.amount),
            },
          };
        case "CreateProofFromBucketOfNonFungibles":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
              ids: value.ids,
            },
          };
        case "CreateProofFromBucketOfAll":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
            },
          };
        case "BurnResource":
          return {
            kind: value.kind,
            value: {
              bucket_id: Convert.Number.toString(value.bucketId),
            },
          };
        case "CloneProof":
          return {
            kind: value.kind,
            value: {
              proof_id: Convert.Number.toString(value.proofId),
            },
          };
        case "DropProof":
          return {
            kind: value.kind,
            value: {
              proof_id: Convert.Number.toString(value.proofId),
            },
          };
        case "CallFunction":
          return {
            kind: value.kind,
            value: {
              package_address: GeneratedConverter.ManifestAddress.toGenerated(
                value.packageAddress
              ),
              blueprint_name: value.blueprintName,
              function_name: value.functionName,
              args: GeneratedConverter.ManifestValue.toGenerated(value.args),
            },
          };
        case "CallMethod":
        case "CallRoyaltyMethod":
        case "CallMetadataMethod":
        case "CallRoleAssignmentMethod":
          return {
            kind: value.kind,
            value: {
              address: GeneratedConverter.ManifestAddress.toGenerated(
                value.address
              ),
              method_name: value.methodName,
              args: GeneratedConverter.ManifestValue.toGenerated(value.args),
            },
          };
        case "CallDirectVaultMethod":
          return {
            kind: value.kind,
            value: {
              address: value.address,
              method_name: value.methodName,
              args: GeneratedConverter.ManifestValue.toGenerated(value.args),
            },
          };
        case "DropAllProofs":
          return {
            kind: value.kind,
          };
        case "AllocateGlobalAddress":
          return {
            kind: value.kind,
            value: {
              package_address: value.packageAddress,
              blueprint_name: value.blueprintName,
            },
          };
      }
    }

    static fromGenerated(value: SerializableInstruction): Instruction {
      switch (value.kind) {
        case "TakeAllFromWorktop":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
          };
        case "TakeFromWorktop":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "TakeNonFungiblesFromWorktop":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            ids: value.value.ids,
          };
        case "ReturnToWorktop":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
          };
        case "AssertWorktopContainsAny":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
          };
        case "AssertWorktopContains":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "AssertWorktopContainsNonFungibles":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            ids: value.value.ids,
          };
        case "PopFromAuthZone":
          return {
            kind: value.kind,
          };
        case "PushToAuthZone":
          return {
            kind: value.kind,
            proofId: Convert.String.toNumber(value.value.proof_id),
          };
        case "ClearAuthZone":
          return {
            kind: value.kind,
          };
        case "CreateProofFromAuthZoneOfAmount":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "CreateProofFromAuthZoneOfNonFungibles":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
            ids: value.value.ids,
          };
        case "CreateProofFromAuthZoneOfAll":
          return {
            kind: value.kind,
            resourceAddress: value.value.resource_address,
          };
        case "ClearSignatureProofs":
          return {
            kind: value.kind,
          };
        case "CreateProofFromBucketOfAmount":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
            amount: Convert.String.toDecimal(value.value.amount),
          };
        case "CreateProofFromBucketOfNonFungibles":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
            ids: value.value.ids,
          };
        case "CreateProofFromBucketOfAll":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
          };
        case "BurnResource":
          return {
            kind: value.kind,
            bucketId: Convert.String.toNumber(value.value.bucket_id),
          };
        case "CloneProof":
          return {
            kind: value.kind,
            proofId: Convert.String.toNumber(value.value.proof_id),
          };
        case "DropProof":
          return {
            kind: value.kind,
            proofId: Convert.String.toNumber(value.value.proof_id),
          };
        case "CallFunction":
          return {
            kind: value.kind,
            packageAddress: GeneratedConverter.ManifestAddress.fromGenerated(
              value.value.package_address
            ),
            blueprintName: value.value.blueprint_name,
            functionName: value.value.function_name,
            args: GeneratedConverter.ManifestValue.fromGenerated(
              value.value.args
            ),
          };
        case "CallMethod":
        case "CallRoyaltyMethod":
        case "CallMetadataMethod":
        case "CallRoleAssignmentMethod":
          return {
            kind: value.kind,
            address: GeneratedConverter.ManifestAddress.fromGenerated(
              value.value.address
            ),
            methodName: value.value.method_name,
            args: GeneratedConverter.ManifestValue.fromGenerated(
              value.value.args
            ),
          };
        case "CallDirectVaultMethod":
          return {
            kind: value.kind,
            address: value.value.address,
            methodName: value.value.method_name,
            args: GeneratedConverter.ManifestValue.fromGenerated(
              value.value.args
            ),
          };
        case "DropAllProofs":
          return {
            kind: value.kind,
          };
        case "AllocateGlobalAddress":
          return {
            kind: value.kind,
            packageAddress: value.value.package_address,
            blueprintName: value.value.blueprint_name,
          };
      }
    }
  };
}
