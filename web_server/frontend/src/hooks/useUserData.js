import { createContext, useState, useContext, useEffect } from "react";
const UserData = createContext({
    userName: "",
    signedIn: false,
    setNowUser: () => {},
    setLogOut: () => {},
});
const LOCALSTORAGE_KEY = "save-me";
const savedMe = localStorage.getItem(LOCALSTORAGE_KEY);

const UserDataProvider = (props) => {
    const [name, setUserName] = useState(savedMe || "");
    const [signedIn, setSignedIn] = useState(false);
    const setNowUser = (_name) => {
        setUserName(_name);
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
