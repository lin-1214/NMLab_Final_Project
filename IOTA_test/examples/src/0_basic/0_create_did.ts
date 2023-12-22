// Copyright 2020-2023 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    IotaDID,
    IotaDocument,
    IotaIdentityClient,
    JwkMemStore,
    JwsAlgorithm,
    KeyIdMemStore,
    MethodDigest,
    MethodScope,
    Storage,
} from "@iota/identity-wasm/node";
import {
    AliasOutput,
    Client,
    MnemonicSecretManager,
    SecretManager,
    Utils,
} from "@iota/sdk-wasm/node";
import { API_ENDPOINT, ensureAddressHasFunds } from "../util";

/** Demonstrate how to create a DID Document and publish it in a new Alias Output. */
export async function createIdentity(): Promise<{
    didClient: IotaIdentityClient;
    secretManager: SecretManager;
    walletAddressBech32: string;
    did: IotaDID;
}> {
    let start = Date.now();
    const start_time = start;
    /////////////////////////////////////////////////////////////
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);
    /////////////////////////////////////////////////////////////
    console.log("Client created in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    // Get the Bech32 human-readable part (HRP) of the network.
    const networkHrp: string = await didClient.getNetworkHrp();
    /////////////////////////////////////////////////////////////
    console.log("get Network HRP in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    const mnemonicSecretManager: MnemonicSecretManager = {
        mnemonic: Utils.generateMnemonic(),
    };
    /////////////////////////////////////////////////////////////
    console.log("generate Mnemonic in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    // Generate a random mnemonic for our wallet.
    const secretManager: SecretManager = new SecretManager(mnemonicSecretManager);
    /////////////////////////////////////////////////////////////
    console.log("Secret manager created in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    const walletAddressBech32 = (
        await secretManager.generateEd25519Addresses({
            accountIndex: 0,
            range: {
                start: 0,
                end: 1,
            },
            bech32Hrp: networkHrp,
        })
    )[0];
    /////////////////////////////////////////////////////////////
    console.log("Wallet address created in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    console.log("Wallet address Bech32:", walletAddressBech32);
    // Request funds for the wallet, if needed - only works on development networks.
    await ensureAddressHasFunds(client, walletAddressBech32);
    /////////////////////////////////////////////////////////////
    console.log("wallet address funds requested in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    // Create a new DID document with a placeholder DID.
    // The DID will be derived from the Alias Id of the Alias Output after publishing.
    const document = new IotaDocument(networkHrp);
    const storage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    /////////////////////////////////////////////////////////////
    console.log("Document created in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    // Insert a new Ed25519 verification method in the DID document.
    const fragment = await document.generateMethod(
        storage,
        JwkMemStore.ed25519KeyType(),
        JwsAlgorithm.EdDSA,
        "#key-1",
        MethodScope.VerificationMethod()
    );
    /////////////////////////////////////////////////////////////
    console.log("Method generated in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    // Construct an Alias Output containing the DID document, with the wallet address
    // set as both the state controller and governor.
    const address = Utils.parseBech32Address(walletAddressBech32);
    const aliasOutput: AliasOutput = await didClient.newDidOutput(address, document);
    /////////////////////////////////////////////////////////////
    console.log("Alias Output created in", Date.now() - start, "ms");
    start = Date.now();
    /////////////////////////////////////////////////////////////
    console.log("Alias Output:", JSON.stringify(aliasOutput, null, 2));
    // Publish the Alias Output and get the published DID document.
    const published = await didClient.publishDidOutput(mnemonicSecretManager, aliasOutput);
    console.log("Published DID document:", JSON.stringify(published, null, 2));
    /////////////////////////////////////////////////////////////
    console.log("Alias Output published in", Date.now() - start, "ms");
    console.log("Total time:", Date.now() - start_time, "ms");
    /////////////////////////////////////////////////////////////
    return {
        didClient,
        secretManager,
        walletAddressBech32,
        did: published.id(),
    };
}
