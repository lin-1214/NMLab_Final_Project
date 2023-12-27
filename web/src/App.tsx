import ChatRoom from "./containers/ChatRoom";
import Signin from "./containers/Signin";
import { useUserData } from "./hooks/useUserData";
import { useChat } from "./hooks/useChat";
import { AlertColor } from "@mui/material";
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
    "fatal error": 5000,
});
const severityMap: { [Name: string]: AlertColor } = Object.freeze({
    success: "success",
    error: "error",
    warning: "warning",
    info: "info",
    default: "info",
    loading: "info",
    "success-long": "success",
    "fatal error": "error",
    "fatal-error": "error",
});

function App() {
    const { userName, signedIn } = useUserData();
    const [alert, setAlert] = useState(false);
    const { status, msgSent, setMsgSent } = useChat();
    // console.log("Sign in: ", signedIn);
    // return <ChatRoom user={userName}></ChatRoom>;
    useEffect(() => {
        // console.log("App", status);
        if (status.type) setAlert(true);
        else setAlert(false);
    }, [status]);

    return (
        <>
            {!signedIn ? <Signin></Signin> : <ChatRoom user={userName}></ChatRoom>}
            <PopUp
                duration={durationMap[status.type || "loading"]}
                message={status.msg || ""}
                open={alert}
                setOpen={setAlert}
                severity={severityMap[status.type || "loading"]}
            />
        </>
    );
}

export default App;
