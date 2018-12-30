struct State {
};

{{ GENERATED_CODE }}

void evaluate(Context ctx) {
    if (!isInputDirty<input_UPD>(ctx))
        return;

    const uint8_t port = getValue<input_PORT>(ctx);
    if (!isValidDigitalPort(port)) {
        emitValue<output_ERR>(ctx, 1);
        return;
    }

    if (!isInputDirty<input_PULL>(ctx)) {
        const bool pull_up = getValue<input_PULL>(ctx);
        if (pull_up) {
            ::pinMode(port, INPUT_PULLUP);
        else {
            ::pinMode(port, INPUT);
        }
    }

    ::pinMode(port, INPUT);
    emitValue<output_SIG>(ctx, ::digitalRead(port));
    emitValue<output_DONE>(ctx, 1);
}
