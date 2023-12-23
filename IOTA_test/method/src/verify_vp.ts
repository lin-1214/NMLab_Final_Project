// Copyright 2020-2023 IOTA Stiftung
// SPDX-License-Identifier: Apache-2.0

import {
    CoreDID,
    Credential,
    Duration,
    EdDSAJwsVerifier,
    FailFast,
    IotaIdentityClient,
    JwkMemStore,
    JwsSignatureOptions,
    JwsVerificationOptions,
    Jwt,
    JwtCredentialValidationOptions,
    JwtCredentialValidator,
    JwtPresentationOptions,
    JwtPresentationValidationOptions,
    JwtPresentationValidator,
    KeyIdMemStore,
    Presentation,
    Resolver,
    Storage,
    SubjectHolderRelationship,
    Timestamp,
    IotaDID,
} from "@iota/identity-wasm/node";
import { Client, MnemonicSecretManager, Utils } from "@iota/sdk-wasm/node";
import { API_ENDPOINT, createDid } from "../util";

/**
 * This example shows how to create a Verifiable Presentation and validate it.
 * A Verifiable Presentation is the format in which a (collection of) Verifiable Credential(s) gets shared.
 * It is signed by the subject, to prove control over the Verifiable Credential with a nonce or timestamp.
 */
export async function verifyVP(vp: string, challenge: string) {
    const client = new Client({
        primaryNode: API_ENDPOINT,
        localPow: true,
    });
    const didClient = new IotaIdentityClient(client);
    // Create a JWT verifiable presentation using the holder's verification method
    // and include the requested challenge and expiry timestamp.
    const presentationJwt = Jwt.fromJSON(vp);
    const nonce = challenge;
    // ===========================================================================
    // Step 7: Verifier receives the Verifiable Presentation and verifies it.
    // ===========================================================================

    // The verifier wants the following requirements to be satisfied:
    // - JWT verification of the presentation (including checking the requested challenge to mitigate replay attacks)
    // - JWT verification of the credentials.
    // - The presentation holder must always be the subject, regardless of the presence of the nonTransferable property
    // - The issuance date must not be in the future.
    try {
        const jwtPresentationValidationOptions = new JwtPresentationValidationOptions({
            presentationVerifierOptions: new JwsVerificationOptions({ nonce }),
        });
        const resolver = new Resolver({
            client: didClient,
        });

        // Resolve the presentation holder.
        const presentationHolderDID: CoreDID =
            JwtPresentationValidator.extractHolder(presentationJwt);
        const resolvedHolder = await resolver.resolve(presentationHolderDID.toString());

        // Validate presentation. Note that this doesn't validate the included credentials.
        let decodedPresentation = new JwtPresentationValidator(new EdDSAJwsVerifier()).validate(
            presentationJwt,
            resolvedHolder,
            jwtPresentationValidationOptions
        );
        // console.log("decodedPresentation", decodedPresentation.presentation());
        // Validate the credentials in the presentation.
        let credentialValidator = new JwtCredentialValidator(new EdDSAJwsVerifier());
        let validationOptions = new JwtCredentialValidationOptions({
            subjectHolderRelationship: [
                presentationHolderDID.toString(),
                SubjectHolderRelationship.AlwaysSubject,
            ],
        });

        let jwtCredentials: Jwt[] = decodedPresentation
            .presentation()
            .verifiableCredential()
            .map((credential) => {
                const jwt = credential.tryIntoJwt();
                if (!jwt) {
                    throw new Error("expected a JWT credential");
                } else {
                    return jwt;
                }
            });

        // Concurrently resolve the issuers' documents.
        let issuers: string[] = [];
        for (let jwtCredential of jwtCredentials) {
            let issuer = JwtCredentialValidator.extractIssuerFromJwt(jwtCredential);
            issuers.push(issuer.toString());
        }
        let resolvedIssuers = await resolver.resolveMultiple(issuers);

        // Validate the credentials in the presentation.
        for (let i = 0; i < jwtCredentials.length; i++) {
            credentialValidator.validate(
                jwtCredentials[i],
                resolvedIssuers[i],
                validationOptions,
                FailFast.FirstError
            );
        }
    } catch (e: any) {
        // console.log(e);
        if ("expiration" in e) return { status: false, msg: "expired vp" };
        return { status: false, msg: "failed" };
    }
    // Since no errors were thrown we know that the validation was successful.
    console.log(`VP successfully validated`);
    return { status: true, msg: "success" };
}
