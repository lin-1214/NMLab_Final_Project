import { FC, createContext, useState, useContext, useEffect } from "react";

interface UserDataProps {
    userName: string;
    signedIn: boolean;
    setNowUser: (name: string) => void;
    setLogOut: () => void;
}
const UserData = createContext<UserDataProps>({
    userName: "",
    signedIn: false,
    setNowUser: () => {},
    setLogOut: () => {},
});
const LOCALSTORAGE_KEY = "save-me";
const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);
interface UserDataProviderProps {
    children: React.ReactNode;
}
const UserDataProvider: FC<UserDataProviderProps> = (props) => {
    const [name, setUserName] = useState(savedMe || "");
    const [signedIn, setSignedIn] = useState(false);
    const setNowUser = (name: string) => {
        setUserName(name);
        setSignedIn(true);
    };
    const setLogOut = () => {
        setSignedIn(false);
    };
    useEffect(() => {
        if (signedIn) {
            localStorage.setItem(LOCALSTORAGE_KEY, name);
        }
    }, [name, signedIn]);

    return (
        <UserData.Provider
            value={{
                userName: name,
                signedIn: signedIn,
                setNowUser,
                setLogOut,
            }}
            {...props}
        ></UserData.Provider>
    );
};
const useUserData = () => {
    return useContext(UserData);
};

export { UserDataProvider, useUserData };
