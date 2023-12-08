export type sendDataTypes = "CHAT" | "MESSAGE" | "CLEAR" | "init";
export type statusType = {
    type?: string;
    msg?: string;
};
export type messageTypes = {
    name?: string;
    to?: string;
    body?: string;
};
