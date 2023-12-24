import { useEffect, useState } from "react";
import { messageTypes, sendDataTypes } from "../types";

// console.log("i enter useChat");
import { useUserData } from "./useUserData";
const backendURL = "localhost:4000";
const RPiURL = "192.168.137.33:8000";
var client = new WebSocket(`ws://${backendURL}`);
var RPiClient = new WebSocket(`ws://${RPiURL}`);

console.log("Backend client: ", client.readyState);
console.log("RPi client: ", RPiClient.readyState);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// RPiClient.addEventListener("open", function (event) {
//   RPiClient.send("Connection Established");
// });

const isValideMessage = (msg: messageTypes): msg is messageTypes => {
  if (msg.name && msg.to && msg.body) return true;
  return false;
};

const useChat = () => {
  // define messages, status
  useEffect(() => {
    console.log("creating useChat");
    return () => console.log("unMounting useChat");
  }, []);

  const [messages, setMessages] = useState<messageTypes[]>([]);
  const [status, setStatus] = useState<{ type?: string; msg?: string }>({});
  const [msgSent, setMsgSent] = useState(false);
  const { setLogOut, setNowUser, setNowPassword } = useUserData();

  //   const sendData = async (data: [sendDataTypes, messageTypes | "init"]) => {
  //     if (client.readyState === client.CONNECTING) {
  //       let msg = "Server Connnecting. Please try again later!";
  //       setStatus({ type: "error", msg: msg });
  //       return;
  //     }
  //     if (
  //       client.readyState === client.CLOSED ||
  //       client.readyState === client.CLOSING
  //     ) {
  //       setStatus({ type: "info", msg: "Connecting..." });
  //       await delay(500);
  //       client = new WebSocket("ws://localhost:4000");
  //       console.log(client.readyState);
  //       if (client.readyState === client.CONNECTING) await delay(2000);
  //       if (client.readyState !== client.OPEN) {
  //         let msg = "Connnection Failed. Please try again later!";
  //         console.log(msg);
  //         setStatus({ type: "error", msg: msg });
  //         return;
  //       } else {
  //         setStatus({ type: "success", msg: "Connected!" });
  //         askInit();
  //         client.onmessage = (byteString) => clientOnMsg(byteString);
  //       }
  //     }
  //     client.send(JSON.stringify(data));
  //   };
  //   const askInit = () => {
  //     sendData(["init", "init"]);
  //   };
  //   //ChatBoxes
  //   const startChat = (name: string, to: string) => {
  //     console.log(`start a chatbox of ${name + to}`);
  //     sendData(["CHAT", { name, to }]);
  //   };
  //   const sendMessageInBox = (payload: {
  //     name: string;
  //     to: string;
  //     body: string;
  //   }) => {
  //     // encrypt message
  //     console.log("MESSAGE", payload);
  //     sendData(["MESSAGE", payload]);
  //   };
  //   const clearChatBox = (participants: { name: string; to: string }) => {
  //     console.log("clear");
  //     sendData(["CLEAR", participants]);
  //   };
  //   const clientOnMsg = (byteString: MessageEvent<string>) => {
  //     const { data } = byteString;
  //     const [task, payload] = JSON.parse(data);
  //     console.log(task);
  //     switch (task) {
  //       case "output": {
  //         let prevMessages = messages;
  //         payload?.forEach((msg: messageTypes) => {
  //           if (isValideMessage(msg)) {
  //             prevMessages = [...prevMessages, msg];
  //           } else console.error("invalid message: ", msg);
  //         });
  //         setMessages(prevMessages);
  //         console.log("receive output");
  //         break;
  //       }
  //       case "status": {
  //         setStatus(payload);
  //         break;
  //       }
  //       case "init": {
  //         console.log("receive init", payload);
  //         setMessages(payload);
  //         setMsgSent(true);
  //         break;
  //       }
  //       case "cleared": {
  //         setMessages([]);
  //         break;
  //       }
  //       case "Login": {
  //         console.log("receive login", payload);
  //         RPiClient.send(JSON.stringify(payload));
  //         RPiClient.addEventListener("message", function (event) {
  //           console.log("payload", event.data);
  //           const data = JSON.parse(event.data.replace(/'/g, '"'));
  //           if (data.state === "success") {
  //             console.log("login success");
  //           } else {
  //             setNowUser("");
  //             setNowPassword("");
  //             setLogOut();
  //           }
  //           // parse event.data
  //         });
  //         break;
  //       }
  //       default:
  //         break;
  //     }
  //   };
  const sendData = async (
    data: [sendDataTypes, messageTypes | "init"],
    attempt = 0
  ) => {
    if (attempt > 5) {
      let msg = "RPi Connnection Failed. Please try again later!";
      setStatus({ type: "error", msg: msg });
      return;
    }
    if (client.readyState === client.CONNECTING) {
      sendData(data, attempt + 1);
      return;
    }
    if (
      client.readyState === client.CLOSED ||
      client.readyState === client.CLOSING
    ) {
      setStatus({ type: "info", msg: "Connecting..." });
      await delay(500);
      client = new WebSocket(`ws://${backendURL}`);
      console.log(client.readyState);
      if (client.readyState === client.CONNECTING) await delay(2000);
      if (client.readyState !== client.OPEN) {
        sendData(data, attempt + 1);
        return;
      } else {
        setStatus({ type: "success", msg: "Connected!" });
        askInit();
        client.onmessage = (byteString) => clientOnMsg(byteString);
      }
    }
    client.send(JSON.stringify(data));
  };

  // TODO: change sendData to sendCryptoData if send to rpi
  const sendCryptoData = async (
    data: [sendDataTypes, messageTypes],
    attempt = 0
  ) => {
    let client = RPiClient;
    if (attempt > 5) {
      let msg = "Connnection Failed. Please try again later!";
      setStatus({ type: "error", msg: msg });
      return;
    }
    if (client.readyState === client.CONNECTING) {
      sendCryptoData(data, attempt + 1);
      return;
    }
    if (
      client.readyState === client.CLOSED ||
      client.readyState === client.CLOSING
    ) {
      setStatus({ type: "info", msg: "Connecting..." });
      await delay(500);
      RPiClient = client = new WebSocket(`ws://${RPiURL}`);
      console.log(client.readyState);
      if (client.readyState === client.CONNECTING) await delay(2000);
      if (client.readyState !== client.OPEN) {
        sendCryptoData(data, attempt + 1);
        return;
      } else {
        setStatus({ type: "success", msg: "Connected!" });
        RPiClient.onmessage = (byteString) => RPiOnMsg(byteString);
      }
    }
    client.send(JSON.stringify(data));
  };
  const askInit = () => {
    sendData(["init", "init"]);
  };
  //ChatBoxes
  const startChat = (name: string, to: string) => {
    console.log(`start a chatbox of ${name + to}`);
    sendData(["CHAT", { name, to }]);
  };
  const sendMessageInBox = (payload: {
    name: string;
    to: string;
    body: string;
  }) => {
    console.log("MESSAGE", payload);
    sendData(["MESSAGE", payload]);
  };
  const clearChatBox = (participants: { name: string; to: string }) => {
    console.log("clear");
    sendData(["CLEAR", participants]);
  };
  const clientOnMsg = (byteString: MessageEvent<string>) => {
    const { data } = byteString;
    const [task, payload] = JSON.parse(data);
    console.log(task);
    switch (task) {
      case "output": {
        let prevMessages = messages;
        payload?.forEach((msg: messageTypes) => {
          if (isValideMessage(msg)) {
            prevMessages = [...prevMessages, msg];
          } else console.error("invalid message: ", msg);
        });
        setMessages(prevMessages);
        console.log("receive output");
        break;
      }
      case "status": {
        setStatus(payload);
        break;
      }
      case "init": {
        console.log("receive init", payload);
        setMessages(payload);
        setMsgSent(true);
        break;
      }
      case "cleared": {
        setMessages([]);
        break;
      }
      case "Login": {
        console.log("receive login", payload);
        RPiClient.send(JSON.stringify(payload));
        RPiClient.addEventListener("message", function (event) {
          console.log("payload", event.data);
          const data = JSON.parse(event.data.replace(/'/g, '"'));
          if (data.state === "success") {
            console.log("login success");
          } else {
            setNowUser("");
            setNowPassword("");
            setLogOut();
          }
          // parse event.data
        });
        break;
      }
      default:
        break;
    }
  };

  // TODO: add RPiOnMsg to handle RPiClient
  //   const RPiOnMsg = (byteString: MessageEvent<string>) => {
  //     const { data } = byteString;
  //     console.log(data);
  //     const [task, payload] = JSON.parse(data);
  //     console.log(task);
  //     switch (task) {
  //       case "Login":
  //         break;
  //       default:
  //         break;
  //     }
  //   };

  client.onclose = (e) => {
    console.log("Socket is closed.", e.reason);
    let msg = "Server Lost. Reconnect will be attempted in 5 second!";
    setStatus({ type: "fatal error", msg: msg });
  };

  // TODO: send encypted register content to backend
  const sendNonMessageData = async (data: [sendDataTypes, messageTypes]) => {
    console.log("connecting...");
    client = new WebSocket("ws://localhost:4000");
    // console.log(client.readyState);
    if (client.readyState === client.CONNECTING) await delay(2000);
    if (client.readyState !== client.OPEN) {
      let msg = "Connnection Failed. Please try again later!";
      console.log(msg);
      setStatus({ type: "error", msg: msg });
      return;
    } else {
      setStatus({ type: "success", msg: "Connected!" });
      client.send(JSON.stringify(data));
    }
  };

  // TODO: send login content plaintext to RPi
  const sendLoginData = (payload: {
    state: string;
    userName: string;
    password: string;
    pincode: string;
  }) => {
    console.log("payload: ", JSON.stringify(payload));
    RPiClient.send(JSON.stringify(payload));

    RPiClient.addEventListener("message", function (event) {
      console.log("payload", event.data);
      // parse event.data
      sendNonMessageData([
        "Register",
        JSON.parse(event.data.replace(/'/g, '"')),
      ]);
    });
  };

  const checkLoginInfo = (payload: {
    state: string;
    userName: string;
    password: string;
  }) => {
    RPiClient.send(JSON.stringify(payload));
    RPiClient.addEventListener("message", function (event) {
      console.log("payload", event.data);
      // parse event.data
      sendNonMessageData(["Login", JSON.parse(event.data.replace(/'/g, '"'))]);
      client.onmessage = (byteString) => clientOnMsg(byteString);
    });
  };

  client.onmessage = (byteString) => clientOnMsg(byteString);
  return {
    status,
    messages,
    msgSent,
    setMsgSent,
    askInit,
    startChat,
    sendMessageInBox,
    clearChatBox,
    sendLoginData,
    checkLoginInfo,
  };
};

export default useChat;
