import React, { Profiler } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import { UserDataProvider } from "./hooks/useUserData";
import { UseChatProvider } from "./hooks/useChat.tsx";
import "./index.css";
function onRenderCallback(
    id: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    endTime: number
) {
    console.log(`Profiler [${id}] - ${phase} - ${actualDuration} ms`);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <UserDataProvider>
            <UseChatProvider>
                {/* <Profiler id="App" onRender={onRenderCallback}> */}
                <App />
                {/* </Profiler> */}
            </UseChatProvider>
        </UserDataProvider>
    </React.StrictMode>
);
