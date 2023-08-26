import OpenAI from "openai";
import {State} from "./state";
import {writeJson} from "./utils";

const prompt = require("prompt-sync")();

export async function chatLoop(client: OpenAI, state: State) {
    while (true) {
        const userInput = prompt("> ");

        if (["quit", "exit"].includes(userInput)) {
            break;
        }

        console.log("context:", state.context);

        const completion = await client.chat.completions.create({
            functions: [
                {
                    name: "create_response",
                    description: "Respond to the user's message.",
                    parameters: {
                        type: "object",
                        properties: {
                            "assistant_response": {
                                type: "string",
                                description: "Your response to display to the user based on their request."
                            },
                            "context_key": {
                                type: "string",
                                description: "This is a key for something you want to remember in the context. For instance, 'last_message' if you want to keep track of the last message in the conversation (highly advised)."
                            },
                            "context_value": {
                                type: "string",
                                description: "This is the value for the corresponding key to update to. You can set it to empty to delete the key from the context."
                            }
                        },
                        required: ["assistant_response"]
                    }
                }
            ],
            messages: [{
                role: "system",
                content: JSON.stringify(state.context)
            }, {
                role: "user",
                content: userInput,
            }],
            function_call: {
                name: "create_response",
            },
            model: "gpt-3.5-turbo"
        });

        const choice = completion.choices[0];
        const args = JSON.parse(choice.message.function_call!.arguments);
        console.log(args);

        const {context_key, context_value} = args;
        if (context_key !== undefined && context_value !== undefined) {
            if (context_value === "") {
                delete state.context[context_key];
            } else {
                state.context[context_key] = context_value;
            }
        }

        writeJson("state.json", state);
    }
}