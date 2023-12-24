// Copyright 2020-2023 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    Credential,
    EdDSAJwsVerifier,
    FailFast,
    JwkMemStore,
    JwsSignatureOptions,
    JwtCredentialValidationOptions,
    JwtCredentialValidator,
    KeyIdMemStore,
    Storage,
    IotaDID,
    IotaIdentityClient,
} from "@iota/identity-wasm/node";
import { Client, MnemonicSecretManager, Utils } from "@iota/sdk-wasm/node";
import { API_ENDPOINT, createDid } from "../util";
import { updateVerificationMethod } from "./update_did";

/**
 * This example shows how to create a Verifiable Credential and validate it.
 * In this example, Alice takes the role of the subject, while we also have an issuer.
 * The issuer signs a UniversityDegreeCredential type verifiable credential with Alice's name and DID.
 * This Verifiable Credential can be verified by anyone, allowing Alice to take control of it and share it with whomever they please.
 */
interface EmployeeInfo {
    name: string;
    age?: number;
    position?: string;
    salary?: number;
    [key: string]: any;
}
export async function createVC(
    issuerDID_ID: string,
    issuerMnemonic: string,
    issuerURL: string,
    issuerStorage: Storage,
    holderDID_ID: string,
    info: EmployeeInfo
) {
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);

    // Generate a random mnemonic for our wallet.
    const secretManager: MnemonicSecretManager = {
        mnemonic: issuerMnemonic,
    };

    const issuerDid = IotaDID.parse(issuerDID_ID);
    const issuerDocument = await didClient.resolveDid(issuerDid);

    const holderDid = IotaDID.parse(holderDID_ID);
    const holderDocument = await didClient.resolveDid(holderDid);
    // Create a credential subject indicating the degree earned by Alice, linked to their DID.
    const subject = {
        id: holderDocument.id(),
        ...info,
    };

    // Create an unsigned `UniversityDegree` credential for Alice
    const unsignedVc = new Credential({
        id: `${issuerURL}credentials/${subject.name}`,
        type: "CompanyEmployeeCredential",
        issuer: issuerDocument.id(),
        credentialSubject: subject,
    });

    // const { document: issuerDocument2, fragment: issuerFragment } = await createDid(
    //     client,
    //     secretManager,
    //     new Storage(new JwkMemStore(), new KeyIdMemStore())
    // );
    // console.log(issuerFragment);
    // Create signed JWT credential.
    // const issuerStorage: Storage = new Storage(new JwkMemStore(), new KeyIdMemStore());
    // await updateVerificationMethod(issuerDID_ID, issuerMnemonic, issuerStorage);
    // console.log("Issuer DID updated");
    const new_issuerDocument = await didClient.resolveDid(issuerDid);
    const credentialJwt = await new_issuerDocument.createCredentialJwt(
        issuerStorage,
        "jwk",
        unsignedVc,
        new JwsSignatureOptions()
    );
    // console.log(`Credential JWT > ${credentialJwt.toString()}`);

    // Before sending this credential to the holder the issuer wants to validate that some properties
    // of the credential satisfy their expectations.

    // Validate the credential's signature, the credential's semantic structure,
    // check that the issuance date is not in the future and that the expiration date is not in the past.
    // Note that the validation returns an object containing the decoded credential.
    const decoded_credential = new JwtCredentialValidator(new EdDSAJwsVerifier()).validate(
        credentialJwt,
        new_issuerDocument,
        new JwtCredentialValidationOptions(),
        FailFast.FirstError
    );

    // Since `validate` did not throw any errors we know that the credential was successfully validated.
    console.log(`VC successfully validated`);

    // The issuer is now sure that the credential they are about to issue satisfies their expectations.
    // Note that the credential is NOT published to the IOTA Tangle. It is sent and stored off-chain.
    // console.log(`Issued credential: ${JSON.stringify(decoded_credential.intoCredential(), null, 2)}`);
    return credentialJwt.toString();
}
