import ChatRoom from "./containers/ChatRoom";
import Signin from "./containers/Signin";
import { useUserData } from "./hooks/useUserData";
function App() {
    const { userName, signedIn } = useUserData();
    console.log(signedIn);
    // return <ChatRoom user={userName}></ChatRoom>;
    return !signedIn ? <Signin></Signin> : <ChatRoom user={userName}></ChatRoom>;
}

export default App;
