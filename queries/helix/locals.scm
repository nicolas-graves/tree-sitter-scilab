(function_definition name: (identifier) @local.definition ?) @local.scope
(arguments (identifier)* @local.definition)

(assignment left: ((function_call
                     name: (identifier) @local.definition)))
(assignment left: ((struct . [(function_call
                               name: (identifier) @local.definition)
                              (identifier) @local.definition])))
(assignment left: (_) @local.definition)
(assignment (multioutput_variable (_) @local.definition))

(iterator . (identifier) @local.definition)

(identifier) @local.reference
