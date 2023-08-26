import {ChatFunction, ChatFunctionParams} from "./index";
import {State} from "../state";

const SendMessageFunction: ChatFunction = {
    name: "send_message",
    description: "Send a message to the user.",
    fn: (state: State, {message}: ChatFunctionParams) => {
        console.log(message);
    },
    parameters: {
        message: {
            description: "The message to send to the user.",
        }
    }
}

export const MESSAGING_FUNCTIONS: ChatFunction[] = [
    SendMessageFunction,
];