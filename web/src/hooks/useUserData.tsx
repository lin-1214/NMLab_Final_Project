import React, { FC, createContext, useState, useContext, useEffect } from "react";

interface UserDataProps {
    userName: string;
    userPassword: string;
    userPinCode: string;
    company: string;
    signedIn: boolean;
    setNowUser: (name: string) => void;
    setLogOut: () => void;
    setNowPassword: (password: string) => void;
    setNowPinCode: (pinCode: string) => void;
    setCompany: (company: string) => void;
    setSignedIn: (signedIn: boolean) => void;
}
const UserData = createContext<UserDataProps>({
    userName: "",
    userPassword: "",
    userPinCode: "",
    company: "",
    signedIn: false,
    setNowUser: () => {},
    setNowPassword: () => {},
    setNowPinCode: () => {},
    setLogOut: () => {},
    setCompany: () => {},
    setSignedIn: () => {},
});
const LOCALSTORAGE_KEY = "save-me";
const savedMeName = localStorage.getItem(`${LOCALSTORAGE_KEY}/name`);
const savedMeCompany = localStorage.getItem(`${LOCALSTORAGE_KEY}/company`);
interface UserDataProviderProps {
    children: React.ReactNode;
}
const UserDataProvider: FC<UserDataProviderProps> = (props) => {
    const [name, setUserName] = useState(savedMeName || "");
    const [company, setCompany] = useState(savedMeCompany || "");
    const [password, setPassword] = useState("");
    const [pinCode, setPinCode] = useState("");
    const [signedIn, setSignedIn] = useState(false);
    const setNowUser = (name: string) => {
        setUserName(name);
    };
    const setNowPassword = (password: string) => {
        setPassword(password);
    };
    const setNowPinCode = (pinCode: string) => {
        setPinCode(pinCode);
    };
    const setLogOut = () => {
        setSignedIn(false);
    };
    useEffect(() => {
        if (signedIn) {
            localStorage.setItem(`${LOCALSTORAGE_KEY}/name`, name);
            localStorage.setItem(`${LOCALSTORAGE_KEY}/company`, company);
        }
    }, [name, signedIn, company]);

    return (
        <UserData.Provider
            value={{
                userName: name,
                userPassword: password,
                userPinCode: pinCode,
                signedIn,
                company,
                setNowUser,
                setNowPassword,
                setNowPinCode,
                setLogOut,
                setCompany,
                setSignedIn,
            }}
            {...props}
        ></UserData.Provider>
    );
};
const useUserData = () => {
    return useContext(UserData);
};

export { UserDataProvider, useUserData };
