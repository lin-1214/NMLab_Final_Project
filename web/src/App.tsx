import ChatRoom from "./containers/ChatRoom";
import Signin from "./containers/Signin";
import { useUserData } from "./hooks/useUserData";
import useChat from "./hooks/useChat";
import PopUp from "./components/PopUp";
import { useEffect, useState } from "react";
const durationMap: { [Name: string]: number } = Object.freeze({
    success: 3000,
    error: 3000,
    warning: 3000,
    info: 3000,
    default: 3000,
    loading: 0,
    "success-long": 5000,
});

function App() {
    const { userName, signedIn } = useUserData();
    const { status } = useChat();
    const [alert, setAlert] = useState(false);
    console.log("Sign in: ", signedIn);

    if (status.type) {
        setAlert(true);
    }
    console.log("app status: ", status);
    // return <ChatRoom user={userName}></ChatRoom>;
    return (
        <>
            {!signedIn ? <Signin></Signin> : <ChatRoom user={userName}></ChatRoom>}
            <PopUp
                duration={durationMap[status.type || "loading"]}
                message={status.msg || ""}
                open={alert}
                setOpen={setAlert}
            />
        </>
    );
}

export default App;
