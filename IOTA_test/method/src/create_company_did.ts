// Copyright 2020-2023 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0
// modified from IOTA examples 0_basic/1_update_did.ts
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
export async function create_company(name: string = "company-A") {
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Generate a random mnemonic for our wallet.
    const mnemonic = Utils.generateMnemonic();
    const secretManager: MnemonicSecretManager = {
        mnemonic: mnemonic,
    };
    // Creates a new wallet and identity (see "0_create_did" example).
    const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    let { address, document, fragment } = await createDid(client, secretManager, storage);
    const did = document.id();
    console.log("Document fragment:", fragment);

    // Add a new Service.
    const service: Service = new Service({
        id: did.join("#company-info"),
        type: "CompanyInfo",
        serviceEndpoint: `https://${name.replace(" ", "")}.org/`,
        properties: new Map<string, string>([["CompanyName", name]]),
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
    return [address, updated.id().toString(), mnemonic];
}
