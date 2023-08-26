import {ChatFunction, ChatFunctionParams} from "./index";
import {State} from "../state";

const RememberFunction: ChatFunction = {
    name: "remember",
    description: "Remember something in the context.",
    fn: (state: State, {keyToRemember, valueToRemember}: ChatFunctionParams) => {
        state.context[keyToRemember] = valueToRemember;
    },
    parameters: {
        keyToRemember: {
            description: "The key to remember in the context.",
        },
        valueToRemember: {
            description: "The value to remember in the context.",
        }
    }
}

const ForgetFunction: ChatFunction = {
    name: "forget",
    description: "Forget something in the context.",
    fn: (state: State, {keyToForget}: ChatFunctionParams) => {
        delete state.context[keyToForget];
    },
    parameters: {
        keyToForget: {
            description: "The key to forget in the context.",
        }
    }
}

export const MEMORY_FUNCTIONS: ChatFunction[] = [
    RememberFunction,
    ForgetFunction,
];