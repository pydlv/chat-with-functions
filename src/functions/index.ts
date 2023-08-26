import {State} from "../state";
import {MEMORY_FUNCTIONS} from "./memory";
import {CompletionCreateParams} from "openai/src/resources/chat/completions";
import {MESSAGING_FUNCTIONS} from "./messaging";

interface Parameter {
    description: string;
}

export type ChatFunctionParams = {[key: string]: string};

export interface ChatFunction<Args extends ChatFunctionParams = any, F extends (state: State, args: Args) => string = any> {
    name: string;
    description: string;
    fn: F;
    parameters: {[parameterName in keyof Args]: Parameter};
}

export const ALL_FUNCTIONS: ChatFunction[] = [
    ...MEMORY_FUNCTIONS,
    ...MESSAGING_FUNCTIONS
];

export const OPEN_AI_FUNCTION_LIST: Array<CompletionCreateParams.Function> = ALL_FUNCTIONS.map(func => ({
    name: func.name,
    description: func.description,
    parameters: {
        type: "object",
        properties: {
            ...Object.entries(func.parameters).reduce((acc: {[key: string]: {type: "string", description: string}}, [parameterName, parameter]) => {
                acc[parameterName] = {
                    type: "string",
                    description: parameter.description
                };
                return acc;
            }, {})
        }
    }
}));