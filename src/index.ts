import openai from 'openai';
import {tryReadJson} from "./utils";
import {getDefaultState, State} from "./state";
import {chatLoop} from "./chat";

async function main() {
    const apiKey = process.env["API_KEY"];

    if (apiKey === undefined) {
        console.error("Please set the API_KEY environment variable.");
        return;
    }

    const state = tryReadJson<State>("state.json", getDefaultState());

    const client = new openai.OpenAI({
        apiKey
    });

    await chatLoop(client, state);
}

// noinspection JSIgnoredPromiseFromCall
main();