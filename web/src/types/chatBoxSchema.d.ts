export interface ChatBoxProps {
    children: React.ReactNode;
}
export interface ChatBoxStates {
    label: string;
    children: React.ReactNode;
    key: string;
}
export interface ChatRoomProps {
    user: string;
}
export interface ChatRoomInputProps {
    bodyRef: React.RefObject<HTMLInputElement>;
    onSubmit: (msgBody: string) => boolean;
}
