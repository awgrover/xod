struct State {
};

{{ GENERATED_CODE }}

void evaluate(NodeId nid, State* state) {
    emitValue<Outputs::OUT>(nid, getValue<Inputs::IN>(nid) ? 1.0 : 0.0);
}