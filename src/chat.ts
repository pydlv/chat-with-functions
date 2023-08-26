import OpenAI from "openai";
import {Context, State} from "./state";
import {writeJson} from "./utils";
import {ALL_FUNCTIONS, OPEN_AI_FUNCTION_LIST} from "./functions";

const prompt = require("prompt-sync")();

interface UserInputTrigger {
    type: "user_input"
    userMessage: string
}

type Trigger = UserInputTrigger;

interface SystemMessageVariables {
    trigger: Trigger
    context: Context
}

export async function chatLoop(client: OpenAI, state: State) {
    while (true) {
        const userInput = prompt("> ");

        if (["quit", "exit"].includes(userInput)) {
            break;
        }

        const systemMessageVariables: SystemMessageVariables = {
            trigger: {
                type: "user_input",
                userMessage: userInput
            },
            context: state.context
        };

        console.log("System message:", JSON.stringify(systemMessageVariables));

        const completion = await client.chat.completions.create({
            functions: OPEN_AI_FUNCTION_LIST,
            messages: [
                {
                    role: "system",
                    content: JSON.stringify({
                        instructions: "You are not interacting directly with the user. Any action you take, including responding to user messages, must be done through functions.",
                        variables: systemMessageVariables
                    }, null, 0),
                },
                {
                    role: "user",
                    content: userInput,
                }
            ],
            function_call: "auto",
            model: "gpt-3.5-turbo"
        });

        const choice = completion.choices[0];
        const functionCall = choice.message.function_call;
        if (functionCall === undefined) {
            console.log("No function call made:", choice);
            continue;
        }

        const functionName = functionCall.name;
        const func = ALL_FUNCTIONS.find(func => func.name === functionName);
        if (func === undefined) {
            console.warn("Assistant tried to execute unknown function:", functionName);
            continue;
        }

        const args = JSON.parse(functionCall.arguments);

        func.fn(state, args);

        writeJson("state.json", state);
    }
}