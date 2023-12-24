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
    VerificationMethod,
} from "@iota/identity-wasm/node";
import { AliasOutput, Client, IRent, MnemonicSecretManager, Utils } from "@iota/sdk-wasm/node";
import { API_ENDPOINT, createDid } from "../util";

/** Demonstrates how to update a DID document in an existing Alias Output. */
export async function updateIdentity() {
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Generate a random mnemonic for our wallet.
    const secretManager: MnemonicSecretManager = {
        mnemonic: Utils.generateMnemonic(),
    };

    // Creates a new wallet and identity (see "0_create_did" example).
    const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    let { document, fragment } = await createDid(client, secretManager, storage);
    const did = document.id();

    // Resolve the latest state of the document.
    // Technically this is equivalent to the document above.
    document = await didClient.resolveDid(did);

    let _frag = "#key-2";
    try {
        // Remove a verification method.
        let originalMethod = document.resolveMethod(_frag) as VerificationMethod;
        await document.purgeMethod(storage, originalMethod?.id());
    } catch (e) {
        console.log("No method to purge");
    }
    // Insert a new Ed25519 verification method in the DID document.
    await document.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        JwsAlgorithm.EdDSA,
        _frag,
        MethodScope.VerificationMethod()
    );

    // Attach a new method relationship to the inserted method.
    document.attachMethodRelationship(did.join(_frag), MethodRelationship.Authentication);

    // Add a new Service.
    const service: Service = new Service({
        id: did.join("#linked-domain"),
        type: "LinkedDomains",
        serviceEndpoint: "https://iota.org/",
    });
    document.insertService(service);
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
    const updated: IotaDocument = await didClient.publishDidOutput(secretManager, aliasOutput);
    console.log("Updated DID document:", JSON.stringify(updated, null, 2));
}
