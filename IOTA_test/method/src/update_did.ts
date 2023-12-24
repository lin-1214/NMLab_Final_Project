// Copyright 2020-2023 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    IotaDocument,
    IotaIdentityClient,
    JwkMemStore,
    JwsAlgorithm,
    KeyIdMemStore,
    MethodRelationship,
    MethodScope,
    Service,
    Storage,
    Timestamp,
    IotaDID,
    VerificationMethod,
} from "@iota/identity-wasm/node";
import { AliasOutput, Client, IRent, MnemonicSecretManager, Utils } from "@iota/sdk-wasm/node";
import { API_ENDPOINT, createDid } from "../util";

/** Demonstrates how to update a DID document in an existing Alias Output. */
export async function updateVerificationMethod(
    DID_id: string,
    DID_mnemonic: string,
    storage: Storage
) {
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Generate a random mnemonic for our wallet.
    const secretManager: MnemonicSecretManager = {
        mnemonic: DID_mnemonic,
    };
    const DID = IotaDID.parse(DID_id);
    const document = await didClient.resolveDid(DID);
    // Creates a new wallet and identity (see "0_create_did" example).
    // const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    const did = document.id();
    // let originalMethod = document.resolveMethod(fragment) as VerificationMethod;
    // await document.purgeMethod(storage, originalMethod?.id());
    // Insert a new Ed25519 verification method in the DID document.
    let _frag = "#jwk";
    try {
        // Remove a verification method.
        let originalMethod = document.resolveMethod(_frag) as VerificationMethod;
        document.removeMethod(originalMethod?.id());
        // await document.purgeMethod(storage, originalMethod?.id());
    } catch (e) {
        console.log("No method to purge");
        console.log("---------------");
    }

    const frag = "#jwk";
    await document.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        JwsAlgorithm.EdDSA,
        frag,
        MethodScope.VerificationMethod()
    );
    // Attach a new method relationship to the inserted method.
    document.attachMethodRelationship(did.join(frag), MethodRelationship.Authentication);
    document.setMetadataUpdated(Timestamp.nowUTC());

    // Resolve the latest output and update it with the given document.
    let aliasOutput: AliasOutput = await didClient.updateDidOutput(document);
    // Because the size of the DID document increased, we have to increase the allocated storage deposit.
    // This increases the deposit amount to the new minimum.
    const rentStructure: IRent = await didClient.getRentStructure();

    aliasOutput = await client.buildAliasOutput({
        ...aliasOutput,
        amount: Utils.computeStorageDeposit(aliasOutput, rentStructure),
        aliasId: aliasOutput.getAliasId(),
        unlockConditions: aliasOutput.getUnlockConditions(),
    });
    // Publish the output.
    try {
        const updated: IotaDocument = await didClient.publishDidOutput(secretManager, aliasOutput);
        // console.log("Updated DID document:", JSON.stringify(updated, null, 2));
    } catch (e) {
        console.log("Error: ", e);
    }
}
