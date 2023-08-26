export type Context = {[context_key: string]: string};

export interface State {
    context: Context;
}

export function getDefaultState(): State {
    return {
        context: {}
    }
}