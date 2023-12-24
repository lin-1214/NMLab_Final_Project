// Copyright 2020-2023 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    IotaDID,
    IotaDocument,
    IotaIdentityClient,
    JwkMemStore,
    JwsAlgorithm,
    KeyIdMemStore,
    MethodScope,
    Storage,
    Service,
    Timestamp,
} from "@iota/identity-wasm/node";
import {
    Address,
    AliasAddress,
    AliasOutput,
    Client,
    IRent,
    IssuerFeature,
    MnemonicSecretManager,
    StateControllerAddressUnlockCondition,
    UnlockConditionType,
    Utils,
} from "@iota/sdk-wasm/node";
import { API_ENDPOINT, createDid } from "../util";

/** Demonstrates how an identity can control another identity.

For this example, we consider the case where a parent company's DID controls the DID of a subsidiary. */
export async function didControlsDid(
    issuerDID_ID: string,
    issuerMnemonic: string,
    issuerName: string,
    subsidiaryName: string
) {
    // ========================================================
    // Create the company's and subsidiary's Alias Output DIDs.
    // ========================================================

    // Create a new Client to interact with the IOTA ledger.
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Generate a random mnemonic for our wallet.
    const secretManager: MnemonicSecretManager = {
        mnemonic: issuerMnemonic,
    };
    const _mnemonic = Utils.generateMnemonic();

    // Creates a new wallet and identity (see "0_create_did" example).
    const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    // Get the current byte costs.
    const rentStructure: IRent = await didClient.getRentStructure();
    const companyDid = IotaDID.parse(issuerDID_ID);
    const companyDocument = await didClient.resolveDid(companyDid);

    // Get the Bech32 human-readable part (HRP) of the network.
    const networkName: string = await didClient.getNetworkHrp();

    // Construct a new DID document for the subsidiary.
    var subsidiaryDocument: IotaDocument = new IotaDocument(networkName);

    // Create the Alias Address of the company.
    const companyAliasAddress: Address = new AliasAddress(companyDid.toAliasId());

    // Create a DID for the subsidiary that is controlled by the parent company's DID.
    // This means the subsidiary's Alias Output can only be updated or destroyed by
    // the state controller or governor of the company's Alias Output respectively.
    var subsidiaryAlias: AliasOutput = await didClient.newDidOutput(
        companyAliasAddress,
        subsidiaryDocument,
        rentStructure
    );

    // Optionally, we can mark the company as the issuer of the subsidiary DID.
    // This allows to verify trust relationships between DIDs, as a resolver can
    // verify that the subsidiary DID was created by the parent company.
    subsidiaryAlias = await client.buildAliasOutput({
        ...subsidiaryAlias,
        immutableFeatures: [new IssuerFeature(companyAliasAddress)],
        aliasId: subsidiaryAlias.getAliasId(),
        unlockConditions: subsidiaryAlias.getUnlockConditions(),
    });

    // Adding the issuer feature means we have to recalculate the required storage deposit.
    subsidiaryAlias = await client.buildAliasOutput({
        ...subsidiaryAlias,
        amount: Utils.computeStorageDeposit(subsidiaryAlias, rentStructure),
        aliasId: subsidiaryAlias.getAliasId(),
        unlockConditions: subsidiaryAlias.getUnlockConditions(),
    });

    // Publish the subsidiary's DID.
    subsidiaryDocument = await didClient.publishDidOutput(secretManager, subsidiaryAlias);

    // =====================================
    // Update the subsidiary's Alias Output.
    // =====================================

    // Add a verification method to the subsidiary.
    // This only serves as an example for updating the subsidiary DID.
    const fragment = await subsidiaryDocument.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        JwsAlgorithm.EdDSA,
        "#jwk",
        MethodScope.VerificationMethod()
    );
    console.log("Document fragment:", fragment);
    const did = subsidiaryDocument.id();
    // Add a new Service.
    const url = `https://${issuerName.replace(" ", "")}.org/${subsidiaryName.replace(" ", "")}`;
    const service: Service = new Service({
        id: did.join("#employee-info"),
        type: "EmployeeInfo",
        serviceEndpoint: url,
        properties: new Map<string, string>([["EmployeeName", subsidiaryName]]),
    });
    subsidiaryDocument.insertService(service);
    subsidiaryDocument.setMetadataUpdated(Timestamp.nowUTC());

    // Because the size of the DID document increased, we have to increase the allocated storage deposit.
    // This increases the deposit amount to the new minimum.
    const newrentStructure: IRent = await didClient.getRentStructure();

    // Update the subsidiary's Alias Output with the updated document
    // and increase the storage deposit.
    let subsidiaryAliasUpdate: AliasOutput = await didClient.updateDidOutput(subsidiaryDocument);
    subsidiaryAliasUpdate = await client.buildAliasOutput({
        ...subsidiaryAliasUpdate,
        amount: Utils.computeStorageDeposit(subsidiaryAliasUpdate, newrentStructure),
        aliasId: subsidiaryAliasUpdate.getAliasId(),
        unlockConditions: subsidiaryAliasUpdate.getUnlockConditions(),
    });

    // Publish the updated subsidiary's DID.
    //
    // This works because `secret_manager` can unlock the company's Alias Output,
    // which is required in order to update the subsidiary's Alias Output.
    subsidiaryDocument = await didClient.publishDidOutput(secretManager, subsidiaryAliasUpdate);

    // ===================================================================
    // Determine the controlling company's DID given the subsidiary's DID.
    // ===================================================================

    // Resolve the subsidiary's Alias Output.
    const subsidiaryOutput: AliasOutput = await didClient.resolveDidOutput(subsidiaryDocument.id());

    // Extract the company's Alias Id from the state controller unlock condition.
    //
    // If instead we wanted to determine the original creator of the DID,
    // we could inspect the issuer feature. This feature needs to be set when creating the DID.
    //
    // Non-null assertion is safe to use since every Alias Output has a state controller unlock condition.
    // Cast to StateControllerAddressUnlockCondition is safe as we check the type in find.
    const stateControllerUnlockCondition: StateControllerAddressUnlockCondition = subsidiaryOutput
        .getUnlockConditions()
        .find(
            (unlockCondition) =>
                unlockCondition.getType() == UnlockConditionType.StateControllerAddress
        )! as StateControllerAddressUnlockCondition;

    // Cast to IAliasAddress is safe because we set an Alias Address earlier.
    const companyAliasId: string = (
        stateControllerUnlockCondition.getAddress() as AliasAddress
    ).getAliasId();

    // Reconstruct the company's DID from the Alias Id and the network.
    const new_companyDid = IotaDID.fromAliasId(companyAliasId, networkName);

    // Resolve the company's DID document.
    const new_companyDocument: IotaDocument = await didClient.resolveDid(new_companyDid);
    // console.log(new_companyDocument.toString());
    // console.log("new Company ", JSON.stringify(new_companyDocument, null, 2));
    // console.log("Subsidiary ", JSON.stringify(subsidiaryDocument, null, 2));
    return [subsidiaryDocument.id().toString(), issuerMnemonic];
}
