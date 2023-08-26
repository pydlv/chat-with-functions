export interface State {
    context: {[context_key: string]: string};
}

export function getDefaultState(): State {
    return {
        context: {}
    }
}