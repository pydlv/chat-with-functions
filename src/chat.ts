import OpenAI from "openai";
import {Context, State} from "./state";
import {writeJson} from "./utils";
import {ALL_FUNCTIONS, ChatFunctionParams, OPEN_AI_FUNCTION_LIST} from "./functions";

const prompt = require("prompt-sync")({
    sigint: true
});

interface UserInputTrigger {
    type: "user_input"
    userMessage: string
}

interface ResultTrigger {
    type: "result",
    call: FunctionSeriesItem,
    result: string
}

type Trigger = UserInputTrigger | ResultTrigger;

interface SystemMessageVariables {
    trigger_history: Trigger[]
    context: Context
}

interface FunctionSeriesItem {
    function: string
    purpose: string
    arguments: ChatFunctionParams
}

type FunctionSeries = FunctionSeriesItem[]

// Read contents of system_prompt.txt and store in a variable
const SYSTEM_PROMPT = require("fs").readFileSync("./src/system_prompt.txt", "utf-8");

export async function handleTrigger(client: OpenAI, state: State, triggerHistory: Trigger[]) {
    const systemMessageVariables: SystemMessageVariables = {
        trigger_history: triggerHistory,
        context: state.context
    };

    console.log("System message:", JSON.stringify(systemMessageVariables));

    const completion = await client.chat.completions.create({
        functions: OPEN_AI_FUNCTION_LIST,
        messages: [
            {
                role: "system",
                content: JSON.stringify({
                    instructions: SYSTEM_PROMPT,
                    variables: systemMessageVariables
                }, null, 0),
            },
        ],
        function_call: "none",
        model: "gpt-4"
    });

    const choice = completion.choices[0];

    if (choice.message.content === null) {
        console.warn("Assistant did not return any message content.");
        return;
    }

    const plannedFunctions: FunctionSeries = JSON.parse(choice.message.content);
    if (plannedFunctions.length > 0) {
        const nextFunction = plannedFunctions[0];

        let funcName = nextFunction.function;
        if (funcName.startsWith("functions.")) {
            funcName = funcName.substring("functions.".length);
        }

        const func = ALL_FUNCTIONS.find(func => func.name === funcName);
        if (func === undefined) {
            console.warn("Assistant called unknown function:", funcName);
            return;
        }

        const result = func.fn(state, nextFunction.arguments);

        writeJson("state.json", state);

        const newTriggerHistory: Trigger[] = [
            ...triggerHistory,
            {
                type: "result",
                call: nextFunction,
                result: result ?? ""
            }
        ];

        await handleTrigger(client, state, newTriggerHistory);
    }
}

export async function chatLoop(client: OpenAI, state: State) {
    while (true) {
        const userInput = prompt("> ");

        if (["quit", "exit"].includes(userInput)) {
            break;
        }

        await handleTrigger(client, state, [{
            type: "user_input",
            userMessage: userInput
        }])
    }
}