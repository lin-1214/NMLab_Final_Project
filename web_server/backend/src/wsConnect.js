import Message from "./models/message";
import { UserModel, MessageModel, ChatBoxModel } from "./models/chatbox";
import IdentityModel from "./models/identity";
// 在 global scope 將 chatBoxes 宣告成空物件
const chatBoxes = {};

const sendData = (data, ws) => {
  ws.send(JSON.stringify(data));
};
const sendStatus = (payload, ws) => {
  sendData(["status", payload], ws);
};
const initData = (ws) => {
  Message.find()
    .sort({ created_at: -1 })
    .limit(100)
    .exec((err, res) => {
      if (err) throw err;
      // initialize app with existing messages
      console.log(res);
      sendData(["init", res], ws);
    });
};

// hw7
const makeName = (name, to) => {
  return [name, to].sort().join("_");
};
const validateChatBox = async (name, participants) => {
  let box = await ChatBoxModel.findOne({ name });
  if (!box)
    box = await new ChatBoxModel({
      name,
      users: participants.map((user) => user._id),
    }).save();
  return box.populate(["users", { path: "messages", populate: "sender" }]);
};
const validateUser = async (name) => {
  let user = await UserModel.findOne({ name: name });
  if (user) return user;
  user = await new UserModel({ name: name, chatBoxes: [] }).save();
  return user;
};
const updateUserChatbox = async (user, chatBox_id) => {
  if (!user) return;
  const existing = user.chatBoxes.includes(chatBox_id);
  if (existing) return;
  await UserModel.updateOne(
    { _id: user._id },
    { $set: { chatBoxes: [...user.chatBoxes, chatBox_id] } }
  );
  return;
};
const initChatBoxData = (chatboxData, ws) => {
  // console.log(chatboxData.messages);

  const processedData = chatboxData.messages.map((msg) => {
    // initialize app with existing messages
    // console.log(msg);
    return { name: msg.sender.name, body: msg.body };
  });

  sendData(["init", processedData], ws);
  console.log("init sent");
};

const updateChatboxMsg = async (chatBox, msg) => {
  await ChatBoxModel.updateOne(
    { _id: chatBox._id },
    { $set: { messages: [...chatBox.messages, msg.id] } }
  );
  return;
};
export default {
  initData: (ws) => {
    console.log("init Data");
    initData(ws);
  },
  onChatBoxMessage: (wss, ws) => {
    ws.on("message", async (byteString) => {
      const data = byteString;
      const [task, payload] = JSON.parse(data);
      console.log(task, payload);
      if (task === "init") return;

      // deal with save register data to backend
      if (task === "Register") {
        const { userName, password, pincode, signature, publicKey } = payload;
        const identity = new IdentityModel({
          userName: userName,
          password: password,
          pincode: pincode,
          signature: signature,
          publicKey: publicKey,
        });

        await identity.save();
        return;
      }

      if (task === "Login") {
        console.log("login");
        const { userName, password } = payload;
        let user = await IdentityModel.findOne({ userName: userName });
        if (!user) {
          sendStatus(
            {
              type: "error",
              msg: "User doesn't exist.",
            },
            ws
          );
          return;
        }
        console.log(user);
        const payload = {
          state: "login",
          userName: user.userName,
          password: password,
          hashedPassword: user.password,
          signature: user.signature,
          publicKey: user.publicKey,
        };
        ws.send(JSON.stringify(["Login", payload]));
        return;
      }
      const { name, to } = payload;
      // console.log(name, to);
      const participants = await Promise.all(
        [name, to].map(async (user) => await validateUser(user))
      );
      // console.log("pass");
      const chatBoxName = makeName(name, to);
      // 如果不曾有過 chatBoxName 的對話，將 chatBoxes[chatBoxName] 設定為 empty Set
      if (!chatBoxes[chatBoxName]) chatBoxes[chatBoxName] = new Set(); // make new record for chatbox
      chatBoxes[chatBoxName].add(ws);

      // user(ws) was in another chatbox
      if (ws.box !== chatBoxName) {
        if (ws.box !== "" && chatBoxes[ws.box]) chatBoxes[ws.box].delete(ws);
        ws.box = chatBoxName;
      }
      switch (task) {
        case "CHAT":
          console.log(name, to);
          const chatboxData = await validateChatBox(
            makeName(name, to),
            participants
          );
          await Promise.all(
            participants.map(
              async (user) => await updateUserChatbox(user, chatboxData._id)
            )
          );
          initChatBoxData(chatboxData, ws);
          console.log("chatboxdata", chatboxData);
          break;
        case "MESSAGE":
          const { body } = payload;
          let box = await ChatBoxModel.findOne({
            name: makeName(name, to),
          });
          const new_message = new MessageModel({
            chatBox: box._id,
            sender: participants[0],
            body: body,
          });
          try {
            await new_message.save();
          } catch (e) {
            sendStatus(
              {
                type: "error",
                msg: "Message DB save error: " + e,
              },
              ws
            );
            break;
          }
          await updateChatboxMsg(box, new_message);

          // console.log(chatBoxes[chatBoxName]);
          chatBoxes[chatBoxName].forEach((ws) => {
            sendData(["output", [{ name: name, to: to, body: body }]], ws);
          });
          break;
        case "CLEAR":
          let clear_box = await ChatBoxModel.findOne({
            name: makeName(name, to),
          });
          await ChatBoxModel.updateOne(
            { _id: clear_box._id },
            { $set: { messages: [] } }
          );
          MessageModel.deleteMany({ chatBox: clear_box._id }, () => {
            chatBoxes[chatBoxName].forEach((ws) => {
              sendData(["cleared"], ws);
              sendStatus(
                {
                  type: "success",
                  msg: "This chat room db was cleared.",
                },
                ws
              );
            });
          });
          break;
      }
    });
    ws.once("close", () => {
      try {
        chatBoxes[ws.box].delete(ws);
      } catch (e) {
        console.log(e);
      }
    });
  },
};
