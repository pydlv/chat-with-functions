import OpenAI from "openai";
import {Context, State} from "./state";
import {writeJson} from "./utils";
import {ALL_FUNCTIONS, OPEN_AI_FUNCTION_LIST} from "./functions";

const prompt = require("prompt-sync")({
    sigint: true
});

interface UserInputTrigger {
    type: "user_input"
    userMessage: string
}

type Trigger = UserInputTrigger;

interface SystemMessageVariables {
    trigger: Trigger
    context: Context
}

export async function handleTrigger(client: OpenAI, state: State, trigger: Trigger) {
    const systemMessageVariables: SystemMessageVariables = {
        trigger,
        context: state.context
    };

    console.log("System message:", JSON.stringify(systemMessageVariables));

    const completion = await client.chat.completions.create({
        functions: OPEN_AI_FUNCTION_LIST,
        messages: [
            {
                role: "system",
                content: JSON.stringify({
                    instructions: "You are an assistant capable of executing certain functions. Your task is to look at " +
                        "the trigger given to you in the system message and choose a function based on its type. If " +
                        "the trigger is a user_input, then you should send a message back to the user using the " +
                        "send_message function, if no other function calls are applicable.",
                    variables: systemMessageVariables
                }, null, 0),
            },
        ],
        function_call: "auto",
        model: "gpt-4"
    });

    const choice = completion.choices[0];
    const functionCall = choice.message.function_call;
    if (functionCall === undefined) {
        console.log("No function call made:", choice);
        return;
    }

    const functionName = functionCall.name;
    const func = ALL_FUNCTIONS.find(func => func.name === functionName);
    if (func === undefined) {
        console.warn("Assistant tried to execute unknown function:", functionName);
        return;
    }

    const args = JSON.parse(functionCall.arguments);

    if (functionName !== "send_message") {
        console.log("Executing function:", functionName, "with args:", args);
    }

    func.fn(state, args);

    writeJson("state.json", state);
}

export async function chatLoop(client: OpenAI, state: State) {
    while (true) {
        const userInput = prompt("> ");

        if (["quit", "exit"].includes(userInput)) {
            break;
        }

        await handleTrigger(client, state, {
            type: "user_input",
            userMessage: userInput
        })
    }
}