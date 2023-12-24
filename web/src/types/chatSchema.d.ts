export type sendDataTypes =
  | "CHAT"
  | "MESSAGE"
  | "CLEAR"
  | "init"
  | "Register"
  | "Login";
export type statusType = {
  type?: string;
  msg?: string;
};
export type messageTypes = {
  name?: string;
  to?: string;
  body?: string;
};
