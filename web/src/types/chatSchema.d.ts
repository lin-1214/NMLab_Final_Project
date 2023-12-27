export type sendDataTypes =
    | "CHAT"
    | "MESSAGE"
    | "CLEAR"
    | "init"
    | "Register"
    | "Login"
    | "VP"
    | "verifyVP"
    | "Signature";
export type statusType = {
    type?: string;
    msg?: string;
};
export type messageTypes = {
    name?: string;
    to?: string;
    companys?: string[];
    body?: string;
};
export type verificationTypes = {
    ID: string;
    challenge: string;
    vp?: string;
    signature?: string;
};

// for RSA Key Exchange
export type RSASessionCommandTypes =
    | "close"
    | "RSAEstablishing"
    | "RSAEstablished"
    | "KeyExchanged";
export interface publicKeysTypes {
    [name: string]: string;
}
export interface ChatBoxDataTypes {
    id: string;
    name: string;
    to: string;
    company: string;
    status: RSASessionCommandTypes;
    key?: string;
    publicKeys?: publicKeysTypes;
}
export interface ChatBoxSessionStatus {
    id: string;
    status: RSASessionCommandTypes;
    key?: string;
}
