export type sendDataTypes =
    | "CHAT"
    | "MESSAGE"
    | "CLEAR"
    | "init"
    | "Register"
    | "Login"
    | "VP"
    | "verifyVP";
export type statusType = {
    type?: string;
    msg?: string;
};
export type messageTypes = {
    name?: string;
    to?: string;
    body?: string;
};
export type verificationTypes = {
    ID: string;
    challenge: string;
    vp?: string;
};
