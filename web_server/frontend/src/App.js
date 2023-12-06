// import "./App.css";
import ChatRoom from "./containers/ChatRoom";
import Signin from "./containers/Signin";
import { useUserData } from "./hooks/useUserData";
const App = () => {
    const { userName, signedIn } = useUserData();
    console.log(signedIn);
    return !signedIn ? (
        <Signin></Signin>
    ) : (
        <ChatRoom user={userName}></ChatRoom>
    );
};
export default App;
